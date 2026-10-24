import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getSessionSecret } from "@/lib/session-secret";

export const COOKIE_NAME = "lava_auth_token";

export interface SessionPayload {
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";
  branchId?: string | null;
  branchName?: string | null;
  doctorId?: string | null;
}

/**
 * إنشاء وتوقيع رمز JWT للجلسة
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

/**
 * فحص وصحة رمز JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.userId !== "string" ||
      typeof payload.name !== "string" ||
      !["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(
        String(payload.role)
      )
    ) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * استخراج الجلسة الحالية من ملفات تعريف الارتباط
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenSession = await verifySessionToken(token);
  if (!tokenSession) return null;

  if (tokenSession.role === "PATIENT") {
    const { data: patient, error } = await supabase
      .from("Patient")
      .select("id, fullName, email, phone")
      .eq("id", tokenSession.userId)
      .maybeSingle();
    if (error) throw error;
    if (!patient) return null;
    return {
      ...tokenSession,
      name: patient.fullName,
      email: patient.email,
      phone: patient.phone,
    };
  }

  const { data: user, error } = await supabase
    .from("User")
    .select("id, name, email, role, branchId, doctorId, branch:Branch(name)")
    .eq("id", tokenSession.userId)
    .maybeSingle();
  if (error) throw error;
  if (
    !user ||
    user.role !== tokenSession.role ||
    (user.branchId ?? null) !== (tokenSession.branchId ?? null) ||
    (user.doctorId ?? null) !== (tokenSession.doctorId ?? null)
  ) {
    return null;
  }

  return {
    ...tokenSession,
    name: user.name,
    email: user.email,
    branchId: user.branchId,
    branchName: user.branch?.name ?? null,
    doctorId: user.doctorId,
  };
}
