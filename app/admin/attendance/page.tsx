"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Activity, CircleDashed, Download, QrCode, Clock, RefreshCcw, Search, Users } from "lucide-react";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import type { AttendanceRecord } from "@/src/lib/supabase/attendance";
import type { AppUserRecord } from "@/src/lib/supabase/users";

type AttendanceTokenResponse = {
  token?: string;
  expires_at?: string;
};

type ApiStudent = Pick<AppUserRecord, "id" | "name" | "phone" | "stage" | "grade" | "track" | "student_code" | "parent_phone">;

const fetchJson = async <T,>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> => {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "حدث خطأ غير متوقع");
  }

  return (await response.json()) as T;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [activeTab, setActiveTab] = useState<"LIVE" | "DYNAMIC">("LIVE");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [qrValue, setQrValue] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(60);
  const [message, setMessage] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  const filteredManualSearchResults = useMemo(() => {
    const query = manualSearch.trim().toLowerCase();
    if (!query) return [];
    return students
      .filter((student) => {
        const haystack = [
          student.name,
          student.phone,
          student.student_code ?? "",
          student.grade ?? "",
          student.track ?? "",
          student.parent_phone ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 12);
  }, [manualSearch, students]);

  const loadRecords = async () => {
    try {
      const payload = await fetchJson<{ records?: AttendanceRecord[] }>("/api/admin/attendance");
      if (payload?.records) setRecords(payload.records);
    } catch (error) {
      console.error("Failed to load attendance records", error);
    }
  };

  const loadStudents = async () => {
    try {
      const payload = await fetchJson<{ students?: ApiStudent[] }>("/api/admin/students");
      setStudents(payload?.students ?? []);
    } catch (error) {
      console.error("Failed to load students", error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadRecords(), loadStudents()]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    const interval = window.setInterval(() => {
      if (activeTab === "LIVE") {
        void loadRecords();
      }
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTab]);

  const downloadBarcode = async () => {
    const svg = barcodeRef.current?.querySelector("svg");
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width || 512;
      canvas.height = image.height || 512;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "royacenter-attendance-token.png";
      link.click();
    };

    image.src = url;
  };

  const issueToken = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const payload = await fetchJson<{ token?: AttendanceTokenResponse }>("/api/admin/attendance-token", {
        method: "POST",
        body: JSON.stringify({ shared: true, valid_for_seconds: sessionDurationSeconds }),
      });

      const tokenData = payload?.token;
      if (!tokenData?.token) {
        setMessage("فشل توليد رمز الحضور");
        return;
      }

      setQrValue(tokenData.token);
      setExpiresAt(tokenData.expires_at ?? null);
      setMessage("تم توليد رمز QR بنجاح");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حصل خطأ أثناء توليد التوكن");
    } finally {
      setIsLoading(false);
    }
  };

  const recordManualAttendance = async (student: ApiStudent) => {
    if (!student.id) {
      setMessage("تعذر تحديد الطالب لتسجيل الحضور");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const payload = await fetchJson<{ success?: boolean; error?: string }>("/api/admin/manual-attendance", {
        method: "POST",
        body: JSON.stringify({ student_id: student.id }),
      });

      if (!payload?.success) {
        throw new Error(payload?.error ?? "تعذر تسجيل الحضور اليدوي");
      }

      setMessage(`تم تسجيل حضور ${student.name} بنجاح`);
      setManualSearch("");
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تسجيل الحضور اليدوي");
    } finally {
      setIsLoading(false);
    }
  };

  const liveRows = useMemo(() => records.slice(0, 8), [records]);

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540]">الحضور الذكي</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">شاشة البث المباشر وتوليد QR مباشر قصير العمر من قاعدة البيانات.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("LIVE")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === "LIVE" ? "bg-white text-[#0A2540] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            البث المباشر
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setActiveTab("DYNAMIC")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "DYNAMIC" ? "bg-white text-[#0A2540] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              QR مباشر
            </button>
          ) : null}
        </div>
      </motion.div>

      {activeTab === "LIVE" ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540]">شاشة البث المباشر</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">هنا تظهر تسجيلات الحضور الجديدة أول ما تتسجل من أي جهاز.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadRecords()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540]"
            >
              <RefreshCcw className="h-4 w-4" />
              تحديث
            </button>
          </div>

          {liveRows.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد تسجيلات حضور حالياً"
              description="أول ما يتسجل حضور من شاشة الـ QR هتظهر هنا."
            />
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="min-w-full text-right">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                    <th className="px-4 py-3 text-sm font-bold">الصف</th>
                    <th className="px-4 py-3 text-sm font-bold">القسم</th>
                    <th className="px-4 py-3 text-sm font-bold">العنوان</th>
                    <th className="px-4 py-3 text-sm font-bold">رقم الهاتف</th>
                    <th className="px-4 py-3 text-sm font-bold">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {liveRows.map((row) => (
                    <tr key={row.id ?? `${row.student_name}-${row.created_at}`}>
                      <td className="px-4 py-4 font-bold text-[#0A2540]">{row.student_name}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-600">{row.grade ?? "-"}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-600">{row.track ?? "-"}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-600">{row.address ?? "-"}</td>
                      <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500">{row.student_phone ?? "-"}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-500">
                        {row.created_at ? new Date(row.created_at).toLocaleString("ar-EG") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0A2540]/5 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#0A2540]">
                <QrCode className="h-4 w-4" />
                رمز QR مباشر
              </div>
              <h2 className="text-2xl font-extrabold text-[#0A2540]">شاشة QR الديناميكي</h2>
              <p className="max-w-xl text-sm font-bold leading-7 text-slate-500">
                أنشئ رمز حضور مباشر صالح لجميع الطلاب لفترة قصيرة. استخدم هذه الشاشة في السنتر أو أي جهاز عرض، وسيتم تسجيل الحضور فوراً عند المسح.
              </p>

              <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <label className="space-y-2 text-sm font-bold text-slate-700">
                  مدة صلاحية رمز الـ QR
                  <select
                    value={sessionDurationSeconds}
                    onChange={(event) => setSessionDurationSeconds(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
                  >
                    <option value={60}>1 دقيقة</option>
                    <option value={120}>2 دقائق</option>
                    <option value={300}>5 دقائق</option>
                    <option value={600}>10 دقائق</option>
                  </select>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void issueToken()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {isLoading ? "جاري التوليد..." : "توليد QR جديد"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadBarcode}
                    disabled={!qrValue}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    تحميل الصورة
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <label className="space-y-2 text-sm font-bold text-slate-700">
                    تسجيل حضور يدوي سريع
                    <div className="relative">
                      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={manualSearch}
                        onChange={(event) => setManualSearch(event.target.value)}
                        placeholder="ابحث بـ VIS أو الاسم أو الهاتف أو ولي الأمر"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none"
                      />
                    </div>
                  </label>

                  {filteredManualSearchResults.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {filteredManualSearchResults.map((student) => (
                        <div key={student.id ?? student.phone} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div>
                            <div className="text-sm font-extrabold text-[#0A2540]">{student.name}</div>
                            <div className="text-xs font-bold text-slate-500">{student.phone} • {student.student_code ?? "-"}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void recordManualAttendance(student)}
                            disabled={isLoading}
                            className="rounded-xl bg-[#0A2540] px-3 py-2 text-sm font-bold text-white"
                          >
                            تسجيل حضور
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : manualSearch ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">لا توجد نتائج مطابقة.</div>
                  ) : null}
                </div>

                {message ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{message}</div> : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-lg font-extrabold text-[#0A2540]">QR والحماية</h3>
              </div>

              <div ref={barcodeRef} className="inline-flex rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg">
                <div className="rounded-[1.5rem] border-4 border-[#0A2540] bg-white p-4">
                  {qrValue ? <QRCode value={qrValue} size={260} fgColor="#0A2540" /> : <EmptyState icon={Users} title="لم يتم توليد QR بعد" description="اضغط توليد QR جديد لإنشاء رمز صالح حالياً." />}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
