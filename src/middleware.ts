// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const prefixes = ["/dashboard/admin", "/dashboard/student", "/dashboard/teacher"];
  const protectedPrefix = prefixes.find((p) => pathname.startsWith(p));

  const hasCookie = !!request.cookies.get("better-auth.session_token");
  if (!hasCookie) {
    if (protectedPrefix) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  const res = await fetch(`${origin}/api/auth/get-session`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  if (!res.ok) {
    if (protectedPrefix) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  const data = await res.json().catch(() => null);
  const user = (data && (data.user || data.session?.user)) || null;
  const role = Array.isArray(user?.roles) ? user.roles[0] : user?.role || "student";

  const allowed: Record<string, string[]> = {
    "/dashboard/admin": ["admin"],
    "/dashboard/teacher": ["teacher"],
    "/dashboard/student": ["student"],
  };

  const roleHome: Record<string, string> = {
    admin: "/dashboard/admin",
    teacher: "/dashboard/teacher",
    student: "/dashboard/student",
  };

  const rolePrefix = role === "admin" ? "/dashboard/admin" : role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";

  // sin gating de onboarding

  if (!pathname.startsWith(rolePrefix)) {
    return NextResponse.redirect(new URL(roleHome[role] || "/signin", request.url));
  }

  if (protectedPrefix && !allowed[protectedPrefix].includes(role)) {
    const target = roleHome[role] || "/signin";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signin", "/signup", "/dashboard/admin/:path*", "/dashboard/student/:path*", "/dashboard/teacher/:path*"],
};