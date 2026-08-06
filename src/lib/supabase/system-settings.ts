import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type SystemSettings = {
  id?: string;
  wallet_enabled: boolean;
  registration_open: boolean;
  show_results: boolean;
};

export async function fetchSystemSettings(): Promise<SystemSettings | null> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/admin/system-settings", { credentials: "include", cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { settings?: SystemSettings | null };
        return payload.settings ?? null;
      }
    } catch {
      // fall back to direct client access below
    }
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(supabaseTableNames.systemSettings)
      .select("id, wallet_enabled, registration_open, show_results")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching system settings:", error);
      return null;
    }

    return (data as SystemSettings | null) ?? null;
  } catch (err) {
    console.error("Unexpected error fetching system settings:", err);
    return null;
  }
}

function normalizeSystemSettings(data: SupabaseRecord | null): SystemSettings | null {
  if (!data) return null;

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    wallet_enabled: Boolean(data.wallet_enabled),
    registration_open: Boolean(data.registration_open),
    show_results: Boolean(data.show_results),
  };
}

function getLocalDailyCloseDeadline(): Date {
  const now = new Date();
  const deadline = new Date(now);

  deadline.setHours(23, 59, 0, 0);
  deadline.setSeconds(0);
  deadline.setMilliseconds(0);

  return deadline;
}

export async function closeRegistrationIfPastDeadline(): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const settings = await fetchSystemSettings();
  if (!settings) return null;
  if (!settings.registration_open) return settings;

  const deadline = getLocalDailyCloseDeadline();
  if (new Date() < deadline) return settings;

  return await updateSystemSettings({ registration_open: false });
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings | null> {
  if (typeof window !== "undefined") {
    try {
        const response = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const payload = (await response.json()) as { settings?: SystemSettings | null };
        return payload.settings ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const existing = await fetchSystemSettings();

    if (existing) {
      const { data, error } = await client
        .from(supabaseTableNames.systemSettings)
        .update({
          wallet_enabled: settings.wallet_enabled ?? existing.wallet_enabled,
          registration_open: settings.registration_open ?? existing.registration_open,
          show_results: settings.show_results ?? existing.show_results,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating system settings:", error);
        return null;
      }

      return normalizeSystemSettings(data as SupabaseRecord | null);
    } else {
      const { data, error } = await client
        .from(supabaseTableNames.systemSettings)
        .insert({
          wallet_enabled: settings.wallet_enabled ?? true,
          registration_open: settings.registration_open ?? false,
          show_results: settings.show_results ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating system settings:", error);
        return null;
      }

      return normalizeSystemSettings(data as SupabaseRecord | null);
    }
  } catch (err) {
    console.error("Unexpected error updating system settings:", err);
    return null;
  }
}

export function subscribeToSystemSettings(callback: (settings: SystemSettings) => void): (() => void) | null {
  if (typeof window !== "undefined") {
    let active = true;
    const tick = async () => {
      if (!active) return;
      const settings = await fetchSystemSettings();
      if (settings) callback(settings);
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

  try {
    const channel = client
      .channel("public:system_settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        (payload) => {
          if (payload.new) {
            callback(normalizeSystemSettings(payload.new as SupabaseRecord) ?? {
              wallet_enabled: false,
              registration_open: false,
              show_results: false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error("Error subscribing to system settings:", err);
    return null;
  }
}
