import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/src/lib/supabase/server";

export type AdminRole = "master_admin" | "staff";
export type AdminProfile = { id: string; name: string; phone: string; role: AdminRole; permissions: string[] };

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = createRouteSupabaseClient(await cookies());
  const { data: authUser } = await supabase.auth.getUser();
  const user = authUser.user;
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("id, name, phone, role, permissions")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (data && (data.role === "master_admin" || data.role === "staff")) {
    return { ...data, permissions: Array.isArray(data.permissions) ? data.permissions : [] } as AdminProfile;
  }

  const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const signedInEmail = user.email?.trim().toLowerCase() ?? "";
  if (masterAdminEmail && signedInEmail === masterAdminEmail) {
    return {
      id: user.id,
      name: "المدير العام",
      phone: user.email ?? masterAdminEmail,
      role: "master_admin",
      permissions: ["*"],
    };
  }

  return null;
}
