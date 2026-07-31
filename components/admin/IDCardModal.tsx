import { Printer, X } from "lucide-react";
import Image from "next/image";

type Student = { id: number; name: string; grade: string; code: string };

export function IDCardModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-red-500"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-b from-[#0A2540] to-[#123659] p-6 pb-8 text-center text-white">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#D4AF37]/20 blur-3xl" />
          <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-lg">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" unoptimized />
          </div>
          <h2 className="text-xl font-bold tracking-tighter">سنتـر رؤية التعليمي</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Student ID Card</p>
        </div>

        <div className="relative flex flex-col items-center bg-white px-6 py-8">
          <div className="absolute -top-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg">
            <div className="text-4xl text-gray-400">👤</div>
          </div>

          <div className="mt-12 w-full text-center">
            <h3 className="text-2xl font-black text-[#0A2540]">{student.name}</h3>
            <p className="mt-1 text-sm font-bold text-gray-500">{student.grade}</p>

            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Student ID Code</p>
              <p className="text-2xl font-mono font-bold tracking-[0.2em] text-[#0A2540] drop-shadow-sm">{student.code}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center border-t border-gray-100 bg-gray-50 p-4">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border-2 border-transparent px-6 py-2 text-sm font-bold text-[#0A2540] transition-colors hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/5 hover:text-[#D4AF37]"
          >
            <Printer className="h-4 w-4" />
            طباعة الكارنية
          </button>
        </div>
      </div>
    </div>
  );
}
