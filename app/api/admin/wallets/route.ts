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
    .select("id, user_id, created_by, amount, type, reason, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const transactionRows = Array.isArray(data) ? data : [];
  const userIds = Array.from(new Set(transactionRows.flatMap((row) => [row.user_id, row.created_by]).filter(Boolean)));
  const { data: users, error: usersError } = userIds.length
    ? await supabase.from("users").select("id, auth_user_id, name, phone, student_code").in("id", userIds)
    : { data: [], error: null };

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 });

  const userById = new Map((users ?? []).map((user) => [user.id, user]));
  const userByAuthId = new Map((users ?? []).filter((user) => user.auth_user_id).map((user) => [user.auth_user_id, user]));
  const mappedData = transactionRows.map((transaction) => {
    const owner = userById.get(transaction.user_id);
    const employee = userById.get(transaction.created_by) ?? userByAuthId.get(transaction.created_by);
    return {
      id: transaction.id,
      amount: transaction.type === "debit" ? -transaction.amount : transaction.amount,
      reason: transaction.reason,
      created_at: transaction.created_at,
      owner: owner?.name || owner?.phone || "غير معروف",
      student_phone: owner?.phone,
      student_code: owner?.student_code,
      employee_name: employee?.name || "النظام",
      employee_phone: employee?.phone,
      account_type: "student",
    };
  });

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
