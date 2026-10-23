import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بتعديل بيانات المستخدمين" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, branchId, password } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (role) dataToUpdate.role = role;
    if (branchId !== undefined) dataToUpdate.branchId = branchId || null;
    if (password && password.trim()) {
      dataToUpdate.password = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: dataToUpdate,
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المستخدم وصلاحياته بنجاح",
      user: updated,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث المستخدم" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بحذف المستخدمين" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // منع الأدمن من حذف حسابه الشخصي الذي سجل الدخول به
    if (id === session.userId) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك حذف حسابك الشخصي المتصل به حالياً!" },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف المستخدم بنجاح من النظام",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "فشل حذف المستخدم" },
      { status: 500 }
    );
  }
}
