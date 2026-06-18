"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, ShieldAlert, TrendingDown, TrendingUp, Vault } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function VaultPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [activeTab, setActiveTab] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط¯ط®ظˆظ„ ط§ظ„ط®ط²ظ†ط©</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">
          ط§ظ„طµظپط­ط© ظ…ط­ظ…ظٹط© ظ„ظ„ظ…ط¯ظٹط± ظپظ‚ط·.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] bg-[#0A2540] p-6 text-white shadow-sm">
          <p className="text-sm font-bold text-white/60">ط±طµظٹط¯ ط§ظ„ط®ط²ظ†ط©</p>
          <p className="mt-2 text-4xl font-black">0</p>
          <p className="mt-2 text-sm font-medium text-white/70">ط¬ط§ظ‡ط² ظ„ظ„ط§ط³طھظ‚ط¨ط§ظ„ ط¨ط¹ط¯ ط§ظ„ط±ط¨ط·.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ط§ظ„ظˆط±ط§ط¯</p>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0A2540] dark:text-white">0 ط¬.ظ…</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ط§ظ„ظ…ظ†طµط±ظپ</p>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0A2540] dark:text-white">0 ط¬.ظ…</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        {[
          { id: "ALL", label: "ط§ظ„ظƒظ„" },
          { id: "INCOME", label: "ط§ظ„ظˆط±ط§ط¯" },
          { id: "EXPENSE", label: "ط§ظ„ظ…ظ†طµط±ظپ" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id as typeof activeTab)}
            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === item.id
                ? "bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
            <Vault className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط³ط¬ظ„ ط§ظ„ط­ط±ظƒط§طھ ط§ظ„ظ…ط§ظ„ظٹط©</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظˆظ‡ظ…ظٹط©. ط£ظˆظ„ ط­ط±ظƒط© ط­ظ‚ظٹظ‚ظٹط© ظ‡طھط¸ظ‡ط± ظ‡ظ†ط§ ط¨ط¹ط¯ ط§ظ„ط±ط¨ط·.
            </p>
          </div>
        </div>

        <EmptyState
          icon={CircleDashed}
          title="ط§ظ„ط®ط²ظ†ط© ط¬ط§ظ‡ط²ط© ظ„ظ„ط±ط¨ط·"
          description="ط§ظ„طµظپط­ط© ط§ظ„ط­ط§ظ„ظٹط© ط¹ط¨ط§ط±ط© ط¹ظ† ظ„ظˆط­ط© ظ…طھط§ط¨ط¹ط© ظ†ط¸ظٹظپط© ط¨ط¯ظˆظ† ط£ظٹ ط³ط¬ظ„ ظˆظ‡ظ…ظٹ. ط¨ط¹ط¯ Supabase ظ‡ظ†ظ‚ط±ط§ ط§ظ„ط­ط±ظƒط§طھ ط§ظ„ظپط¹ظ„ظٹط© ظˆظ†ظ‚ط³ظ…ظ‡ط§ طھظ„ظ‚ط§ط¦ظٹط§ظ‹."
        />
      </motion.section>
    </div>
  );
}

