"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandLoader, { LoadingIndicator } from "@/components/BrandLoader";
import { isTeethWhiteningService } from "@/lib/whitening";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  FileText,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  doctors?: { id: string; name: string; specialty: string }[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  durationMinutes: number;
}

interface MedicalSolution {
  id: string;
  titleAr: string;
  shortDescription: string;
  price: number | null;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  originalPrice: number | null;
  discountPrice: number;
  endDate: string | null;
  serviceId: string | null;
  service?: { name: string } | null;
}

interface SubmissionSuccess {
  appointmentId: string;
  appointment: {
    patient?: { fullName: string };
    branch?: { name: string };
    service?: { name: string } | null;
    medicalSolution?: { titleAr: string } | null;
    offerTitle: string | null;
    offerPrice: number | null;
    bookingType: string;
    bookingTitle: string | null;
    bookingPrice: number | null;
  };
}

const fieldBaseClassName =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10";
const fieldClassName = `${fieldBaseClassName} px-4`;
const iconFieldClassName = `${fieldBaseClassName} pl-4 pr-11`;

interface BookingFormProps {
  preselectedBranchId?: string;
  preselectedOfferId?: string;
  initialAppointmentDate: string;
  initialPhone?: string;
}

export default function BookingForm(props: BookingFormProps) {
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get("phone");
  const initialPhone = phoneFromUrl || props.initialPhone || "";

  return <BookingFormFields key={initialPhone} {...props} initialPhone={initialPhone} />;
}

