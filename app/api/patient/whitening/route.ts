import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";
import { isCurrentOffer, isTeethWhiteningService } from "@/lib/whitening";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "PATIENT") {
    return NextResponse.json(
      { success: false, message: "سجل الدخول لعرض خدمات التبييض المتاحة." },
      { status: 401 }
    );
  }

  try {
    const { data: records, error: serviceError } = await supabase
      .from("Service")
      .select("id, name, description, category, price")
      .eq("isActive", true)
      .order("name", { ascending: true });
    if (serviceError) throw serviceError;

    const services = (records ?? []).filter(isTeethWhiteningService);
    const serviceIds = services.map((service) => service.id);
    let offers: {
      id: string;
      title: string;
      description: string | null;
      originalPrice: number | null;
      discountPrice: number;
      startDate: string | null;
      endDate: string | null;
      serviceId: string;
    }[] = [];

    if (serviceIds.length > 0) {
      const { data: offerRecords, error: offerError } = await supabase
        .from("Offer")
        .select("id, title, description, originalPrice, discountPrice, startDate, endDate, serviceId")
        .eq("isActive", true)
        .in("serviceId", serviceIds)
        .order("displayOrder", { ascending: true });
      if (offerError) throw offerError;

      const now = new Date();
      offers = (offerRecords ?? []).filter((offer) =>
        isCurrentOffer(offer, now)
      ) as typeof offers;
    }

    return NextResponse.json({ success: true, services, offers });
  } catch (error) {
    console.error("Failed to load patient whitening services:", error);
    return NextResponse.json(
      { success: false, message: "تعذر تحميل خدمات التبييض المتاحة." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "PATIENT") {
    return NextResponse.json(
      { success: false, message: "سجل الدخول لإرسال طلب تبييض الأسنان." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "بيانات طلب التبييض غير صالحة." },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, message: "بيانات طلب التبييض غير صالحة." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const branchId = typeof input.branchId === "string" ? input.branchId : "";
  const serviceId = typeof input.serviceId === "string" ? input.serviceId : "";
  const offerId = typeof input.offerId === "string" ? input.offerId : "";
  if (!branchId || Boolean(serviceId) === Boolean(offerId)) {
    return NextResponse.json(
      { success: false, message: "اختر الفرع وخدمة التبييض أو عرضاً واحداً." },
      { status: 400 }
    );
  }

  try {
    const { data: branch, error: branchError } = await supabase
      .from("Branch")
      .select("id, name")
      .eq("id", branchId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (branchError) throw branchError;
    if (!branch) {
      return NextResponse.json(
        { success: false, message: "الفرع المحدد غير متاح حالياً." },
        { status: 400 }
      );
    }

    const now = new Date();
    let selectedOffer: {
      id: string;
      title: string;
      discountPrice: number;
      serviceId: string;
      startDate: string | null;
      endDate: string | null;
    } | undefined;
    let selectedService: {
      id: string;
      name: string;
      category: string | null;
      price: number;
    } | null = null;

    if (offerId) {
      const { data: offer, error: offerError } = await supabase
        .from("Offer")
        .select("id, title, discountPrice, serviceId, startDate, endDate")
        .eq("id", offerId)
        .eq("isActive", true)
        .maybeSingle();
      if (offerError) throw offerError;
      if (!offer?.serviceId || !isCurrentOffer(offer, now)) {
        return NextResponse.json(
          { success: false, message: "هذا العرض لم يعد متاحاً. حدّث الصفحة واختر عرضاً آخر." },
          { status: 400 }
        );
      }
      selectedOffer = {
        id: offer.id,
        title: offer.title,
        discountPrice: offer.discountPrice,
        serviceId: offer.serviceId,
        startDate: offer.startDate,
        endDate: offer.endDate,
      };

      const { data: service, error: serviceError } = await supabase
        .from("Service")
        .select("id, name, category, price")
        .eq("id", offer.serviceId)
        .eq("isActive", true)
        .maybeSingle();
      if (serviceError) throw serviceError;
      if (!service || !isTeethWhiteningService(service)) {
        return NextResponse.json(
          { success: false, message: "هذا العرض غير مرتبط بخدمة تبييض متاحة." },
          { status: 400 }
        );
      }
      selectedService = service;
    } else {
      const { data: service, error: serviceError } = await supabase
        .from("Service")
        .select("id, name, category, price")
        .eq("id", serviceId)
        .eq("isActive", true)
        .maybeSingle();
      if (serviceError) throw serviceError;
      if (!service || !isTeethWhiteningService(service)) {
        return NextResponse.json(
          { success: false, message: "خدمة التبييض المحددة غير متاحة." },
          { status: 400 }
        );
      }
      selectedService = service;

      const { data: activeOffers, error: offerError } = await supabase
        .from("Offer")
        .select("id, title, startDate, endDate")
        .eq("serviceId", serviceId)
        .eq("isActive", true);
      if (offerError) throw offerError;
      const currentOffer = (activeOffers ?? []).find((offer) => isCurrentOffer(offer, now));
      if (currentOffer) {
        return NextResponse.json(
          {
            success: false,
            message: `يوجد عرض ساري «${currentOffer.title}». اختر العرض بدلاً من السعر الأساسي.`,
          },
          { status: 409 }
        );
      }
    }

    if (!selectedService) {
      throw new Error("Whitening service was not resolved for the request");
    }
    const bookingType = selectedOffer ? "OFFER" : "SERVICE";
    const bookingTitle = selectedOffer?.title ?? selectedService.name;
    const bookingPrice = selectedOffer?.discountPrice ?? selectedService.price;
    const createdAt = now.toISOString();
    const { data: appointment, error: appointmentError } = await supabase
      .from("Appointment")
      .insert({
        id: createRecordId(),
        updatedAt: createdAt,
        branchId,
        patientId: session.userId,
        serviceId: selectedService.id,
        offerId: selectedOffer?.id ?? null,
        offerTitle: selectedOffer?.title ?? null,
        offerPrice: selectedOffer?.discountPrice ?? null,
        bookingType,
        bookingTitle,
        bookingPrice,
        appointmentDate: createdAt,
        status: "PENDING",
        noteType: "INQUIRY",
        patientComplaint: "طلب جلسة تبييض الأسنان من تطبيق المريض.",
      })
      .select("id, appointmentDate, bookingTitle, bookingPrice, bookingType, status, branch:Branch(name)")
      .single();
    if (appointmentError) throw appointmentError;

    return NextResponse.json(
      {
        success: true,
        message: selectedOffer
          ? `تم استلام طلبك باستخدام عرض «${selectedOffer.title}» بسعر ${bookingPrice.toLocaleString("ar-EG")} ج.م. سيتواصل معك الفرع لتأكيد الموعد.`
          : "تم استلام طلب التبييض بالسعر الأساسي. سيتواصل معك الفرع لتأكيد الموعد.",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit patient whitening request:", error);
    return NextResponse.json(
      { success: false, message: "تعذر إرسال طلب التبييض حالياً. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
