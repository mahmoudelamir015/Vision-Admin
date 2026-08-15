"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Edit3, Key, Plus, Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { deleteUser, fetchUsers, saveUser, subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type StudentStage = "primary" | "prep" | "secondary";
type SecondaryTrack = "" | "arts" | "science" | "math";

type StudentForm = {
  name: string;
  phone: string;
  stage: StudentStage;
  grade: string;
  track: SecondaryTrack;
  subjects: string;
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
  prep: ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"],
  secondary: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
};

const trackLabels: Record<Exclude<SecondaryTrack, "">, string> = {
  arts: "أدبي",
  science: "علمي علوم",
  math: "علمي رياضة",
};

const emptyForm: StudentForm = {
  name: "",
  phone: "",
  stage: "secondary",
  grade: "",
  track: "",
  subjects: "",
};

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<AppUserRecord[]>([]);
  const [nextCode, setNextCode] = useState(1);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  );

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      const records = await fetchUsers("student");
      if (!isMounted) return;

      setStudents(records);
      setNextCode(records.length + 1);
      setSelectedStudentId((current) => current ?? records[0]?.id ?? null);
    };

    void loadStudents();

    const unsubscribe = subscribeToUsers((records) => {
      setStudents(records.filter((record) => record.role === "student"));
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
        [student.name, student.phone, student.student_code ?? "", student.grade ?? "", student.track ?? ""]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setPassword("");
    setFeedback(null);
    setIsEditModalOpen(false);
  };

  const handleStageChange = (stage: StudentStage) => {
    setForm((current) => ({
      ...current,
      stage,
      grade: "",
      track: stage === "secondary" ? current.track : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.grade.trim()) {
      setFeedback({
        type: "error",
        message: "من فضلك أكمل الاسم والهاتف والصف قبل الحفظ.",
      });
      return;
    }

    setFeedback(null);
    setIsSaving(true);
    try {
      const currentStudent = editingId ? students.find((student) => student.id === editingId) ?? null : null;
      const phoneDigits = form.phone.trim().replace(/\D/g, "");
      const payloadBody: Record<string, unknown> = {
        id: currentStudent?.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: "student",
        stage: form.stage,
        grade: form.grade,
        track: form.stage === "secondary" ? form.track : "",
        subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
        student_code: currentStudent?.student_code ?? `VIS-${String(nextCode).padStart(4, "0")}`,
      };
      if (password.trim().length >= 8) {
        payloadBody.password = password.trim();
      } else if (!editingId) {
        payloadBody.password = phoneDigits.length >= 8 ? phoneDigits : `${phoneDigits}123456`;
      }

      const response = await fetch("/api/admin/users", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payloadBody),
      });

      const payload = (await response.json().catch(() => null)) as { user?: AppUserRecord; error?: string } | null;
      const saved = payload?.user ?? null;

      if (!response.ok || !saved) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "تعذر حفظ الطالب. تأكد من صحة البيانات والمحاولة مرة أخرى.",
        });
        return;
      }

      setStudents((current) => {
        if (editingId) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current.filter((item) => item.id !== saved.id)];
      });

      if (!editingId) {
        setNextCode((current) => current + 1);
      }

      setSelectedStudentId(saved.id ?? null);
      setFeedback({ type: "success", message: editingId ? "تم حفظ الطالب بنجاح" : "تم إضافة الطالب بنجاح" });
      resetForm();
    } catch (error) {
      console.error("Failed to save student", error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء الحفظ.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (student: AppUserRecord) => {
    if (!student.id) return;
    setMemberActionLoading(student.id);
    setFeedback(null);

    try {
      const deleted = await deleteUser(student.id);
      if (!deleted) {
        setFeedback({ type: "error", message: "حدث خطأ أثناء حذف الطالب. حاول مرة أخرى." });
        return;
      }

      setStudents((current) => current.filter((item) => item.id !== student.id));
      if (selectedStudentId === student.id) {
        setSelectedStudentId(null);
      }
      setFeedback({ type: "success", message: "تم حذف الطالب بنجاح." });
    } catch (error) {
      console.error("Failed to delete student", error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حذف الطالب.",
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleChangePasswordStudent = async (student: AppUserRecord) => {
    if (!student.id) return;
    const newPassword = window.prompt("اكتب كلمة المرور الجديدة للطالب (8 أحرف على الأقل):");
    if (!newPassword || newPassword.trim().length < 8) return;

    setMemberActionLoading(student.id);
    setFeedback(null);

    try {
      const saved = await saveUser({ ...student, password: newPassword.trim() });
      if (!saved) {
        setFeedback({ type: "error", message: "تعذر تغيير كلمة المرور. حاول مرة أخرى." });
        return;
      }

      setStudents((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setFeedback({ type: "success", message: "تم تغيير كلمة المرور بنجاح." });
    } catch (error) {
      console.error("Failed to change student password", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "حدث خطأ غير متوقع." });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const startEdit = (student: AppUserRecord) => {
    setEditingId(student.id ?? null);
    setSelectedStudentId(student.id ?? null);
    setIsEditModalOpen(true);
    setForm({
      name: student.name,
      phone: student.phone,
      stage: (student.stage as StudentStage) || "secondary",
      grade: student.grade ?? "",
      track: (student.track as SecondaryTrack) || "",
      subjects: (student.subjects ?? []).join(", "),
    });
    setPassword("");
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">إدارة الطلاب</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
              إضافة طالب، تعديل بياناته، حذف الحساب، وتوليد كود VIS تلقائياً.
            </p>
          </div>
          <div className="relative lg:w-80">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالاسم أو الكود أو الهاتف"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
            />
          </div>
        </div>
      </motion.div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] bg-slate-50 dark:text-[#D4AF37]">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">
              {editingId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h2>
            <p className="text-sm font-bold text-slate-500 text-slate-500">
              كود الطالب بيتولد تلقائياً من VIS- ويثبت بعد الإنشاء.
            </p>
          </div>
        </div>

        {feedback ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="اسم الطالب"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="010XXXXXXXX"
            dir="ltr"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          />
          <input
            value={form.subjects}
            onChange={(event) => setForm((current) => ({ ...current, subjects: event.target.value }))}
            placeholder="المواد المخصصة للطالب (مفصولة بفاصلة ,)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة مرور اختيارية"
            type="password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          />
          <select
            value={form.stage}
            onChange={(event) => handleStageChange(event.target.value as StudentStage)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          >
            <option value="primary">الابتدائية</option>
            <option value="prep">الإعدادية</option>
            <option value="secondary">الثانوية</option>
          </select>
          <select
            value={form.grade}
            onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value, track: "" }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
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
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? "جارٍ الحفظ..." : editingId ? "حفظ" : "إضافة"}
          </button>
        </form>

        {form.stage === "secondary" && (form.grade === "الصف الثاني الثانوي" || form.grade === "الصف الثالث الثانوي") ? (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(["arts", "science", "math"] as Exclude<SecondaryTrack, "">[]).map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setForm((current) => ({ ...current, track }))}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                  form.track === track
                    ? "border-[#0A2540] bg-[#0A2540] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A2540]"
                    : "border-slate-200 bg-slate-50 text-slate-600 border-slate-200 bg-white text-slate-700"
                }`}
              >
                {trackLabels[track]}
              </button>
            ))}
          </div>
        ) : null}

        {selectedStudent ? (
          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">{selectedStudent.name}</h3>
                <p className="text-sm font-bold text-slate-500 text-slate-500">{selectedStudent.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              >
                إخفاء التفاصيل
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-3 text-sm font-bold bg-white">
                الكود: {selectedStudent.student_code ?? "VIS-0000"}
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm font-bold bg-white">
                المرحلة: {selectedStudent.stage ?? "-"}
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm font-bold bg-white">
                الصف: {selectedStudent.grade ?? "-"}
              </div>
            </div>
          </div>
        ) : null}

        {editingId ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={resetForm}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] border-slate-200 text-slate-700 sm:w-auto"
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
        <section className=" rounded-[2rem] border border-slate-200 bg-white shadow-sm border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-500 bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">الكود</th>
                  <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                  <th className="px-4 py-3 text-sm font-bold">الهاتف</th>
                  <th className="px-4 py-3 text-sm font-bold">المرحلة</th>
                  <th className="px-4 py-3 text-sm font-bold">الصف</th>
                  <th className="px-4 py-3 text-sm font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 divide-slate-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id ?? student.phone}>
                    <td className="px-4 py-4 font-mono text-sm font-bold tracking-[0.2em] text-[#0A2540] dark:text-[#D4AF37]">
                      {student.student_code ?? "VIS-0000"}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#0A2540] text-[#0A2540]">{student.name}</td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 text-slate-700">
                      {student.phone}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 text-slate-700">
                      {student.stage === "primary"
                        ? "ابتدائية"
                        : student.stage === "prep"
                          ? "إعدادية"
                          : "ثانوية"}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 text-slate-700">
                      {student.grade}
                      {student.track ? ` - ${trackLabels[student.track as Exclude<SecondaryTrack, "">]}` : ""}
                    </td>
                    <td className="px-4 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(student)}
                          disabled={memberActionLoading === student.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-slate-600 transition-colors ${
                            memberActionLoading === student.id ? "border-slate-200 bg-slate-100 cursor-wait opacity-70" : "border-slate-200 bg-slate-50 hover:border-[#D4AF37] hover:text-[#0A2540] border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <Edit3 className="h-4 w-4" />
                          تعديل البيانات
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleChangePasswordStudent(student)}
                          disabled={memberActionLoading === student.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-[#0A2540] transition-colors ${
                            memberActionLoading === student.id ? "border-slate-200 bg-slate-100 cursor-wait opacity-70" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <Key className="h-4 w-4" />
                          تغيير باسورد
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStudent(student)}
                          disabled={memberActionLoading === student.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-red-600 transition-colors ${
                            memberActionLoading === student.id ? "border-red-200 bg-red-100 cursor-wait opacity-70" : "border-red-200 bg-red-50 hover:bg-red-100"
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                          {memberActionLoading === student.id ? "جارٍ الحذف..." : "حذف"}
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

      {isEditModalOpen && editingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 border-slate-200 dark:bg-[#0A2540]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">تعديل بيانات الطالب</h2>
                <p className="text-sm font-bold text-slate-500 text-slate-500">عدّل البيانات ثم احفظ التغييرات لتحديث السجل فورًا.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 sm:w-auto border-slate-200 bg-slate-50 text-slate-700"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="اسم الطالب"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              />
              <input
            value={form.subjects}
            onChange={(event) => setForm((current) => ({ ...current, subjects: event.target.value }))}
            placeholder="المواد المخصصة للطالب (مفصولة بفاصلة ,)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة مرور اختيارية"
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              />
              <select
                value={form.stage}
                onChange={(event) => handleStageChange(event.target.value as StudentStage)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              >
                <option value="primary">الابتدائية</option>
                <option value="prep">الإعدادية</option>
                <option value="secondary">الثانوية</option>
              </select>
              <select
                value={form.grade}
                onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value, track: "" }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              >
                <option value="">الصف</option>
                {stageGrades[form.stage].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <div className="lg:col-span-5">
                {form.stage === "secondary" && (form.grade === "الصف الثاني الثانوي" || form.grade === "الصف الثالث الثانوي") ? (
                  <div className="mt-1 grid gap-3 lg:grid-cols-3">
                    {(["arts", "science", "math"] as Exclude<SecondaryTrack, "">[]).map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, track }))}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                          form.track === track
                            ? "border-[#0A2540] bg-[#0A2540] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A2540]"
                            : "border-slate-200 bg-slate-50 text-slate-600 border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {trackLabels[track]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-5 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] border-slate-200 text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540]"
                >
                  <Plus className="h-4 w-4" />
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
