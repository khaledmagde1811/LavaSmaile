import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { getSessionSecret } from "@/lib/session-secret";

const COOKIE_NAME = "lava_auth_token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = getSessionSecret();

  let isAuthenticated = false;
  let userPayload: (JWTPayload & { role?: string }) | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = true;
      userPayload = payload;
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. حماية مسارات الإدارة (/admin) -> للموظفين والإدارة فقط
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // إذا كان مريضاً يحاول فتح الداشبورد
    if (userPayload?.role === "PATIENT") {
      return NextResponse.redirect(new URL("/patient", request.url));
    }
  }

  // 2. حماية مسارات بوابة المريض (/patient)
  if (pathname.startsWith("/patient")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. إذا كان المستخدم مسجل دخوله وزار صفحة /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      if (userPayload?.role === "PATIENT") {
        return NextResponse.redirect(new URL("/patient", request.url));
      } else {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/patient/:path*", "/login"],
};
