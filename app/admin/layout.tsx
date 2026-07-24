"use client";

export const dynamic = "force-dynamic";

import Sidebar from "@/components/admin/Sidebar";
import { AuthProvider } from "@/components/admin/AuthContext";
import { closeRegistrationIfPastDeadline } from "@/src/lib/supabase/system-settings";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    void closeRegistrationIfPastDeadline();
  }, []);

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#F7F2E8] dir-rtl" dir="rtl">
        {!isLogin && (
          <Sidebar 
            isMobileMenuOpen={isMobileMenuOpen} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
          />
        )}
        <main className={`flex-1 flex flex-col h-screen overflow-hidden ${isLogin ? 'bg-[#F7F2E8]' : ''}`}>
          {!isLogin && (
             <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-20 relative">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setIsMobileMenuOpen(true)}
                   className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                 >
                   <Menu className="w-6 h-6" />
                 </button>
                 <h2 className="text-xl font-bold text-[#0A2540]">لوحة التحكم</h2>
               </div>
             </header>
          )}
          <div className={`flex-1 overflow-y-auto ${isLogin ? '' : 'p-4 sm:p-6'}`}>
            {children}
          </div>
          
          {/* Mobile Overlay */}
          {!isLogin && isMobileMenuOpen && (
            <div 
               className="fixed inset-0 bg-[#0A2540]/50 backdrop-blur-sm z-40 lg:hidden"
               onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </main>
      </div>
    </AuthProvider>
  );
}
