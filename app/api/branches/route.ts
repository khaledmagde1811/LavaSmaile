import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      where: { status: "ACTIVE" },
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            specialty: true,
            workingDays: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            doctors: true,
            followUps: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب قائمة الفروع" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // التحقق من صلاحية الأدمن
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بإضافة فروع جديدة (مطلوب صلاحية المدير العام)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, city, address, phone, workingHours, mapUrl } = body;

    if (!name || !city || !address || !phone) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع الحقول الإلزامية للفرع" },
        { status: 400 }
      );
    }

    const branch = await db.branch.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        workingHours: workingHours?.trim() || "10:00 ص - 10:00 م",
        mapUrl: mapUrl?.trim() || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "تمت إضافة الفرع الجديد بنجاح",
      branch,
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إضافة الفرع" },
      { status: 500 }
    );
  }
}
