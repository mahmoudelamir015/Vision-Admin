import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";
import { supabaseTableNames } from "@/src/lib/supabase";

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentAdminProfile();
    if (profile?.role !== "master_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const supabase = createServiceSupabaseClient();

    // delete from attendance and wallets
    const p1 = supabase.from(supabaseTableNames.attendance).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
    const p2 = supabase.from(supabaseTableNames.wallets).delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await Promise.all([p1, p2]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear records" }, { status: 500 });
  }
}
