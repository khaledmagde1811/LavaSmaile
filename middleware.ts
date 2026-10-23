import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "lava_smile_super_secure_secret_key_clinic_2026_jwt"
);

const COOKIE_NAME = "lava_auth_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isAuthenticated = false;
  let userPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
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
