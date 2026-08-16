"use client";

import { ShieldAlert } from "lucide-react";

export default function StaffPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
      <ShieldAlert className="mb-3 h-14 w-14 opacity-70 text-[#0A2540]" />
      <h2 className="text-xl font-extrabold text-[#0A2540]">هذا القسم غير مفعل</h2>
      <p className="mt-2 max-w-md text-sm font-bold leading-6">تم إيقاف إدارة الموظفين بناءً على توجيهات المدير العام.</p>
    </div>
  );
}
