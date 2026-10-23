import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: { price: "desc" },
    });

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب قائمة الخدمات" },
      { status: 500 }
    );
  }
}
