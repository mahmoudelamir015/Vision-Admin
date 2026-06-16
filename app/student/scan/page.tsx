"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, ArrowRight, Camera, XCircle, CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerPage() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<"SUCCESS" | "ERROR" | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning) {
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "student-reader",
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
                false
            );
            
            scannerRef.current.render(
                (decodedText) => {
                    setScanning(false);
                    setResult(decodedText === "VISION_CENTER_CHECKIN_CODE" ? "SUCCESS" : "ERROR");
                    if (scannerRef.current) {
                        scannerRef.current.pause(true);
                    }
                },
                (err) => {}
            );
        } else {
             scannerRef.current.resume();
        }
    }
  }, [scanning]);

  useEffect(() => {
    return () => {
        if (scannerRef.current) {
            try { scannerRef.current.clear(); } catch(e) {}
        }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-50 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/student" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
          <ChevronRight className="w-6 h-6" />
        </Link>
        <span className="text-white font-bold tracking-wide">مسح كود الحضور</span>
        <div className="w-10 h-10"></div> {/* spacer */}
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
         {/* Live Camera View Simulation */}
         <div className="absolute inset-0 bg-[#0A2540]">
             {/* Simulating camera feed blur */}
             <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-[#0A2540] to-black"></div>
         </div>

         <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div 
                 key="scanning"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.1 }}
                 className="relative z-10 flex flex-col items-center"
              >
                 <div className="w-80 max-w-[90vw] relative mb-12">
                     <div id="student-reader" className="w-full bg-white rounded-3xl overflow-hidden border-4 border-[#0A2540]"></div>
                     
                    {/* Scanner Frame Options omitted to give room for real scanner UI */}
                 </div>

                 <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-white text-sm font-bold tracking-wide">جاري البحث عن كود السنتر...</span>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                 key="result"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="relative z-10 w-full max-w-sm px-6"
              >
                 {result === "SUCCESS" ? (
                   <div className="bg-white rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
                      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                         <CheckCircle className="w-12 h-12 text-green-500 relative z-10" />
                         <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping"></div>
                      </div>
                      <h2 className="text-2xl font-black text-[#0A2540] mb-2 cursor-default">تم تسجيل حضورك!</h2>
                      <p className="text-gray-500 font-bold mb-6">الوقت: {new Date().toLocaleTimeString('ar-EG', { hour12: true, hour: "numeric", minute: "numeric" })}</p>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl text-right border border-gray-100 mb-8">
                         <p className="text-xs text-gray-400 font-bold mb-1">المادة الحالية</p>
                         <p className="text-[#0A2540] font-black">لغة إنجليزية - الثالث الثانوي</p>
                      </div>

                      <button 
                         onClick={() => { setScanning(true); setResult(null); }}
                         className="w-full font-bold text-[#0A2540] bg-gray-100 py-4 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                         مسح كود آخر
                      </button>
                   </div>
                 ) : (
                   <div className="bg-white rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
                      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                         <XCircle className="w-12 h-12 text-red-500 relative z-10" />
                      </div>
                      <h2 className="text-2xl font-black text-[#0A2540] mb-2 cursor-default">خطأ في المسح</h2>
                      <p className="text-gray-500 font-bold mb-8">الكود غير صالح أو لم يتم التعرف عليه لمركز رؤية.</p>

                      <button 
                         onClick={() => { setScanning(true); setResult(null); }}
                         className="w-full font-bold text-white bg-[#0A2540] py-4 rounded-xl hover:bg-[#0c2f52] transition-colors shadow-lg shadow-[#0A2540]/20"
                      >
                         إعادة المحاولة
                      </button>
                   </div>
                 )}
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
