"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, Plus, ShieldAlert, Trash2, Users, Wallet, CalendarRange } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

type StaffPermission = "attendance" | "wallet" | "operations" | "content" | "notifications";

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  permissions: StaffPermission[];
  active: boolean;
};

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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState<StaffPermission[]>(["attendance"]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول الموظفين</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للمدير العام فقط.</p>
      </div>
    );
  }

  const addStaff = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || permissions.length === 0) return;

    setStaff((current) => [
      {
        id: `staff-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        permissions,
        active: true,
      },
      ...current,
    ]);

    setName("");
    setPhone("");
    setPermissions(["attendance"]);
  };

  const togglePermission = (permission: StaffPermission) => {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    );
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </form>

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
                    ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540] dark:border-[#D4AF37] dark:bg-[#D4AF37]/10 dark:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
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
      </section>

      {staff.length === 0 ? (
        <EmptyState
          icon={CircleDashed}
          title="لا يوجد موظفون بعد"
          description="أضف أول موظف من النموذج بالأعلى، وبعدها هنقدر نعدل الصلاحيات أو نوقف الحساب أو نحذفه."
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
                  <tr key={member.id}>
                    <td className="px-4 py-4 font-bold text-[#0A2540] dark:text-white">{member.name}</td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">
                      {member.phone}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {member.permissions.map((permission) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() =>
                              setStaff((current) =>
                                current.map((item) =>
                                  item.id === member.id
                                    ? {
                                        ...item,
                                        permissions: item.permissions.includes(permission)
                                          ? item.permissions.filter((itemPermission) => itemPermission !== permission)
                                          : [...item.permissions, permission],
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-full bg-[#0A2540]/5 px-3 py-1 text-xs font-black text-[#0A2540] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]"
                          >
                            {permissionLabels[permission]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          setStaff((current) =>
                            current.map((item) =>
                              item.id === member.id ? { ...item, active: !item.active } : item,
                            ),
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          member.active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {member.active ? "نشط" : "موقوف"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => setStaff((current) => current.filter((item) => item.id !== member.id))}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </button>
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
