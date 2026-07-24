import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase.from("attendance").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ records: Array.isArray(data) ? data : [] });
}
