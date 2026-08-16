"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, XCircle, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import { fetchUsers, type AppUserRecord } from "@/src/lib/supabase/users";

export default function GateModePage() {
  const { user } = useAuth();
  const isAdminOrGate = user?.role === "master_admin" || user?.permissions.includes("gate");
  
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AppUserRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus search on mount
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return;
    
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    
    try {
      const records = await fetchUsers("student");
      const matched = records.find(r => 
        (r.student_code && r.student_code.toLowerCase() === searchTerm) ||
        (r.phone && r.phone.replace(/^\\+?20/, '0') === searchTerm) ||
        (r.phone && r.phone === searchTerm)
      );

      if (matched) {
        setResult(matched);
      } else {
        setErrorMsg("تعذر العثور على الطالب بهذة البيانات.");
      }
    } catch (error) {
      setErrorMsg("خطأ في الاتصال بقاعدة البيانات.");
    }
    
    setLoading(false);
    setQuery(""); // clear input for next rapid scan
    // re-focus for scanner
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!isAdminOrGate) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <Shield className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول شاشة البوابة</h2>
      </div>
    );
  }

  const isDebt = result && typeof result.wallet_balance === 'number' && result.wallet_balance < 0;

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-[#0A2540]">شاشة البوابة السريعة (Gate Mode)</h1>
          <p className="mt-2 text-slate-500 font-bold">للبحث السريع عن حالة الطلاب باستخدام الكود أو رقم الهاتف</p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <Search className="absolute right-4 top-4 h-6 w-6 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب أو امسح كود الطالب (VIS-0000) أو الهاتف..."
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-12 py-4 text-lg font-bold outline-none transition-colors focus:border-[#D4AF37] focus:bg-white"
            disabled={loading}
          />
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 font-bold text-slate-500">
            جاري البحث...
          </motion.div>
        )}

        {errorMsg && !loading && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-500" />
            <h2 className="text-2xl font-extrabold text-rose-700">{errorMsg}</h2>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div 
            key="result" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-[2rem] border-4 p-8 sm:p-12 text-center shadow-xl ${
              isDebt ? "border-rose-500 bg-rose-50" : "border-emerald-500 bg-emerald-50"
            }`}
          >
            {isDebt ? (
              <AlertTriangle className="mx-auto mb-6 h-20 w-20 text-rose-600" />
            ) : (
              <CheckCircle className="mx-auto mb-6 h-20 w-20 text-emerald-600" />
            )}
            
            <h2 className={`text-4xl font-black mb-2 ${isDebt ? "text-rose-700" : "text-emerald-700"}`}>
              {result.name}
            </h2>
            <div className="text-xl font-bold mb-6 text-slate-700 flex justify-center items-center gap-4">
               <span className="bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">{result.student_code || "أضيف حديثاً"}</span>
               <span className="bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">{result.phone?.replace(/^\\+?20/, '0')}</span>
            </div>

            <div className={`mt-8 max-w-lg mx-auto rounded-3xl p-6 ${isDebt ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
               <div className="text-3xl font-black">
                 {isDebt ? `عليه مديونية: ${String(-result.wallet_balance!)} EGP` : "رصيده سليم، يمكنه الدخول"}
               </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold opacity-80 justify-center">
               <div className="bg-white/40 p-3 rounded-xl">{result.stage === 'primary' ? 'إبتدائي' : result.stage === 'prep' ? 'إعدادي' : 'ثانوي'}</div>
               <div className="bg-white/40 p-3 rounded-xl">{result.grade || '-'}</div>
               {result.track && <div className="bg-white/40 p-3 rounded-xl">{result.track}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
