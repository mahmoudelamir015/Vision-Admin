"use client";

import { motion } from "motion/react";
import { CircleDashed, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";

export default function StudentHomePage() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6 pb-24 dark:bg-slate-950" dir="rtl">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0A2540] via-[#0f345b] to-[#132f49] p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/60">أهلاً بيك</p>
            <h1 className="mt-1 text-2xl font-black">لوحة الطالب</h1>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#D4AF37]">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
      </motion.header>

      <Link
        href="/student/scan"
        className="rounded-[2rem] bg-[#D4AF37] p-5 text-[#0A2540] shadow-xl shadow-[#D4AF37]/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <QrCode className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black">مسح QR للحضور</h2>
            <p className="mt-1 text-sm font-bold text-[#0A2540]/70">افتح الكاميرا وسجل حضورك فوراً.</p>
          </div>
        </div>
      </Link>

      <EmptyState
        icon={CircleDashed}
        title="لا توجد بيانات طالب حالياً"
        description="الصفحة جاهزة لاستقبال الجدول، الحضور، والمستوى الدراسي الحقيقي من Supabase."
        actionLabel="اذهب إلى مسح QR"
        onAction={() => {
          window.location.href = "/student/scan";
        }}
      />
    </div>
  );
}
