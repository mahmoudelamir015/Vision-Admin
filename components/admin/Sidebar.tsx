"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  LogOut,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  Vault,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission: string;
}

const navItems: NavItem[] = [
  { name: "ط؛ط±ظپط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط´ط§ظ…ظ„ط©", href: "/admin", icon: Shield, permission: "control-room" },
  { name: "ط¥ط¯ط§ط±ط© ط§ظ„ط·ظ„ط§ط¨", href: "/admin/users", icon: Users, permission: "students" },
  { name: "ط§ظ„ط­ط¶ظˆط± ط§ظ„ط°ظƒظٹ", href: "/admin/attendance", icon: UserCheck, permission: "attendance" },
  { name: "ط§ظ„ظ…ط­ظپط¸ط© ظˆط§ظ„ظ…ط§ظ„ظٹط§طھ", href: "/admin/wallet", icon: Wallet, permission: "wallet" },
  { name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†", href: "/admin/staff", icon: UserPlus, permission: "staff" },
  { name: "ط§ظ„ط®ط²ظ†ط©", href: "/admin/vault", icon: Vault, permission: "vault" },
  { name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط­طھظˆظ‰", href: "/admin/content", icon: FileText, permission: "content" },
  { name: "ظ…ط±ظƒط² ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ", href: "/admin/notifications", icon: Bell, permission: "notifications" },
];

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user || pathname === "/admin/login") return null;

  const filteredNavItems = navItems.filter((item) => user.permissions.includes(item.permission));

  return (
    <aside
      className={cn(
        "bg-[#0A2540] text-white flex flex-col min-h-screen shrink-0 relative overflow-hidden transition-all duration-300 z-50",
        "w-64 fixed lg:static lg:translate-x-0 inset-y-0 right-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "translate-x-full",
      )}
    >
      <div className="absolute top-[-5%] right-[-20%] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="h-16 lg:h-28 flex flex-col items-center justify-center border-b border-white/10 gap-1 lg:gap-2 px-4 shrink-0 relative">
        <button
          className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:bg-white/10 rounded-lg"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div className="text-[#D4AF37] font-black text-xl lg:text-2xl tracking-tighter flex items-center gap-2">
          Vision Center
        </div>
        <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] lg:text-xs font-medium text-white/80 border border-white/5">
          {user.name} ({user.role === "master_admin" ? "ط§ظ„ظ…ط¯ظٹط±" : "ظ…ظˆط¸ظپ"})
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 font-sans font-bold overflow-y-auto z-10 pt-6">
        <p className="text-xs text-white/40 mb-4 px-3 uppercase tracking-wider font-semibold">
          {user.role === "master_admin" ? "MASTER ADMIN" : "STAFF ACCESS"}
        </p>

        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-[#D4AF37] text-[#0A2540] shadow-lg shadow-[#D4AF37]/20 font-black translate-x-1"
                  : "text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-1",
              )}
            >
              <Icon className={cn("shrink-0 transition-transform", isActive ? "w-5 h-5 scale-110" : "w-5 h-5")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 z-10 shrink-0">
        <button
          onClick={logout}
          type="button"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold w-full"
        >
          <LogOut className="w-5 h-5" />
          طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
        </button>
      </div>
    </aside>
  );
}

