"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserRole = "ADMIN" | "STAFF";

interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (code: string, roleRequested?: UserRole) => boolean;
  logout: () => void;
}

const ADMIN_ACCESS_CODE = "500900";
const STAFF_PHONE_REGEX = /^01\d{9}$/;

const defaultPermissions = (role: UserRole) =>
  role === "ADMIN"
    ? [
        "control-room",
        "students",
        "attendance",
        "wallet",
        "staff",
        "vault",
        "content",
        "notifications",
      ]
    : ["attendance", "wallet"];

const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<User> & { role?: string };
  if (candidate.role !== "ADMIN" && candidate.role !== "STAFF") return null;

  return {
    id: typeof candidate.id === "string" ? candidate.id : candidate.role === "ADMIN" ? "1" : "staff",
    name: typeof candidate.name === "string" ? candidate.name : candidate.role === "ADMIN" ? "المدير العام" : "موظف عمليات",
    role: candidate.role,
    phone: typeof candidate.phone === "string" ? candidate.phone : undefined,
    permissions: Array.isArray(candidate.permissions) && candidate.permissions.length > 0 ? candidate.permissions : defaultPermissions(candidate.role),
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("vision_admin_user");
    if (storedUser) {
      try {
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem("vision_admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }

    if (user && pathname === "/admin/login") {
      router.replace(user.role === "ADMIN" ? "/admin" : "/admin/attendance");
    }
  }, [user, isLoading, pathname, router]);

  const login = (code: string, roleRequested?: UserRole) => {
    const normalizedCode = code.trim();

    if (roleRequested === "ADMIN") {
      if (normalizedCode === ADMIN_ACCESS_CODE) {
        const adminUser: User = {
          id: "1",
          name: "المدير العام",
          role: "ADMIN",
          permissions: [
            "control-room",
            "students",
            "attendance",
            "wallet",
            "staff",
            "vault",
            "content",
            "notifications",
          ],
        };

        setUser(adminUser);
        localStorage.setItem("vision_admin_user", JSON.stringify(adminUser));
        router.replace("/admin");
        return true;
      }

      return false;
    }

    if (STAFF_PHONE_REGEX.test(normalizedCode)) {
      const staffUser: User = {
        id: normalizedCode,
        name: "موظف عمليات",
        role: "STAFF",
        phone: normalizedCode,
        permissions: ["attendance", "wallet"],
      };

      setUser(staffUser);
      localStorage.setItem("vision_admin_user", JSON.stringify(staffUser));
      router.replace("/admin/attendance");
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vision_admin_user");
    router.replace("/admin/login");
  };

  if (isLoading) return null;

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
