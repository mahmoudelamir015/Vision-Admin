"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Banknote, CircleDashed, History, PlusCircle, Search, ShieldAlert, Wallet } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

type WalletEntry = {
  id: string;
  owner: string;
  accountType: "staff" | "student" | "parent";
  amount: number;
  reason: string;
  createdAt: string;
};

export default function WalletPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";

  const [isWalletEnabled, setIsWalletEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"CHARGE" | "LEDGER" | "SETTLEMENT">("CHARGE");
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [chargeOwner, setChargeOwner] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeReason, setChargeReason] = useState("");
  const [accountType, setAccountType] = useState<WalletEntry["accountType"]>("staff");

  const settlementPreview = useMemo(() => {
    const gross = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const teacherShare = Math.round(gross * 0.6);
    const centerShare = gross - teacherShare;
    return { gross, teacherShare, centerShare };
  }, [entries]);

  const handleCharge = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isWalletEnabled) return;
    if (!chargeOwner.trim() || !chargeAmount.trim()) return;

    setEntries((current) => [
      {
        id: `entry-${Date.now()}`,
        owner: chargeOwner.trim(),
        accountType,
        amount: Number(chargeAmount),
        reason: chargeReason.trim() || "ط´ط­ظ† ط±طµظٹط¯",
        createdAt: new Date().toLocaleString("ar-EG"),
      },
      ...current,
    ]);

    setChargeOwner("");
    setChargeAmount("");
    setChargeReason("");
    setAccountType("staff");
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">
              ط§ظ„ظ…ط­ظپط¸ط© ظˆط§ظ„ظ…ط§ظ„ظٹط§طھ
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              ط´ط­ظ† ط±طµظٹط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ†طŒ ظ…طھط§ط¨ط¹ط© ط§ظ„ط³ط¬ظ„طŒ ظˆطھط¬ظ‡ظٹط² ط§ظ„طھظ‚ظپظٹظ„ ط§ظ„ط¢ظ„ظٹ.
            </p>
          </div>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsWalletEnabled((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              isWalletEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <Banknote className="h-4 w-4" />
            {isWalletEnabled ? "ط§ظ„ظ…ط­ظپط¸ط© ظ…ظپط¹ظ„ط©" : "ط§ظ„ظ…ط­ظپط¸ط© ظ…طھظˆظ‚ظپط©"}
          </button>
        ) : null}
      </motion.div>

      {!isWalletEnabled && isAdmin ? (
        <div className="rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-6 text-center text-red-700">
          <ShieldAlert className="mx-auto mb-3 h-12 w-12 opacity-80" />
          <h2 className="text-xl font-extrabold">ظ†ط¸ط§ظ… ط§ظ„ظ…ط­ظپط¸ط© ظ…طھظˆظ‚ظپ ط­ط§ظ„ظٹط§ظ‹</h2>
          <p className="mt-2 text-sm font-bold leading-6">
            ط§ظ„ط¥ط¯ط§ط±ط© ط£ظˆظ‚ظپطھ ط§ظ„ط´ط­ظ† ظˆط§ظ„ط³ط­ط¨ ظ…ط¤ظ‚طھط§ظ‹ ظ…ظ† ط؛ط±ظپط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ. طھظ‚ط¯ط± طھط¹ظٹط¯ طھط´ط؛ظٹظ„ظ‡ ظ…ظ† ط§ظ„ط²ط± ط§ظ„ظ…ظˆط¬ظˆط¯ ط¨ط§ظ„ط£ط¹ظ„ظ‰ ظپظٹ ط£ظٹ ظˆظ‚طھ.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        {[
          { id: "CHARGE", label: "ط´ط­ظ† ط±طµظٹط¯" },
          { id: "LEDGER", label: "ط§ظ„ط³ط¬ظ„ ط§ظ„ظ…ط§ظ„ظٹ" },
          { id: "SETTLEMENT", label: "ط§ظ„طھظ‚ظپظٹظ„ ط§ظ„ط¢ظ„ظٹ" },
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

      {activeTab === "CHARGE" ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط´ط­ظ† ط±طµظٹط¯ ط§ظ„ظ…ظˆط¸ظپ</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  ط£ط¶ظپ ط¹ظ…ظ„ظٹط© ط´ط­ظ† ط­ظ‚ظٹظ‚ظٹط© ط¨ط¯ظˆظ† ط£ظٹ ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.
                </p>
              </div>
            </div>

            <form onSubmit={handleCharge} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ظ…ظˆط¨ط§ظٹظ„</span>
                  <input
                    value={chargeOwner}
                    onChange={(event) => setChargeOwner(event.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ط§ظ„ظ†ظˆط¹</span>
                  <select
                    value={accountType}
                    onChange={(event) => setAccountType(event.target.value as WalletEntry["accountType"])}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                  >
                    <option value="staff">ظ…ظˆط¸ظپ</option>
                    <option value="student">ط·ط§ظ„ط¨</option>
                    <option value="parent">ظˆظ„ظٹ ط£ظ…ط±</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ط§ظ„ظ…ط¨ظ„ط؛</span>
                <input
                  value={chargeAmount}
                  onChange={(event) => setChargeAmount(event.target.value)}
                  type="number"
                  min="1"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ط³ط¨ط¨ ط§ظ„ط­ط±ظƒط©</span>
                <input
                  value={chargeReason}
                  onChange={(event) => setChargeReason(event.target.value)}
                  placeholder="ط´ط­ظ†طŒ ط®طµظ…طŒ طھط³ظˆظٹط© ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>

              <button
                type="submit"
                disabled={!isWalletEnabled}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
              >
                طھط³ط¬ظٹظ„ ط§ظ„ط´ط­ظ†
              </button>
            </form>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط£ط­ط¯ط« ط§ظ„ط­ط±ظƒط§طھ</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  ط£ظٹ ط´ط­ظ† ط¬ط¯ظٹط¯ ط¨ظٹط¸ظ‡ط± ظ‡ظ†ط§ ظپظˆط±ط§ظ‹.
                </p>
              </div>
            </div>

            {entries.length === 0 ? (
              <EmptyState
                icon={CircleDashed}
                title="ظ„ط§ طھظˆط¬ط¯ ط­ط±ظƒط§طھ ظ…ط§ظ„ظٹط© ط¨ط¹ط¯"
                description="ط¨ط¹ط¯ ط£ظˆظ„ ط¹ظ…ظ„ظٹط© ط´ط­ظ† ط£ظˆ ط®طµظ… ظ‡طھط¸ظ‡ط± ط§ظ„ط³ط¬ظ„ط§طھ ظ‡ظ†ط§ ظˆطھظƒظˆظ† ط¬ط§ظ‡ط²ط© ظ„ظ„ظ…ط±ط§ط¬ط¹ط© ظˆط§ظ„ط·ط¨ط§ط¹ط©."
              />
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#0A2540] dark:text-white">{entry.owner}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{entry.createdAt}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0A2540] dark:bg-[#0A2540] dark:text-white">
                        {entry.accountType}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{entry.reason}</p>
                    <p className="mt-3 text-lg font-black text-[#0A2540] dark:text-white">
                      {entry.amount} <span className="text-sm font-bold text-slate-400">ط¬.ظ…</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      ) : activeTab === "LEDGER" ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط§ظ„ط³ط¬ظ„ ط§ظ„ظ…ط§ظ„ظٹ ظ„ظ„ط·ط§ظ„ط¨ ظˆظˆظ„ظٹ ط§ظ„ط£ظ…ط±</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                ط§ط¨ط­ط« ط¨ط§ظ„ظƒظˆط¯ ط£ظˆ ط±ظ‚ظ… ط§ظ„ظ…ظˆط¨ط§ظٹظ„طŒ ظˆط§ظ„ظ†طھط§ط¦ط¬ ظ‡طھظٹط¬ظٹ ظ…ظ† Supabase ظ„ط§ط­ظ‚ط§ظ‹.
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={searchCode}
              onChange={(event) => setSearchCode(event.target.value)}
              placeholder="ظ…ط«ط§ظ„: VIS-101 ط£ظˆ 010XXXXXXXX"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
            />
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:text-slate-300"
            >
              ط¨ط­ط«
            </button>
          </div>

          <EmptyState
            icon={CircleDashed}
            title="ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ ط­ط§ظ„ظٹط§ظ‹"
            description="ظ…ظپظٹط´ ط¨ظٹط§ظ†ط§طھ ظ…ط±طھط¨ط·ط© ظ„ط³ظ‡. ط£ظˆظ„ ظ…ط§ ظ†ط±ط¨ط· ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ‡ظٹظ†ط²ظ„ ط³ط¬ظ„ ط§ظ„ط·ط§ظ„ط¨ ظˆظˆظ„ظٹ ط§ظ„ط£ظ…ط± ظ‡ظ†ط§ ظ…ط¨ط§ط´ط±ط©."
          />
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <div className="rounded-[2rem] border border-slate-200 bg-[#0A2540] p-6 text-white shadow-sm lg:col-span-1 dark:border-white/10">
            <p className="text-sm font-bold text-white/60">ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط´ط­ظ†ط§طھ</p>
            <p className="mt-2 text-4xl font-black">{settlementPreview.gross}</p>
            <p className="mt-2 text-sm font-medium text-white/70">ظ‚ظٹظ…ط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط³ط¬ظ„ط© ط§ظ„ط¢ظ†</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ظ†ط³ط¨ط© ط§ظ„ظ…ط¯ط±ط³</p>
            <p className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">60%</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">طھظ†ظپط¹ طھطھط¹ط¯ظ„ ظ…ظ† ط؛ط±ظپط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ط§ظ„طھظ‚ظپظٹظ„ ط§ظ„ط¢ظ„ظٹ</p>
            <p className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">{settlementPreview.centerShare}</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">ط­طµط© ط§ظ„ط³ظ†طھط± ط§ظ„طھظ‚ط¯ظٹط±ظٹط© ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط­ط§ظ„ظٹط©.</p>
          </div>
        </motion.section>
      )}
    </div>
  );
}

