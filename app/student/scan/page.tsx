"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, XCircle, CheckCircle, ChevronRight, RefreshCw, Phone, KeyRound } from "lucide-react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { normalizeEgyptianPhone } from "@/src/lib/auth/phone";
import { saveAttendanceRecord } from "@/src/lib/supabase/attendance";

export default function ScannerPage() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<"SUCCESS" | "ERROR" | null>(null);
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scanning) return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "student-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false,
      );

      scannerRef.current.render(
        (decodedText) => {
          setToken(decodedText.trim());
          setScanning(false);
          if (scannerRef.current) scannerRef.current.pause(true);
        },
        () => {
          // ignore scan noise
        },
      );
    } else {
      scannerRef.current.resume();
    }
  }, [scanning]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          void scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const submit = async () => {
    setMessage(null);

    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!normalizedPhone) {
      setMessage("رقم الهاتف غير صالح");
      return;
    }

    /* QR is optional */

    if (pin.trim().length < 4) {
      setMessage("اكتب الـ PIN المختصر");
      return;
    }

    try {
      const saved = await saveAttendanceRecord({
        student_name: normalizedPhone,
        student_phone: normalizedPhone,
        code: pin.trim(),
        qr_value: token,
      });

      if (!saved) {
        setResult("ERROR");
        setMessage("فشل تسجيل الحضور");
        return;
      }

      setResult("SUCCESS");
      setMessage("تم تسجيل الحضور بنجاح");
    } catch (error) {
      setResult("ERROR");
      setMessage(error instanceof Error ? error.message : "فشل تسجيل الحضور");
    }
  };

  return (
    <div className="flex min-h-screen flex-col relative bg-black">
      <div className="absolute top-0 inset-x-0 z-50 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/student" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
          <ChevronRight className="w-6 h-6" />
        </Link>
        <span className="text-white font-bold tracking-wide">مسح QR الحضور</span>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center px-4 py-24">
        <div className="absolute inset-0 bg-[#0A2540]">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-[#0A2540] to-black" />
        </div>

        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06 }}
              className="relative z-10 flex w-full max-w-xl flex-col items-center gap-6"
            >
              <div className="w-full overflow-hidden rounded-[2rem] border-4 border-white/90 bg-white shadow-2xl">
                <div id="student-reader" className="w-full" />
              </div>

              <div className="rounded-full border border-white/10 bg-black/50 px-6 py-3 text-sm font-bold text-white backdrop-blur-md">
                الكاميرا جاهزة لمسح QR token
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 w-full max-w-lg px-6"
            >
              <div className="rounded-[2rem] bg-white p-8 shadow-2xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540]">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#0A2540]">تسجيل حضور الطالب</h2>
                    <p className="text-sm font-bold text-slate-500">امسح الـ QR ثم اكتب رقم الهاتف والـ PIN المختصر.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-600">
                    رقم الهاتف
                    <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+20XXXXXXXXXX"
                        dir="ltr"
                        className="w-full outline-none"
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-bold text-slate-600">
                    الـ PIN
                    <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                      <input
                        value={pin}
                        onChange={(event) => setPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        placeholder="123456"
                        dir="ltr"
                        className="w-full font-mono outline-none"
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-bold text-slate-600">
                    نص الـ QR (اختياري)
                    <textarea
                      value={token}
                      onChange={(event) => setToken(event.target.value.trim())}
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none"
                      placeholder="token"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => void submit()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#123B66]"
                    >
                      <CheckCircle className="h-4 w-4" />
                      تسجيل الحضور
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanning(true);
                        setResult(null);
                        setMessage(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      مسح QR آخر
                    </button>
                  </div>

                  {message ? (
                    <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${result === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {message}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result === "SUCCESS" ? (
          <div className="mt-6 rounded-2xl bg-white/10 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur-md">
            الحضور اتسجل بنجاح
          </div>
        ) : null}
      </div>
    </div>
  );
}
