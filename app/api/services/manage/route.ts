import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإدارة الخدمات" },
      { status: 403 }
    );
  }

  try {
    const { data: services, error } = await supabase
      .from("Service")
      .select("*")
      .order("price", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services for management:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب قائمة الخدمات" },
      { status: 500 }
    );
  }
}
