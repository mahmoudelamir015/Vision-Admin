import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

type WalletBody = {
  id?: string;
  owner?: string;
  account_type?: string;
  amount?: number | string;
  reason?: string;
  student_phone?: string | null;
  created_at?: string;
};

function normalizePayload(body: WalletBody) {
  return {
    id: typeof body.id === "string" ? body.id : undefined,
    owner: typeof body.owner === "string" ? body.owner.trim() : "",
    account_type: typeof body.account_type === "string" ? body.account_type : "student",
    amount: Number(body.amount ?? 0),
    reason: typeof body.reason === "string" ? body.reason.trim() : "",
    student_phone: body.student_phone ? normalizeEgyptianPhone(body.student_phone) : null,
    created_at: typeof body.created_at === "string" ? body.created_at : new Date().toISOString(),
  };
}

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase.from("wallets").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ wallets: Array.isArray(data) ? data : [] });
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as WalletBody;
  const payload = normalizePayload(body);
  if (!payload.owner || !payload.reason || !Number.isFinite(payload.amount)) {
    return NextResponse.json({ error: "بيانات الحركة غير مكتملة" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      owner: payload.owner,
      account_type: payload.account_type,
      amount: payload.amount,
      reason: payload.reason,
      student_phone: payload.student_phone,
      created_at: payload.created_at,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ wallet: data });
}
