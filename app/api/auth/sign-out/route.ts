import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClientWithBufferedCookies } from "@/src/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(cookieStore);
  await supabase.auth.signOut();
  return attachBufferedCookies(NextResponse.json({ ok: true }));
}
