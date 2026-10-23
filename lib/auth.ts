import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "lava_smile_super_secure_secret_key_clinic_2026_jwt"
);

export const COOKIE_NAME = "lava_auth_token";

export interface SessionPayload {
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";
  branchId?: string | null;
  branchName?: string | null;
}

/**
 * إنشاء وتوقيع رمز JWT للجلسة
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * فحص وصحة رمز JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * استخراج الجلسة الحالية من ملفات تعريف الارتباط
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
