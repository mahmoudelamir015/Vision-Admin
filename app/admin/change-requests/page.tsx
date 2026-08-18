"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCcw, XCircle } from "lucide-react";

type ChangeRequest = { id: string; user_type: string; requested_field: string; new_value: string; reason: string; status: "pending" | "approved" | "rejected"; admin_reason?: string | null; created_at?: string };

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/change-requests", { cache: "no-store", credentials: "include" });
      const payload = (await response.json().catch(() => null)) as { requests?: ChangeRequest[] } | null;
      if (response.ok && Array.isArray(payload?.requests)) setRequests(payload.requests);
    } finally { setLoading(false); }
  };

  useEffect(() => { const timer = window.setTimeout(() => void loadRequests(), 0); return () => window.clearTimeout(timer); }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const adminReason = rejectReasons[id]?.trim() ?? "";
    if (action === "reject" && !adminReason) { alert("اكتب سبب الرفض أولاً"); return; }
    setActionLoading(id);
    try {
      const response = await fetch("/api/admin/change-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id, action, admin_reason: action === "reject" ? adminReason : undefined }) });
      if (!response.ok) { const payload = (await response.json().catch(() => null)) as { error?: string } | null; throw new Error(payload?.error ?? "تعذر تنفيذ العملية"); }
      setRejectReasons((current) => { const next = { ...current }; delete next[id]; return next; });
      await loadRequests();
    } catch (error) { alert(error instanceof Error ? error.message : "تعذر تنفيذ العملية"); } finally { setActionLoading(null); }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="rounded-[2rem] border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">طلبات التعديل</h1><p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">راجع الطلبات الجديدة واعتمدها او ارفضها مع سبب واضح.</p></div><button type="button" onClick={() => void loadRequests()} className="inline-flex items-center gap-2 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"><RefreshCcw className="h-4 w-4" />تحديث</button></div>
      </header>
      {loading ? <div className="rounded-[2rem] border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">جاري التحميل...</div> : requests.length === 0 ? <div className="rounded-[2rem] border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">لا توجد طلبات حالياً.</div> : (
        <div className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-right text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500"><tr><th className="px-5 py-4">النوع</th><th className="px-5 py-4">الحقل</th><th className="px-5 py-4">القيمة الجديدة</th><th className="px-5 py-4">السبب</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">التاريخ</th><th className="px-5 py-4">الإجراء</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">{requests.map((request) => <tr key={request.id} className="align-middle hover:bg-slate-50/80 dark:hover:bg-white/5"><td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">{request.user_type}</td><td className="whitespace-nowrap px-5 py-4 font-bold text-[#0A2540]">{request.requested_field}</td><td className="max-w-[220px] px-5 py-4 font-extrabold text-[#0A2540]">{request.new_value}</td><td className="max-w-[240px] px-5 py-4 text-xs font-bold text-slate-500">{request.reason}</td><td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${request.status === "pending" ? "bg-amber-100 text-amber-700" : request.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{request.status}</span>{request.admin_reason ? <p className="mt-2 text-xs font-bold text-red-600">{request.admin_reason}</p> : null}</td><td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-500">{request.created_at ? new Date(request.created_at).toLocaleDateString("ar-EG") : "—"}</td><td className="px-5 py-4">{request.status === "pending" ? <div className="flex min-w-[300px] items-center gap-2"><button type="button" disabled={actionLoading === request.id} onClick={() => void handleAction(request.id, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"><CheckCircle2 className="h-3.5 w-3.5" />اعتماد</button><input value={rejectReasons[request.id] ?? ""} onChange={(event) => setRejectReasons((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="سبب الرفض" className="w-36 rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5 dark:text-white" /><button type="button" disabled={actionLoading === request.id} onClick={() => void handleAction(request.id, "reject")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"><XCircle className="h-3.5 w-3.5" />رفض</button></div> : <span className="text-xs font-bold text-slate-400">تم التعامل معه</span>}</td></tr>)}</tbody>
        </table></div></div>
      )}
    </div>
  );
}
