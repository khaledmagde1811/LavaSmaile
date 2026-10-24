import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
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

    const updates: Database["public"]["Tables"]["Branch"]["Update"] = {};
    if (name) updates.name = name.trim();
    if (city) updates.city = city.trim();
    if (address) updates.address = address.trim();
    if (phone) updates.phone = phone.trim();
    if (workingHours) updates.workingHours = workingHours.trim();
    if (mapUrl !== undefined) updates.mapUrl = mapUrl ? mapUrl.trim() : null;
    if (status) updates.status = status;
    updates.updatedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("Branch")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

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
    const { data, error } = await supabase
      .from("Branch")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) {
      return NextResponse.json(
        { success: false, message: "الفرع غير موجود" },
        { status: 404 }
      );
    }

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
