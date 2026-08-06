"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, LockKeyhole, Shield, Sparkles, UserRound } from "lucide-react";

type LoginTab = "master_admin" | "staff";

const tabMeta: Array<{ id: LoginTab; label: string; hint: string; icon: typeof Shield }> = [
  {
    id: "master_admin",
    label: "المدير العام",
    hint: "دخول المدير العام بكود واحد فقط.",
    icon: Shield,
  },
  {
    id: "staff",
    label: "الموظفين",
    hint: "دخول الموظفين بحساباتهم الفعلية وصلاحيات محددة من قاعدة البيانات.",
    icon: UserRound,
  },
];

async function authRequest<T>(payload: unknown): Promise<T> {
  const response = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "حدث خطأ أثناء تسجيل الدخول");
  return result;
}

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("master_admin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (tab === "master_admin") {
      if (!accessCode.trim()) {
        setError("من فضلك أدخل كود المدير.");
        return;
      }
    } else {
      if (!phone.trim() || !password.trim()) {
        setError("من فضلك أدخل رقم الهاتف وكلمة المرور.");
        return;
      }
      if (password.length < 8) {
        setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await authRequest<{ profile: { role: LoginTab } }>({
        phone: tab === "master_admin" ? undefined : phone,
        password: tab === "master_admin" ? undefined : password,
        expectedRole: tab,
        accessCode: tab === "master_admin" ? accessCode : undefined,
      });

      window.location.assign(result.profile.role === "master_admin" ? "/admin" : "/admin/attendance");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "حدث خطأ أثناء تسجيل الدخول.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F2E8] via-white to-[#EEF4FF] p-4 text-[#0A2540] sm:p-8"
      dir="rtl"
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[-10%] top-[-20%] h-[80vw] w-[80vw] rounded-full bg-[#D4AF37]/25 blur-[150px] sm:h-[50vw] sm:w-[50vw]"
      />
      <motion.div
        animate={{ scale: [1, 1.16, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[70vw] w-[70vw] rounded-full bg-sky-300/25 blur-[120px] sm:h-[40vw] sm:w-[40vw]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.35 }}
            className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/90 p-3 shadow-[0_24px_80px_rgba(10,37,64,0.12)] sm:h-40 sm:w-40"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/15 via-transparent to-sky-200/20" />
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white p-3 shadow-inner">
              <Image src="/logo.png" alt="Vision Center" fill sizes="(max-width: 640px) 144px, 160px" className="object-contain" priority />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white/85 shadow-[0_30px_80px_rgba(10,37,64,0.08)] backdrop-blur-xl"
        >
          <div className="absolute -inset-x-20 top-0 h-[100px] -translate-y-12 -rotate-6 bg-gradient-to-b from-white/30 to-transparent opacity-80 blur-[2px]" />

          <div className="relative z-10 p-6 sm:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-[#8A6A00]">
              <Building2 className="h-4 w-4" />
              Vision Admin
            </div>

            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
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
                      setAccessCode("");
                    }}
                    className={`relative flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      isActive ? "text-[#0A2540]" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="admin-login-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-[0_10px_30px_rgba(10,37,64,0.08)] ring-1 ring-[#D4AF37]/20"
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

            <p className="mt-3 text-center text-xs font-bold text-slate-500">{tabMeta.find((item) => item.id === tab)?.hint}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {tab === "master_admin" ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">كود دخول المدير</label>
                  <div className="relative">
                    <input
                      type={showAccessCode ? "text" : "password"}
                      value={accessCode}
                      onChange={(event) => setAccessCode(event.target.value)}
                      placeholder="أدخل كود المدير"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-12 text-center text-base font-semibold tracking-[0.28em] text-[#0A2540] outline-none transition-all placeholder:text-slate-300 focus:border-[#D4AF37] focus:bg-[#FFFCF7] focus:ring-4 focus:ring-[#D4AF37]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessCode((current) => !current)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400"
                      aria-label={showAccessCode ? "إخفاء الكود" : "عرض الكود"}
                    >
                      {showAccessCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {tab !== "master_admin" ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+2010XXXXXXXXX"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-base font-semibold tracking-[0.12em] text-[#0A2540] outline-none transition-all placeholder:text-slate-300 focus:border-[#D4AF37] focus:bg-[#FFFCF7] focus:ring-4 focus:ring-[#D4AF37]/10"
                  />
                </div>
              ) : null}

              {tab !== "master_admin" ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-12 pr-12 text-center text-xl font-semibold tracking-[0.18em] text-[#0A2540] outline-none transition-all placeholder:text-slate-300 focus:border-[#D4AF37] focus:bg-[#FFFCF7] focus:ring-4 focus:ring-[#D4AF37]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0A2540] py-4 text-lg font-black text-white shadow-[0_20px_40px_rgba(10,37,64,0.16)] transition-all hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                <span>{tab === "master_admin" ? "دخول المدير العام" : "دخول الموظفين"}</span>
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
