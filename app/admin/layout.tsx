"use client";

export const dynamic = "force-dynamic";

import Sidebar from "@/components/admin/Sidebar";
import { AuthProvider } from "@/components/admin/AuthContext";
import { closeRegistrationIfPastDeadline } from "@/src/lib/supabase/system-settings";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

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
      <div className="flex min-h-screen overflow-x-hidden bg-[#F7F2E8] dir-rtl" dir="rtl">
        {!isLogin ? <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} /> : null}
        <main className={`flex h-screen flex-1 flex-col overflow-hidden ${isLogin ? "bg-[#F7F2E8]" : ""}`}>
          {!isLogin ? (
            <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:h-16 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <h2 className="text-lg font-bold text-[#0A2540] sm:text-xl">لوحة التحكم</h2>
              </div>
            </header>
          ) : null}

          <div className={`flex-1 overflow-y-auto ${isLogin ? "" : "p-3 sm:p-5 lg:p-6"}`}>{children}</div>

          {!isLogin && isMobileMenuOpen ? (
            <div
              className="fixed inset-0 z-40 bg-[#0A2540]/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ) : null}
        </main>
      </div>
    </AuthProvider>
  );
}
