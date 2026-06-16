"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Show splash for 2.5 seconds then redirect to admin login
    const timer = setTimeout(() => {
      router.push("/admin/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[80vw] h-[80vw] bg-[#D4AF37] rounded-full blur-[150px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#D4AF37] rounded-full blur-[120px] pointer-events-none"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-48 h-48 sm:w-64 sm:h-64 relative mb-10 rounded-full overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.4)] border-4 border-[#D4AF37]/30 bg-white flex items-center justify-center p-2 group"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent mix-blend-multiply"></div>
            <div className="relative h-[85%] w-[85%]">
              <Image
                src="/logo.png"
                alt="Vision Educational Center Logo"
                fill
                sizes="(max-width: 640px) 85vw, 320px"
                className="object-contain scale-100 transition-transform duration-700 group-hover:scale-110"
                priority
              />
            </div>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
            className="text-center space-y-4"
        >
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D4AF37] to-white tracking-tight drop-shadow-lg">
              سنتر رؤية التعليمي
            </h1>
            <p className="text-white/70 font-medium tracking-[0.25em] text-sm sm:text-base uppercase">
              Vision Educational Center
            </p>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-16 flex gap-3 items-center bg-white/5 px-8 py-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl"
        >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span className="text-white/80 text-sm font-bold mr-4 tracking-wider">جاري تهيئة لوحة التحكم...</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
