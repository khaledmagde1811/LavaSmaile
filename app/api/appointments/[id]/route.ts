import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: "يرجى تحديد الحالة الجديدة" },
        { status: 400 }
      );
    }

    const updated = await db.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        branch: true,
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة الحجز إلى ${status}`,
      appointment: updated,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث الحجز" },
      { status: 500 }
    );
  }
}
