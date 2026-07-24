import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as { student_phone?: string; valid_for_minutes?: number };
  const studentPhone = normalizeEgyptianPhone(body.student_phone ?? "");
  if (!studentPhone) return NextResponse.json({ error: "رقم الطالب غير صالح" }, { status: 400 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase.rpc("issue_attendance_token", {
    p_student_phone: studentPhone,
    p_valid_for_minutes: body.valid_for_minutes ?? 10,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const tokenRow = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ token: tokenRow });
}
