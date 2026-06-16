"use client";

import { Home, QrCode, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "الرئيسية", href: "/student", icon: Home },
    { name: "المحفظة", href: "/student/wallet", icon: Wallet },
    { name: "مسح QR", href: "/student/scan", icon: QrCode },
    { name: "حسابي", href: "/student/profile", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0" dir="rtl">
      {/* Mobile-focused main content */}
      <main className="flex-1 overflow-y-auto max-w-md w-full mx-auto md:border-x md:border-gray-200 bg-white relative shadow-2xl shadow-gray-200 lg:my-8 lg:rounded-[2.5rem] lg:overflow-hidden lg:max-h-[850px]">
        {children}
        
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-between z-50 md:sticky lg:border-t-0 lg:shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           {navItems.map((item) => {
             const isActive = pathname === item.href;
             const Icon = item.icon;
             return (
               <Link 
                 key={item.href} 
                 href={item.href}
                 className={`flex flex-col items-center gap-1 p-2 transition-all ${isActive ? "text-[#0A2540] -translate-y-1" : "text-gray-400 hover:text-gray-600"}`}
               >
                 <div className={`relative ${isActive ? "bg-[#0A2540]/5 p-2 rounded-xl" : "p-2"}`}>
                    <Icon className={`w-6 h-6 ${isActive ? "text-[#0A2540]" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>}
                 </div>
                 <span className="text-[10px] font-bold">{item.name}</span>
               </Link>
             )
           })}
        </nav>
      </main>
    </div>
  );
}
