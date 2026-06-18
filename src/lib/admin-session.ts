import type { AdminProfile } from "./supabase/auth";

const ADMIN_SESSION_KEY = "vision_admin_session";

type StoredAdminSession = AdminProfile & {
  authMode: "code" | "phone";
};

export function readStoredAdminSession(): AdminProfile | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAdminSession;

    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.phone === "string" &&
      (parsed.role === "master_admin" || parsed.role === "staff")
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        phone: parsed.phone,
        role: parsed.role,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function storeAdminSession(profile: AdminProfile, authMode: "code" | "phone") {
  if (typeof window === "undefined") return;

  const payload: StoredAdminSession = {
    ...profile,
    authMode,
  };

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}
