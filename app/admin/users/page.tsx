"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Edit3, Plus, Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

type StudentStage = "primary" | "prep" | "secondary";
type SecondaryTrack = "" | "arts" | "science" | "math";

type StudentRecord = {
  id: string;
  code: string;
  name: string;
  phone: string;
  stage: StudentStage;
  grade: string;
  track: SecondaryTrack;
};

const stageGrades: Record<StudentStage, string[]> = {
  primary: [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  prep: [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  secondary: [
    "الصف الأول الثانوي ",
    "الصف الثاني الثانوي ",
    "الصف الثالث الثانوي ",
  ],
};

const trackLabels: Record<Exclude<SecondaryTrack, "">, string> = {
  arts: "أدبي",
  science: "علمي علوم",
  math: "علمي رياضة",
};

const emptyForm = {
  name: "",
  phone: "",
  stage: "secondary" as StudentStage,
  grade: "",
  track: "" as SecondaryTrack,
};

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [nextCode, setNextCode] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول الطلاب</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للمدير العام فقط.</p>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredStudents = !query
    ? students
    : students.filter((student) =>
        [student.name, student.phone, student.code, student.grade, student.track]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleStageChange = (stage: StudentStage) => {
    setForm((current) => ({
      ...current,
      stage,
      grade: "",
      track: stage === "secondary" ? current.track : "",
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.grade.trim()) return;

    const payload: StudentRecord = {
      id: editingId ?? `student-${Date.now()}`,
      code:
        editingId && students.find((student) => student.id === editingId)
          ? students.find((student) => student.id === editingId)!.code
          : `VIS-${String(nextCode).padStart(4, "0")}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      stage: form.stage,
      grade: form.grade,
      track: form.stage === "secondary" ? form.track : "",
    };

    setStudents((current) =>
      editingId ? current.map((item) => (item.id === editingId ? payload : item)) : [payload, ...current],
    );

    if (!editingId) {
      setNextCode((current) => current + 1);
    }

    resetForm();
  };

  const startEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      phone: student.phone,
      stage: student.stage,
      grade: student.grade,
      track: student.track,
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">إدارة الطلاب</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              إضافة طالب، تعديل بياناته، حذف الحساب، وتوليد كود VIS تلقائيًا.
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
      </motion.div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">
              {editingId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              كود الطالب بيتولد تلقائيًا من VIS- ويثبت بعد الإنشاء.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1.1fr_1fr_0.9fr_0.9fr_auto]">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="اسم الطالب"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="010XXXXXXXX"
            dir="ltr"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <select
            value={form.stage}
            onChange={(event) => handleStageChange(event.target.value as StudentStage)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          >
            <option value="primary">الابتدائية</option>
            <option value="prep">الإعدادية</option>
            <option value="secondary">الثانوية</option>
          </select>
          <select
            value={form.grade}
            onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value, track: "" }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          >
            <option value="">الصف</option>
            {stageGrades[form.stage].map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "حفظ" : "إضافة"}
          </button>
        </form>

        {form.stage === "secondary" && (form.grade === "الصف الثاني الثانوي المطور" || form.grade === "الصف الثالث الثانوي المطور") ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {(["arts", "science", "math"] as Exclude<SecondaryTrack, "">[]).map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setForm((current) => ({ ...current, track }))}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                  form.track === track
                    ? "border-[#0A2540] bg-[#0A2540] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A2540]"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-300"
                }`}
              >
                {trackLabels[track]}
              </button>
            ))}
          </div>
        ) : null}

        {editingId ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:text-slate-300"
            >
              إلغاء التعديل
            </button>
          </div>
        ) : null}
      </section>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا توجد بيانات طلاب حالياً"
          description="أضف أول طالب من النموذج بالأعلى، وبعدها هنقدر نعدل بياناته أو نحذفه أو نبحث عنه بسهولة."
        />
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">الكود</th>
                  <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                  <th className="px-4 py-3 text-sm font-bold">الهاتف</th>
                  <th className="px-4 py-3 text-sm font-bold">المرحلة</th>
                  <th className="px-4 py-3 text-sm font-bold">الصف</th>
                  <th className="px-4 py-3 text-sm font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-4 font-mono text-sm font-bold tracking-[0.2em] text-[#0A2540] dark:text-[#D4AF37]">
                      {student.code}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#0A2540] dark:text-white">{student.name}</td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">
                      {student.phone}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {student.stage === "primary"
                        ? "ابتدائية"
                        : student.stage === "prep"
                          ? "إعدادية"
                          : "ثانوية"}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {student.grade}
                      {student.track ? ` - ${trackLabels[student.track]}` : ""}
                    </td>
                    <td className="px-4 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(student)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:bg-black/20 dark:text-slate-300"
                        >
                          <Edit3 className="h-4 w-4" />
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudents((current) => current.filter((item) => item.id !== student.id))}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
