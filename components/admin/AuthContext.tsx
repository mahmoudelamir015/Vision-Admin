"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { closeRegistrationIfPastDeadline } from "@/src/lib/supabase/system-settings";
import { getSupabaseClient } from "@/src/lib/supabase/index";

type User = {
  id: string;
  name: string;
  phone: string;
  role: "master_admin" | "staff";
  permissions: string[];
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        await closeRegistrationIfPastDeadline();

        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!isMounted) return;

        if (!response.ok) {
          setUser(null);
          return;
        }

        const result = (await response.json()) as { profile?: User };
        setUser(result.profile ?? null);
      } catch (error) {
        console.error("Failed to load admin session", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }

    if (user && pathname === "/admin/login") {
      router.replace(user.role === "master_admin" ? "/admin" : "/admin/attendance");
      return;
    }

    if (user?.role === "staff" && pathname === "/admin") {
      router.replace("/admin/attendance");
    }
  }, [isLoading, pathname, router, user]);

  const logout = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    router.replace("/admin/login");
  };

  if (isLoading) return null;

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
