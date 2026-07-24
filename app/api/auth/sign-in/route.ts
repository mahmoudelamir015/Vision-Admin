import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; password?: string; expectedRole?: "master_admin" | "staff"; accessCode?: string };
  const configuredAccessCode =
    process.env.MASTER_ADMIN_ACCESS_CODE ??
    process.env.NEXT_PUBLIC_MASTER_ADMIN_ACCESS_CODE ??
    "";
  const isMasterAdminLogin = body.expectedRole === "master_admin";
  if (isMasterAdminLogin) {
    if (!body.accessCode || body.accessCode !== configuredAccessCode) {
      return NextResponse.json({ error: "كود دخول المدير غير صحيح" }, { status: 403 });
    }
  }

  if (isMasterAdminLogin && (!process.env.MASTER_ADMIN_PHONE || !process.env.MASTER_ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "لازم تضبط MASTER_ADMIN_PHONE و MASTER_ADMIN_PASSWORD على Vercel" }, { status: 500 });
  }

  const loginPassword = isMasterAdminLogin ? process.env.MASTER_ADMIN_PASSWORD ?? "" : body.password ?? "";

  const supabase = createRouteSupabaseClient(await cookies());
  const phoneCandidates = isMasterAdminLogin
    ? Array.from(
        new Set(
          [
            process.env.MASTER_ADMIN_PHONE ?? "",
            normalizeEgyptianPhone(process.env.MASTER_ADMIN_PHONE ?? "") ?? "",
            body.phone ?? "",
            normalizeEgyptianPhone(body.phone ?? "") ?? "",
          ].filter((candidate) => candidate.trim().length > 0),
        ),
      )
    : [normalizeEgyptianPhone(body.phone ?? "") ?? ""].filter((candidate) => candidate.trim().length > 0);

  if (!phoneCandidates.length || !loginPassword) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
  }

  let data: { user: { id: string } | null } = { user: null };
  let error: { message?: string } | null = null;
  for (const candidatePhone of phoneCandidates) {
    const attempt = await supabase.auth.signInWithPassword({ phone: candidatePhone, password: loginPassword });
    data = { user: attempt.data?.user ?? null };
    error = attempt.error ?? null;
    if (data.user) break;
  }

  if (error || !data.user) return NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, phone, role, permissions")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "master_admin" && profile.role !== "staff") || (body.expectedRole && profile.role !== body.expectedRole)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "الحساب غير مخول لهذه الواجهة" }, { status: 403 });
  }

  return NextResponse.json({ profile: { ...profile, permissions: Array.isArray(profile.permissions) ? profile.permissions : [] } });
}
