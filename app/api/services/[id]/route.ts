import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validateServiceInput, type ServiceValues } from "@/lib/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتعديل الخدمات" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "صيغة البيانات غير صالحة" },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const { data: existing, error: existingError } = await supabase
      .from("Service")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "الخدمة غير موجودة" },
        { status: 404 }
      );
    }

    const currentValues: ServiceValues = {
      name: existing.name,
      description: existing.description,
      category: existing.category,
      price: existing.price,
      isActive: existing.isActive,
    };
    const validation = validateServiceInput(body, currentValues);
    if ("error" in validation) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { data: service, error } = await supabase
      .from("Service")
      .update({ ...validation.values, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث الخدمة" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بحذف الخدمات" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("Service")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) {
      return NextResponse.json(
        { success: false, message: "الخدمة غير موجودة" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, message: "فشل حذف الخدمة" },
      { status: 500 }
    );
  }
}
