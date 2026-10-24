import { NextResponse } from "next/server";
import { createRecordId, supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";
import { isCurrentOffer, isTeethWhiteningService } from "@/lib/whitening";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (
      !session ||
      !["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.role)
    ) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    let query = supabase
      .from("Appointment")
      .select("*, patient:Patient(id, fullName, phone, secondaryPhone, email, address, nationalId, birthDate, gender, chronicDiseases, allergies, notes, createdAt, updatedAt), branch:Branch(*), doctor:Doctor(*), service:Service(*), medicalSolution:MedicalSolution(*), followUps:FollowUp(*)")
      .order("appointmentDate", { ascending: false });
    if (branchId && branchId !== "ALL") query = query.eq("branchId", branchId);
    if (session.role !== "SUPER_ADMIN") {
      if (!session.branchId) {
        return NextResponse.json(
          { success: false, message: "لا يوجد فرع مرتبط بحسابك" },
          { status: 403 }
        );
      }
      query = query.eq("branchId", session.branchId);
    }
    if (session.role === "DOCTOR") {
      if (!session.doctorId) {
        return NextResponse.json(
          { success: false, message: "حساب الطبيب غير مرتبط بسجل طبيب" },
          { status: 403 }
        );
      }
      query = query.eq("doctorId", session.doctorId);
    }
    if (status && status !== "ALL") query = query.eq("status", status);

    const { data: appointments, error } = await query;
    if (error) throw error;
    if (session.role !== "SUPER_ADMIN") {
      for (const appointment of appointments ?? []) {
        appointment.followUps = (appointment.followUps ?? []).filter(
          (followUp) =>
            followUp.branchId === session.branchId &&
            (session.role !== "DOCTOR" || followUp.doctorId === session.doctorId)
        );
      }
    }

    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب الحجوزات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      branchId,
      serviceId,
      medicalSolutionId,
      offerId,
      doctorId,
      appointmentDate,
      fullName,
      phone,
      secondaryPhone,
      email,
      address,
      nationalId,
      noteType,
      patientComplaint,
      patientSuggestion,
      painLocation,
    } = body;

    // التحقق من الحقول الأساسية
    if (!branchId || !fullName || !phone || !appointmentDate) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع الحقول المطلوبة (الفرع، الاسم، الهاتف، وموعد الحجز)" },
        { status: 400 }
      );
    }
    if (doctorId) {
      const { data: doctor, error: doctorError } = await supabase
        .from("Doctor")
        .select("id")
        .eq("id", doctorId)
        .eq("branchId", branchId)
        .maybeSingle();
      if (doctorError) throw doctorError;
      if (!doctor) {
        return NextResponse.json(
          { success: false, message: "الطبيب المحدد غير مرتبط بالفرع المختار" },
          { status: 400 }
        );
      }
    }

    const appointmentDateValue = new Date(appointmentDate);
    if (Number.isNaN(appointmentDateValue.getTime())) {
      return NextResponse.json(
        { success: false, message: "تاريخ الموعد غير صالح" },
        { status: 400 }
      );
    }
    if (offerId !== undefined && offerId !== null && typeof offerId !== "string") {
      return NextResponse.json(
        { success: false, message: "العرض المختار غير صالح" },
        { status: 400 }
      );
    }
    if (
      (serviceId !== undefined && serviceId !== null && typeof serviceId !== "string") ||
      (medicalSolutionId !== undefined &&
        medicalSolutionId !== null &&
        typeof medicalSolutionId !== "string")
    ) {
      return NextResponse.json(
        { success: false, message: "الخدمة المختارة غير صالحة" },
        { status: 400 }
      );
    }
    const selectedIds = [serviceId, medicalSolutionId, offerId].filter(
      (id) => typeof id === "string" && id.length > 0
    );
    if (selectedIds.length > 1) {
      return NextResponse.json(
        { success: false, message: "اختر خدمة واحدة أو عرضاً واحداً فقط" },
        { status: 400 }
      );
    }

    const now = new Date();
    let selectedOffer = null;
    if (typeof offerId === "string" && offerId) {
      const { data, error } = await supabase
        .from("Offer")
        .select("*")
        .eq("id", offerId)
        .eq("isActive", true)
        .maybeSingle();
      if (error) throw error;
      const startsInTime = !data?.startDate || new Date(data.startDate) <= now;
      const endsInTime = !data?.endDate || new Date(data.endDate) >= now;
      selectedOffer = startsInTime && endsInTime ? data : null;
    }

    if (offerId && !selectedOffer) {
      return NextResponse.json(
        { success: false, message: "العرض المحدد لم يعد متاحاً. يرجى اختيار عرض آخر." },
        { status: 400 }
      );
    }
    let selectedService = null;
    if (typeof serviceId === "string" && serviceId) {
      const { data, error } = await supabase
        .from("Service")
        .select("*")
        .eq("id", serviceId)
        .eq("isActive", true)
        .maybeSingle();
      if (error) throw error;
      selectedService = data;
    }
    if (serviceId && !selectedOffer && !selectedService) {
      return NextResponse.json(
        { success: false, message: "الخدمة المحددة لم تعد متاحة. يرجى اختيار خدمة أخرى." },
        { status: 400 }
      );
    }
    if (selectedService && isTeethWhiteningService(selectedService)) {
      const { data: whiteningOffers, error: whiteningOfferError } = await supabase
        .from("Offer")
        .select("id, title, startDate, endDate")
        .eq("serviceId", selectedService.id)
        .eq("isActive", true);
      if (whiteningOfferError) throw whiteningOfferError;
      const currentWhiteningOffer = (whiteningOffers ?? []).find((offer) =>
        isCurrentOffer(offer, now)
      );
      if (currentWhiteningOffer) {
        return NextResponse.json(
          {
            success: false,
            message: `يوجد عرض ساري «${currentWhiteningOffer.title}» لخدمة التبييض. اختر العرض بدلاً من السعر الأساسي.`,
          },
          { status: 409 }
        );
      }
    }
    let selectedMedicalSolution = null;
    if (typeof medicalSolutionId === "string" && medicalSolutionId) {
      const { data, error } = await supabase
        .from("MedicalSolution")
        .select("*")
        .eq("id", medicalSolutionId)
        .eq("isActive", true)
        .maybeSingle();
      if (error) throw error;
      selectedMedicalSolution = data;
    }
    if (medicalSolutionId && !selectedMedicalSolution) {
      return NextResponse.json(
        { success: false, message: "الخدمة الطبية المحددة لم تعد متاحة. يرجى اختيار خدمة أخرى." },
        { status: 400 }
      );
    }
    let linkedOfferService = null;
    if (selectedOffer?.serviceId) {
      const { data, error } = await supabase
        .from("Service")
        .select("id")
        .eq("id", selectedOffer.serviceId)
        .eq("isActive", true)
        .maybeSingle();
      if (error) throw error;
      linkedOfferService = data;
    }
    if (selectedOffer?.serviceId && !linkedOfferService) {
      return NextResponse.json(
        { success: false, message: "الخدمة المرتبطة بهذا العرض لم تعد متاحة." },
        { status: 400 }
      );
    }
    if (selectedOffer?.serviceId && serviceId && selectedOffer.serviceId !== serviceId) {
      return NextResponse.json(
        { success: false, message: "هذا العرض مرتبط بخدمة مختلفة؛ يرجى اختيار الخدمة المرتبطة به." },
        { status: 400 }
      );
    }
    const bookingType = selectedOffer
      ? "OFFER"
      : selectedMedicalSolution
        ? "MEDICAL_SOLUTION"
        : selectedService
          ? "SERVICE"
          : "GENERAL";
    const bookingTitle = selectedOffer?.title
      ?? selectedMedicalSolution?.titleAr
      ?? selectedService?.name
      ?? "كشف واستشارة عامة";
    const bookingPrice = selectedOffer?.discountPrice
      ?? selectedMedicalSolution?.price
      ?? selectedService?.price
      ?? null;

    // 1. البحث عن المريض بالهاتف أو إنشاؤه
    const { data: existingPatient, error: findPatientError } = await supabase
      .from("Patient")
      .select("id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt")
      .eq("phone", phone.trim())
      .maybeSingle();
    if (findPatientError) throw findPatientError;
    let patient = existingPatient;

    if (!patient) {
      const { data, error } = await supabase
        .from("Patient")
        .insert({
          id: createRecordId(),
          updatedAt: new Date().toISOString(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          secondaryPhone: secondaryPhone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          nationalId: nationalId?.trim() || null,
        })
        .select("id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt")
        .single();
      if (error) throw error;
      patient = data;
    }

    // 2. إنشاء الحجز
    const { data: appointment, error: appointmentError } = await supabase
      .from("Appointment")
      .insert({
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
        branchId,
        patientId: patient.id,
        serviceId: selectedOffer?.serviceId || selectedService?.id || null,
        medicalSolutionId: selectedMedicalSolution?.id || null,
        offerId: selectedOffer?.id || null,
        offerTitle: selectedOffer?.title || null,
        offerPrice: selectedOffer?.discountPrice ?? null,
        bookingType,
        bookingTitle,
        bookingPrice,
        doctorId: doctorId || null,
        appointmentDate: appointmentDateValue.toISOString(),
        status: "PENDING",
        noteType: noteType || "COMPLAINT",
        patientComplaint: patientComplaint?.trim() || null,
        patientSuggestion: patientSuggestion?.trim() || null,
        painLocation: painLocation?.trim() || null,
      })
      .select("*, branch:Branch(*), service:Service(*), medicalSolution:MedicalSolution(*)")
      .single();
    if (appointmentError) throw appointmentError;

    const bookingMessage = selectedOffer
      ? `تم تسجيل طلب حجزك باستخدام عرض «${selectedOffer.title}» بسعر ${selectedOffer.discountPrice.toLocaleString("ar-EG")} ج.م. سيتواصل معك فريق الاستقبال لتأكيد الموعد.`
      : "تم تسجيل طلب حجزك بنجاح وسيتواصل معك فريق الاستقبال لتأكيد الموعد.";

    return NextResponse.json({
      success: true,
      message: bookingMessage,
      appointmentId: appointment.id,
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تسجيل الحجز، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
