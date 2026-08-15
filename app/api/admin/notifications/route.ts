import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: Array.isArray(data) ? data : [] });
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    body?: string;
    audience?: "ALL" | "GROUP" | "STUDENT";
    stage?: string;
    grade?: string;
    track?: string;
    student_code?: string;
  } | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body?.body === "string" ? body.body.trim() : "";

  if (!title || !bodyText) {
    return NextResponse.json({ error: "العنوان ونص الإشعار مطلوبان" }, { status: 400 });
  }

  const audience = body?.audience ?? "ALL";

  const insertPayload: Record<string, unknown> = {
    title,
    body: bodyText,
    published: true,
  };

  if (audience === "GROUP") {
    insertPayload.stage = body?.stage || null;
    insertPayload.grade = body?.grade || null;
    insertPayload.track = body?.track || null;
  } else if (audience === "STUDENT") {
    insertPayload.student_code = body?.student_code || null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notification: data });
}
