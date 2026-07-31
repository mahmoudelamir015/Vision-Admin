import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AdminProfile = { role: "master_admin" | "staff"; permissions: string[] | null };

function canAccess(pathname: string, profile: AdminProfile) {
  if (profile.role === "master_admin") return true;
  const permissions = new Set(profile.permissions ?? []);
  if (pathname.startsWith("/admin/attendance")) return permissions.has("attendance");
  if (pathname.startsWith("/admin/wallet")) return permissions.has("wallet");
  if (pathname.startsWith("/admin/operations")) return permissions.has("operations");
  return false;
}

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return isLogin ? response : NextResponse.redirect(new URL("/admin/login", request.url));
  const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, {
          ...(options as CookieOptions), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
        }));
      },
    },
  });

  const { data: authUser } = await supabase.auth.getUser();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims ?? null;

  const signedInEmail = authUser.user?.email?.trim().toLowerCase() ?? "";
  const isMasterAdminByEmail = Boolean(masterAdminEmail && signedInEmail === masterAdminEmail);
  if (!claims?.sub) return isLogin ? response : NextResponse.redirect(new URL("/admin/login", request.url));

  if (isMasterAdminByEmail) {
    if (isLogin) return NextResponse.redirect(new URL("/admin", request.url));
    return response;
  }

  const { data } = await supabase.from("users").select("role, permissions").eq("auth_user_id", claims.sub).maybeSingle();
  const profile = data as AdminProfile | null;
  if (!profile || (profile.role !== "master_admin" && profile.role !== "staff")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (isLogin) return NextResponse.redirect(new URL(profile.role === "master_admin" ? "/admin" : "/admin/attendance", request.url));
  if (!canAccess(request.nextUrl.pathname, profile)) return NextResponse.redirect(new URL("/admin/attendance", request.url));
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
