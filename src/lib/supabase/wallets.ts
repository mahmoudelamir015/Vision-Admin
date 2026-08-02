import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type WalletEntry = {
  id?: string;
  owner: string;
  account_type: "student";
  amount: number;
  reason: string;
  created_at?: string;
  student_phone?: string;
};

const normalizeEntry = (record: SupabaseRecord | null): WalletEntry | null => {
  if (!record) return null;

  const owner = typeof record.owner === "string" ? record.owner : "";
  const amount = Number(record.amount ?? 0);
  const reason = typeof record.reason === "string" ? record.reason : "";

  if (!owner || !reason || Number.isNaN(amount)) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    owner,
    account_type: "student",
    amount,
    reason,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    student_phone: typeof record.student_phone === "string" ? record.student_phone : undefined,
  };
};

async function adminApiRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
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

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchWalletEntries(): Promise<WalletEntry[]> {
  if (typeof window !== "undefined") {
    const payload = await adminApiRequest<{ wallets?: SupabaseRecord[] }>("/api/legacy/admin/wallets");
    if (Array.isArray(payload?.wallets)) {
      return payload.wallets
        .map((record) => normalizeEntry(record as SupabaseRecord))
        .filter((entry): entry is WalletEntry => Boolean(entry));
    }
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.wallets).select("*");
  if (error || !Array.isArray(data)) return [];

  return data.map((record) => normalizeEntry(record as SupabaseRecord)).filter((entry): entry is WalletEntry => Boolean(entry));
}

export async function saveWalletEntry(entry: WalletEntry): Promise<WalletEntry | null> {
  if (typeof window !== "undefined") {
    const payload = {
      id: entry.id,
      owner: entry.owner,
      account_type: entry.account_type,
      amount: entry.amount,
      reason: entry.reason,
      created_at: entry.created_at ?? new Date().toISOString(),
      student_phone: entry.student_phone,
    };

    const response = await adminApiRequest<{ wallet?: SupabaseRecord }>("/api/legacy/admin/wallets", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response?.wallet ? normalizeEntry(response.wallet) : null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    id: entry.id,
    owner: entry.owner,
    account_type: entry.account_type,
    amount: entry.amount,
    reason: entry.reason,
    created_at: entry.created_at ?? new Date().toISOString(),
    student_phone: entry.student_phone,
  };

  const { data, error } = await client.from(supabaseTableNames.wallets).insert(payload).select("*").single();
  if (error) return null;
  return normalizeEntry(data as SupabaseRecord | null);
}

export function subscribeToWalletEntries(callback: (entries: WalletEntry[]) => void): (() => void) | null {
  if (typeof window !== "undefined") {
    let active = true;
    const tick = async () => {
      if (!active) return;
      callback(await fetchWalletEntries());
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
    .channel("public:wallets")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.wallets,
      },
      async () => {
        callback(await fetchWalletEntries());
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
