import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAdminProfile();
    if (!profile) {
      return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { student_id?: string } | null;
    const studentId = typeof body?.student_id === "string" ? body.student_id.trim() : "";
    if (!studentId) {
      return NextResponse.json({ error: "رقم الطالب غير صالح" }, { status: 400 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    const { data: student, error: studentError } = await serviceSupabase
      .from("users")
      .select("name, phone, stage, grade, track")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: "تعذر العثور على بيانات الطالب" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("attendance")
      .insert({
        student_name: student.name,
        student_phone: student.phone?.replace(/^\\+?20/, '0'),
        stage: student.stage,
        grade: student.grade,
        track: student.track,
        address: null,
        code: "manual-admin",
        qr_value: "manual-admin",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || "تعذر تسجيل الحضور" }, { status: 400 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تسجيل الحضور" }, { status: 400 });
  }
}