function BookingFormFields({
  preselectedBranchId,
  preselectedOfferId,
  initialAppointmentDate,
  initialPhone,
}: BookingFormProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [medicalSolutions, setMedicalSolutions] = useState<MedicalSolution[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [selectedBranchOverride, setSelectedBranch] = useState<string | null>(null);
  const [selectedBookingOptionOverride, setSelectedBookingOption] = useState<string | null>(null);
  const selectedBranch =
    (selectedBranchOverride && branches.some((branch) => branch.id === selectedBranchOverride)
      ? selectedBranchOverride
      : null) ??
    (preselectedBranchId && branches.some((branch) => branch.id === preselectedBranchId)
      ? preselectedBranchId
      : null) ??
    branches[0]?.id ??
    "";
  const selectedBookingOption = useMemo(
    () =>
      selectedBookingOptionOverride ??
      (preselectedOfferId && offers.some((offer) => offer.id === preselectedOfferId)
        ? `offer:${preselectedOfferId}`
        : ""),
    [offers, preselectedOfferId, selectedBookingOptionOverride]
  );
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(initialAppointmentDate);
  const [appointmentTime, setAppointmentTime] = useState("11:00");
  const [currentStep, setCurrentStep] = useState(1);

  // Patient Info State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nationalId, setNationalId] = useState("");

  // Complaint / Suggestion State
  const [noteType, setNoteType] = useState<"COMPLAINT" | "SUGGESTION" | "INQUIRY">("COMPLAINT");
  const [patientComplaint, setPatientComplaint] = useState("");
  const [patientSuggestion, setPatientSuggestion] = useState("");
  const [painLocation, setPainLocation] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load active branches, services, medical solutions, and offers.
  useEffect(() => {
    async function loadData() {
      try {
        const [branchRes, serviceRes, solutionRes, offerRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/services"),
          fetch("/api/medical-solutions"),
          fetch("/api/offers?forBooking=true"),
        ]);
        const responses = [branchRes, serviceRes, solutionRes, offerRes];
        if (responses.some((response) => !response.ok)) {
          throw new Error("تعذر تحميل بيانات الحجز. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
        }
        const [branchData, serviceData, solutionData, offerData] = await Promise.all(
          responses.map((response) => response.json())
        );

        if (!branchData.success || !serviceData.success || !solutionData.success || !offerData.success) {
          throw new Error(
            branchData.message ||
              serviceData.message ||
              solutionData.message ||
              offerData.message ||
              "تعذر تحميل بيانات الحجز."
          );
        }
        setBranches(branchData.branches);
        setServices(serviceData.services);
        setMedicalSolutions(solutionData.solutions);
        setOffers(offerData.offers);
      } catch (loadError) {
        console.error("Failed to load booking dependencies:", loadError);
        setErrorMessage(
          loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الحجز."
        );
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const {
    activeBranchObj,
    selectedOffer,
    selectedServiceObj,
    selectedMedicalSolution,
    bookingPrice,
  } = useMemo(() => {
    const activeBranch = branches.find((branch) => branch.id === selectedBranch);
    const offer = selectedBookingOption.startsWith("offer:")
      ? offers.find((item) => item.id === selectedBookingOption.slice("offer:".length))
      : undefined;
    const service = selectedBookingOption.startsWith("service:")
      ? services.find((item) => item.id === selectedBookingOption.slice("service:".length))
      : offer?.serviceId
        ? services.find((item) => item.id === offer.serviceId)
        : undefined;
    const medicalSolution = selectedBookingOption.startsWith("solution:")
      ? medicalSolutions.find(
          (item) => item.id === selectedBookingOption.slice("solution:".length)
        )
      : undefined;

    return {
      activeBranchObj: activeBranch,
      selectedOffer: offer,
      selectedServiceObj: service,
      selectedMedicalSolution: medicalSolution,
      bookingPrice: offer?.discountPrice ?? service?.price ?? medicalSolution?.price ?? null,
    };
  }, [branches, medicalSolutions, offers, selectedBookingOption, selectedBranch, services]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (currentStep < 3) {
      if (e.currentTarget.reportValidity()) {
        setCurrentStep((step) => step + 1);
      }
      return;
    }

    if (!selectedBranch) {
      setErrorMessage("يرجى اختيار الفرع المناسب.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("يرجى كتابة اسم المريض بالكامل.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("يرجى إدخال رقم الهاتف الأساسي للتواصل والواتساب.");
      return;
    }
    if (!appointmentDate) {
      setErrorMessage("يرجى تحديد تاريخ الموعد المطلوب.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const fullDate = new Date(`${appointmentDate}T${appointmentTime}:00`);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          serviceId: selectedOffer ? null : selectedServiceObj?.id ?? null,
          medicalSolutionId: selectedMedicalSolution?.id ?? null,
          offerId: selectedOffer?.id ?? null,
          doctorId: selectedDoctor || null,
          appointmentDate: fullDate.toISOString(),
          fullName,
          phone,
          secondaryPhone,
          email,
          address,
          nationalId,
          noteType,
          patientComplaint: noteType === "COMPLAINT" ? patientComplaint : null,
          patientSuggestion: noteType === "SUGGESTION" ? patientSuggestion : null,
          painLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تسجيل الحجز");
      }

      setSubmissionSuccess(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع، يرجى إعادة المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <BrandLoader message="جاري تحميل الفروع والخدمات المتاحة..." />
    );
  }

  // Success Receipt Screen
  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-12 shadow-2xl border border-emerald-100 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            تم استلام طلبك بنجاح
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            شكراً لك، أستاذ/ة {submissionSuccess.appointment?.patient?.fullName || fullName}!
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            تم تسجيل موعدك في <strong className="text-cyan-700">{submissionSuccess.appointment?.branch?.name}</strong> بنجاح.
            {submissionSuccess.appointment?.bookingType === "OFFER"
              ? ` تم تسجيله باستخدام عرض ${submissionSuccess.appointment.bookingTitle || submissionSuccess.appointment.offerTitle}، وسيقوم فريق الاستقبال بالتواصل معك عبر الواتساب لتأكيد التفاصيل.`
              : " سيقوم فريق الاستقبال بمراجعة تفاصيل طلبك والتواصل معك عبر الواتساب لتأكيد الساعة."}
          </p>
        </div>

        {/* Receipt Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right space-y-3 text-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">رقم الحجز المرجعي:</span>
            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-200 px-2.5 py-1 rounded-lg">
              {submissionSuccess.appointmentId}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">الفرع:</span>
            <span className="font-bold text-slate-900">{submissionSuccess.appointment?.branch?.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">
              {submissionSuccess.appointment?.bookingType === "OFFER" ? "العرض المختار:" : "الخدمة المطلوبة:"}
            </span>
            <span className="font-bold text-cyan-600">
              {submissionSuccess.appointment?.bookingTitle ||
                submissionSuccess.appointment?.offerTitle ||
                submissionSuccess.appointment?.medicalSolution?.titleAr ||
                submissionSuccess.appointment?.service?.name ||
                "كشف واستشارة عامة"}
            </span>
          </div>
          {submissionSuccess.appointment?.bookingPrice !== null &&
            submissionSuccess.appointment?.bookingPrice !== undefined && (
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">
                  {submissionSuccess.appointment.bookingType === "OFFER" ? "سعر العرض:" : "السعر التقديري:"}
                </span>
                <span className="font-black text-emerald-700">
                  {submissionSuccess.appointment.bookingPrice.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
          )}
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">رقم الهاتف الأساسي:</span>
            <span className="font-bold text-slate-900" dir="ltr">{phone}</span>
          </div>
          {noteType === "COMPLAINT" && patientComplaint && (
            <div className="pt-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="font-bold block mb-1">الشكوى المسجلة لدى الطبيب:</span>
              <p>&quot;{patientComplaint}&quot;</p>
              {painLocation && <p className="mt-1 font-semibold text-amber-900">موضع الألم: {painLocation}</p>}
            </div>
          )}
          {noteType === "SUGGESTION" && patientSuggestion && (
            <div className="pt-2 text-xs text-cyan-800 bg-cyan-50 p-3 rounded-xl border border-cyan-200">
              <span className="font-bold block mb-1">اقتراحك المسجل للإدارة:</span>
              <p>&quot;{patientSuggestion}&quot;</p>
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              setSubmissionSuccess(null);
              setFullName("");
              setPhone("");
              setPatientComplaint("");
              setPatientSuggestion("");
              setSelectedBookingOption("");
              setCurrentStep(1);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            حجز موعد آخر
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-10"
    >
      <div className="space-y-2 border-b border-slate-100 pb-6">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          احجز موعدك الآن
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          أكمل الخطوات التالية لإرسال طلب الحجز، وسيتواصل معك فريقنا لتأكيد الموعد.
        </p>
      </div>

      <ol aria-label="خطوات الحجز" className="grid grid-cols-3 gap-2">
        {["الفرع والخدمة", "بيانات التواصل", "ملاحظات ومراجعة"].map(
          (stepLabel, index) => {
            const step = index + 1;
            const isComplete = currentStep > step;
            const isCurrent = currentStep === step;

            return (
              <li key={stepLabel}>
                <button
                  type="button"
                  onClick={() => step < currentStep && setCurrentStep(step)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-center text-[11px] font-bold transition-colors sm:text-xs ${
                    isCurrent
                      ? "bg-cyan-700 text-white"
                      : isComplete
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step}
                  </span>
                  <span>{stepLabel}</span>
                </button>
              </li>
            );
          }
        )}
      </ol>

      {/* Error Alert */}
      {errorMessage && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <span className="min-w-0">{errorMessage}</span>
        </div>
      )}

      {currentStep === 1 && (
      <>
      {/* SECTION 1: Branch Selection */}
      <section className="space-y-5 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700">
            1
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">اختر الفرع المناسب لك</h3>
            <p className="mt-0.5 text-xs text-slate-500">اختر من الفروع المتاحة حاليًا</p>
          </div>
        </div>

        <div>
          <label htmlFor="booking-branch" className="mb-1.5 block text-xs font-bold text-slate-700">
            الفرع *
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-cyan-700" />
            <select
              id="booking-branch"
              value={selectedBranch}
              onChange={(event) => {
                setSelectedBranch(event.target.value || null);
                setSelectedDoctor("");
              }}
              required
              disabled={branches.length === 0}
              className={`${iconFieldClassName} font-bold disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="" disabled>
                {branches.length === 0 ? "لا توجد فروع متاحة للحجز" : "اختر الفرع"}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} — {branch.city}
                </option>
              ))}
            </select>
          </div>
          {activeBranchObj && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-600" />
                {activeBranchObj.address}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-600" />
                {activeBranchObj.workingHours}
              </span>
              <a
                href={`tel:${activeBranchObj.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span dir="ltr">{activeBranchObj.phone}</span>
              </a>
            </div>
          )}
          {branches.length === 0 && !loadingData && !errorMessage && (
            <p className="mt-2 text-sm text-amber-700">
              لا يمكن إرسال الحجز قبل إضافة فرع نشط من لوحة الإدارة.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 2: Service & Doctor */}
      <section className="space-y-5 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700">
            2
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">الخدمة المطلوبة والطبيب (اختياري)</h3>
            <p className="mt-0.5 text-xs text-slate-500">حدد نوع الاستشارة أو الإجراء المطلوب</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              اختر الخدمة أو العرض
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-cyan-700" />
              <select
                value={selectedBookingOption}
                onChange={(e) => setSelectedBookingOption(e.target.value)}
                className={`${iconFieldClassName} font-bold`}
              >
                <option value="">كشف وتشخيص عام (استشارة مبدئية)</option>
                {services.length > 0 && (
                  <optgroup label="الخدمات الطبية">
                    {services
                      .filter((service) =>
                        !isTeethWhiteningService(service) ||
                        !offers.some((offer) => offer.serviceId === service.id)
                      )
                      .map((service) => (
                      <option key={service.id} value={`service:${service.id}`}>
                        {service.name} — {service.price.toLocaleString("ar-EG")} ج.م
                      </option>
                    ))}
                  </optgroup>
                )}
                {medicalSolutions.length > 0 && (
                  <optgroup label="الحلول والخدمات الطبية">
                    {medicalSolutions.map((solution) => (
                      <option key={solution.id} value={`solution:${solution.id}`}>
                        {solution.titleAr}
                        {solution.price !== null
                          ? ` — ${solution.price.toLocaleString("ar-EG")} ج.م`
                          : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {offers.length > 0 && (
                  <optgroup label="العروض الخاصة">
                    {offers.map((offer) => (
                      <option key={offer.id} value={`offer:${offer.id}`}>
                        {offer.title} — {offer.discountPrice.toLocaleString("ar-EG")} ج.م
                        {offer.endDate
                          ? ` (حتى ${new Date(offer.endDate).toLocaleDateString("ar-EG")})`
                          : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {offers.some((offer) => {
              const service = services.find((item) => item.id === offer.serviceId);
              return service ? isTeethWhiteningService(service) : false;
            }) && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                عند وجود عرض سارٍ للتبييض، يظهر العرض وحده ويُستخدم سعره بدلاً من السعر الأساسي.
              </p>
            )}
            {services.length === 0 && medicalSolutions.length === 0 && offers.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                لا توجد خدمات أو عروض متاحة حالياً؛ يمكنك متابعة الحجز لكشف عام.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              الطبيب المفضل (اختياري)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-cyan-700" />
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className={`${iconFieldClassName} font-bold`}
              >
                <option value="">أي طبيب متاح في هذا الفرع</option>
                {activeBranchObj?.doctors?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {bookingPrice !== null && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-cyan-100 bg-cyan-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-700">
              {selectedOffer
                ? `السعر بعد تطبيق عرض ${selectedOffer.title}:`
                : "السعر التقديري للخدمة:"}
            </span>
            <span className="flex items-center gap-2">
              {selectedOffer && (selectedOffer.originalPrice ?? selectedServiceObj?.price) !== undefined && (
                <span className="text-sm text-slate-400 line-through">
                  {(selectedOffer.originalPrice ?? selectedServiceObj?.price)?.toLocaleString("ar-EG")} ج.م
                </span>
              )}
              <strong className="text-lg font-black text-cyan-700">
                {bookingPrice.toLocaleString("ar-EG")} ج.م
              </strong>
            </span>
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              تاريخ الموعد المقترح
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-cyan-700" />
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className={`${iconFieldClassName} font-bold`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              الفترة المفضلة
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-cyan-700" />
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className={`${iconFieldClassName} font-bold`}
              >
                <option value="11:00">صباحاً (11:00 ص - 01:00 م)</option>
                <option value="14:00">ظهراً (02:00 م - 04:00 م)</option>
                <option value="17:00">عصراً (05:00 م - 07:00 م)</option>
                <option value="19:00">مساءً (07:00 م - 09:00 م)</option>
                <option value="21:00">سهرة (09:00 م - 10:30 م)</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {/* SECTION 3: Patient Full Information */}
      {currentStep === 2 && (
      <section className="space-y-5 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700">
            3
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-6 text-slate-900 sm:text-lg">
              بيانات المريض والتواصل الكاملة
            </h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              نرجو كتابة أرقام صحيحة للتواصل وتأكيد الحجز
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              الاسم بالكامل *
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <User className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد عبد الله محمود"
                className={iconFieldClassName}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              رقم الهاتف الأساسي (الواتساب) *
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className={`${iconFieldClassName} text-left`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              رقم هاتف إضافي / طوارئ (اختياري)
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="tel"
                dir="ltr"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="011XXXXXXXX"
                className={`${iconFieldClassName} text-left`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              البريد الإلكتروني (اختياري)
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className={`${iconFieldClassName} text-left`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              العنوان / المنطقة
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Home className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: المعادي، القاهرة"
                className={iconFieldClassName}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              الرقم القومي (لربط الملف الطبي)
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <input
                type="text"
                dir="ltr"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="الرقم القومي المكون من 14 رقم"
                className={`${iconFieldClassName} text-left`}
              />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* SECTION 4: Complaint or Suggestion Module */}
      {currentStep === 3 && (
      <section className="space-y-5 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700">
            4
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">إضافة شكوى أو اقتراح مع الحجز</h3>
            <p className="mt-0.5 text-xs text-slate-500">اختر طبيعة رسالتك لتسجيلها في ملف الحجز الخاص بك</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm">
          <h4 className="font-black text-slate-900">راجع بيانات طلبك</h4>
          <dl className="grid gap-3 text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">الفرع</dt>
              <dd className="font-bold">{activeBranchObj?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">الخدمة</dt>
              <dd className="font-bold">
                {selectedOffer?.title ||
                  selectedMedicalSolution?.titleAr ||
                  selectedServiceObj?.name ||
                  "كشف وتشخيص عام"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">التاريخ والفترة المفضلة</dt>
              <dd className="font-bold">
                {new Date(`${appointmentDate}T12:00:00`).toLocaleDateString("ar-EG")} — {appointmentTime}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">اسم المريض ورقم التواصل</dt>
              <dd className="font-bold" dir="auto">
                {fullName} — <span dir="ltr">{phone}</span>
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-5 text-slate-600">
            إرسال الطلب لا يعني تأكيد الموعد؛ سيتواصل معك فريق الاستقبال لتأكيد التوفر.
          </p>
        </div>

        {/* Note Type Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setNoteType("COMPLAINT")}
            className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              noteType === "COMPLAINT"
                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>شكوى طبية / ألم</span>
          </button>

          <button
            type="button"
            onClick={() => setNoteType("SUGGESTION")}
            className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              noteType === "SUGGESTION"
                ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>اقتراح للإدارة</span>
          </button>

          <button
            type="button"
            onClick={() => setNoteType("INQUIRY")}
            className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              noteType === "INQUIRY"
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>استفسار عام</span>
          </button>
        </div>

        {/* Conditional Content based on selected type */}
        {noteType === "COMPLAINT" && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                صف سبب الزيارة أو طبيعة الألم والأعراض التي تشعر بها:
              </label>
              <textarea
                rows={3}
                value={patientComplaint}
                onChange={(e) => setPatientComplaint(e.target.value)}
                placeholder="مثال: كسر بالضرس مع حساسية من المشروبات الساخنة والباردة وألم مستمر أثناء النوم..."
                className={fieldClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                موضع الألم أو السن المتضرر (إن أمكن تحديده):
              </label>
              <input
                type="text"
                value={painLocation}
                onChange={(e) => setPainLocation(e.target.value)}
                placeholder="مثال: الضرس الخلفي السفلي يمين، أو القواطع العلوية"
                className={fieldClassName}
              />
            </div>
          </div>
        )}

        {noteType === "SUGGESTION" && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ما هو اقتراحك لتحسين تجربتك في فروع Lava Smile؟
              </label>
              <textarea
                rows={3}
                value={patientSuggestion}
                onChange={(e) => setPatientSuggestion(e.target.value)}
                placeholder="مثال: أقترح توفير خطة تقسيط بنكي بدون فوائد، أو مواعيد بعد الـ 9 مساءً..."
                className={fieldClassName}
              />
            </div>
          </div>
        )}

        {noteType === "INQUIRY" && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ما هو استفسارك الذي تود أن يجيبك عليه الطبيب أو الاستقبال؟
              </label>
              <textarea
                rows={3}
                value={patientComplaint}
                onChange={(e) => setPatientComplaint(e.target.value)}
                placeholder="مثال: هل يمكن تركيب عدسات إيماكس بدون حك للأسنان؟ وما مدة الضمان؟"
                className={fieldClassName}
              />
            </div>
          </div>
        )}
      </section>
      )}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep((step) => step - 1)}
            className="min-h-14 rounded-2xl border border-slate-200 px-6 py-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 sm:w-1/3"
          >
            رجوع
          </button>
        )}
        <button
          type={currentStep === 3 ? "submit" : "button"}
          onClick={(event) => {
            if (currentStep < 3) {
              const form = event.currentTarget.form;
              if (form?.reportValidity()) {
                setErrorMessage("");
                setCurrentStep((step) => step + 1);
              }
            }
          }}
          disabled={isSubmitting || branches.length === 0}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-700 hover:to-teal-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {currentStep < 3 ? (
            <>
              <span>متابعة</span>
              <Calendar className="h-5 w-5" />
            </>
          ) : isSubmitting ? (
            <>
              <LoadingIndicator size="sm" className="border-white border-t-amber-300" />
              <span>جاري تسجيل الحجز وتأكيد البيانات...</span>
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              <span>تأكيد طلب الحجز الآن</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          بياناتك مشفرة ومحمية بخصوصية طبية تامة.
        </p>
      </div>
    </form>
  );
}
