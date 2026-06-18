"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { fetchWalletEntries, type WalletEntry } from "@/src/lib/supabase/wallets";
import { fetchUsers, type AppUserRecord } from "@/src/lib/supabase/users";

function formatDateLocal(d?: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("ar-EG");
  } catch {
    return d;
  }
}

export default function DailyClosePage() {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [users, setUsers] = useState<AppUserRecord[]>([]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!e.created_at) return false;
      const entryDate = new Date(e.created_at).toLocaleDateString("en-CA");
      return entryDate === date;
    });
  }, [entries, date]);

  const grandTotal = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount ?? 0), 0), [filtered]);

  const perStaff = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      const key = e.owner ?? "unknown";
      map.set(key, (map.get(key) ?? 0) + Number(e.amount ?? 0));
    });
    return Array.from(map.entries()).map(([owner, total]) => ({ owner, total }));
  }, [filtered]);

  const usersByPhone = useMemo(() => {
    const m: Record<string, AppUserRecord> = {};
    users.forEach((u) => {
      if (u.phone) m[u.phone] = u;
    });
    return m;
  }, [users]);

  const handlePrint = () => {
    const positive = entries.filter((e) => {
      if (!e.created_at) return false;
      const entryDate = new Date(e.created_at).toLocaleDateString("en-CA");
      return entryDate === date && Number(e.amount ?? 0) > 0;
    });

    const total = positive.reduce((s, e) => s + Number(e.amount ?? 0), 0);

    const rows = positive
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .map((e) => {
        const student = usersByPhone[e.student_phone ?? ""]?.name ?? e.student_phone ?? "-";
        return `<tr><td>${formatDateLocal(e.created_at)}</td><td>${student}</td><td style="font-family: monospace">${e.amount} EGP</td><td>${e.owner ?? "-"}</td><td>${e.reason ?? "-"}</td></tr>`;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>تقفيل اليومية ${date}</title><style>body{font-family:Arial,\'Noto Naskh Arabic\',sans-serif;direction:rtl;text-align:right;padding:20px}h1{margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style></head><body><h1>تقفيل اليومية — ${date}</h1><h3>المجموع: ${total} EGP</h3><table><thead><tr><th>الوقت</th><th>الطالب</th><th>المبلغ</th><th>السكرتير</th><th>السبب</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("رجاءً سمح النوافذ المنبثقة في المتصفح ثم أعد المحاولة.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleExportCSV = () => {
    const positive = entries.filter((e) => {
      if (!e.created_at) return false;
      const entryDate = new Date(e.created_at).toLocaleDateString("en-CA");
      return entryDate === date && Number(e.amount ?? 0) > 0;
    });

    const header = ["الوقت", "الطالب", "المبلغ", "السكرتير", "السبب"];
    const rows = positive
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .map((e) => {
        const student = usersByPhone[e.student_phone ?? ""]?.name ?? e.student_phone ?? "-";
        return [formatDateLocal(e.created_at), student, String(e.amount), e.owner ?? "-", e.reason ?? "-"];
      });

    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-close-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [allEntries, allUsers] = await Promise.all([fetchWalletEntries(), fetchUsers()]);
        if (!mounted) return;
        setEntries(allEntries);
        setUsers(allUsers);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // protect: only master_admin
  if (user?.role !== "master_admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <h2 className="text-xl font-extrabold">ممنوع</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">هذه الصفحة متاحة لمدير النظام فقط.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-[1rem] border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540]">تقفيل اليومية</h1>
            <p className="mt-1 text-sm text-slate-500">ملخص اليوم والتفاصيل المالية لكل سكرتير.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-bold">تاريخ:</label>
            <input className="rounded-md border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button
              onClick={handlePrint}
              className="ml-2 rounded-md bg-[#0A2540] px-3 py-2 text-sm font-bold text-white hover:opacity-95"
            >
              طباعة
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4 bg-slate-50">
            <div className="text-sm text-slate-500">الخزنة (Grand Total)</div>
            <div className="mt-2 text-3xl font-black text-[#0A2540]">{grandTotal} EGP</div>
          </div>

          <div className="md:col-span-2 rounded-lg border p-4 bg-slate-50">
            <div className="text-sm text-slate-500">عهدة السكرتارية</div>
            <div className="mt-3 space-y-2">
              {perStaff.length === 0 ? (
                <div className="text-sm text-slate-500">لا توجد عمليات في هذا التاريخ.</div>
              ) : (
                <table className="w-full table-fixed text-right">
                  <thead>
                    <tr>
                      <th className="py-2 text-sm">السكرتير</th>
                      <th className="py-2 text-sm">المجموع (EGP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perStaff.map((s) => (
                      <tr key={s.owner} className="border-t">
                        <td className="py-2 font-bold">{s.owner}</td>
                        <td className="py-2 font-mono">{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-[#0A2540]">سجل الحركات</h2>

          {loading ? (
            <div className="mt-3">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="لا توجد حركات"
              description="لا توجد عمليات شحن في هذا التاريخ."
            />
          ) : (
            <div className="mt-3 overflow-auto rounded-lg border">
              <table className="min-w-full text-right">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-sm">الوقت</th>
                    <th className="px-4 py-3 text-sm">الطالب</th>
                    <th className="px-4 py-3 text-sm">المبلغ</th>
                    <th className="px-4 py-3 text-sm">السكرتير</th>
                    <th className="px-4 py-3 text-sm">السبب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered
                    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                    .map((e) => (
                      <tr key={e.id ?? `${e.owner}-${e.created_at}`}>
                        <td className="px-4 py-3 text-sm">{formatDateLocal(e.created_at)}</td>
                        <td className="px-4 py-3 text-sm">{usersByPhone[e.student_phone ?? ""]?.name ?? e.student_phone ?? "-"}</td>
                        <td className="px-4 py-3 text-sm font-mono">{e.amount} EGP</td>
                        <td className="px-4 py-3 text-sm">{e.owner}</td>
                        <td className="px-4 py-3 text-sm">{e.reason}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
