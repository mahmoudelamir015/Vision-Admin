"use client";

import { useRouter } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";

export default function StudentProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo bg-slate-50 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">الملف الشخصي</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
                البيانات الشخصية هتظهر بعد الربط.
              </p>
            </div>
          </div>
        </header>

        <EmptyState
          icon={UserCircle2}
          title="لا يوجد ملف شخصي متزامن حالياً"
          description="هيتم عرض الاسم، المرحلة، الكود، والصورة الشخصية من قاعدة البيانات لاحقاً."
          actionLabel="العودة للصفحة الرئيسية"
          onAction={() => router.push("/student")}
        />
      </div>
    </div>
  );
}
