import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export type AdminRole = "master_admin" | "staff";
export type AdminProfile = { id: string; name: string; phone: string; role: AdminRole; permissions: string[] };

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = createRouteSupabaseClient(await cookies());
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims ?? null;
  if (!claims?.sub) return null;
  const { data } = await supabase
    .from("users")
    .select("id, name, phone, role, permissions")
    .eq("auth_user_id", claims.sub)
    .maybeSingle();
  if (!data || (data.role !== "master_admin" && data.role !== "staff")) return null;
  return { ...data, permissions: Array.isArray(data.permissions) ? data.permissions : [] } as AdminProfile;
}
