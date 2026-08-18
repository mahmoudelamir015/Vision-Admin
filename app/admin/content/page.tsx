"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, FileText, ShieldAlert, Upload } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function ContentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">لا يوجد تصريح لك بالدخول إلى المحتوى</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">هذه الصفحة محمية للمدير فقط.</p>
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
              رفع الملفات والمذكرات سيتصل لاحقاً بالـ API بدون بيانات وهمية.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <EmptyState
            icon={CircleDashed}
            title="لا توجد ملفات منشورة حالياً"
            description="أي ملف سيُضاف من هنا أو من Supabase سيظهر تلقائياً في قائمة المحتوى."
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
            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  setSelectedFileName(null);
                  setUploadMessage(null);
                  return;
                }
                setSelectedFileName(file.name);
                setUploadMessage("تم اختيار الملف بنجاح، سيتم ربط الرفع لاحقاً عند تكوين الـ API.");
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[8rem] w-full items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-white dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <div>
                <p className="mb-3">اسحب الملف هنا أو اختر من الجهاز</p>
                <p className="text-xs font-medium text-slate-400">PWA ready • Mobile first</p>
                {selectedFileName ? (
                  <p className="mt-4 text-sm text-slate-700 dark:text-white">الملف المحدد: {selectedFileName}</p>
                ) : null}
              </div>
            </button>
          </div>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full items-center justify-center rounded-[1.5rem] border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
          >
            رفع الملف غير مفعل بعد
          </button>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            الرفع حالياً هو واجهة تحضيرية فقط. يحتاج إنشاء API رفع أو تكامل Supabase Storage ليعمل بالشكل الحقيقي.
          </div>
          {uploadMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {uploadMessage}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
