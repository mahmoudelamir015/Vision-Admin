"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, Users, Wallet, CalendarRange } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";
import { useAuth } from "@/components/admin/AuthContext";
import {
  fetchAttendanceRecords,
  subscribeToAttendance,
  type AttendanceRecord,
} from "@/src/lib/supabase/attendance";
import { fetchWalletEntries, subscribeToWalletEntries, type WalletEntry } from "@/src/lib/supabase/wallets";
import { subscribeToUsers } from "@/src/lib/supabase/users";

type OpsItem = {
  id: string;
  type: "attendance" | "wallet" | "user";
  title: string;
  subtitle?: string;
  created_at?: string;
};

export default function OperationsPage() {
  const { user } = useAuth();
  const isAllowed = user?.permissions.includes("operations") || user?.role === "master_admin";

  const [items, setItems] = useState<OpsItem[]>([]);

  useEffect(() => {
    if (!isAllowed) return;

    let isMounted = true;

    const load = async () => {
      const [attendance, wallets] = await Promise.all([fetchAttendanceRecords(), fetchWalletEntries()]);

      const ops: OpsItem[] = [];

      attendance.forEach((a) =>
        ops.push({
          id: `att-${a.id ?? Math.random().toString(36).slice(2)}`,
          type: "attendance",
          title: a.student_name,
          subtitle: `${a.stage ?? ""} ${a.grade ?? ""} ${a.track ?? ""}`.trim(),
          created_at: a.created_at,
        }),
      );

      wallets.forEach((w) =>
        ops.push({
          id: `wal-${w.id ?? Math.random().toString(36).slice(2)}`,
          type: "wallet",
          title: `${w.owner} — ${w.reason}`,
          subtitle: `${w.amount} EGP ${w.student_phone ? `(${w.student_phone})` : ""}`.trim(),
          created_at: w.created_at,
        }),
      );

      // sort desc
      ops.sort((a, b) => (b.created_at ?? "")!.localeCompare(a.created_at ?? ""));

      if (isMounted) setItems(ops);
    };

    void load();

    const unsubAttendance = subscribeToAttendance(async (records) => {
      setItems((current) => {
        const next = [...current.filter((i) => i.type !== "attendance")];
        records.forEach((a) =>
          next.push({
            id: `att-${a.id ?? Math.random().toString(36).slice(2)}`,
            type: "attendance",
            title: a.student_name,
            subtitle: `${a.stage ?? ""} ${a.grade ?? ""} ${a.track ?? ""}`.trim(),
            created_at: a.created_at,
          }),
        );
        next.sort((x, y) => (y.created_at ?? "").localeCompare(x.created_at ?? ""));
        return next;
      });
    });

    const unsubWallets = subscribeToWalletEntries((records) => {
      setItems((current) => {
        const next = [...current.filter((i) => i.type !== "wallet")];
        records.forEach((w) =>
          next.push({
            id: `wal-${w.id ?? Math.random().toString(36).slice(2)}`,
            type: "wallet",
            title: `${w.owner} — ${w.reason}`,
            subtitle: `${w.amount} EGP ${w.student_phone ? `(${w.student_phone})` : ""}`.trim(),
            created_at: w.created_at,
          }),
        );
        next.sort((x, y) => (y.created_at ?? "").localeCompare(x.created_at ?? ""));
        return next;
      });
    });

    const unsubUsers = subscribeToUsers((users) => {
      setItems((current) => {
        const next = current.filter((i) => i.type !== "user");
        users.slice(-50).forEach((u) =>
          next.push({
            id: `usr-${u.id ?? u.phone}`,
            type: "user",
            title: u.name,
            subtitle: `${u.role} • ${u.phone}`,
            created_at: u.id ?? undefined,
          }),
        );
        next.sort((x, y) => (y.created_at ?? "").localeCompare(x.created_at ?? ""));
        return next;
      });
    });

    return () => {
      isMounted = false;
      if (unsubAttendance) unsubAttendance();
      if (unsubWallets) unsubWallets();
      if (unsubUsers) unsubUsers();
    };
  }, [isAllowed]);

  const rendered = useMemo(() => items.slice(0, 200), [items]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <Clock className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول غرفة العمليات</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">اطلب صلاحية ‘العمليات’ من المدير لإظهار هذه الواجهة.</p>
      </div>
    );
  }

  if (rendered.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="لا توجد عمليات حتى الآن"
        description="العمليات تظهر هنا فور وقوعها — حضور، محفظة، وتحديثات الحسابات."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#0A2540]">غرفة العمليات</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">تدفق حي لآخر الأحداث في النظام.</p>

        <div className="mt-6 grid gap-3">
          {rendered.map((it) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border p-4 bg-slate-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-extrabold text-[#0A2540]">{it.title}</div>
                  {it.subtitle ? <div className="mt-1 text-xs text-slate-500">{it.subtitle}</div> : null}
                </div>
                <div className="text-xs font-mono text-slate-400">{it.created_at ? new Date(it.created_at).toLocaleString() : ""}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
