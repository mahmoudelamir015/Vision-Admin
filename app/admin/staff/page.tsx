"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, Plus, ShieldAlert, Trash2, Users, Wallet, CalendarRange, Eye } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { deleteUser, fetchUsers, saveUser, subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";
import { requestAdminPasswordReset } from "@/src/lib/supabase/auth";

type StaffPermission = "attendance" | "wallet" | "operations" | "content" | "notifications";

const permissionLabels: Record<StaffPermission, string> = {
  attendance: "الحضور",
  wallet: "المحفظة",
  operations: "العمليات",
  content: "المحتوى",
  notifications: "الإشعارات",
};

const permissionIcons: Record<StaffPermission, typeof CalendarRange> = {
  attendance: CalendarRange,
  wallet: Wallet,
  operations: Users,
  content: Users,
  notifications: Users,
};

const allPermissions: StaffPermission[] = ["attendance", "wallet", "operations", "content", "notifications"];

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [staff, setStaff] = useState<AppUserRecord[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState<StaffPermission[]>(["attendance"]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [staffFormFeedback, setStaffFormFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [passwordActionLoading, setPasswordActionLoading] = useState<string | null>(null);
  const [passwordActionFeedback, setPasswordActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  const getPasswordResetMeta = (member: AppUserRecord) => {
    const extra = member.extra && typeof member.extra === "object" ? (member.extra as Record<string, unknown>) : {};
    const passwordReset = extra.password_reset as Record<string, unknown> | undefined;
    if (!passwordReset || typeof passwordReset !== "object") return null;
    return passwordReset as {
      status?: string;
      requested_at?: string;
      approved_at?: string;
      approved_until?: string;
    };
  };

  const getPasswordResetStatus = (meta: ReturnType<typeof getPasswordResetMeta>) => {
    if (!meta?.status) return "غير مطلوب";
    if (meta.status === "pending") return "معلقة";
    if (meta.status === "approved") {
      if (meta.approved_until && new Date(meta.approved_until).getTime() > nowTimestamp) {
        return "موافق عليها";
      }
      return "منتهية";
    }
    return "غير مطلوب";
  };

  const isPasswordResetRequestAllowed = (member: AppUserRecord) => {
    const meta = getPasswordResetMeta(member);
    if (!meta?.status) return true;
    if (meta.status === "pending") return false;
    if (meta.status === "approved") {
      return !(meta.approved_until && new Date(meta.approved_until).getTime() > nowTimestamp);
    }
    return true;
  };

  const handleRequestPasswordReset = async (member: AppUserRecord) => {
    if (!member.phone) return;
    setPasswordActionFeedback(null);
    setPasswordActionLoading(member.id ?? member.phone);

    try {
      const updated = await requestAdminPasswordReset(member.phone);
      if (!updated) {
        setPasswordActionFeedback({ type: "error", message: "تعذر تسجيل طلب تغيير كلمة المرور. حاول مرة أخرى." });
        return;
      }

      setStaff((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setPasswordActionFeedback({ type: "success", message: "تم تسجيل طلب تغيير كلمة المرور بنجاح." });
    } catch (error) {
      console.error("Failed to request password reset", error);
      setPasswordActionFeedback({ type: "error", message: "حدث خطأ غير متوقع أثناء طلب تغيير كلمة المرور." });
    } finally {
      setPasswordActionLoading(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      const records = await fetchUsers("staff");
      if (!isMounted) return;

      setStaff(records);
      setSelectedStaffId((current) => current ?? records[0]?.id ?? null);
    };

    void loadStaff();

    const unsubscribe = subscribeToUsers((records) => {
      setStaff(records.filter((record) => record.role === "staff"));
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
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول الموظفين</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للمدير العام فقط.</p>
      </div>
    );
  }

  const addStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setStaffFormFeedback(null);

    if (!name.trim() || !phone.trim() || permissions.length === 0) {
      setStaffFormFeedback({ type: "error", message: "من فضلك اكمل الاسم والهاتف واختر صلاحية واحدة على الأقل." });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveUser({
        name: name.trim(),
        phone: phone.trim(),
        role: "staff",
        permissions,
        active: true,
      });

      if (!saved) {
        setStaffFormFeedback({ type: "error", message: "حدث خطأ أثناء حفظ الموظف. رجاءً حاول مرة أخرى." });
        return;
      }

      setStaff((current) => [saved, ...current.filter((item) => item.phone !== saved.phone)]);
      setSelectedStaffId(saved.id ?? null);
      setName("");
      setPhone("");
      setPermissions(["attendance"]);
      setStaffFormFeedback({ type: "success", message: "تم إضافة الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to add staff", error);
      setStaffFormFeedback({ type: "error", message: "حدث خطأ غير متوقع أثناء إضافة الموظف." });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permission: StaffPermission) => {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    );
  };

  const updateMember = async (member: AppUserRecord, patch: Partial<AppUserRecord>) => {
    setMemberActionLoading(member.id ?? member.phone);
    setStaffFormFeedback(null);

    try {
      const saved = await saveUser({
        ...member,
        role: "staff",
        ...patch,
      });

      if (!saved) {
        setStaffFormFeedback({
          type: "error",
          message: "تعذر حفظ بيانات الموظف. حاول مرة أخرى.",
        });
        return;
      }

      setStaff((current) => current.map((item) => (item.phone === member.phone ? saved : item)));
      setSelectedStaffId(saved.id ?? selectedStaffId);
      setStaffFormFeedback({ type: "success", message: "تم تحديث بيانات الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to update staff member", error);
      setStaffFormFeedback({
        type: "error",
        message: "حدث خطأ غير متوقع أثناء تحديث بيانات الموظف.",
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleDeleteStaff = async (member: AppUserRecord) => {
    if (!member.id) return;
    setMemberActionLoading(member.id);
    setStaffFormFeedback(null);

    try {
      const deleted = await deleteUser(member.id);
      if (!deleted) {
        setStaffFormFeedback({
          type: "error",
          message: "حدث خطأ أثناء حذف الموظف. حاول مرة أخرى.",
        });
        return;
      }

      setStaff((current) => current.filter((item) => item.phone !== member.phone));
      if (selectedStaffId === member.id) {
        setSelectedStaffId(null);
      }
      setStaffFormFeedback({ type: "success", message: "تم حذف الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to delete staff member", error);
      setStaffFormFeedback({
        type: "error",
        message: "حدث خطأ غير متوقع أثناء حذف الموظف.",
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">إدارة الموظفين</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              إضافة، تعديل الصلاحيات، حذف، وتفعيل أكثر من صلاحية للموظف الواحد.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={addStaff} className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم الموظف"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010XXXXXXXX"
            dir="ltr"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540]"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? "جارٍ الحفظ..." : "إضافة"}
          </button>
        </form>

        {staffFormFeedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              staffFormFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {staffFormFeedback.message}
          </div>
        ) : null}

        {passwordActionFeedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              passwordActionFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {passwordActionFeedback.message}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {allPermissions.map((permission) => {
            const Icon = permissionIcons[permission];
            const active = permissions.includes(permission);

            return (
              <button
                key={permission}
                type="button"
                onClick={() => togglePermission(permission)}
                className={`rounded-2xl border px-4 py-4 text-right transition-all ${
                        active
                          ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540]"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white"
                      }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold">{permissionLabels[permission]}</span>
                  <Icon className={`h-5 w-5 ${active ? "text-[#D4AF37]" : "text-slate-400"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {selectedStaff ? (
          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0A2540] dark:text-white">{selectedStaff.name}</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{selectedStaff.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffId(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              >
                <Eye className="h-4 w-4" />
                إخفاء التفاصيل
              </button>
            </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-3 text-sm font-bold">
                الحالة: {selectedStaff.active ? "نشط" : "موقوف"}
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm font-bold">
                الصلاحيات: {(selectedStaff.permissions ?? []).join("، ") || "لا توجد"}
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm font-bold">
                حالة إعادة الباسورد: {getPasswordResetStatus(getPasswordResetMeta(selectedStaff))}
                {getPasswordResetMeta(selectedStaff)?.approved_until ? (
                  <div className="mt-2 text-xs text-slate-500">
                    تنتهي في {new Date(getPasswordResetMeta(selectedStaff)!.approved_until!).toLocaleString("ar-EG")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {staff.length === 0 ? (
        <EmptyState
          icon={CircleDashed}
          title="لا يوجد موظفون بعد"
          description="أضف أول موظف من النموذج بالأعلى، وبعدها هنقدر نعدل الصلاحيات أو نوقف الحساب من هنا."
        />
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                  <th className="px-4 py-3 text-sm font-bold">الموبايل</th>
                  <th className="px-4 py-3 text-sm font-bold">الصلاحيات</th>
                  <th className="px-4 py-3 text-sm font-bold">الحالة</th>
                  <th className="px-4 py-3 text-sm font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {staff.map((member) => (
                  <tr key={member.id ?? member.phone}>
                    <td className="px-4 py-4 font-bold text-[#0A2540] dark:text-white">{member.name}</td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">
                      {member.phone}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(member.permissions ?? []).map((permission) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() =>
                              void updateMember(member, {
                                permissions: (member.permissions ?? []).includes(permission)
                                  ? (member.permissions ?? []).filter((itemPermission) => itemPermission !== permission)
                                  : [...(member.permissions ?? []), permission],
                              })
                            }
                            disabled={memberActionLoading === member.id}
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              memberActionLoading === member.id
                                ? "bg-slate-100 text-slate-400 cursor-wait opacity-70"
                                : "bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]"
                            }`}
                          >
                            {permissionLabels[permission as StaffPermission] ?? permission}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void updateMember(member, { active: !member.active })}
                        disabled={memberActionLoading === member.id}
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          memberActionLoading === member.id
                            ? "bg-slate-100 text-slate-400 cursor-wait opacity-70"
                            : member.active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {member.active ? "نشط" : "موقوف"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRequestPasswordReset(member)}
                          disabled={
                            passwordActionLoading === member.id || !isPasswordResetRequestAllowed(member)
                          }
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-[#0A2540] transition-colors ${
                            passwordActionLoading === member.id || !isPasswordResetRequestAllowed(member)
                              ? "border-slate-200 bg-slate-100 cursor-not-allowed opacity-70"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          {getPasswordResetStatus(getPasswordResetMeta(member)) === "معلقة"
                            ? "طلب معلق"
                            : getPasswordResetStatus(getPasswordResetMeta(member)) === "موافق عليها"
                            ? "موافق عليها"
                            : "طلب إعادة باسورد"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStaff(member)}
                          disabled={memberActionLoading === member.id}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-red-600 transition-colors ${
                            memberActionLoading === member.id ? "border-red-200 bg-red-100 cursor-wait opacity-70" : "border-red-200 bg-red-50 hover:bg-red-100"
                          }`}
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
