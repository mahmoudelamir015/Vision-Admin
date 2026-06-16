export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const isSupabaseConfigured = Boolean(supabaseEnv.url && supabaseEnv.anonKey);

export const supabaseTables = ['students', 'teachers', 'staff', 'attendance', 'wallet', 'exams'] as const;

export type SupabaseTable = (typeof supabaseTables)[number];
