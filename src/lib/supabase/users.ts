import { normalizeEgyptianPhone } from "../auth/phone";
import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type AppUserRole = "master_admin" | "staff" | "student" | "parent" | "teacher";

export type AppUserRecord = {
  id?: string;
  auth_user_id?: string;
  name: string;
  phone: string;
  role: AppUserRole;
  permissions?: string[];
  active?: boolean;
  stage?: string;
  grade?: string;
  track?: string;
  school_name?: string;
  parent_phone?: string;
  subjects?: string[];
  student_code?: string;
  extra?: Record<string, unknown>;
};

const readExtra = (record: SupabaseRecord | null): Record<string, unknown> => {
  if (!record || !record.extra || typeof record.extra !== "object") return {};
  return record.extra as Record<string, unknown>;
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : [];
};

const normalizeUser = (record: SupabaseRecord | null): AppUserRecord | null => {
  if (!record) return null;

  const name = typeof record.name === "string" ? record.name : "";
  const phone = typeof record.phone === "string" ? record.phone : "";
  const role =
    record.role === "master_admin" ||
    record.role === "staff" ||
    record.role === "student" ||
    record.role === "parent" ||
    record.role === "teacher"
      ? record.role
      : null;

  if (!name || !phone || !role) return null;

  const extra = readExtra(record);
  const permissions = normalizeStringArray(record.permissions) ?? normalizeStringArray(extra.permissions);
  const active = typeof record.active === "boolean" ? record.active : typeof extra.active === "boolean" ? extra.active : undefined;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    auth_user_id: typeof record.auth_user_id === "string" ? record.auth_user_id : undefined,
    name,
    phone,
    role,
    permissions,
    active,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    school_name: typeof record.school_name === "string" ? record.school_name : undefined,
    parent_phone: typeof record.parent_phone === "string" ? record.parent_phone : undefined,
    subjects: Array.isArray(record.subjects)
      ? record.subjects.filter((item): item is string => typeof item === "string")
      : undefined,
    student_code: typeof record.student_code === "string" ? record.student_code : undefined,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
  };
};

const normalizeUserInput = (user: AppUserRecord): AppUserRecord | null => {
  const phone = normalizeEgyptianPhone(user.phone);
  if (!phone) return null;

  const parentPhone = user.parent_phone ? normalizeEgyptianPhone(user.parent_phone) ?? undefined : undefined;

  return {
    ...user,
    phone,
    parent_phone: parentPhone,
  };
};

async function adminApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    if (!response.ok) {
      let errorMessage = text;
      try {
        const parsed = JSON.parse(text);
        errorMessage = typeof parsed === "object" && parsed !== null && "error" in parsed ? (parsed as { error?: string }).error ?? text : text;
      } catch {
        // ignore invalid JSON
      }

      console.error("Admin API request failed", {
        path,
        status: response.status,
        statusText: response.statusText,
        body: errorMessage,
      });
      throw new Error(errorMessage || `${response.status} ${response.statusText}`);
    }

    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Admin API request error", path, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Admin API request failed");
  }
}

const buildPayload = (user: AppUserRecord) => {
  const payload: Record<string, unknown> = {
    auth_user_id: user.auth_user_id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    stage: user.stage,
    grade: user.grade,
    track: user.track,
    school_name: user.school_name,
    parent_phone: user.parent_phone,
    subjects: user.subjects ?? [],
    student_code: user.student_code,
    extra: {
      ...(user.extra ?? {}),
    },
  };

  if (Array.isArray(user.permissions)) {
    payload.permissions = user.permissions;
  }

  if (typeof user.active === "boolean") {
    payload.active = user.active;
  }

  return payload;
};

export async function fetchUsers(role?: AppUserRole): Promise<AppUserRecord[]> {
  if (typeof window !== "undefined") {
    const payload = await adminApiRequest<{ users?: SupabaseRecord[] }>(
      role ? `/api/admin/users?role=${encodeURIComponent(role)}` : "/api/admin/users",
    );
    if (Array.isArray(payload?.users)) {
      const normalized = payload.users
        .map((record) => normalizeUser(record as SupabaseRecord))
        .filter((record): record is AppUserRecord => Boolean(record));
      return role ? normalized.filter((record) => record.role === role) : normalized;
    }
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.users).select("*");
  if (error || !Array.isArray(data)) return [];

  const normalized = data
    .map((record) => normalizeUser(record as SupabaseRecord))
    .filter((record): record is AppUserRecord => Boolean(record));

  return role ? normalized.filter((record) => record.role === role) : normalized;
}

export async function fetchUserByPhone(phone: string): Promise<AppUserRecord | null> {
  if (typeof window !== "undefined") {
    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!normalizedPhone) return null;
    const users = await fetchUsers();
    return users.find((record) => record.phone === normalizedPhone) ?? null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedPhone = normalizeEgyptianPhone(phone);
  if (!normalizedPhone) return null;

  const { data, error } = await client.from(supabaseTableNames.users).select("*").eq("phone", normalizedPhone).maybeSingle();
  if (error || !data) return null;
  return normalizeUser(data as SupabaseRecord);
}

export async function createUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  if (typeof window !== "undefined") {
    const normalizedUser = normalizeUserInput(user);
    if (!normalizedUser) return null;

    const response = await adminApiRequest<{ user?: SupabaseRecord }>('/api/admin/users', {
      method: "POST",
      body: JSON.stringify(buildPayload(normalizedUser)),
    });
    return response?.user ? normalizeUser(response.user) : null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedUser = normalizeUserInput(user);
  if (!normalizedUser) return null;

  const { data, error } = await client.from(supabaseTableNames.users).insert(buildPayload(normalizedUser)).select("*").single();
  if (error) return null;
  return normalizeUser(data as SupabaseRecord | null);
}

export async function updateUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  if (typeof window !== "undefined") {
    const normalizedUser = normalizeUserInput(user);
    if (!normalizedUser || !normalizedUser.id) return null;

    const response = await adminApiRequest<{ user?: SupabaseRecord }>('/api/admin/users', {
      method: "PATCH",
      body: JSON.stringify({ ...buildPayload(normalizedUser), id: normalizedUser.id }),
    });
    return response?.user ? normalizeUser(response.user) : null;
  }

  const client = getSupabaseClient();
  if (!client || !user.id) return null;

  const normalizedUser = normalizeUserInput(user);
  if (!normalizedUser) return null;

  const { data, error } = await client
    .from(supabaseTableNames.users)
    .update(buildPayload(normalizedUser))
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return null;
  return normalizeUser(data as SupabaseRecord | null);
}

export async function saveUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  return user.id ? updateUser(user) : createUser(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const response = await adminApiRequest<{ ok?: boolean }>('/api/admin/users', {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      return Boolean(response?.ok);
    } catch (error) {
      console.error("Failed to delete user", error);
      return false;
    }
  }

  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from(supabaseTableNames.users).delete().eq("id", id);
  return !error;
}

export function subscribeToUsers(callback: (users: AppUserRecord[]) => void): (() => void) | null {
  if (typeof window !== "undefined") {
    let active = true;
    const tick = async () => {
      if (!active) return;
      callback(await fetchUsers());
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel("public:users")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.users,
      },
      async () => {
        const users = await fetchUsers();
        callback(users);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
