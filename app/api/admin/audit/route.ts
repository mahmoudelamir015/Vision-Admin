import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  // Only master_admin can see this
  if (!profile || profile.role !== "master_admin") {
    return NextResponse.json({ error: "غير مصرح الدخول" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient(await cookies());

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id, amount, type, reason, created_at,
      users!transactions_user_id_fkey(name, phone),
      employee:users!transactions_created_by_fkey(name, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const audit = data.map((t: any) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    reason: t.reason,
    created_at: t.created_at,
    student_name: t.users?.name || "غير معروف",
    student_phone: t.users?.phone || "",
    employee_name: t.employee?.name || "",
    employee_phone: t.employee?.phone || "",
  }));

  return NextResponse.json({ audit });
}
