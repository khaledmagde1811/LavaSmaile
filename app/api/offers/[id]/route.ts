import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validateOfferInput, type OfferValues } from "@/lib/offers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتعديل العروض" },
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
      .from("Offer")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "العرض غير موجود" },
        { status: 404 }
      );
    }

    const currentValues: OfferValues = {
      title: existing.title,
      description: existing.description,
      imageUrl: existing.imageUrl,
      originalPrice: existing.originalPrice,
      discountPrice: existing.discountPrice,
      startDate: existing.startDate ? new Date(existing.startDate) : null,
      endDate: existing.endDate ? new Date(existing.endDate) : null,
      isActive: existing.isActive,
      showOnHome: existing.showOnHome,
      displayOrder: existing.displayOrder,
      serviceId: existing.serviceId,
    };
    const validation = validateOfferInput(body, currentValues);
    if ("error" in validation) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    if (validation.values.serviceId) {
      const { data: service, error: serviceError } = await supabase
        .from("Service")
        .select("id")
        .eq("id", validation.values.serviceId)
        .maybeSingle();
      if (serviceError) throw serviceError;
      if (!service) {
        return NextResponse.json(
          { success: false, message: "الخدمة المرتبطة بالعرض غير موجودة" },
          { status: 400 }
        );
      }
    }

    const { data: offer, error } = await supabase
      .from("Offer")
      .update({
        ...validation.values,
        startDate: validation.values.startDate?.toISOString() ?? null,
        endDate: validation.values.endDate?.toISOString() ?? null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { success: false, message: "فشل في تحديث العرض" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بحذف العروض" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("Offer")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) {
      return NextResponse.json(
        { success: false, message: "العرض غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { success: false, message: "فشل في حذف العرض" },
      { status: 500 }
    );
  }
}
