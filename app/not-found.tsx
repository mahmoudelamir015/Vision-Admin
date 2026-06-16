import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-black text-[#0A2540] mb-2 tracking-tight" dir="ltr">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-4">هذه الصفحة غير موجودة</h2>
        <p className="text-gray-500 mb-8 font-medium">عذراً، الرابط الذي تحاول الوصول إليه غير متاح أو تم نقله.</p>
        
        <Link 
          href="/" 
          className="w-full bg-[#D4AF37] hover:bg-[#c49a20] text-[#0A2540] font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-95"
        >
          <Home className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
