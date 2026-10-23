import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";

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
    const staffUser = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
        ],
      },
      include: {
        branch: true,
      },
    });

    if (staffUser) {
      let passwordMatches = false;
      try {
        passwordMatches = await bcrypt.compare(password, staffUser.password);
      } catch {
        passwordMatches = false;
      }

      if (!passwordMatches && staffUser.password === password) {
        passwordMatches = true;
      }

      if (!passwordMatches) {
        return NextResponse.json(
          { success: false, message: "بيانات تسجيل الدخول غير صحيحة" },
          { status: 401 }
        );
      }

      const token = await signSessionToken({
        userId: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role as any,
        branchId: staffUser.branchId,
        branchName: staffUser.branch?.name || null,
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
    const patientUser = await db.patient.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
    });

    if (patientUser) {
      let passwordMatches = false;
      if (patientUser.password) {
        try {
          passwordMatches = await bcrypt.compare(password, patientUser.password);
        } catch {
          passwordMatches = false;
        }
        if (!passwordMatches && patientUser.password === password) {
          passwordMatches = true;
        }
      } else {
        // إذا لم يكن العميل قد عيّن كلمة مرور بعد -> افتراضياً كلمة مروره هي رقم هاتفه أو "patient123"
        if (password === patientUser.phone || password === "patient123") {
          passwordMatches = true;
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
