"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/admin/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Lock, AlertCircle, Shield, Users, Phone, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"ADMIN" | "STAFF">("STAFF");
  const [adminCode, setAdminCode] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [errorType, setErrorType] = useState<"ADMIN" | "STAFF" | null>(null);
  const [isLoading, setIsLoading] = useState<"ADMIN" | "STAFF" | null>(null);
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorType(null);
    setIsLoading(activeTab);

    const code = activeTab === "ADMIN" ? adminCode : staffCode;

    setTimeout(() => {
      const success = login(code, activeTab);
      if (!success) {
        setErrorType(activeTab);
      }
      setIsLoading(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] bg-[#D4AF37] rounded-full blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] sm:w-[40vw] sm:h-[40vw] bg-[#D4AF37] rounded-full blur-[120px] pointer-events-none"
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="w-32 h-32 sm:w-40 sm:h-40 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center p-3 shadow-[0_0_80px_rgba(212,175,55,0.15)] border border-white/10 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden shadow-inner p-3">
              <Image
                src="/logo.png"
                alt="Center Logo"
                fill
                sizes="(max-width: 640px) 128px, 160px"
                className="object-contain transition-transform duration-700 group-hover:scale-110"
                priority
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -inset-x-20 top-0 h-[100px] bg-gradient-to-b from-white/10 to-transparent -rotate-6 blur-[2px] opacity-30 transform -translate-y-12" />

          <div className="p-6 sm:p-10 relative z-10">
            <div className="flex bg-[#0A2540]/50 p-1.5 rounded-2xl mb-8 border border-white/10 relative">
              <motion.div
                className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-[#D4AF37] to-[#e1bd41] rounded-xl shadow-lg"
                initial={false}
                animate={{
                  left: activeTab === "STAFF" ? "6px" : "calc(50%)",
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />

              <button
                onClick={() => {
                  setErrorType(null);
                  setActiveTab("ADMIN");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 text-sm sm:text-base font-bold rounded-xl transition-colors duration-300 relative z-10 ${activeTab === "ADMIN" ? "text-white" : "text-white/60 hover:text-white/80"}`}
                type="button"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                الإدارة
              </button>
              <button
                onClick={() => {
                  setErrorType(null);
                  setActiveTab("STAFF");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 text-sm sm:text-base font-bold rounded-xl transition-colors duration-300 relative z-10 ${activeTab === "STAFF" ? "text-[#0A2540]" : "text-white/60 hover:text-white/80"}`}
                type="button"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                الموظفين
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative min-h-[110px]">
                <AnimatePresence mode="wait">
                  {activeTab === "ADMIN" ? (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <label className="block text-white/80 text-sm font-bold mb-3 tracking-wide">كود الوصول للمدير (500900)</label>
                      <div className="relative group">
                        <input
                          type="password"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          dir="ltr"
                          placeholder="500900"
                          className={`w-full text-center text-3xl tracking-[0.5em] font-mono bg-[#0A2540]/40 border-2 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none transition-all duration-300 shadow-inner ${errorType === "ADMIN" ? "border-red-400/50 bg-red-400/10 focus:border-red-400 ring-4 ring-red-400/20" : "border-white/10 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"}`}
                        />
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30 group-focus-within:text-[#D4AF37] transition-colors" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="staff"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <label className="block text-white/80 text-sm font-bold mb-3 tracking-wide">رقم الموبايل فقط</label>
                      <div className="relative group">
                        <input
                          type="tel"
                          value={staffCode}
                          onChange={(e) => setStaffCode(e.target.value)}
                          dir="ltr"
                          placeholder="010XXXXXXXX"
                          className={`w-full text-center text-2xl sm:text-3xl tracking-[0.1em] sm:tracking-[0.2em] font-mono bg-[#0A2540]/40 border-2 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none transition-all duration-300 shadow-inner ${errorType === "STAFF" ? "border-red-400/50 bg-red-400/10 focus:border-red-400 ring-4 ring-red-400/20" : "border-white/10 focus:border-[#D4AF37] focus:bg-[#0A2540]/60"}`}
                        />
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30 group-focus-within:text-[#D4AF37] transition-colors" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-8 flex items-center justify-center">
                <AnimatePresence>
                  {errorType && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-300 text-sm font-bold flex items-center gap-1.5 bg-red-500/10 px-4 py-2 rounded-xl backdrop-blur-md border border-red-500/20 shadow-lg"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {errorType === "ADMIN" ? "كود الوصول غير صحيح." : "رقم الموبايل غير صالح."}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading !== null || (activeTab === "ADMIN" ? !adminCode : !staffCode)}
                className="w-full relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#e1bd41] disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-[#0A2540] font-black text-lg sm:text-xl py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#D4AF37]/20 border border-white/10 disabled:border-white/5 mt-4 group disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                {isLoading ? (
                  <div className="w-7 h-7 border-4 border-[#0A2540]/30 border-t-[#0A2540] rounded-full animate-spin relative z-10 disabled:border-white/30 disabled:border-t-white" />
                ) : (
                  <>
                    <span className="relative z-10 tracking-wide">تسجيل الدخول</span>
                    <ArrowLeft className="w-6 h-6 relative z-10" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/30 text-xs mt-8 font-mono tracking-widest uppercase cursor-default"
        >
          Secure Auth Portal | V.1.0.0
        </motion.p>
      </div>
    </div>
  );
}
