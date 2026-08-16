import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

function buildNotification(title: string, body: string) {
  return { title, body, audience_role: null, stage: null, grade: null, track: null, published: true };
}

async function getProfileRow(userId: string) {
  const serviceSupabase = createServiceSupabaseClient();
  const { data } = await serviceSupabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const serviceSupabase = createServiceSupabaseClient();
  const query = serviceSupabase.from("change_requests").select("*").order("created_at", { ascending: false });

  if (profile.role !== "master_admin") {
    query.eq("user_id", profile.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ requests: Array.isArray(data) ? data : [] });
}

export async function PATCH(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string; action?: string; admin_reason?: string } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action === "approve" || body?.action === "reject" ? body.action : "";
  const adminReason = typeof body?.admin_reason === "string" ? body.admin_reason.trim() : "";

  if (!id || !action) {
    return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { data: requestRow, error: requestError } = await serviceSupabase.from("change_requests").select("*").eq("id", id).maybeSingle();
  if (requestError || !requestRow) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  const requestRecord = requestRow as Record<string, unknown>;

  if (action === "reject" && !adminReason) {
    return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
  }

  if (action === "approve") {
    const row = await getProfileRow(String(requestRecord.user_id));
    if (!row) return NextResponse.json({ error: "تعذر العثور على الحساب" }, { status: 404 });

    const requestedField = String(requestRecord.requested_field ?? "");
    const newValue = String(requestRecord.new_value ?? "");
    const updatePayload: Record<string, unknown> = {};

    if (requestedField === "profile_image") {
      updatePayload.extra = {
        ...((row.extra as Record<string, unknown>) ?? {}),
        profile_image: newValue,
      };
    } else {
      updatePayload[requestedField] = requestedField === "subjects" ? newValue.split(",").map((item) => item.trim()).filter(Boolean) : newValue;
    }

    const { error: updateError } = await serviceSupabase.from("users").update(updatePayload).eq("auth_user_id", requestRecord.user_id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  let { error: statusError } = await serviceSupabase
    .from("change_requests")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      admin_reason: action === "reject" ? adminReason : null,
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (statusError && statusError.message?.includes("resolved_at")) {
    const fallbackUpdate = await serviceSupabase
      .from("change_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        admin_reason: action === "reject" ? adminReason : null,
        resolved_by: profile.id,
      })
      .eq("id", id);
    statusError = fallbackUpdate.error;
  }

  if (statusError) return NextResponse.json({ error: statusError.message }, { status: 400 });

  const notification = action === "approve"
    ? buildNotification("تم قبول طلب التعديل", `تم قبول طلبك الخاص بـ ${String(requestRecord.requested_field ?? "")}.`)
    : buildNotification("تم رفض طلب التعديل", `تم رفض طلبك الخاص بـ ${String(requestRecord.requested_field ?? "")}. ${adminReason}`);

  await serviceSupabase.from("notifications").insert(notification);

  return NextResponse.json({ ok: true });
}
