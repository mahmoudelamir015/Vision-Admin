"use client";

import { useState } from "react";
import { Send, Users, User, Bell, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/components/admin/AuthContext";

export default function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [target, setTarget] = useState<"ALL" | "GROUP" | "STUDENT">("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-bold">غير مصرح لك بدخول هذه الصفحة</h2>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setSuccess(true);
      setTitle("");
      setMessage("");
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-full relative">
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-12 h-12 bg-[#0A2540]/5 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#0A2540]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540]">مركز الإشعارات</h2>
          <p className="text-gray-500 text-sm mt-1">إرسال تنبيهات فورية لتطبيقات الطلاب وأولياء الأمور</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 p-6 lg:p-10 relative overflow-hidden">
        <AnimatePresence>
            {success && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 right-0 bg-green-500 text-white p-4 text-center font-bold z-50 text-sm shadow-md"
                >
                    تم إرسال الإشعار بنجاح!
                </motion.div>
            )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="space-y-8 max-w-2xl mx-auto mt-4">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">الفئة المستهدفة</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setTarget("ALL")}
                className={`py-3 px-4 rounded-xl flex items-center gap-2 justify-center border-2 transition-all ${
                  target === "ALL" 
                    ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540] shadow-sm" 
                    : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50 hover:bg-white"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="font-bold">الجميع</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTarget("GROUP")}
                className={`py-3 px-4 rounded-xl flex items-center gap-2 justify-center border-2 transition-all ${
                  target === "GROUP" 
                    ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540] shadow-sm" 
                    : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50 hover:bg-white"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-bold">مجموعة صفية</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget("STUDENT")}
                className={`py-3 px-4 rounded-xl flex items-center gap-2 justify-center border-2 transition-all ${
                  target === "STUDENT" 
                    ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540] shadow-sm" 
                    : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50 hover:bg-white"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-bold">طالب محدد</span>
              </button>
            </div>
          </div>

          {target === "GROUP" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
               <label className="block text-sm font-bold text-gray-700">اختر الصف الدراسي</label>
               <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all focus:bg-white font-semibold text-gray-700">
                  <option value="">-- يرجى الاختيار --</option>
                  <option value="1">الصف الأول الثانوى المطور</option>
                  <option value="2">الصف الثاني الثانوى المطور</option>
                  <option value="3">الصف الثالث الثانوى المطور</option>
               </select>
            </motion.div>
          )}

          {target === "STUDENT" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
               <label className="block text-sm font-bold text-gray-700">كود الطالب</label>
               <input 
                  type="text" 
                  placeholder="مثال: VIS-101" 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all focus:bg-white font-mono tracking-widest font-bold text-right dir-ltr"
               />
            </motion.div>
          )}

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">عنوان الإشعار</label>
                <input 
                    required
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تنبيه هام بخصوص موعد الامتحان" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all focus:bg-white text-lg font-bold"
                />
            </div>

            <div className="space-y-2 flex-1">
                <label className="block text-sm font-bold text-gray-700">نص الإشعار</label>
                <textarea 
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب المحتوى هنا..." 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all focus:bg-white resize-none font-medium text-gray-800"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending || !title || !message}
            className="w-full bg-[#0A2540] hover:bg-[#0A2540]/90 disabled:bg-gray-200 disabled:text-gray-400 text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#0A2540]/20 disabled:shadow-none hover:-translate-y-0.5"
          >
            {isSending ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                    <Send className="w-5 h-5 ml-1" />
                    <span>إرسال الإشعار الآن</span>
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
