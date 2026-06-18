"use client";

import { motion } from "motion/react";
import { CircleDashed, FileText, ShieldAlert, Upload } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function ContentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط¯ط®ظˆظ„ ط§ظ„ظ…ط­طھظˆظ‰</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">ط§ظ„طµظپط­ط© ظ…ط­ظ…ظٹط© ظ„ظ„ظ…ط¯ظٹط± ظپظ‚ط·.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط­طھظˆظ‰</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              ط±ظپط¹ ط§ظ„ظ…ظ„ظپط§طھ ظˆط§ظ„ظ…ط°ظƒط±ط§طھ ظ‡ظٹطھظ… ط±ط¨ط·ظ‡ ط¨ط§ظ„ظ€ API ظ„ط§ط­ظ‚ط§ظ‹ ط¨ط¯ظˆظ† ط¨ظٹط§ظ†ط§طھ ظˆظ‡ظ…ظٹط©.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <EmptyState
            icon={CircleDashed}
            title="ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ظپط§طھ ظ…ظ†ط´ظˆط±ط© ط­ط§ظ„ظٹط§ظ‹"
            description="ط£ظٹ ظ…ظ„ظپ ظ‡ظٹطھط¶ط§ظپ ظ…ظ† ظ‡ظ†ط§ ط£ظˆ ظ…ظ† Supabase ظ‡ظٹط¸ظ‡ط± طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظپظٹ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ط­طھظˆظ‰."
          />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط±ظپط¹ ظ…ظ„ظپ ط¬ط¯ظٹط¯</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                ط§ظ„ظˆط§ط¬ظ‡ط© ط¬ط§ظ‡ط²ط© ظ„ظ„ط±ط¨ط· ظ…ط¹ ط§ظ„طھط®ط²ظٹظ†.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">ط§ط³ط­ط¨ ط§ظ„ظ…ظ„ظپ ظ‡ظ†ط§ ط£ظˆ ط§ط®طھط± ظ…ظ† ط§ظ„ط¬ظ‡ط§ط²</p>
            <p className="mt-2 text-xs font-medium text-slate-400">PWA ready â€¢ Mobile first</p>
          </div>
        </div>
      </section>
    </div>
  );
}

