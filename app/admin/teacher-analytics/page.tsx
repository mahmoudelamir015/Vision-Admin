"use client";

import { useEffect, useState } from "react";
import { BookOpen, Star, TrendingUp, Users } from "lucide-react";
import { fetchUsers, type AppUserRecord } from "@/src/lib/supabase/users";
import { useAuth } from "@/components/admin/AuthContext";
import { getSupabaseClient } from "@/src/lib/supabase";

type AnalyticsData = {
  [teacherId: string]: {
    studentsCount: number;
    materialsCount: number;
  };
};

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<AppUserRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({});

  useEffect(() => {
    const load = async () => {
      const records = await fetchUsers("teacher");
      setTeachers(records);

      const client = getSupabaseClient();
      if (!client) return;

      const [{ data: groups }, { data: materials }] = await Promise.all([
        client.from("teacher_student_groups").select("teacher_user_id"),
        client.from("teacher_materials").select("teacher_user_id")
      ]);

      const counts: AnalyticsData = {};
      records.forEach(t => {
        if (t.id) counts[t.id] = { studentsCount: 0, materialsCount: 0 };
      });

      if (groups) {
        groups.forEach((g: any) => {
           if (counts[g.teacher_user_id]) counts[g.teacher_user_id].studentsCount++;
        });
      }
      if (materials) {
        materials.forEach((m: any) => {
           if (counts[m.teacher_user_id]) counts[m.teacher_user_id].materialsCount++;
        });
      }

      setAnalytics(counts);
    };
    void load();
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
          const teacherAnalytics = teacher.id ? analytics[teacher.id] : null;
          const studentsCount = teacherAnalytics?.studentsCount || 0;
          const materialsCount = teacherAnalytics?.materialsCount || 0;

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
                  <div className="flex justify-center text-emerald-500 mb-1"><Users className="h-5 w-5" /></div>
                  <div className="text-2xl font-black text-[#0A2540]">{studentsCount}</div>
                  <div className="text-xs font-bold text-slate-500">إجمالي طلابه</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center text-blue-500 mb-1"><BookOpen className="h-5 w-5" /></div>
                  <div className="text-2xl font-black text-[#0A2540]">{materialsCount}</div>
                  <div className="text-xs font-bold text-slate-500">الملزمات/الإمتحانات</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
