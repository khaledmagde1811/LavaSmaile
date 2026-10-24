import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "بيانات الطلب غير صالحة" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "بيانات التسجيل غير صالحة" },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const secondaryPhone =
    typeof input.secondaryPhone === "string" ? input.secondaryPhone.trim() : "";
  const email =
    typeof input.email === "string" && input.email.trim()
      ? input.email.trim().toLowerCase()
      : null;
  const password = typeof input.password === "string" ? input.password : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";

  if (!fullName || !phone || !password) {
    return NextResponse.json(
      { success: false, message: "الاسم ورقم الهاتف وكلمة المرور حقول مطلوبة" },
      { status: 400 }
    );
  }
  if (fullName.length > 120 || phone.length > 32 || password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { success: false, message: "تحقق من الاسم ورقم الهاتف، واجعل كلمة المرور 8 أحرف على الأقل" },
      { status: 400 }
    );
  }
  if (
    secondaryPhone.length > 32 ||
    address.length > 500 ||
    (email !== null && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  ) {
    return NextResponse.json(
      { success: false, message: "تحقق من صحة البريد الإلكتروني والبيانات الاختيارية" },
      { status: 400 }
    );
  }

  try {
    const { data: existingPhone, error: phoneError } = await supabase
      .from("Patient")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    if (phoneError) throw phoneError;
    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: "رقم الهاتف مسجل مسبقاً. سجل الدخول أو استخدم رقماً آخر." },
        { status: 409 }
      );
    }

    if (email) {
      const { data: existingEmail, error: emailError } = await supabase
        .from("Patient")
        .select("id")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (emailError) throw emailError;
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: "البريد الإلكتروني مسجل مسبقاً." },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const { data: patient, error: insertError } = await supabase
      .from("Patient")
      .insert({
        id: createRecordId(),
        fullName,
        phone,
        secondaryPhone: secondaryPhone || null,
        email,
        password: passwordHash,
        address: address || null,
        updatedAt: now,
      })
      .select("id, fullName, phone, email")
      .single();
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { success: false, message: "رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً." },
          { status: 409 }
        );
      }
      throw insertError;
    }

    const token = await signSessionToken({
      userId: patient.id,
      name: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      role: "PATIENT",
    });
    const response = NextResponse.json({
      success: true,
      message: "تم إنشاء حسابك بنجاح",
      redirectUrl: "/patient",
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Patient registration error:", error);
    return NextResponse.json(
      { success: false, message: "تعذر إنشاء الحساب حالياً. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
