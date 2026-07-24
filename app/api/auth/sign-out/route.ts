import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export async function POST() {
  const supabase = createRouteSupabaseClient(await cookies());
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
