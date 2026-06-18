import { getSupabaseClient, supabaseTableNames } from "./index";

export type SystemSettings = {
  id?: string;
  wallet_enabled: boolean;
  registration_open: boolean;
  show_results: boolean;
};

export async function fetchSystemSettings(): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(supabaseTableNames.systemSettings)
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching system settings:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error fetching system settings:", err);
    return null;
  }
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // First, try to get existing record
    const existing = await fetchSystemSettings();

    if (existing) {
      // Update existing record
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

      return data;
    } else {
      // Insert new record if none exists
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

      return data;
    }
  } catch (err) {
    console.error("Unexpected error updating system settings:", err);
    return null;
  }
}

export function subscribeToSystemSettings(
  callback: (settings: SystemSettings) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Use realtime channel for subscriptions
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
            callback(payload.new as SystemSettings);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error("Error subscribing to system settings:", err);
    return null;
  }
}
