import { X, Printer } from "lucide-react";
import Image from "next/image";

type Student = { id: number; name: string; grade: string; code: string };

export function IDCardModal({ student, onClose }: { student: Student, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-500 hover:text-red-500 shadow-sm transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-8 text-center flex flex-col items-center bg-gradient-to-b from-[#0A2540] to-[#123659] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl rounded-tl-none"></div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden border-2 border-white/20">
               <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" unoptimized />
            </div>
            <h2 className="text-xl font-bold tracking-tighter">سنتر رؤية التعليمي</h2>
            <p className="text-[#D4AF37] text-xs mt-1 font-bold tracking-widest uppercase">Student ID Card</p>
        </div>

        <div className="px-6 py-8 flex flex-col items-center relative bg-white">
            <div className="absolute -top-12 border-4 border-white rounded-full shadow-lg overflow-hidden w-24 h-24 bg-gray-100 flex items-center justify-center">
                {/* Profile Picture Placeholder */}
                <div className="text-4xl text-gray-400">👤</div>
            </div>
            
            <div className="mt-12 text-center w-full">
                <h3 className="text-2xl font-black text-[#0A2540]">{student.name}</h3>
                <p className="text-gray-500 font-bold mt-1 text-sm">{student.grade}</p>
                
                <div className="mt-6 bg-gray-50 rounded-xl p-4 border-2 border-gray-100 border-dashed">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Student ID Code</p>
                    <p className="text-2xl font-mono tracking-[0.2em] font-bold text-[#0A2540] drop-shadow-sm">{student.code}</p>
                </div>
            </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100">
            <button className="flex items-center gap-2 text-sm font-bold text-[#0A2540] hover:text-[#D4AF37] transition-colors py-2 px-6 rounded-xl border-2 border-transparent hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/5">
                <Printer className="w-4 h-4" /> طباعة الكارنيه
            </button>
        </div>
      </div>
    </div>
  );
}
