import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const updated = await db.followUp.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
      },
      include: {
        patient: true,
        branch: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة المتابعة بنجاح",
      followUp: updated,
    });
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث حالة المتابعة" },
      { status: 500 }
    );
  }
}
