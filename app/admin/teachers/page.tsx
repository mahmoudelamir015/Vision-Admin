"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, Edit3, Key, Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { OptionalPhotoPicker } from "../../../components/registration/optional-photo-picker";
import { deleteUser, fetchUsers, saveUser, subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type TeacherStage = "primary" | "prep" | "secondary";

const stageLabels: Record<TeacherStage, string> = {
  primary: "ابتدائي",
  prep: "إعدادي",
  secondary: "ثانوي",
};

const emptyForm = {
  name: "",
  phone: "",
  stage: "secondary" as TeacherStage,
  school_name: "",
  subjects: "",
  password: "",
};

export default function TeachersPage() {
  const { user } = useAuth();
  const canManageTeachers = user?.role === "master_admin" || user?.permissions.includes("manage_teachers");
  const canDeleteTeachers = user?.role === "master_admin";
  const [teachers, setTeachers] = useState<AppUserRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherPhotoName, setTeacherPhotoName] = useState<string | null>(null);
  const [teacherPhotoPreview, setTeacherPhotoPreview] = useState<string | null>(null);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) ?? null,
    [selectedTeacherId, teachers],
  );

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      const records = await fetchUsers("teacher");
      if (!isMounted) return;
      setTeachers(records);
      setSelectedTeacherId((current) => current ?? records[0]?.id ?? null);
    };

    void loadTeachers();

    const unsubscribe = subscribeToUsers((records) => {
      setTeachers(records.filter((record) => record.role === "teacher"));
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!canManageTeachers) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول المدرسين</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للمدير العام أو الموظف الحاصل على صلاحية إدارة المدرسين.</p>
      </div>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFeedback(null);
    setTeacherPhotoName(null);
    setTeacherPhotoPreview(null);
    setIsEditModalOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setFeedback({ type: "error", message: "من فضلك اكتب الاسم ورقم الهاتف." });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveUser({
        id: editingId ?? undefined,
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: "teacher",
        stage: form.stage,
        school_name: form.school_name.trim() || undefined,
        subjects: form.subjects
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        password: form.password.trim() || undefined,
        profile_image: teacherPhotoPreview ?? undefined,
        active: true,
      });

      if (!saved) {
        setFeedback({ type: "error", message: "تعذر حفظ المدرس. حاول مرة أخرى." });
        return;
      }

      setTeachers((current) => {
        if (editingId) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current.filter((item) => item.id !== saved.id)];
      });

      setSelectedTeacherId(saved.id ?? null);
      setFeedback({ type: "success", message: editingId ? "تم تحديث بيانات المدرس." : "تم إضافة المدرس بنجاح." });
      resetForm();
    } catch (error) {
      console.error("Failed to save teacher", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "حدث خطأ غير متوقع." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordTeacher = async (teacher: AppUserRecord) => {
    if (!teacher.id) return;
    const newPassword = window.prompt("اكتب كلمة المرور الجديدة للمعلم (8 أحرف على الأقل):");
    if (!newPassword || newPassword.trim().length < 8) return;

    setMemberActionLoading(teacher.id);
    setFeedback(null);

    try {
      const saved = await saveUser({ ...teacher, password: newPassword.trim() });
      if (!saved) {
        setFeedback({ type: "error", message: "تعذر تغيير كلمة المرور. حاول مرة أخرى." });
        return;
      }

      setTeachers((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setFeedback({ type: "success", message: "تم تغيير كلمة المرور بنجاح." });
    } catch (error) {
      console.error("Failed to change teacher password", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "حدث خطأ غير متوقع." });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleDeleteTeacher = async (teacher: AppUserRecord) => {
    if (!canDeleteTeachers) return;
    if (!teacher.id) return;
    setMemberActionLoading(teacher.id);
    setFeedback(null);

    try {
      const deleted = await deleteUser(teacher.id);
      if (!deleted) {
        setFeedback({ type: "error", message: "تعذر حذف المدرس. حاول مرة أخرى." });
        return;
      }

      setTeachers((current) => current.filter((item) => item.id !== teacher.id));
      if (selectedTeacherId === teacher.id) {
        setSelectedTeacherId(null);
      }
      setFeedback({ type: "success", message: "تم حذف المدرس بنجاح." });
    } catch (error) {
      console.error("Failed to delete teacher", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "حدث خطأ غير متوقع." });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const startEdit = (teacher: AppUserRecord) => {
    setEditingId(teacher.id ?? null);
    setSelectedTeacherId(teacher.id ?? null);
    setIsEditModalOpen(true);
    setTeacherPhotoName(teacher.profile_image ? "صورة المدرس" : null);
    setTeacherPhotoPreview(teacher.profile_image ?? null);
    setForm({
      name: teacher.name,
      phone: teacher.phone,
      stage: (teacher.stage as TeacherStage) || "secondary",
      school_name: teacher.school_name ?? "",
      subjects: (teacher.subjects ?? []).join(", "),
      password: "",
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">إدارة المدرسين</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              إضافة مدرس جديد أو تعديل بيانات المدرسين الموجودين.</p>
          </div>
        </div>
      </motion.div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
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

        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr_auto]">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="اسم المدرس"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="010XXXXXXXX"
            dir="ltr"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={form.school_name}
            onChange={(event) => setForm((current) => ({ ...current, school_name: event.target.value }))}
            placeholder="اسم المدرسة"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="كلمة مرور اختيارية"
            type="password"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540]"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? "جارٍ الحفظ..." : editingId ? "حفظ" : "إضافة"}
          </button>
        </form>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <select
            value={form.stage}
            onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value as TeacherStage }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          >
            <option value="primary">ابتدائي</option>
            <option value="prep">اعدادي</option>
            <option value="secondary">ثانوي</option>
          </select>
          <OptionalPhotoPicker
            label="صورة المعلم"
            description="صورة اختيارية يمكن إضافتها أو إزالتها قبل الحفظ."
            fileName={teacherPhotoName}
            previewUrl={teacherPhotoPreview}
            onChange={(fileName, previewUrl) => {
              setTeacherPhotoName(fileName);
              setTeacherPhotoPreview(previewUrl);
            }}
          />
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540]"
            >
              إلغاء التعديل
            </button>
          ) : null}
        </div>
      </section>

      {isEditModalOpen && editingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-white/10 dark:bg-[#0A2540]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">تعديل بيانات المدرس</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">المودال ده بيحفظ التعديل بشكل مباشر لما تضغط حفظ.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:w-auto"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="اسم المدرس"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <input
                value={form.school_name}
                onChange={(event) => setForm((current) => ({ ...current, school_name: event.target.value }))}
                placeholder="اسم المدرسة"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="كلمة مرور اختيارية"
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <select
                value={form.stage}
                onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value as TeacherStage }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              >
                <option value="primary">ابتدائي</option>
                <option value="prep">إعدادي</option>
                <option value="secondary">ثانوي</option>
              </select>
              <div className="w-full">
                <OptionalPhotoPicker
                  label="صورة المدرس"
                  description="يمكنك إضافة أو تغيير الصورة من هنا."
                  fileName={teacherPhotoName}
                  previewUrl={teacherPhotoPreview}
                  onChange={(fileName, previewUrl) => {
                    setTeacherPhotoName(fileName);
                    setTeacherPhotoPreview(previewUrl);
                  }}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:text-slate-300 sm:w-auto"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540] sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {teachers.length === 0 ? (
        <EmptyState
          icon={CircleDashed}
          title="لا يوجد مدرسين بعد"
          description="أضف أول مدرس من النموذج بالأعلى، ثم يمكنك التعديل أو الحذف من القائمة."
        />
      ) : (
        <section className=" rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                  <th className="px-4 py-3 text-sm font-bold">الهاتف</th>
                  <th className="px-4 py-3 text-sm font-bold">المرحلة</th>
                  <th className="px-4 py-3 text-sm font-bold">المدرسة</th>
                  <th className="px-4 py-3 text-sm font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {teachers.map((teacher) => (
                  <tr key={teacher.id ?? teacher.phone}>
                    <td className="px-4 py-4 flex items-center gap-3 font-bold text-[#0A2540] dark:text-white">
                      {teacher.profile_image ? (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
                          <img src={teacher.profile_image} alt={teacher.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Users className="h-5 w-5" />
                        </div>
                      )}
                      {teacher.name}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">{teacher.phone}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{stageLabels[teacher.stage as TeacherStage] ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{teacher.school_name ?? "-"}</td>
                    <td className="px-4 py-4 text-left">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(teacher)}
                          disabled={memberActionLoading === teacher.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-slate-600 transition-colors ${
                            memberActionLoading === teacher.id
                              ? "border-slate-200 bg-slate-100 cursor-wait opacity-70"
                              : "border-slate-200 bg-slate-50 hover:border-[#D4AF37] hover:text-[#0A2540]"
                          }`}
                        >
                          <Edit3 className="h-4 w-4" />
                          تعديل البيانات
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleChangePasswordTeacher(teacher)}
                          disabled={memberActionLoading === teacher.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-[#0A2540] transition-colors ${
                            memberActionLoading === teacher.id
                              ? "border-slate-200 bg-slate-100 cursor-wait opacity-70"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <Key className="h-4 w-4" />
                          تغيير باسورد
                        </button>
                        {canDeleteTeachers ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTeacher(teacher)}
                            disabled={memberActionLoading === teacher.id}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-red-600 transition-colors ${
                              memberActionLoading === teacher.id ? "border-red-200 bg-red-100 cursor-wait opacity-70" : "border-red-200 bg-red-50 hover:bg-red-100"
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </button>
                        ) : null}
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
