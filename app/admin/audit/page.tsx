"use client";

import { useEffect, useState } from "react";
import { FileText, Clock } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

type AuditEntry = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  created_at: string;
  student_name: string;
  student_phone: string;
  employee_name: string;
  employee_phone: string;
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/admin/audit");
        const payload = await res.json();
        if (isMounted && payload.audit) {
          setEntries(payload.audit);
        }
      } catch (err) {
        console.error("Failed to load audit", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchAudit();
    
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-6 text-center text-red-600 sm:p-8">
        <Clock className="mb-3 h-12 w-12 opacity-70 sm:h-14 sm:w-14" />
        <h2 className="text-lg font-extrabold sm:text-xl">غير مصرح لك بدخول سجل الحركات الرقابي</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للإدارة العليا فقط.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#0A2540]">سجل الحركات الرقابي (Audit Log)</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">تتبع دقيق لكل المعاملات المالية، والموظف الذي قام بها.</p>
      </header>

      {loading ? (
        <div className="text-center py-10 font-bold text-slate-500">جاري التحميل...</div>
      ) : entries.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد حركات مسجلة" description="سيظهر هنا سجل المعاملات المالية كإضافة رصيد للطلاب." />
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold">الوقت</th>
                  <th className="px-4 py-3 font-bold">الموظف (المسؤول)</th>
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">الإجراء</th>
                  <th className="px-4 py-3 font-bold">السبب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleString("ar-EG")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-[#0A2540]">{entry.employee_name || "النظام"}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-wider">{entry.employee_phone?.replace(/^\\+?20/, '0') || ""}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-[#0A2540]">{entry.student_name}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-wider">{entry.student_phone?.replace(/^\\+?20/, '0') || ""}</div>
                    </td>
                    <td className="px-4 py-4 font-bold">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs ${entry.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                         {entry.type === 'credit' ? `أضاف ${entry.amount} EGP` : `خصم ${entry.amount} EGP`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-bold">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
