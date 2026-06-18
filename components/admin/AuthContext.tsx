"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdminProfileByPhone, getCurrentAdminProfile, type AdminProfile } from "@/src/lib/supabase/auth";
import { getSupabaseClient } from "@/src/lib/supabase";
import { clearAdminSession, readStoredAdminSession } from "@/src/lib/admin-session";

type User = AdminProfile;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredAdminSession());
  const [isLoading, setIsLoading] = useState(() => {
    const storedSession = readStoredAdminSession();
    return !storedSession && Boolean(getSupabaseClient());
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const storedSession = readStoredAdminSession();
    if (storedSession) {
      return undefined;
    }

    const client = getSupabaseClient();

    if (!client) {
      return undefined;
    }

    const applyProfile = async () => {
      try {
        const profile = await getCurrentAdminProfile();

        if (!isMounted) return;
        setUser(profile);
      } catch (error) {
        console.error("Failed to load admin session", error);

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void applyProfile();

    const { data } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const phone = session?.user.phone;
      if (!phone) {
        setUser(null);
        return;
      }

      const profile = await fetchAdminProfileByPhone(phone);
      if (!isMounted) return;

      if (!profile) {
        setUser(null);
        void client.auth.signOut();
        return;
      }

      setUser(profile);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
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
    const client = getSupabaseClient();

    setUser(null);
    clearAdminSession();

    if (client) {
      await client.auth.signOut();
    }

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
