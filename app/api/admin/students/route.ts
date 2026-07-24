import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, permissions, active, stage, grade, track, school_name, parent_phone, subjects, student_code, extra")
    .eq("role", "student");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ students: Array.isArray(data) ? data : [] });
}
