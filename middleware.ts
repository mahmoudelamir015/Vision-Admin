import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AdminProfile = { role: "master_admin" | "staff"; permissions: string[] | null };

function canAccess(pathname: string, profile: AdminProfile) {
  if (profile.role === "master_admin") return true;
  const permissions = new Set(profile.permissions ?? []);
  if (pathname.startsWith("/admin/attendance")) return permissions.has("attendance");
  if (pathname.startsWith("/admin/wallet")) return permissions.has("wallet");
  if (pathname.startsWith("/admin/operations")) return permissions.has("operations");
  if (pathname.startsWith("/admin/gate")) return permissions.has("gate");
  if (pathname.startsWith("/admin/teacher")) return permissions.has("manage_teachers");
  return false;
}

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const cookieNames = request.cookies.getAll().map(({ name }) => name);
  console.log("[admin-middleware] start", {
    pathname: request.nextUrl.pathname,
    isLogin,
    cookieCount: cookieNames.length,
    cookieNames,
  });
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return isLogin ? response : NextResponse.redirect(new URL("/admin/login", request.url));
  const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...(options as CookieOptions),
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          });
        });
      },
    },
  });

  const { data: authUser, error: authError } = await supabase.auth.getUser();
  const user = authUser.user;
  console.log("[admin-middleware] auth", {
    pathname: request.nextUrl.pathname,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    authError: authError?.message ?? null,
  });

  const signedInEmail = user?.email?.trim().toLowerCase() ?? "";
  const isMasterAdminByEmail = Boolean(masterAdminEmail && signedInEmail === masterAdminEmail);
  
  const applyRedirect = (urlPath: string) => {
    const redirectUrl = new URL(urlPath, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
    setCookieHeaders.forEach((c) => redirectResponse.headers.append("Set-Cookie", c));
    return redirectResponse;
  };

  if (!user) return isLogin ? response : applyRedirect("/admin/login");

  if (isMasterAdminByEmail) {
    if (isLogin) return applyRedirect("/admin");
    return response;
  }

  const { data } = await supabase.from("users").select("role, permissions").eq("auth_user_id", user.id).maybeSingle();
  const profile = data as AdminProfile | null;
  if (!profile || (profile.role !== "master_admin" && profile.role !== "staff")) {
    return applyRedirect("/admin/login");
  }
  if (isLogin) return applyRedirect(profile.role === "master_admin" ? "/admin" : "/admin/attendance");
  if (!canAccess(request.nextUrl.pathname, profile)) return applyRedirect("/admin/attendance");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
