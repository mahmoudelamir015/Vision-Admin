"use client";

import { useState } from "react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { fetchUserByPhone } from "@/src/lib/supabase/users";
import { fetchWalletEntries, saveWalletEntry } from "@/src/lib/supabase/wallets";

export default function WalletTopupPage() {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | string>("");
  const [message, setMessage] = useState<string | null>(null);

  const lookupByPhone = async (p: string) => {
    setMessage(null);
    setStudent(null);
    setBalance(null);
    if (!p) return;
    setLoading(true);
    try {
      const found = await fetchUserByPhone(p);
      if (!found) {
        setMessage("لم يتم العثور على طالب بهذا الرقم");
        return;
      }
      setStudent(found);

      const entries = await fetchWalletEntries();
      const studentEntries = entries.filter((e) => e.student_phone === p);
      const bal = studentEntries.reduce((s, e) => s + Number(e.amount), 0);
      setBalance(bal);
    } catch (err) {
      console.error(err);
      setMessage("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await lookupByPhone(phone.trim());
  };

  const handleTopup = async () => {
    setMessage(null);
    if (!student) {
      setMessage("اختر طالب أولاً");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setMessage("ادخل مبلغ صالح أكبر من صفر");
      return;
    }

    setLoading(true);
    try {
      const owner = user?.name ?? user?.phone ?? "unknown";
      const entry = await saveWalletEntry({
        owner,
        account_type: "student",
        amount: amt,
        reason: `Topup by ${owner}`,
        student_phone: student.phone?.replace(/^\+?20/, '0'),
      });

      if (!entry) {
        setMessage("فشل شحن المحفظة، حاول مرة أخرى");
        return;
      }

      // refresh balance
      await lookupByPhone(student.phone);
      setAmount("");
      setMessage("تم الشحن بنجاح");
    } catch (err) {
      console.error(err);
      setMessage("حدث خطأ أثناء شحن المحفظة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[1rem] border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold text-[#0A2540]">شاشة شحن المحفظة (السكرتارية)</h1>
        <p className="mt-2 text-sm text-slate-500">ابحث عن الطالب برقم الموبايل ثم ادخل مبلغ الشحن.</p>

        <div className="mt-4 flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="أدخل رقم الهاتف"
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button onClick={handleSearch} disabled={loading} className="rounded-lg bg-[#0A2540] px-4 py-2 text-white">
            بحث
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div>جاري التحميل...</div>
          ) : student ? (
            <div className="space-y-3">
              <div className="text-lg font-bold">{student.name} — {student.phone?.replace(/^\+?20/, '0')}</div>
              <div className="text-sm">الرصيد الحالي: <span className="font-mono">{balance ?? 0} EGP</span></div>

              <div className="mt-3 flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="المبلغ"
                  type="number"
                  className="flex-1 rounded-lg border px-3 py-2"
                />
                <button onClick={handleTopup} disabled={loading} className="rounded-lg bg-[#D4AF37] px-4 py-2 font-bold text-[#0A2540]">
                  شحن
                </button>
              </div>
            </div>
          ) : (
            <EmptyState title="ابحث عن طالب" description="ابدأ بالبحث لعرض اسم الطالب ورصيده" />
          )}

          {message ? <div className="mt-4 text-sm text-red-600">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}
