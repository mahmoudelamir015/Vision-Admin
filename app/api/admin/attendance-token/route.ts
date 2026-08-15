import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAdminProfile();
    if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { shared?: boolean; student_phone?: string; valid_for_seconds?: number } | null;
    const supabase = createServiceSupabaseClient();

    if (body?.shared) {
      const { data, error } = await supabase.rpc("issue_shared_attendance_token", {
        p_valid_for_seconds: body.valid_for_seconds ?? 60,
      });

      if (error) {
        const message = error?.message || "تعذر توليد رمز الحضور";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const tokenRow = Array.isArray(data) ? data[0] : data;
      if (!tokenRow) {
        return NextResponse.json({ error: "تعذر توليد رمز الحضور" }, { status: 400 });
      }

      return NextResponse.json({ token: tokenRow });
    }

    const studentPhone = normalizeEgyptianPhone(body?.student_phone ?? "");
    if (!studentPhone) return NextResponse.json({ error: "رقم الطالب غير صالح" }, { status: 400 });

    const { data, error } = await supabase.rpc("issue_attendance_token", {
      p_student_phone: studentPhone,
      p_valid_for_minutes: Math.max(1, Math.min(Math.ceil((body?.valid_for_seconds ?? 600) / 60), 60)),
    });

    if (error) {
      const message = error?.message || "تعذر توليد رمز الحضور";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const tokenRow = Array.isArray(data) ? data[0] : data;
    if (!tokenRow) {
      return NextResponse.json({ error: "تعذر توليد رمز الحضور" }, { status: 400 });
    }

    return NextResponse.json({ token: tokenRow });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر توليد رمز الحضور" }, { status: 400 });
  }
}
