"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Phone, Shield, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { getSupabaseClient } from "@/src/lib/supabase";
import {
  fetchAdminProfileByPhone,
  sendAdminLoginOtp,
  verifyAdminLoginOtp,
} from "@/src/lib/supabase/auth";

type LoginRole = "master_admin" | "staff";
type LoginStep = "phone" | "otp";

const roleTabs: Array<{ role: LoginRole; label: string; hint: string }> = [
  {
    role: "master_admin",
    label: "المدير العام",
    hint: "دخول كامل لغرفة العمليات الشاملة",
  },
  {
    role: "staff",
    label: "الموظفين",
    hint: "صلاحيات محدودة حسب الدور",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("staff");
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setError("Supabase غير مضبوط حالياً. راجع متغيرات البيئة.");
      return;
    }

    setIsLoading(true);

    try {
      if (step === "phone") {
        const { error: otpError } = await sendAdminLoginOtp(phone);
        if (otpError) {
          throw otpError;
        }

        setStep("otp");
        setSuccessMessage("تم إرسال كود التحقق على رقم الموبايل.");
        return;
      }

      const { error: verifyError } = await verifyAdminLoginOtp(phone, otp);
      if (verifyError) {
        throw verifyError;
      }

      const profile = await fetchAdminProfileByPhone(phone);
      if (!profile) {
        const client = getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
        throw new Error("الرقم غير مسجل داخل جدول users.");
      }

      if (profile.role !== role) {
        const client = getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
        throw new Error(role === "master_admin" ? "هذا الرقم ليس مديراً عاماً." : "هذا الرقم ليس مخصصاً للموظفين.");
      }

      router.replace(profile.role === "master_admin" ? "/admin" : "/admin/attendance");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "حدث خطأ أثناء تسجيل الدخول.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = step === "phone" ? phone.trim().length > 0 : otp.trim().length > 0 && phone.trim().length > 0;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A2540] p-4 text-white sm:p-8" dir="rtl">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[-10%] top-[-20%] h-[80vw] w-[80vw] rounded-full bg-[#D4AF37] blur-[150px] sm:h-[50vw] sm:w-[50vw]"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[70vw] w-[70vw] rounded-full bg-[#D4AF37] blur-[120px] sm:h-[40vw] sm:w-[40vw]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex w-full flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-3 shadow-[0_0_80px_rgba(212,175,55,0.15)] backdrop-blur-2xl sm:h-40 sm:w-40"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent" />
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white p-3 shadow-inner">
              <Image
                src="/logo.png"
                alt="Center Logo"
                fill
                sizes="(max-width: 640px) 144px, 160px"
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute -inset-x-20 top-0 h-[100px] -translate-y-12 -rotate-6 bg-gradient-to-b from-white/10 to-transparent opacity-30 blur-[2px]" />

          <div className="relative z-10 p-6 sm:p-10">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-bold text-white/70">
              تسجيل دخول الأدمن بـ Supabase Auth. لازم الرقم يكون موجود في جدول <span className="text-[#D4AF37]">users</span>.
            </div>

            <div className="flex rounded-2xl border border-white/10 bg-[#0A2540]/50 p-1.5">
              {roleTabs.map((item) => {
                const Icon = item.role === "master_admin" ? Shield : Users;
                const isActive = role === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      setRole(item.role);
                      setError(null);
                      setSuccessMessage(null);
                      setStep("phone");
                      setOtp("");
                    }}
                    className={`relative flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${isActive ? "text-white" : "text-white/60 hover:text-white/85"}`}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="admin-role-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#e1bd41] shadow-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    ) : null}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-xs font-bold text-white/60">{roleTabs.find((item) => item.role === role)?.hint}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <AnimatePresence mode="wait">
                {step === "phone" ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <label className="block text-sm font-bold text-white/80">رقم الموبايل</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        dir="ltr"
                        placeholder="010XXXXXXXX"
                        className="w-full rounded-2xl border border-white/10 bg-[#0A2540]/40 px-4 py-4 pr-12 text-center text-xl font-mono tracking-[0.16em] text-white outline-none transition-all placeholder:text-white/25 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <label className="block text-sm font-bold text-white/80">كود التحقق</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        dir="ltr"
                        placeholder="123456"
                        className="w-full rounded-2xl border border-white/10 bg-[#0A2540]/40 px-4 py-4 pr-12 text-center text-xl font-mono tracking-[0.35em] text-white outline-none transition-all placeholder:text-white/25 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-sm font-bold text-[#D4AF37] underline decoration-2 underline-offset-4"
                    >
                      تعديل رقم الموبايل
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="min-h-10">
                {error ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
                    {successMessage}
                  </div>
                ) : null}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !canSubmit}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#D4AF37] to-[#e1bd41] py-4 text-lg font-black text-[#0A2540] shadow-xl shadow-[#D4AF37]/20 transition-all disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/10 disabled:text-white/40"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span>{step === "phone" ? "إرسال كود التحقق" : "دخول لوحة التحكم"}</span>
                    <ArrowLeft className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
