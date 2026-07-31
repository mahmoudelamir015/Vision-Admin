"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Banknote, CircleDashed, History, PlusCircle, Search, ShieldAlert, Wallet } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import {
  closeRegistrationIfPastDeadline,
  fetchSystemSettings,
  subscribeToSystemSettings,
  updateSystemSettings,
} from "@/src/lib/supabase/system-settings";
import {
  fetchWalletEntries,
  saveWalletEntry,
  subscribeToWalletEntries,
  type WalletEntry,
} from "@/src/lib/supabase/wallets";

export default function WalletPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";

  const [isWalletEnabled, setIsWalletEnabled] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [isRegistrationSaving, setIsRegistrationSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"CHARGE" | "LEDGER" | "SETTLEMENT">("CHARGE");
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [chargeOwner, setChargeOwner] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeReason, setChargeReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [settings, walletEntries] = await Promise.all([fetchSystemSettings(), fetchWalletEntries()]);
      await closeRegistrationIfPastDeadline();

      if (!isMounted) return;

      if (settings) {
        setIsWalletEnabled(Boolean(settings.wallet_enabled));
        setRegistrationOpen(Boolean(settings.registration_open));
      }

      setEntries(walletEntries);
    };

    void load();

    const unsubscribeSettings = subscribeToSystemSettings((settings) => {
      setIsWalletEnabled(Boolean(settings.wallet_enabled));
      setRegistrationOpen(Boolean(settings.registration_open));
    });

    const unsubscribeEntries = subscribeToWalletEntries((walletEntries) => {
      setEntries(walletEntries);
    });

    return () => {
      isMounted = false;
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeEntries) unsubscribeEntries();
    };
  }, []);

  const settlementPreview = useMemo(() => {
    const gross = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const teacherShare = Math.round(gross * 0.6);
    const centerShare = gross - teacherShare;
    return { gross, teacherShare, centerShare };
  }, [entries]);

  const handleCharge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isWalletEnabled) return;
    if (!chargeOwner.trim() || !chargeAmount.trim()) return;

    setIsSaving(true);
    try {
      const saved = await saveWalletEntry({
        owner: chargeOwner.trim(),
        account_type: "student",
        amount: Number(chargeAmount),
        reason: chargeReason.trim() || "شحن رصيد الطالب",
        created_at: new Date().toISOString(),
      });

      if (saved) {
        setEntries((current) => [saved, ...current]);
        setChargeOwner("");
        setChargeAmount("");
        setChargeReason("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWallet = async () => {
    const nextValue = !isWalletEnabled;
    setIsWalletEnabled(nextValue);
    await updateSystemSettings({ wallet_enabled: nextValue });
  };

  const closeRegistrationNow = async () => {
    setIsRegistrationSaving(true);
    try {
      await updateSystemSettings({ registration_open: false });
      setRegistrationOpen(false);
    } finally {
      setIsRegistrationSaving(false);
    }
  };

  const applySearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchCode(searchDraft.trim());
  };

  const clearSearch = () => {
    setSearchDraft("");
    setSearchCode("");
  };

  const filteredEntries = searchCode.trim()
    ? entries.filter((entry) =>
        [entry.owner, entry.reason, entry.student_phone ?? "", entry.id ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(searchCode.trim().toLowerCase()),
      )
    : entries;

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
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">المحفظة والماليات</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              شحن رصيد الطالب، متابعة السجل، وإدارة فتح/غلق التسجيل.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => void toggleWallet()}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                isWalletEnabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              <Banknote className="h-4 w-4" />
              {isWalletEnabled ? "المحفظة مفعلة" : "المحفظة متوقفة"}
            </button>
          ) : null}

          {isAdmin ? (
            <button
              type="button"
              onClick={() => void closeRegistrationNow()}
              disabled={isRegistrationSaving || !registrationOpen}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                registrationOpen
                  ? "bg-[#D4AF37] text-[#0A2540]"
                  : "bg-slate-100 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isRegistrationSaving ? "جاري الإغلاق..." : "إغلاق التسجيل الآن"}
            </button>
          ) : null}
        </div>
      </motion.div>

      {!isWalletEnabled && isAdmin ? (
        <div className="rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-6 text-center text-red-700">
          <ShieldAlert className="mx-auto mb-3 h-12 w-12 opacity-80" />
          <h2 className="text-xl font-extrabold">نظام المحفظة متوقف حالياً</h2>
          <p className="mt-2 text-sm font-bold leading-6">
            الإدارة أوقفت الشحن والسحب مؤقتاً من غرفة العمليات. تقدر تعيد تشغيله من زر الحالة بالأعلى في أي وقت.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        {[
          { id: "CHARGE", label: "شحن رصيد" },
          { id: "LEDGER", label: "السجل المالي" },
          { id: "SETTLEMENT", label: "التقفيل الآلي" },
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
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">شحن رصيد الطالب</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  الصفحة مخصصة لشحن الطالب فقط، بدون اختيار موظف أو ولي أمر.
                </p>
              </div>
            </div>

            <form onSubmit={handleCharge} className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم الطالب أو رقم ولي الأمر</span>
                <input
                  value={chargeOwner}
                  onChange={(event) => setChargeOwner(event.target.value)}
                  placeholder="اسم الطالب أو رقم ولي الأمر"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">النوع</span>
                <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-3 text-sm font-black text-[#0A2540] dark:text-[#D4AF37]">
                  طالب فقط
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">المبلغ</span>
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
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">سبب الحركة</span>
                <input
                  value={chargeReason}
                  onChange={(event) => setChargeReason(event.target.value)}
                  placeholder="شحن، خصم، تسوية ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>

              <button
                type="submit"
                disabled={!isWalletEnabled || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540]"
              >
                {isSaving ? "جارٍ الحفظ..." : "تسجيل الشحن"}
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
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">أحدث الحركات</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">أي حركة جديدة هتظهر هنا فوراً.</p>
              </div>
            </div>

            {entries.length === 0 ? (
              <EmptyState
                icon={CircleDashed}
                title="لا توجد حركات مالية بعد"
                description="بعد أول عملية شحن أو خصم هتظهر السجلات هنا وتكون جاهزة للمراجعة والطباعة."
              />
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id ?? `${entry.owner}-${entry.created_at}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#0A2540] dark:text-white">{entry.owner}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString("ar-EG") : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0A2540] dark:bg-[#0A2540] dark:text-white">
                        {entry.account_type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{entry.reason}</p>
                    <p className="mt-3 text-lg font-black text-[#0A2540] dark:text-white">
                      {entry.amount} <span className="text-sm font-bold text-slate-400">ج.م</span>
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
              <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">السجل المالي للطالب</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                ابحث بالكود أو رقم الموبايل، والنتائج هتتربط لاحقاً بقاعدة البيانات.
              </p>
            </div>
          </div>

          <form onSubmit={applySearch} className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="مثال: VIS-101 أو 010XXXXXXXX"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={clearSearch}
              disabled={!searchDraft && !searchCode}
              className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300"
            >
              مسح
            </button>
          </form>

          {searchCode ? (
            <div className="mb-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm font-bold text-[#0A2540] dark:text-[#D4AF37]">
              نتائج البحث عن: <span className="font-black">{searchCode}</span>
            </div>
          ) : null}

          <EmptyState
            icon={CircleDashed}
            title={filteredEntries.length === 0 ? "لا توجد نتائج حالياً" : "نتائج جاهزة"}
            description={
              filteredEntries.length === 0
                ? "مفيش بيانات مرتبطة لسه. أول ما نربط قاعدة البيانات هينزل سجل الطالب هنا مباشرة."
                : "تم جلب الحركات المالية من Supabase، ويمكن لاحقاً ربطها بملفات الطالب وولي الأمر."
            }
          />
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <div className="rounded-[2rem] border border-slate-200 bg-[#0A2540] p-6 text-white shadow-sm lg:col-span-1 dark:border-white/10">
            <p className="text-sm font-bold text-white/60">إجمالي الشحنات</p>
            <p className="mt-2 text-4xl font-black">{settlementPreview.gross}</p>
            <p className="mt-2 text-sm font-medium text-white/70">قيمة العمليات المسجلة الآن</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">نسبة المدرس</p>
            <p className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">60%</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">تنفع تتعدل من غرفة العمليات.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">التقفيل الآلي</p>
            <p className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">{settlementPreview.centerShare}</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">حصة السنتر التقديرية من العمليات الحالية.</p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
