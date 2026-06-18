"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Activity, CircleDashed, Download, QrCode, Clock, RefreshCcw } from "lucide-react";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import {
  fetchAttendanceRecords,
  saveAttendanceRecord,
  subscribeToAttendance,
  type AttendanceRecord,
} from "@/src/lib/supabase/attendance";

const STORAGE_KEY = "vision-attendance-seed";

const createSeed = () => `VISION-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
const createPin = () => String(Math.floor(100 + Math.random() * 900));

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [activeTab, setActiveTab] = useState<"LIVE" | "BARCODE">("LIVE");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [qrValue, setQrValue] = useState("");
  const [pinCode, setPinCode] = useState("");
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { qrValue?: string; pinCode?: string };
          if (parsed.qrValue) setQrValue(parsed.qrValue);
          if (parsed.pinCode) setPinCode(parsed.pinCode);
        } catch {
          // ignore
        }
      }

      if (!qrValue) setQrValue(createSeed());
      if (!pinCode) setPinCode(createPin());

      const currentRecords = await fetchAttendanceRecords();
      if (isMounted) setRecords(currentRecords);
    };

    void load();

    const unsubscribe = subscribeToAttendance((nextRecords) => {
      setRecords(nextRecords);
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!qrValue || !pinCode) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ qrValue, pinCode }));
  }, [pinCode, qrValue]);

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
      link.download = "vision-center-checkin.png";
      link.click();
    };

    image.src = url;
  };

  const regenerateAccess = async () => {
    const nextQr = createSeed();
    const nextPin = createPin();
    setQrValue(nextQr);
    setPinCode(nextPin);

    await saveAttendanceRecord({
      student_name: "تجديد الباركود",
      code: nextPin,
      qr_value: nextQr,
      created_at: new Date().toISOString(),
      address: "SYSTEM",
    });
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
            <p className="mt-1 text-sm font-bold text-slate-500">
              باركود ثابت للتجربة + شاشة بث مباشر جاهزة للربط.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("LIVE")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === "LIVE"
                ? "bg-white text-[#0A2540] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            البث المباشر
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setActiveTab("BARCODE")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "BARCODE"
                  ? "bg-white text-[#0A2540] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              الباركود الثابت
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
              <p className="mt-1 text-sm font-bold text-slate-500">
                هتظهر هنا تسجيلات الحضور الفعلية أول ما الطلاب يسجلوا من الموبايل.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
              LIVE FEED
            </span>
          </div>

          {liveRows.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد تسجيلات حضور حالياً"
              description="مفيش بيانات حقيقية لسه. الشاشة جاهزة لاستقبال أي طالب يسجل بالموبايل بدون أي بيانات وهمية."
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
                      <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500">
                        {row.student_phone ?? "-"}
                      </td>
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
                ثابت للطباعة
              </div>
              <h2 className="text-2xl font-extrabold text-[#0A2540]">باركود الحضور الثابت</h2>
              <p className="max-w-xl text-sm font-bold leading-7 text-slate-500">
                استخدم الباركود على مدخل السنتر أو على لوحة الحضور. بعد الربط الحقيقي، نفس الكود ده هيقود صفحة الـ self check-in
                للموبايل.
              </p>

              <div ref={barcodeRef} className="inline-flex rounded-[2rem] border border-slate-200 bg:white p-4 shadow-lg">
                <div className="rounded-[1.5rem] border-4 border-[#0A2540] bg-white p-4">
                  <QRCode value={`${qrValue}|${pinCode}`} size={260} fgColor="#0A2540" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadBarcode}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#123B66]"
                >
                  <Download className="h-4 w-4" />
                  تحميل الباركود كصورة
                </button>
                <button
                  type="button"
                  onClick={() => void regenerateAccess()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  تجديد الكود
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-lg font-extrabold text-[#0A2540]">كود الدخول البديل</h3>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center">
                <p className="text-sm font-bold text-slate-500">الكود المختصر</p>
                <p className="mt-3 text-5xl font-black tracking-[0.3em] text-[#0A2540]">{pinCode || "---"}</p>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  لو في مشكلة كاميرا، الطالب يكتب 3 أرقام فقط من هنا. بعد الربط الحقيقي هيظهر نفس السجل في لوحة الأدمن.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
