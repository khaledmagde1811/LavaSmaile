import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بتعديل الفروع" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, city, address, phone, workingHours, mapUrl, status } = body;

    const updated = await db.branch.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(city && { city: city.trim() }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(workingHours && { workingHours: workingHours.trim() }),
        ...(mapUrl !== undefined && { mapUrl: mapUrl ? mapUrl.trim() : null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات الفرع بنجاح",
      branch: updated,
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث بيانات الفرع" },
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
        { success: false, message: "غير مصرح لك بحذف الفروع" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // حذف الفرع
    await db.branch.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف الفرع بنجاح",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { success: false, message: "فشل حذف الفرع، قد يكون مرتبطاً ببيانات أخرى" },
      { status: 500 }
    );
  }
}
