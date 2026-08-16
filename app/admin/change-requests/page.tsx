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
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(requests.length / pageSize);
  
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const selectedRequest = requests.find(r => r.id === selectedRequestId) || null;

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
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">طلبات التعديل</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">راجع الطلبات الجديدة واعتمدها او ارفضها مع سبب واضح.</p>
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
        <>
          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold">المستخدم</th>
                  <th className="px-4 py-3 text-sm font-bold">الحقل</th>
                  <th className="px-4 py-3 text-sm font-bold">القيمة الجديدة</th>
                  <th className="px-4 py-3 text-sm font-bold">الحالة</th>
                  <th className="px-4 py-3 text-sm font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold">{request.user_type}</td>
                    <td className="px-4 py-3 text-sm font-bold">{request.requested_field}</td>
                    <td className="px-4 py-3 text-sm text-[#0A2540]">{request.new_value}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === "pending" ? "bg-amber-100 text-amber-700" :
                        request.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedRequestId(request.id)}
                        className="text-[#0A2540] font-bold underline hover:text-[#D4AF37]"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-4">
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

          {selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 p-4">
              <div className="flex w-full max-w-lg flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
                <h2 className="text-xl font-extrabold text-[#0A2540]">مراجعة طلب التعديل</h2>
                <div className="text-sm space-y-2">
                  <p><strong>السبب:</strong> <span className="text-slate-600">{selectedRequest.reason}</span></p>
                  <p><strong>القيمة المطلوبة:</strong> <span className="text-slate-600">{selectedRequest.new_value}</span></p>
                  {selectedRequest.admin_reason && <p><strong>سبب الإدارة:</strong> <span className="text-red-600">{selectedRequest.admin_reason}</span></p>}
                </div>

                {selectedRequest.status === "pending" ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      disabled={actionLoading === selectedRequest.id}
                      onClick={() => {
                         void handleAction(selectedRequest.id, "approve");
                         setSelectedRequestId(null);
                      }}
                      className="inline-flex justify-center items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      اعتماد
                    </button>
                    <div className="flex flex-col gap-2 border-t pt-4">
                      <input
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder="سبب الرفض"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      />
                      <button
                        type="button"
                        disabled={actionLoading === selectedRequest.id}
                        onClick={() => {
                          void handleAction(selectedRequest.id, "reject");
                          setSelectedRequestId(null);
                        }}
                        className="inline-flex justify-center items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        رفض
                      </button>
                    </div>
                  </div>
                ) : (
                   <p className="mt-4 text-center text-sm font-bold text-slate-500">هذا الطلب تم الفصل فيه.</p>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedRequestId(null)}
                  className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
