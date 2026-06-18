import { getSupabaseClient } from "./index";

export type AdminRole = "master_admin" | "staff";

export type AdminProfile = {
  id: string;
  name: string;
  phone: string;
  role: AdminRole;
  permissions: string[];
};

const defaultPermissions = (role: AdminRole) =>
  role === "master_admin"
    ? [
        "control-room",
        "students",
        "attendance",
        "wallet",
        "staff",
        "vault",
        "content",
        "notifications",
      ]
    : ["attendance", "wallet"];

const normalizeRole = (value: unknown): AdminRole | null => {
  if (value === "master_admin" || value === "staff") return value;
  if (value === "ADMIN") return "master_admin";
  if (value === "STAFF") return "staff";
  return null;
};

const normalizePhoneCandidates = (phone: string) => {
  const trimmed = phone.trim().replace(/\s+/g, "");
  const compact = trimmed.replace(/[^\d+]/g, "");

  if (!compact) return [];

  if (compact.startsWith("+")) {
    const digitsOnly = compact.replace(/\D/g, "");
    return [compact, digitsOnly, digitsOnly.replace(/^20/, ""), `0${digitsOnly.replace(/^20/, "")}`];
  }

  const digits = compact.replace(/\D/g, "");
  if (!digits) return [];

  if (digits.startsWith("20")) {
    const local = digits.replace(/^20/, "");
    return [`+${digits}`, digits, local, `0${local}`];
  }

  if (digits.startsWith("01")) {
    const withoutZero = digits.replace(/^0/, "");
    return [`+20${withoutZero}`, digits, withoutZero, `+${digits}`];
  }

  return [compact, digits];
};

const normalizePermissions = (role: AdminRole, permissions: unknown) => {
  if (Array.isArray(permissions) && permissions.every((item) => typeof item === "string")) {
    return permissions;
  }

  return defaultPermissions(role);
};

const mapAdminProfile = (record: Record<string, unknown> | null): AdminProfile | null => {
  if (!record) return null;

  const role = normalizeRole(record.role);
  const phone = typeof record.phone === "string" ? record.phone : "";
  const id = typeof record.id === "string" ? record.id : "";
  const name = typeof record.name === "string" ? record.name : role === "master_admin" ? "المدير العام" : "موظف العمليات";

  if (!role || !phone || !id) return null;

  return {
    id,
    name,
    phone,
    role,
    permissions: normalizePermissions(role, record.permissions),
  };
};

export async function fetchAdminProfileByPhone(phone: string): Promise<AdminProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  for (const candidate of normalizePhoneCandidates(phone)) {
    const { data, error } = await client
      .from("users")
      .select("id, name, phone, role, permissions")
      .eq("phone", candidate)
      .maybeSingle();

    if (error) {
      continue;
    }

    const profile = mapAdminProfile(data as Record<string, unknown> | null);
    if (profile) return profile;
  }

  return null;
}

export async function sendAdminLoginOtp(phone: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase غير مضبوط");
  }

  const normalizedPhone = normalizePhoneCandidates(phone)[0];
  if (!normalizedPhone) {
    throw new Error("رقم الموبايل غير صالح");
  }

  return client.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      shouldCreateUser: true,
    },
  });
}

export async function verifyAdminLoginOtp(phone: string, token: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase غير مضبوط");
  }

  const normalizedPhone = normalizePhoneCandidates(phone)[0];
  if (!normalizedPhone) {
    throw new Error("رقم الموبايل غير صالح");
  }

  return client.auth.verifyOtp({
    phone: normalizedPhone,
    token,
    type: "sms",
  });
}

export async function getCurrentAdminProfile() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  const phone = data.session?.user.phone ?? "";
  if (!phone) return null;

  return fetchAdminProfileByPhone(phone);
}
