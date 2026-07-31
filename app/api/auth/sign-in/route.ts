import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    password?: string;
    expectedRole?: "master_admin" | "staff";
    accessCode?: string;
  };

  const configuredAccessCode = process.env.MASTER_ADMIN_ACCESS_CODE ?? process.env.NEXT_PUBLIC_MASTER_ADMIN_ACCESS_CODE ?? "";
  const isMasterAdminLogin = body.expectedRole === "master_admin";

  if (isMasterAdminLogin && (!body.accessCode || body.accessCode !== configuredAccessCode)) {
    return NextResponse.json({ error: "كود دخول المدير غير صحيح" }, { status: 403 });
  }

  const supabase = createRouteSupabaseClient(await cookies());

  let loginResult:
    | {
        data: { user: { id: string } | null };
        error: { message?: string } | null;
      }
    | undefined;

  if (isMasterAdminLogin) {
    const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim();
    const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD ?? "";

    if (!masterAdminEmail || !masterAdminPassword) {
      return NextResponse.json({ error: "لازم تضبط MASTER_ADMIN_EMAIL و MASTER_ADMIN_PASSWORD على Vercel" }, { status: 500 });
    }

    loginResult = await supabase.auth.signInWithPassword({ email: masterAdminEmail, password: masterAdminPassword });
  } else {
    const phone = normalizeEgyptianPhone(body.phone ?? "");
    const password = body.password ?? "";

    if (!phone || password.length < 8) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
    }

    loginResult = await supabase.auth.signInWithPassword({ phone, password });
  }

  const data = loginResult?.data ?? { user: null };
  const error = loginResult?.error ?? null;

  if (error || !data.user) {
    return NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("id, name, phone, role, permissions").eq("auth_user_id", data.user.id).maybeSingle();

  if (!profile || (profile.role !== "master_admin" && profile.role !== "staff") || (body.expectedRole && profile.role !== body.expectedRole)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "الحساب غير مخول لهذه الواجهة" }, { status: 403 });
  }

  return NextResponse.json({ profile: { ...profile, permissions: Array.isArray(profile.permissions) ? profile.permissions : [] } });
}
