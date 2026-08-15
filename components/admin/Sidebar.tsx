"use client";

import Link from "next/link";
import {
  Bell,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  Network,
  Vault,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthContext";

type NavGroup = "core" | "finance" | "management" | "content";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Shield;
  permission: string;
  group: NavGroup;
  masterOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: "غرفة العمليات الشاملة", href: "/admin", icon: LayoutDashboard, permission: "control-room", group: "core" },
  { name: "إدارة الطلاب", href: "/admin/users", icon: Users, permission: "students", group: "core" },
  { name: "الحضور الذكي", href: "/admin/attendance", icon: UserCheck, permission: "attendance", group: "core" },
  { name: "المحفظة والماليات", href: "/admin/wallet", icon: Wallet, permission: "wallet", group: "finance" },
  { name: "شحن المحفظة", href: "/admin/wallet/topup", icon: Wallet, permission: "wallet", group: "finance" },
  { name: "تقفيل اليومية", href: "/admin/wallet/daily-close", icon: Wallet, permission: "wallet", group: "finance", masterOnly: true },
  { name: "إدارة الموظفين", href: "/admin/staff", icon: UserPlus, permission: "staff", group: "management" },
  { name: "إدارة المدرسين", href: "/admin/teachers", icon: GraduationCap, permission: "manage_teachers", group: "management" },
  { name: "تخصيص المواد", href: "/admin/teacher-groups", icon: Network, permission: "manage_teachers", group: "management" },
  { name: "غرفة العمليات", href: "/admin/operations", icon: Eye, permission: "operations", group: "management" },
  { name: "الخزنة", href: "/admin/vault", icon: Vault, permission: "vault", group: "management", masterOnly: true },
  { name: "إدارة المحتوى", href: "/admin/content", icon: FileText, permission: "content", group: "content", masterOnly: true },
  { name: "مركز الإشعارات", href: "/admin/notifications", icon: Bell, permission: "notifications", group: "content", masterOnly: true },
];

const groupLabels: Record<NavGroup, string> = {
  core: "الأساسيات",
  finance: "الماليات",
  management: "الإدارة",
  content: "المحتوى",
};

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

  const isMasterAdmin = user.role === "master_admin" || user.permissions.includes("*");
  const visibleItems = navItems.filter((item) => {
    if (item.masterOnly) return isMasterAdmin;
    if (isMasterAdmin) return true;
    return user.permissions.includes(item.permission);
  });

  const groupedItems = (Object.keys(groupLabels) as NavGroup[])
    .map((group) => ({
      key: group,
      title: groupLabels[group],
      items: visibleItems.filter((item) => item.group === group),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "bg-[#0A2540] text-white flex flex-col min-h-screen shrink-0 relative overflow-hidden transition-all duration-300 z-50",
        "w-60 fixed inset-y-0 right-0 lg:static lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "translate-x-full",
      )}
    >
      <div className="pointer-events-none absolute top-[-5%] right-[-20%] h-48 w-48 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex h-14 shrink-0 flex-col items-center justify-center gap-1 border-b border-white/10 px-3 lg:h-24 lg:gap-2">
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-lg font-black tracking-tighter text-[#D4AF37] lg:text-2xl">
          Vision Center
        </div>
        <div className="rounded-full border border-white/5 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 lg:text-xs">
          {user.name} ({user.role === "master_admin" ? "المدير" : "موظف"})
        </div>
      </div>

      <nav className="z-10 flex-1 overflow-y-auto p-3 pt-5 font-sans font-bold lg:p-4 lg:pt-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {isMasterAdmin ? "MASTER ADMIN" : "STAFF ACCESS"}
        </p>

        <div className="space-y-4">
          {groupedItems.map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="px-3 text-[11px] font-black uppercase tracking-[0.3em] text-white/30">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 lg:px-4 lg:py-3 lg:text-base",
                        isActive
                          ? "bg-[#D4AF37] text-[#0A2540] shadow-lg shadow-[#D4AF37]/20 font-black translate-x-1"
                          : "text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-1",
                      )}
                    >
                      <Icon className={cn("shrink-0 transition-transform", isActive ? "h-5 w-5 scale-110" : "h-5 w-5")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="z-10 shrink-0 border-t border-white/10 p-3 lg:p-4">
        <button
          onClick={logout}
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-300 transition-all hover:bg-red-500/10 hover:text-red-400 lg:px-4 lg:py-3 lg:text-base"
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
