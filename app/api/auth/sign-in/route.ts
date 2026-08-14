import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";
import { createRouteSupabaseClientWithBufferedCookies } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    password?: string;
    expectedRole?: "master_admin" | "staff";
    accessCode?: string;
  };

  const configuredAccessCode = process.env.MASTER_ADMIN_ACCESS_CODE ?? process.env.NEXT_PUBLIC_MASTER_ADMIN_ACCESS_CODE ?? "";
  const normalizedPhone = normalizeEgyptianPhone(body.phone ?? "");
  const rawPhone = (body.phone ?? "").trim();
  console.log("[admin-sign-in] attempt", {
    expectedRole: body.expectedRole,
    phone: rawPhone,
    normalizedPhone,
    hasAccessCode: Boolean(body.accessCode),
  });

  const isMasterAdminLogin = body.expectedRole === "master_admin";
  const cookieStore = await cookies();
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(cookieStore);

  if (isMasterAdminLogin && (!body.accessCode || body.accessCode !== configuredAccessCode)) {
    return attachBufferedCookies(NextResponse.json({ error: "كود دخول المدير غير صحيح" }, { status: 403 }));
  }

  let loginResult:
    | {
        data: { user: { id: string; email?: string | null } | null };
        error: { message?: string } | null;
      }
    | undefined;

  if (isMasterAdminLogin) {
    const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim();
    const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD ?? "";

    if (!masterAdminEmail || !masterAdminPassword) {
      return attachBufferedCookies(
        NextResponse.json({ error: "لازم تضبط MASTER_ADMIN_EMAIL و MASTER_ADMIN_PASSWORD على Vercel" }, { status: 500 }),
      );
    }

    loginResult = await supabase.auth.signInWithPassword({ email: masterAdminEmail, password: masterAdminPassword });
  } else {
    const password = body.password ?? "";
    const normalizedPhoneValue = normalizedPhone ?? "";
    const phoneDigits = normalizedPhoneValue.replace(/\D/g, "");
    const candidatePhones = Array.from(new Set([normalizedPhoneValue, rawPhone].filter((value): value is string => Boolean(value))));
    const candidateEmails = phoneDigits ? [`${phoneDigits}@vision.local`] : [];

    if (candidatePhones.length === 0 || password.length < 8) {
      return attachBufferedCookies(NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 }));
    }

    for (const candidatePhone of candidatePhones) {
      loginResult = await supabase.auth.signInWithPassword({ phone: candidatePhone, password });
      if (!loginResult.error) break;
    }

    if (loginResult?.error) {
      for (const candidateEmail of candidateEmails) {
        loginResult = await supabase.auth.signInWithPassword({ email: candidateEmail, password });
        if (!loginResult.error) break;
      }
    }
  }

  const data = loginResult?.data ?? { user: null };
  const error = loginResult?.error ?? null;
  console.log("[admin-sign-in] result", {
    userId: data.user?.id ?? null,
    email: data.user?.email ?? null,
    errorMessage: error?.message ?? null,
  });

  if (error || !data.user) {
    return attachBufferedCookies(NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 }));
  }

  const serviceSupabase = createServiceSupabaseClient();
  const profileSelect = "id, auth_user_id, name, phone, role, permissions";

  const { data: linkedProfile } = await serviceSupabase
    .from("users")
    .select(profileSelect)
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  let profile = linkedProfile;

  if (!profile || !["master_admin", "staff"].includes(profile.role)) {
    const candidatePhones = Array.from(new Set([normalizedPhone, rawPhone].filter((value): value is string => Boolean(value))));

    if (candidatePhones.length > 0) {
      const { data: fallbackProfiles } = await serviceSupabase
        .from("users")
        .select(profileSelect)
        .in("phone", candidatePhones)
        .in("role", ["master_admin", "staff"]);

      if (Array.isArray(fallbackProfiles) && fallbackProfiles.length > 0) {
        profile = fallbackProfiles[0];

        if (profile.id && profile.auth_user_id !== data.user.id) {
          await serviceSupabase.from("users").update({ auth_user_id: data.user.id }).eq("id", profile.id);
        }
      }
    }
  }

  const normalizedMasterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const signedInEmail = data.user.email?.trim().toLowerCase() ?? "";
  const isMasterAdminUser = isMasterAdminLogin || (normalizedMasterAdminEmail && signedInEmail === normalizedMasterAdminEmail);

  if (profile && (profile.role === "master_admin" || profile.role === "staff")) {
    if (body.expectedRole && profile.role !== body.expectedRole) {
      await supabase.auth.signOut();
      return attachBufferedCookies(NextResponse.json({ error: "الحساب غير مخصص لهذه الواجهة" }, { status: 403 }));
    }

    return attachBufferedCookies(
      NextResponse.json({
        profile: {
          ...profile,
          permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
        },
      }),
    );
  }

  if (isMasterAdminUser) {
    return attachBufferedCookies(
      NextResponse.json({
        profile: {
          id: data.user.id,
          name: "المدير العام",
          phone: normalizedMasterAdminEmail || data.user.email || "",
          role: "master_admin",
          permissions: ["*"],
        },
      }),
    );
  }

  await supabase.auth.signOut();
  return attachBufferedCookies(NextResponse.json({ error: "الحساب غير مخصص لهذه الواجهة" }, { status: 403 }));
}
