import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signSessionToken, COOKIE_NAME, type SessionPayload } from "@/lib/auth";
import bcrypt from "bcryptjs";

function isStaffRole(role: string): role is Exclude<SessionPayload["role"], "PATIENT"> {
  return ["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"].includes(role);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    const identifier = email.trim().toLowerCase();

    // 1. أولاً: البحث في جدول الموظفين والأدمن (User)
    const { data: staffUser, error: staffError } = await supabase
      .from("User")
      .select("*, branch:Branch(*), doctor:Doctor(id)")
      .eq("email", identifier)
      .maybeSingle();
    if (staffError) throw staffError;

    if (staffUser) {
      if (!isStaffRole(staffUser.role)) {
        throw new Error("The staff account has an unsupported role");
      }

      let passwordMatches = false;
      try {
        passwordMatches = await bcrypt.compare(password, staffUser.password);
      } catch {
        passwordMatches = false;
      }

      const legacyPassword = !passwordMatches &&
        !staffUser.password.startsWith("$2") &&
        staffUser.password === password;
      if (legacyPassword) {
        passwordMatches = true;
      }

      if (!passwordMatches) {
        return NextResponse.json(
          { success: false, message: "بيانات تسجيل الدخول غير صحيحة" },
          { status: 401 }
        );
      }

      if (legacyPassword) {
        const { error: passwordUpdateError } = await supabase
          .from("User")
          .update({
            password: await bcrypt.hash(password, 12),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", staffUser.id);
        if (passwordUpdateError) throw passwordUpdateError;
      }

      const token = await signSessionToken({
        userId: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        branchId: staffUser.branchId,
        branchName: staffUser.branch?.name || null,
        doctorId: staffUser.doctorId,
      });

      const response = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح كمسؤول نظام",
        redirectUrl: "/admin",
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          role: staffUser.role,
          branchId: staffUser.branchId,
          branchName: staffUser.branch?.name || null,
          doctorId: staffUser.doctorId,
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    // 2. ثانياً: البحث في جدول المرضى والعملاء (Patient) بالهاتف أو البريد
    const { data: patientByPhone, error: phoneError } = await supabase
      .from("Patient")
      .select("*")
      .eq("phone", identifier)
      .maybeSingle();
    if (phoneError) throw phoneError;
    const { data: patientByEmail, error: emailError } = patientByPhone
      ? { data: null, error: null }
      : await supabase
          .from("Patient")
          .select("*")
          .eq("email", identifier)
          .maybeSingle();
    if (emailError) throw emailError;
    const patientUser = patientByPhone ?? patientByEmail;

    if (patientUser) {
      let passwordMatches = false;
      if (patientUser.password) {
        try {
          passwordMatches = await bcrypt.compare(password, patientUser.password);
        } catch {
          passwordMatches = false;
        }
        const legacyPassword = !passwordMatches &&
          !patientUser.password.startsWith("$2") &&
          patientUser.password === password;
        if (legacyPassword) {
          passwordMatches = true;
          const { error: passwordUpdateError } = await supabase
            .from("Patient")
            .update({
              password: await bcrypt.hash(password, 12),
              updatedAt: new Date().toISOString(),
            })
            .eq("id", patientUser.id);
          if (passwordUpdateError) throw passwordUpdateError;
        }
      }

      if (!passwordMatches) {
        return NextResponse.json(
          { success: false, message: "بيانات تسجيل الدخول غير صحيحة" },
          { status: 401 }
        );
      }

      const token = await signSessionToken({
        userId: patientUser.id,
        name: patientUser.fullName,
        email: patientUser.email,
        phone: patientUser.phone,
        role: "PATIENT",
      });

      const response = NextResponse.json({
        success: true,
        message: `أهلاً بك يا ${patientUser.fullName}`,
        redirectUrl: "/patient",
        user: {
          id: patientUser.id,
          name: patientUser.fullName,
          phone: patientUser.phone,
          role: "PATIENT",
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    // إذا لم يتطابق في جدول المستخدمين ولا جدول المرضى
    return NextResponse.json(
      { success: false, message: "بيانات تسجيل الدخول غير صحيحة" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
