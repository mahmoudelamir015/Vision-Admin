"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, Users, Plus, Network, Trash2 } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { fetchUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type Group = {
  id: string;
  subject: string;
  created_at: string;
  teacher: { id: string; name: string; phone: string } | null;
  student: { id: string; name: string; phone: string; student_code: string | null } | null;
};

export default function TeacherGroupsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin" || user?.permissions.includes("manage_teachers");
  const [teachers, setTeachers] = useState<AppUserRecord[]>([]);
  const [students, setStudents] = useState<AppUserRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    try {
      const allUsers = await fetchUsers();
      setTeachers(allUsers.filter((u) => u.role === "teacher"));
      setStudents(allUsers.filter((u) => u.role === "student"));

      const res = await fetch("/api/admin/teacher-groups");
      const data = await res.json().catch(() => null);
      if (data?.groups) setGroups(data.groups);
    } catch {}
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedStudent || !subject.trim()) {
      setFeedback({ type: "error", message: "المدرس والطالب والمادة مطلوبين" });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/teacher-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: selectedTeacher, student_id: selectedStudent, subject }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "تم الربط بنجاح" });
      setSubject("");
      setSelectedStudent("");
      void loadData();
    } catch {
      setFeedback({ type: "error", message: "تعذر الربط" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("حذف الربط؟")) return;
    try {
      await fetch("/api/admin/teacher-groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      void loadData();
    } catch {}
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <h2 className="text-xl font-extrabold">غير مصرح لك</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Network className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540]">تخصيص المواد للطالب</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              اربط الطالب بمدرس معين ومادة محددة، ليتمكن الطالب من رؤية مذكرات ومحتوى المدرس.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {groups.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد روابط حالياً"
              description="أضف تخصيص للطالب مع المدرس ليظهر هنا."
            />
          ) : (
            <div className="grid gap-3">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <h3 className="font-extrabold text-[#0A2540]">{g.student?.name}</h3>
                    <p className="text-sm font-bold text-slate-600 mt-1">كود الطالب: {g.student?.student_code || "---"}</p>
                    <p className="text-xs text-slate-500 mt-2">
                       يدرس <span className="font-bold text-[#0A2540]">{g.subject}</span> مع أ. {g.teacher?.name}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(g.id)} className="rounded p-2 text-red-500 transition-colors hover:bg-red-50">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm self-start">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-[#0A2540]">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0A2540]">مجموعة تخصيص جديدة</h2>
          </div>

          <form onSubmit={handleAssign} className="grid gap-4">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
            >
              <option value="">اختر المدرس...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
              ))}
            </select>

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
            >
              <option value="">اختر الطالب...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_code || s.phone})</option>
              ))}
            </select>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="اسم المادة (مثال: الفيزياء، الكيمياء)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
            />

            <button
              type="submit"
              disabled={isSaving}
              className="mt-2 w-full rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-70"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التخصيص"}
            </button>
          </form>

          {feedback ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {feedback.message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
