"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/admin/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F2E8] via-white to-[#EEF4FF] p-4" dir="rtl">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[-5%] top-[-10%] h-[80vw] w-[80vw] rounded-full bg-[#D4AF37]/25 blur-[150px]"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-sky-300/25 blur-[120px]"
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
          className="relative mb-10 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white p-2 shadow-[0_24px_80px_rgba(10,37,64,0.12)] sm:h-64 sm:w-64"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent mix-blend-multiply" />
          <div className="relative h-[85%] w-[85%]">
            <Image
              src="/logo.png"
              alt="Vision Educational Center Logo"
              fill
              sizes="(max-width: 640px) 85vw, 320px"
              className="object-contain scale-100 transition-transform duration-700"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="space-y-4 text-center"
        >
          <h1 className="text-4xl font-black tracking-tight text-transparent drop-shadow-sm bg-clip-text bg-gradient-to-r from-[#0A2540] via-[#D4AF37] to-[#0A2540] sm:text-5xl">
            سنتر رؤية التعليمى
          </h1>
          <p className="text-sm font-medium tracking-[0.25em] text-slate-500 uppercase sm:text-base">
            Vision Educational Center
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-16 flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-8 py-4 shadow-[0_16px_40px_rgba(10,37,64,0.08)] backdrop-blur-md"
        >
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#D4AF37]" style={{ animationDelay: "0ms" }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#D4AF37]" style={{ animationDelay: "150ms" }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#D4AF37]" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="mr-4 text-sm font-bold tracking-wider text-slate-600">جارى تهيئة لوحة التحكم...</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
