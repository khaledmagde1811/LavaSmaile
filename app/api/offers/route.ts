import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";
import { validateOfferInput } from "@/lib/offers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";
    const forBooking = searchParams.get("forBooking") === "true";

    if (includeInactive) {
      const session = await getCurrentSession();
      if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بإدارة العروض" },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    let query = supabase
      .from("Offer")
      .select("*, service:Service(name, isActive)")
      .order("displayOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (!includeInactive) {
      query = query.eq("isActive", true);
      if (!forBooking) query = query.eq("showOnHome", true);
    }
    const { data, error } = await query;
    if (error) throw error;
    const offers = includeInactive
      ? data
      : data.filter((offer) => {
          const startDate = offer.startDate ? new Date(offer.startDate) : null;
          const endDate = offer.endDate ? new Date(offer.endDate) : null;
          const isCurrent = (!startDate || startDate <= now) && (!endDate || endDate >= now);
          const serviceIsAvailable = !forBooking || !offer.serviceId || offer.service?.isActive;
          return isCurrent && serviceIsAvailable;
        });

    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب العروض" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإضافة العروض" },
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

  const validation = validateOfferInput(body);
  if ("error" in validation) {
    return NextResponse.json(
      { success: false, message: validation.error },
      { status: 400 }
    );
  }

  try {
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
      .insert({
        ...validation.values,
        startDate: validation.values.startDate?.toISOString() ?? null,
        endDate: validation.values.endDate?.toISOString() ?? null,
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    const errorCode =
      typeof error === "object" && error !== null && "code" in error &&
      typeof error.code === "string"
        ? error.code
        : null;
    const message =
      errorCode === "42501"
        ? "رفضت صلاحيات Supabase إنشاء العرض. أضف SUPABASE_SERVICE_ROLE_KEY إلى بيئة الخادم، أو راجع سياسة INSERT لجدول Offer."
        : "فشل في إنشاء العرض";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
