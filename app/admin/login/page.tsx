"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Building2, KeyRound, Loader2, Phone, Shield, UserRound } from "lucide-react";
import { fetchAdminProfileByPhone } from "@/src/lib/supabase/auth";
import { clearAdminSession, storeAdminSession } from "@/src/lib/admin-session";

type LoginTab = "admin" | "staff";

const ADMIN_CODE = "500900";

const tabMeta: Array<{ id: LoginTab; label: string; hint: string; icon: typeof Shield }> = [
  {
    id: "admin",
    label: "الإدارة",
    hint: "دخول المدير العام بكود الوصول",
    icon: Shield,
  },
  {
    id: "staff",
    label: "الموظفين",
    hint: "دخول محدود برقم الموبايل",
    icon: UserRound,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("admin");
  const [adminCode, setAdminCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAdmin = async () => {
    if (adminCode.trim() !== ADMIN_CODE) {
      setError("كود المدير غير صحيح.");
      return;
    }

    storeAdminSession(
      {
        id: "master-admin",
        name: "المدير العام",
        phone: "500900",
        role: "master_admin",
        permissions: [
          "control-room",
          "students",
          "attendance",
          "wallet",
          "staff",
          "vault",
          "content",
          "notifications",
        ],
      },
      "code",
    );

    router.replace("/admin");
  };

  const submitStaff = async () => {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setError("اكتب رقم الموبايل الأول.");
      return;
    }

    const profile = await fetchAdminProfileByPhone(normalizedPhone);
    if (!profile) {
      setError("رقم الموبايل غير مسجل داخل جدول users.");
      return;
    }

    if (profile.role !== "staff") {
      setError("الرقم ده ليس حساب موظف.");
      return;
    }

    storeAdminSession(profile, "phone");
    router.replace("/admin/attendance");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      clearAdminSession();

      if (tab === "admin") {
        await submitAdmin();
        return;
      }

      await submitStaff();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "حدث خطأ أثناء تسجيل الدخول.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A2540] p-4 text-white sm:p-8" dir="rtl">
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[-10%] top-[-20%] h-[80vw] w-[80vw] rounded-full bg-[#D4AF37] blur-[150px] sm:h-[50vw] sm:w-[50vw]"
      />
      <motion.div
        animate={{ scale: [1, 1.24, 1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[70vw] w-[70vw] rounded-full bg-[#D4AF37] blur-[120px] sm:h-[40vw] sm:w-[40vw]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
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
                alt="Vision Center"
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-[#D4AF37]">
              <Building2 className="h-4 w-4" />
              Vision Admin
            </div>

            <div className="flex rounded-2xl border border-white/10 bg-[#0A2540]/50 p-1.5">
              {tabMeta.map((item) => {
                const Icon = item.icon;
                const isActive = tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setError(null);
                    }}
                    className={`relative flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      isActive ? "text-white" : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="admin-login-pill"
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

            <p className="mt-3 text-center text-xs font-bold text-white/60">
              {tabMeta.find((item) => item.id === tab)?.hint}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {tab === "admin" ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-white/80">كود الوصول</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                    <input
                      type="password"
                      value={adminCode}
                      onChange={(event) => setAdminCode(event.target.value)}
                      dir="ltr"
                      placeholder={ADMIN_CODE}
                      className="w-full rounded-2xl border border-white/10 bg-[#0A2540]/40 px-4 py-4 pl-12 text-center text-2xl font-black tracking-[0.3em] text-white outline-none transition-all placeholder:text-white/20 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"
                    />
                  </div>
                  <p className="text-xs font-bold text-white/50">
                    المدير يدخل بالكود فقط، وبعدها تظهر له غرفة العمليات الشاملة.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-white/80">رقم الموبايل</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      dir="ltr"
                      placeholder="010XXXXXXXX"
                      className="w-full rounded-2xl border border-white/10 bg-[#0A2540]/40 px-4 py-4 pl-12 text-center text-xl font-mono tracking-[0.14em] text-white outline-none transition-all placeholder:text-white/25 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"
                    />
                  </div>
                  <p className="text-xs font-bold text-white/50">
                    الموظف يدخل برقم الموبايل فقط، والصلاحيات بتتحدد من جدول users.
                  </p>
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                  {error}
                </div>
              ) : null}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#D4AF37] to-[#e1bd41] py-4 text-lg font-black text-[#0A2540] shadow-xl shadow-[#D4AF37]/20 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : null}
                <span>{tab === "admin" ? "دخول الإدارة" : "دخول الموظفين"}</span>
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
