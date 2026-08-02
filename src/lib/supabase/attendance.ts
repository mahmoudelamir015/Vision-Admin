import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type AttendanceRecord = {
  id?: string;
  student_name: string;
  student_phone?: string;
  stage?: string;
  grade?: string;
  track?: string;
  address?: string;
  code?: string;
  qr_value?: string;
  created_at?: string;
};

const normalizeAttendance = (record: SupabaseRecord | null): AttendanceRecord | null => {
  if (!record) return null;

  const student_name = typeof record.student_name === "string" ? record.student_name : "";
  if (!student_name) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    student_name,
    student_phone: typeof record.student_phone === "string" ? record.student_phone : undefined,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    address: typeof record.address === "string" ? record.address : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    qr_value: typeof record.qr_value === "string" ? record.qr_value : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api-legacy/admin/attendance", { credentials: "include", cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { records?: AttendanceRecord[] };
        if (Array.isArray(payload.records)) return payload.records;
      }
    } catch {
      // fall back to direct client access below
    }
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.attendance).select("*").order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];

  return data.map((record) => normalizeAttendance(record as SupabaseRecord)).filter((record): record is AttendanceRecord => Boolean(record));
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<AttendanceRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc("record_attendance", {
    student_name: record.student_name,
    student_phone: record.student_phone ?? null,
    stage: record.stage ?? null,
    grade: record.grade ?? null,
    track: record.track ?? null,
    address: record.address ?? null,
    code: record.code ?? null,
    qr_value: record.qr_value ?? null,
  });

  if (error) {
    throw new Error(error.message || "ATTENDANCE_SAVE_FAILED");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return normalizeAttendance(row as SupabaseRecord | null);
}

export function subscribeToAttendance(callback: (records: AttendanceRecord[]) => void): (() => void) | null {
  if (typeof window !== "undefined") {
    let active = true;
    const tick = async () => {
      if (!active) return;
      callback(await fetchAttendanceRecords());
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
    .channel("public:attendance")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.attendance,
      },
      async () => {
        callback(await fetchAttendanceRecords());
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
