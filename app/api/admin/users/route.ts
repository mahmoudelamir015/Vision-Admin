import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
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
};

function normalizePayload(body: UserBody) {
  const phone = normalizeEgyptianPhone(body.phone ?? "");
  const parentPhone = body.parent_phone ? normalizeEgyptianPhone(body.parent_phone) : null;
  return {
    id: typeof body.id === "string" ? body.id : undefined,
    auth_user_id: typeof body.auth_user_id === "string" ? body.auth_user_id : undefined,
    name: typeof body.name === "string" ? body.name.trim() : "",
    phone,
    role: typeof body.role === "string" ? body.role : "",
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
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as UserBody;
  const payload = normalizePayload(body);
  if (!payload.name || !payload.phone || !payload.role) {
    return NextResponse.json({ error: "بيانات المستخدم غير مكتملة" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_user_id: payload.auth_user_id,
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      permissions: payload.permissions,
      active: payload.active,
      stage: payload.stage,
      grade: payload.grade,
      track: payload.track,
      school_name: payload.school_name,
      parent_phone: payload.parent_phone,
      subjects: payload.subjects,
      student_code: payload.student_code,
      extra: payload.extra,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}

export async function PATCH(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as UserBody;
  const payload = normalizePayload(body);
  if (!payload.id || !payload.name || !payload.phone || !payload.role) {
    return NextResponse.json({ error: "بيانات المستخدم غير مكتملة" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("users")
    .update({
      auth_user_id: payload.auth_user_id,
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      permissions: payload.permissions,
      active: payload.active,
      stage: payload.stage,
      grade: payload.grade,
      track: payload.track,
      school_name: payload.school_name,
      parent_phone: payload.parent_phone,
      subjects: payload.subjects,
      student_code: payload.student_code,
      extra: payload.extra,
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "معرّف المستخدم مطلوب" }, { status: 400 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { error } = await supabase.from("users").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
