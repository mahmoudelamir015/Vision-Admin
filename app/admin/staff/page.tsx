"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

type StaffPermission = "attendance" | "wallet" | "operations";

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  permission: StaffPermission;
  active: boolean;
};

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [permission, setPermission] = useState<StaffPermission>("attendance");

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط¯ط®ظˆظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">ط§ظ„طµظپط­ط© ظ…ط­ظ…ظٹط© ظ„ظ„ظ…ط¯ظٹط± ظپظ‚ط·.</p>
      </div>
    );
  }

  const addStaff = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setStaff((current) => [
      ...current,
      {
        id: `staff-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        permission,
        active: true,
      },
    ]);

    setName("");
    setPhone("");
    setPermission("attendance");
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
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپطŒ طھط¹ط¯ظٹظ„ طµظ„ط§ط­ظٹط§طھظ‡طŒ ط£ظˆ ط¥ظٹظ‚ط§ظپ ط§ظ„ط­ط³ط§ط¨.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <form onSubmit={addStaff} className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010XXXXXXXX"
            dir="ltr"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          />
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value as StaffPermission)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
          >
            <option value="attendance">ط§ظ„ط­ط¶ظˆط±</option>
            <option value="wallet">ط§ظ„ظ…ط­ظپط¸ط©</option>
            <option value="operations">ط§ظ„ط¹ظ…ظ„ظٹط§طھ</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
          >
            <Plus className="h-4 w-4" />
            ط¥ط¶ط§ظپط©
          </button>
        </form>
      </section>

      {staff.length === 0 ? (
        <EmptyState
          icon={CircleDashed}
          title="ظ„ط§ ظٹظˆط¬ط¯ ظ…ظˆط¸ظپظˆظ† ط¨ط¹ط¯"
          description="ط§ط¨ط¯ط£ ط¨ط¥ط¶ط§ظپط© ط£ظˆظ„ ظ…ظˆط¸ظپ ظ…ظ† ط§ظ„ظ†ظ…ظˆط°ط¬ ط¨ط§ظ„ط£ط¹ظ„ظ‰طŒ ظˆط¨ط¹ط¯ظ‡ط§ طھظ‚ط¯ط± طھط؛ظٹظ‘ط± ط§ظ„طµظ„ط§ط­ظٹط© ط£ظˆ طھظˆظ‚ظپ ط§ظ„ط­ط³ط§ط¨."
        />
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">ط§ظ„ط§ط³ظ…</th>
                  <th className="px-4 py-3 text-sm font-bold">ط§ظ„ظ…ظˆط¨ط§ظٹظ„</th>
                  <th className="px-4 py-3 text-sm font-bold">ط§ظ„طµظ„ط§ط­ظٹط©</th>
                  <th className="px-4 py-3 text-sm font-bold">ط§ظ„ط­ط§ظ„ط©</th>
                  <th className="px-4 py-3 text-sm font-bold text-left">ط¥ط¬ط±ط§ط،</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4 font-bold text-[#0A2540] dark:text-white">{member.name}</td>
                    <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">{member.phone}</td>
                    <td className="px-4 py-4">
                      <select
                        value={member.permission}
                        onChange={(event) => {
                          const nextPermission = event.target.value as StaffPermission;
                          setStaff((current) =>
                            current.map((item) =>
                              item.id === member.id ? { ...item, permission: nextPermission } : item,
                            ),
                          );
                        }}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20"
                      >
                        <option value="attendance">ط§ظ„ط­ط¶ظˆط±</option>
                        <option value="wallet">ط§ظ„ظ…ط­ظپط¸ط©</option>
                        <option value="operations">ط§ظ„ط¹ظ…ظ„ظٹط§طھ</option>
                      </select>
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
                        {member.active ? "ظ†ط´ط·" : "ظ…ظˆظ‚ظˆظپ"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => setStaff((current) => current.filter((item) => item.id !== member.id))}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        ط­ط°ظپ
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

