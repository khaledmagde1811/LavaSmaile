import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";


export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "BRANCH_ADMIN" && session.role !== "RECEPTIONIST")) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { fullName: { contains: q } },
        { phone: { contains: q } },
        { nationalId: { contains: q } },
      ];
    }

    const patients = await db.patient.findMany({
      where: whereClause,
      include: {
        appointments: {
          include: {
            branch: true,
            service: true,
            doctor: true,
          },
          orderBy: { appointmentDate: "desc" },
        },
        followUps: {
          include: {
            branch: true,
          },
          orderBy: { scheduledDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { success: false, message: "فشل استرجاع سجلات المرضى" },
      { status: 500 }
    );
  }
}
