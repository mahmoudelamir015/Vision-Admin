import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createRouteSupabaseClientWithBufferedCookies } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    password?: string;
    expectedRole?: "master_admin" | "staff";
    accessCode?: string;
  };

  const configuredAccessCode = process.env.MASTER_ADMIN_ACCESS_CODE ?? process.env.NEXT_PUBLIC_MASTER_ADMIN_ACCESS_CODE ?? "";
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
    const phone = normalizeEgyptianPhone(body.phone ?? "");
    const password = body.password ?? "";

    if (!phone || password.length < 8) {
      return attachBufferedCookies(NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 }));
    }

    loginResult = await supabase.auth.signInWithPassword({ phone, password });
  }

  const data = loginResult?.data ?? { user: null };
  const error = loginResult?.error ?? null;

  if (error || !data.user) {
    return attachBufferedCookies(NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 }));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, phone, role, permissions")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  const normalizedMasterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const signedInEmail = data.user.email?.trim().toLowerCase() ?? "";
  const isMasterAdminUser = isMasterAdminLogin || (normalizedMasterAdminEmail && signedInEmail === normalizedMasterAdminEmail);

  if (profile && (profile.role === "master_admin" || profile.role === "staff")) {
    if (body.expectedRole && profile.role !== body.expectedRole) {
      await supabase.auth.signOut();
      return attachBufferedCookies(NextResponse.json({ error: "الحساب غير مخول لهذه الواجهة" }, { status: 403 }));
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
  return attachBufferedCookies(NextResponse.json({ error: "الحساب غير مخول لهذه الواجهة" }, { status: 403 }));
}
