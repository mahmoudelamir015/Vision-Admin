import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

export async function GET(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacher_id") ?? "";

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("teacher_student_groups")
    .select(`
      id,
      subject,
      created_at,
      teacher:teacher_user_id (id, name, phone),
      student:student_user_id (id, name, phone, grade, stage, track, student_code)
    `)
    .order("created_at", { ascending: false });

  if (teacherId) {
    query = query.eq("teacher_user_id", teacherId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ groups: Array.isArray(data) ? data : [] });
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    teacher_id?: string;
    student_id?: string;
    subject?: string;
  } | null;

  const teacherId = typeof body?.teacher_id === "string" ? body.teacher_id.trim() : "";
  const studentId = typeof body?.student_id === "string" ? body.student_id.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";

  if (!teacherId || !studentId) {
    return NextResponse.json({ error: "المعرفات مطلوبة" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("teacher_student_groups")
    .upsert({ teacher_user_id: teacherId, student_user_id: studentId, subject }, { onConflict: "teacher_user_id, student_user_id, subject" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ group: data });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("teacher_student_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
