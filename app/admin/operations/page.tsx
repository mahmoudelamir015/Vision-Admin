"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, Users } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";
import { useAuth } from "@/components/admin/AuthContext";
import { fetchAttendanceRecords, subscribeToAttendance } from "@/src/lib/supabase/attendance";
import { fetchWalletEntries, subscribeToWalletEntries } from "@/src/lib/supabase/wallets";
import { subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type OpsItem = {
  id: string;
  type: "attendance" | "wallet" | "user";
  title: string;
  subtitle?: string;
  created_at?: string;
};

const formatOperationDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ar-EG");
};

const sortTimestamp = (value?: string) => {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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
          title: `${w.owner} - ${w.reason}`,
          subtitle: `${w.amount} EGP ${w.student_phone ? `(${w.student_phone})` : ""}`.trim(),
          created_at: w.created_at,
        }),
      );

      ops.sort((a, b) => sortTimestamp(b.created_at) - sortTimestamp(a.created_at));

      if (isMounted) setItems(ops);
    };

    void load();

    const unsubAttendance = subscribeToAttendance((records) => {
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
        next.sort((x, y) => sortTimestamp(y.created_at) - sortTimestamp(x.created_at));
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
            title: `${w.owner} - ${w.reason}`,
            subtitle: `${w.amount} EGP ${w.student_phone ? `(${w.student_phone})` : ""}`.trim(),
            created_at: w.created_at,
          }),
        );
        next.sort((x, y) => sortTimestamp(y.created_at) - sortTimestamp(x.created_at));
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
            subtitle: `${u.role} - ${u.phone?.replace(/^\\+?20/, '0')}`,
            created_at: (u as AppUserRecord & { created_at?: string }).created_at,
          }),
        );
        next.sort((x, y) => sortTimestamp(y.created_at) - sortTimestamp(x.created_at));
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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(items.length / pageSize);
  const rendered = useMemo(() => items.slice((currentPage - 1) * pageSize, currentPage * pageSize), [items, currentPage]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-6 text-center text-red-600 sm:p-8">
        <Clock className="mb-3 h-12 w-12 opacity-70 sm:h-14 sm:w-14" />
        <h2 className="text-lg font-extrabold sm:text-xl">غير مصرح لك بدخول غرفة العمليات</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">اطلب صلاحية العمليات من المدير لإظهار هذه الواجهة.</p>
      </div>
    );
  }

  if (rendered.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="لا توجد عمليات حتى الآن"
        description="العمليات تظهر هنا فور وقوعها - حضور، محفظة، وتحديثات الحسابات."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-xl font-extrabold text-[#0A2540] sm:text-2xl">غرفة العمليات</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">تدفق حي لآخر الأحداث في النظام.</p>
            </div>
            {user?.role === "master_admin" ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("هل أنت متأكد من حذف جميع السجلات؟")) {
                    await fetch("/api/admin/operations", { method: "DELETE" });
                    window.location.reload();
                  }
                }}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                title="تفريغ الحضور والمحفظة"
              >
                حذف السجلات
              </button>
            ) : null}
         </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">النوع</th>
                  <th className="px-4 py-3 text-sm font-bold">البيان</th>
                  <th className="px-4 py-3 text-sm font-bold">التفاصيل</th>
                  <th className="px-4 py-3 text-sm font-bold">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rendered.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs ${
                        it.type === 'attendance' ? 'bg-blue-100 text-blue-700' :
                        it.type === 'wallet' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {it.type === 'attendance' ? 'حضور' : it.type === 'wallet' ? 'محفظة' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-[#0A2540]">{it.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{it.subtitle || "-"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{formatOperationDate(it.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-sm font-bold text-slate-500">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
