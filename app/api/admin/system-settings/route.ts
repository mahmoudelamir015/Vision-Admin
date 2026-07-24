import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

type SystemSettingsBody = {
  wallet_enabled?: boolean;
  registration_open?: boolean;
  show_results?: boolean;
};

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("system_settings")
    .select("id, wallet_enabled, registration_open, show_results")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data ?? null });
}

export async function PATCH(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  if (profile.role !== "master_admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = (await request.json()) as SystemSettingsBody;
  const supabase = createRouteSupabaseClient(await cookies());
  const { data: existing } = await supabase
    .from("system_settings")
    .select("id, wallet_enabled, registration_open, show_results")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        wallet_enabled: body.wallet_enabled ?? existing.wallet_enabled,
        registration_open: body.registration_open ?? existing.registration_open,
        show_results: body.show_results ?? existing.show_results,
      })
      .eq("id", existing.id)
      .select("id, wallet_enabled, registration_open, show_results")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ settings: data });
  }

  const { data, error } = await supabase
    .from("system_settings")
    .insert({
      wallet_enabled: body.wallet_enabled ?? true,
      registration_open: body.registration_open ?? false,
      show_results: body.show_results ?? true,
    })
    .select("id, wallet_enabled, registration_open, show_results")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
