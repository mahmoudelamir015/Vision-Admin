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
        <h2 className="text-xl font-extrabold">لا يوجد تصريح لك بالدخول إلى الخزنة</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">
          هذه الصفحة محمية للمدير فقط.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] bg-[#0A2540] p-6 text-white shadow-sm">
          <p className="text-sm font-bold text-white/60">رصيد الخزنة</p>
          <p className="mt-2 text-4xl font-black">0</p>
          <p className="mt-2 text-sm font-medium text-white/70">جاهز للاستقبال بعد الربط.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-bold text-slate-500 text-slate-500">الوارد</p>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0A2540] text-[#0A2540]">0 ج.م</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            <p className="text-sm font-bold text-slate-500 text-slate-500">المنصرف</p>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0A2540] text-[#0A2540]">0 ج.م</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm border-slate-200 bg-white shadow-sm">
        {[
          { id: "ALL", label: "الكل" },
          { id: "INCOME", label: "الوارد" },
          { id: "EXPENSE", label: "المنصرف" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id as typeof activeTab)}
            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === item.id
                ? "bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]"
                : "text-slate-500 hover:text-slate-700 text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] bg-slate-50 dark:text-[#D4AF37]">
            <Vault className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">سجل الحركات المالية</h2>
            <p className="text-sm font-bold text-slate-500 text-slate-500">
              لا توجد بيانات وهمية. أول حركة حقيقية ستظهر هنا بعد الربط.
            </p>
          </div>
        </div>

        <EmptyState
          icon={CircleDashed}
          title="الخزنة جاهزة للربط"
          description="الصفحة الحالية عبارة عن لوحة متابعة نظيفة بدون أي سجل وهمي. بعد Supabase هتظهر الحركات الفعلية وتتقسم تلقائياً."
        />
      </motion.section>
    </div>
  );
}
