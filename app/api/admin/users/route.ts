import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

type UserBody = {
  id?: string;
  auth_user_id?: string;
  name?: string;
  phone?: string;
  role?: string;
  permissions?: unknown;
  active?: boolean;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  school_name?: string | null;
  parent_phone?: string | null;
  subjects?: unknown;
  student_code?: string | null;
  extra?: unknown;
  password?: string | null;
};

function getReadableSupabaseError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";

  if (code === "23505" || /already (?:exists|registered)|duplicate key|unique/i.test(message)) {
    return "رقم الهاتف مسجل بالفعل";
  }

  return message || "حدث خطأ غير متوقع";
}

function buildDefaultPassword(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const fallback = digits.length >= 8 ? digits : `${digits}123456`;
  return fallback.length >= 8 ? fallback : `${fallback}A1!`;
}

function normalizePayload(body: UserBody) {
  const phone = normalizeEgyptianPhone(body.phone ?? "");
  const parentPhone = body.parent_phone ? normalizeEgyptianPhone(body.parent_phone) : null;
  const role = typeof body.role === "string" ? body.role : "";
  const resolvedPassword =
    typeof body.password === "string" && body.password.length >= 8
      ? body.password
      : role === "student" && phone
        ? buildDefaultPassword(phone)
        : undefined;

  return {
    id: typeof body.id === "string" ? body.id : undefined,
    auth_user_id: typeof body.auth_user_id === "string" ? body.auth_user_id : undefined,
    name: typeof body.name === "string" ? body.name.trim() : "",
    phone,
    role,
    permissions: Array.isArray(body.permissions) ? body.permissions.filter((item): item is string => typeof item === "string") : [],
    active: typeof body.active === "boolean" ? body.active : true,
    stage: typeof body.stage === "string" ? body.stage : undefined,
    grade: typeof body.grade === "string" ? body.grade : undefined,
    track: typeof body.track === "string" ? body.track : undefined,
    school_name: typeof body.school_name === "string" ? body.school_name : undefined,
    parent_phone: parentPhone ?? undefined,
    subjects: Array.isArray(body.subjects) ? body.subjects.filter((item): item is string => typeof item === "string") : [],
    student_code: typeof body.student_code === "string" ? body.student_code : undefined,
    extra: body.extra && typeof body.extra === "object" ? (body.extra as Record<string, unknown>) : {},
    password: resolvedPassword,
  };
}

function makeAuthEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@vision.local`;
}

function buildProfileRow(payload: ReturnType<typeof normalizePayload>, authUserId: string) {
  return {
    id: authUserId,
    auth_user_id: authUserId,
    name: payload.name,
    phone: payload.phone,
    role: payload.role,
    permissions: payload.permissions,
    active: payload.active,
    stage: payload.stage ?? null,
    grade: payload.grade ?? null,
    track: payload.track ?? null,
    school_name: payload.school_name ?? null,
    parent_phone: payload.parent_phone ?? null,
    subjects: payload.subjects,
    student_code: payload.student_code ?? null,
    extra: payload.extra,
  };
}

export async function GET(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const url = new URL(request.url);
  const role = url.searchParams.get("role") ?? undefined;
  const supabase = createRouteSupabaseClient(await cookies());
  let query = supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, permissions, active, stage, grade, track, school_name, parent_phone, subjects, student_code, extra");

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ users: Array.isArray(data) ? data : [] });
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAdminProfile();
    if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as UserBody | null;
    const payload = normalizePayload(body ?? {});
    if (!payload.name || !payload.phone || !payload.role) {
      return NextResponse.json({ error: "بيانات المستخدم غير مكتملة" }, { status: 400 });
    }

    if (payload.role === "student" && payload.parent_phone && payload.parent_phone === payload.phone) {
      return NextResponse.json({ error: "رقم الطالب لازم يختلف عن رقم ولي الأمر" }, { status: 400 });
    }

    const normalizedPhone = payload.phone ?? "";
    const authEmail = makeAuthEmail(normalizedPhone);
    const serviceSupabase = createServiceSupabaseClient();

    const createWithServiceRole = async () => {
      const authAttributes: Parameters<typeof serviceSupabase.auth.admin.createUser>[0] = {
        phone: payload.phone ?? undefined,
        phone_confirm: true,
        user_metadata: {
          name: payload.name,
          role: payload.role,
          stage: payload.stage ?? null,
          grade: payload.grade ?? null,
          track: payload.track ?? null,
          school_name: payload.school_name ?? null,
          parent_phone: payload.parent_phone ?? null,
          subjects: payload.subjects,
          student_code: payload.student_code ?? null,
          auth_email: authEmail,
        },
      };

      if (payload.password && payload.password.length >= 8) {
        authAttributes.password = payload.password;
      }

      return serviceSupabase.auth.admin.createUser(authAttributes);
    };

    const createWithEmailSignup = async () => {
      const password = payload.password && payload.password.length >= 8 ? payload.password : `${normalizedPhone.replace(/\D/g, "").slice(-4)}Aa!${String(Date.now()).slice(-4)}`;
      return serviceSupabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            name: payload.name,
            role: payload.role,
            phone: payload.phone,
            auth_email: authEmail,
            stage: payload.stage ?? null,
            grade: payload.grade ?? null,
            track: payload.track ?? null,
            school_name: payload.school_name ?? null,
            parent_phone: payload.parent_phone ?? null,
            subjects: payload.subjects,
            student_code: payload.student_code ?? null,
          },
        },
      });
    };

    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const authResult = hasServiceRole ? await createWithServiceRole() : await createWithEmailSignup();
    const authData = authResult.data;
    const authError = authResult.error;

    if (authError || !authData.user) {
      return NextResponse.json({ error: getReadableSupabaseError(authError) }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("users")
      .insert(buildProfileRow(payload, authData.user.id))
      .select("id, auth_user_id, name, phone, role, permissions, active, stage, grade, track, school_name, parent_phone, subjects, student_code, extra")
      .single();

    if (error) {
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: getReadableSupabaseError(error) }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as UserBody;
  const payload = normalizePayload(body);
  if (!payload.id || !payload.name || !payload.phone || !payload.role) {
    return NextResponse.json({ error: "بيانات المستخدم غير مكتملة" }, { status: 400 });
  }

  if (payload.role === "student" && payload.parent_phone && payload.parent_phone === payload.phone) {
    return NextResponse.json({ error: "رقم الطالب لازم يختلف عن رقم ولي الأمر" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id, auth_user_id, phone")
    .eq("id", payload.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const authUserId = existing.auth_user_id ?? existing.id;
  const shouldSyncAuthPhone = typeof existing.phone === "string" && existing.phone !== payload.phone;

  if (shouldSyncAuthPhone) {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUserId, {
      phone: payload.phone,
      phone_confirm: true,
      user_metadata: {
        name: payload.name,
        role: payload.role,
        stage: payload.stage ?? null,
        grade: payload.grade ?? null,
        track: payload.track ?? null,
        school_name: payload.school_name ?? null,
        parent_phone: payload.parent_phone ?? null,
        subjects: payload.subjects,
        student_code: payload.student_code ?? null,
      },
    });

    if (authUpdateError) {
      return NextResponse.json({ error: getReadableSupabaseError(authUpdateError) }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      auth_user_id: authUserId,
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      permissions: payload.permissions,
      active: payload.active,
      stage: payload.stage ?? null,
      grade: payload.grade ?? null,
      track: payload.track ?? null,
      school_name: payload.school_name ?? null,
      parent_phone: payload.parent_phone ?? null,
      subjects: payload.subjects,
      student_code: payload.student_code ?? null,
      extra: payload.extra,
    })
    .eq("id", payload.id)
    .select("id, auth_user_id, name, phone, role, permissions, active, stage, grade, track, school_name, parent_phone, subjects, student_code, extra")
    .single();

  if (error) {
    return NextResponse.json({ error: getReadableSupabaseError(error) }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });

  const supabase = createServiceSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("id", body.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const { error } = await supabase.from("users").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: getReadableSupabaseError(error) }, { status: 400 });

  const authUserId = existing.auth_user_id ?? existing.id;
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId);
  if (authDeleteError) {
    console.warn("Failed to delete linked auth user", authUserId, authDeleteError);
  }

  return NextResponse.json({ ok: true });
}
