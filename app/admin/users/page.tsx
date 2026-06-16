"use client";

import { useState } from "react";
import { Search, ShieldAlert, CircleDashed } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول الطلاب</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة محمية للمدير فقط.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">إدارة الطلاب</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              الصفحة جاهزة لاستقبال ملفات الطلاب الحقيقية من Supabase.
            </p>
          </div>
          <div className="relative lg:w-80">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالاسم أو الكود أو الهاتف"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
            />
          </div>
        </div>
      </div>

      <EmptyState
        icon={CircleDashed}
        title="لا توجد بيانات طلاب حالياً"
        description="هنا هنربط الملف الشامل للطالب، والموبايل، والمراحل، والمستويات بعد إنشاء الجداول الحقيقية."
      />
    </div>
  );
}
