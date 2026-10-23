import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import bcrypt from "bcryptjs";


export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك باستعراض قائمة المستخدمين" },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "فشل استرجاع قائمة المستخدمين" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بإضافة مستخدمين جدد (مطلوب صلاحية المدير العام)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, branchId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور، والصلاحية)" },
        { status: 400 }
      );
    }

    // التحقق من تكرار البريد
    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور بـ Bcrypt
    const hashedPassword = bcrypt.hashSync(password.trim(), 10);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        branchId: branchId || null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم إنشاء حساب المستخدم بنجاح وتعيين صلاحياته",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branch: user.branch,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "فشل إنشاء المستخدم" },
      { status: 500 }
    );
  }
}
