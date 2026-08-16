"use client";

import { useEffect, useState } from "react";
import { BarChart3, Star, TrendingUp, Users } from "lucide-react";
import { fetchUsers, type AppUserRecord } from "@/src/lib/supabase/users";
import { useAuth } from "@/components/admin/AuthContext";

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<AppUserRecord[]>([]);

  useEffect(() => {
    fetchUsers("teacher").then(setTeachers);
  }, []);

  if (user?.role !== "master_admin" && !user?.permissions.includes("manage_teachers")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <h2 className="text-xl font-extrabold">غير مصرح</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#0A2540]">إحصائيات وتقييم المدرسين</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">تحليل أداء المدرسين بناءً على تفاعل الطلاب وتقييمات الحصص (بيانات تجريبية).</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher, idx) => {
          // Dummy data for analytics
          const rating = (4.0 + (idx % 10) * 0.1).toFixed(1);
          const studentsCount = 120 + (idx * 34) % 100;
          const completionRate = 85 + (idx * 5) % 15;

          return (
            <div key={teacher.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="bg-slate-50 p-6 flex flex-col items-center border-b border-slate-100">
                {teacher.profile_image ? (
                   <img src={teacher.profile_image} alt={teacher.name} className="h-20 w-20 rounded-full border-4 border-white shadow-sm object-cover" />
                ) : (
                   <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-sm bg-slate-200 text-slate-500">
                     <Users className="h-8 w-8" />
                   </div>
                )}
                <h3 className="mt-4 text-lg font-extrabold text-[#0A2540]">{teacher.name}</h3>
                <p className="text-sm font-bold text-slate-500">{teacher.stage === 'primary' ? 'ابتدائي' : teacher.stage === 'prep' ? 'إعدادي' : 'ثانوي'} - {teacher.subjects?.[0] || 'عام'}</p>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex justify-center text-[#D4AF37] mb-1"><Star className="h-5 w-5 fill-current" /></div>
                  <div className="text-2xl font-black text-[#0A2540]">{rating}</div>
                  <div className="text-xs font-bold text-slate-500">متوسط التقييم</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center text-emerald-500 mb-1"><Users className="h-5 w-5" /></div>
                  <div className="text-2xl font-black text-[#0A2540]">{studentsCount}</div>
                  <div className="text-xs font-bold text-slate-500">إجمالي طلابه</div>
                </div>
                <div className="text-center col-span-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-center text-blue-500 mb-1"><TrendingUp className="h-5 w-5" /></div>
                  <div className="text-xl font-black text-[#0A2540]">{completionRate}%</div>
                  <div className="text-xs font-bold text-slate-500">نسبة التفاعل واكتمال الدروس</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
