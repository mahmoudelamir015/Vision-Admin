import { normalizeEgyptianPhone } from "../auth/phone";
import { fetchUserByPhone, saveUser, type AppUserRecord } from "./users";

export type AdminRole = "master_admin" | "staff";

const readResetMeta = (user: AppUserRecord | null) => {
  const extra = user?.extra && typeof user.extra === "object" ? user.extra : {};
  const passwordReset = extra && typeof extra === "object" ? (extra as Record<string, unknown>).password_reset : null;
  return passwordReset && typeof passwordReset === "object" ? (passwordReset as Record<string, unknown>) : null;
};

export async function requestAdminPasswordReset(phone: string) {
  const normalized = normalizeEgyptianPhone(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  const user = await fetchUserByPhone(normalized);
  if (!user) return null;

  const nextUser: AppUserRecord = {
    ...user,
    extra: {
      ...(user.extra ?? {}),
      password_reset: {
        status: "pending",
        requested_at: new Date().toISOString(),
        approved_until: null,
      },
    },
  };

  return saveUser(nextUser);
}

export async function approveAdminPasswordReset(phone: string) {
  const normalized = normalizeEgyptianPhone(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  const user = await fetchUserByPhone(normalized);
  if (!user) return null;

  const approvedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const nextUser: AppUserRecord = {
    ...user,
    extra: {
      ...(user.extra ?? {}),
      password_reset: {
        status: "approved",
        requested_at: readResetMeta(user)?.requested_at ?? null,
        approved_at: new Date().toISOString(),
        approved_until: approvedUntil,
      },
    },
  };

  return saveUser(nextUser);
}

export async function canAdminSetNewPassword(phone: string) {
  const normalized = normalizeEgyptianPhone(phone);
  if (!normalized) return false;

  const user = await fetchUserByPhone(normalized);
  const meta = readResetMeta(user);
  const approvedUntil = typeof meta?.approved_until === "string" ? meta.approved_until : null;
  if (!approvedUntil) return false;

  return new Date(approvedUntil).getTime() > Date.now();
}
