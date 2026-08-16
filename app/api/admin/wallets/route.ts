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
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id, amount, type, reason, created_at,
      users!transactions_user_id_fkey(name, phone, student_code),
      employee:users!transactions_created_by_fkey(name, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const mappedData = data.map((t: any) => ({
    id: t.id,
    amount: t.type === 'debit' ? -t.amount : t.amount,
    reason: t.reason,
    created_at: t.created_at,
    owner: t.users?.name || t.users?.phone || "غير معروف",
    student_phone: t.users?.phone,
    student_code: t.users?.student_code,
    employee_name: t.employee?.name || "النظام",
    employee_phone: t.employee?.phone,
    account_type: "student",
  }));

  return NextResponse.json({ wallets: mappedData });
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json()) as WalletBody;
  const payload = normalizePayload(body);
  if (!payload.owner && !payload.student_phone) {
    return NextResponse.json({ error: "يجب تحديد الطالب" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  
  // Find user by owner name or phone
  const searchPhone = payload.student_phone || payload.owner;
  const { data: userData } = await supabase
    .from("users")
    .select("id, name, phone")
    .or(`phone.eq.${searchPhone},name.eq.${payload.owner}`)
    .limit(1)
    .single();

  if (!userData) {
    return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
  }

  const absAmount = Math.abs(payload.amount);
  const type = payload.amount < 0 ? 'debit' : 'credit';

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userData.id,
      amount: absAmount,
      type: type,
      reason: payload.reason,
      created_by: profile.id,
      created_at: payload.created_at,
    })
    .select("id, amount, type, reason, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    wallet: {
      id: data.id,
      amount: data.type === 'debit' ? -data.amount : data.amount,
      reason: data.reason,
      created_at: data.created_at,
      owner: userData.name || userData.phone,
      student_phone: userData.phone,
      account_type: "student",
    }
  });
}
