"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCcw, XCircle } from "lucide-react";

type ChangeRequest = {
  id: string;
  user_type: string;
  requested_field: string;
  new_value: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_reason?: string | null;
  created_at?: string;
};

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/change-requests", { cache: "no-store", credentials: "include" });
      const payload = (await response.json().catch(() => null)) as { requests?: ChangeRequest[]; error?: string } | null;
      if (response.ok && Array.isArray(payload?.requests)) {
        setRequests(payload.requests);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const response = await fetch("/api/admin/change-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, action, admin_reason: action === "reject" ? rejectReason : undefined }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "تعذر تنفيذ العملية");
      }
      setRejectReason("");
      await loadRequests();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تنفيذ العملية");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">طلبات التعديل</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">راجع الطلبات الجديدة واعتمدها او ارفضها مع سبب واضح.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">جاري التحميل...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">لا توجد طلبات حالياً.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{request.user_type}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">{request.requested_field}</span>
                    <span className={`rounded-full px-3 py-1 ${request.status === "pending" ? "bg-amber-100 text-amber-700" : request.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {request.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">{request.new_value}</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{request.reason}</p>
                  {request.admin_reason ? <p className="text-sm font-bold text-red-600">سبب الإدارة: {request.admin_reason}</p> : null}
                </div>

                {request.status === "pending" ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={actionLoading === request.id}
                      onClick={() => void handleAction(request.id, "approve")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      اعتماد
                    </button>
                    <div className="flex flex-col gap-2">
                      <input
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder="سبب الرفض"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      />
                      <button
                        type="button"
                        disabled={actionLoading === request.id}
                        onClick={() => void handleAction(request.id, "reject")}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        رفض
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
