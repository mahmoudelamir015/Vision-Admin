"use client";

import { motion } from "motion/react";
import { CircleDashed, FileText, ShieldAlert, Upload } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function ContentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول المحتوى</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة محمية للمدير فقط.</p>
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
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">إدارة المحتوى</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              رفع الملفات والمذكرات هيتم ربطه بالـ API لاحقاً بدون بيانات وهمية.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <EmptyState
            icon={CircleDashed}
            title="لا توجد ملفات منشورة حالياً"
            description="أي ملف هيتضاف من هنا أو من Supabase هيظهر تلقائياً في قائمة المحتوى."
          />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">رفع ملف جديد</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                الواجهة جاهزة للربط مع التخزين.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">اسحب الملف هنا أو اختر من الجهاز</p>
            <p className="mt-2 text-xs font-medium text-slate-400">PWA ready • Mobile first</p>
          </div>
        </div>
      </section>
    </div>
  );
}
