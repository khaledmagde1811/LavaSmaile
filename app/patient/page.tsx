"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  AlertCircle,
  Lightbulb,
  Activity,
  LogOut,
  Plus,
  Send,
  Stethoscope,
  Smile,
  Hourglass,
  CircleCheck,
  CircleX,
  MapPin,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/Logo";
import BrandLoader, { LoadingIndicator } from "@/components/BrandLoader";

interface PatientBranch {
  id: string;
  name: string;
  city: string;
}

interface WhiteningService {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface WhiteningOffer {
  id: string;
  title: string;
  description: string | null;
  originalPrice: number | null;
  discountPrice: number;
  serviceId: string;
}

interface PatientAppointment {
  id: string;
  appointmentDate: string;
  bookingTitle: string | null;
  offerTitle: string | null;
  offerPrice: number | null;
  bookingType: string;
  bookingPrice: number | null;
  status: string;
  noteType: string;
  patientComplaint: string | null;
  patientSuggestion: string | null;
  painLocation: string | null;
  branchId: string;
  branch: { name: string };
  service: { name: string } | null;
  medicalSolution: { titleAr: string } | null;
  doctor: { name: string } | null;
}

interface PatientFollowUp {
  id: string;
  scheduledDate: string;
  status: string;
  followUpType: string;
  notes: string | null;
  branch: { name: string };
}

interface PatientMedicalRecord {
  id: string;
  appointmentId: string;
  diagnosis: string;
  treatmentPerformed: string;
  createdAt: string;
  doctor: { name: string } | null;
  appointment: {
    appointmentDate: string;
    branch: { name: string } | null;
  } | null;
}

interface PatientProfile {
  fullName: string;
  phone: string;
  nationalId: string | null;
  address: string | null;
  appointments: PatientAppointment[];
  followUps: PatientFollowUp[];
  medicalRecords: PatientMedicalRecord[];
}

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [branches, setBranches] = useState<PatientBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [requestType, setRequestType] = useState<"COMPLAINT" | "INQUIRY">("COMPLAINT");
  const [requestMessage, setRequestMessage] = useState("");
  const [painLocation, setPainLocation] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [whiteningServices, setWhiteningServices] = useState<WhiteningService[]>([]);
  const [whiteningOffers, setWhiteningOffers] = useState<WhiteningOffer[]>([]);
  const [selectedWhiteningService, setSelectedWhiteningService] = useState("");
  const [selectedWhiteningOffer, setSelectedWhiteningOffer] = useState("");
  const [whiteningLoading, setWhiteningLoading] = useState(true);
  const [whiteningLoadError, setWhiteningLoadError] = useState("");
  const [whiteningRequestLoading, setWhiteningRequestLoading] = useState(false);
  const [whiteningRequestError, setWhiteningRequestError] = useState("");
  const [whiteningRequestSuccess, setWhiteningRequestSuccess] = useState("");

  useEffect(() => {
    async function loadPatientData() {
      try {
        const res = await fetch("/api/patient/me");
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(data.message || "تعذر تحميل بيانات المريض.");
        }
        if (data.success && data.patient) {
          setPatient(data.patient);
        } else {
          throw new Error(data.message || "لم يتم العثور على سجل المريض.");
        }
      } catch (err) {
        console.error("Failed to load patient data:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "تعذر تحميل بيانات المريض."
        );
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
    async function loadBranches() {
      try {
        const response = await fetch("/api/branches");
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.branches)) {
          throw new Error(result.message || "تعذر تحميل الفروع");
        }
        setBranches(result.branches);
      } catch (err) {
        console.error("Failed to load branches for patient:", err);
        setRequestError(
          err instanceof Error ? err.message : "تعذر تحميل الفروع المتاحة."
        );
      }
    }
    loadBranches();
    async function loadWhiteningOptions() {
      try {
        const response = await fetch("/api/patient/whitening");
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "تعذر تحميل خيارات التبييض.");
        }
        setWhiteningServices(result.services);
        setWhiteningOffers(result.offers);
      } catch (err) {
        console.error("Failed to load patient whitening options:", err);
        setWhiteningLoadError(
          err instanceof Error ? err.message : "تعذر تحميل خيارات التبييض."
        );
      } finally {
        setWhiteningLoading(false);
      }
    }
    void loadWhiteningOptions();
  }, [router]);

  const submitPatientRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestLoading(true);
    setRequestError("");
    setRequestSuccess("");
    try {
      const response = await fetch("/api/patient/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          noteType: requestType,
          message: requestMessage,
          painLocation,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر إرسال طلبك");
      }
      setRequestSuccess(result.message || "تم إرسال طلبك بنجاح.");
      setRequestMessage("");
      setPainLocation("");
      const profileResponse = await fetch("/api/patient/me");
      const profileResult = await profileResponse.json();
      if (!profileResponse.ok || !profileResult.success) {
        throw new Error(profileResult.message || "تم إرسال الطلب لكن تعذر تحديث سجل الحساب.");
      }
      setPatient(profileResult.patient);
    } catch (err) {
      console.error("Failed to submit patient request:", err);
      setRequestError(err instanceof Error ? err.message : "تعذر إرسال الطلب.");
    } finally {
      setRequestLoading(false);
    }
  };

  const submitWhiteningRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWhiteningRequestLoading(true);
    setWhiteningRequestError("");
    setWhiteningRequestSuccess("");

    try {
      const response = await fetch("/api/patient/whitening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          serviceId: selectedWhiteningOffer ? undefined : selectedWhiteningService,
          offerId: selectedWhiteningOffer || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر إرسال طلب التبييض.");
      }

      setWhiteningRequestSuccess(result.message || "تم إرسال طلب التبييض بنجاح.");
      setSelectedWhiteningService("");
      setSelectedWhiteningOffer("");

      const profileResponse = await fetch("/api/patient/me");
      const profileResult = await profileResponse.json();
      if (!profileResponse.ok || !profileResult.success) {
        throw new Error("تم إرسال الطلب لكن تعذر تحديث سجل الحساب. حدّث الصفحة لمتابعته.");
      }
      setPatient(profileResult.patient);
    } catch (err) {
      console.error("Failed to submit patient whitening request:", err);
      setWhiteningRequestError(
        err instanceof Error ? err.message : "تعذر إرسال طلب التبييض."
      );
    } finally {
      setWhiteningRequestLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <BrandLoader message="جاري تحميل ملفك الطبي وحجوزاتك..." fullScreen />
      </div>
    );
  }

  if (!patient) {
    return errorMessage ? (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p role="alert" className="text-sm font-bold text-rose-700">
          {errorMessage}
        </p>
      </main>
    ) : null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex h-auto max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:h-20 sm:px-6 sm:py-0 lg:px-8">
          
          <Logo />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/book"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>حجز جديد / شكوى</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/70 to-sky-50 p-6 shadow-sm shadow-cyan-950/5 sm:flex-row sm:items-center sm:p-8">
          <div className="space-y-1">
            <span className="mb-1 inline-block rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-bold text-cyan-800">
              الملف الطبي الموحد
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              أهلاً بك، {patient.fullName} <Smile className="inline h-5 w-5 text-cyan-600" aria-label="مرحباً" />
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm">
              تابع من هنا مواعيد حجوزاتك، تاريخ الشكاوى الطبية والمقترحات التي سجلتها، ومواعيد المتابعة الدورية.
            </p>
          </div>

          <div className="shrink-0 space-y-1 rounded-2xl border border-slate-200 bg-white/85 p-4 text-right text-xs text-slate-700">
            <div><span className="text-slate-500">الهاتف:</span> <strong dir="ltr">{patient.phone}</strong></div>
            {patient.nationalId && <div><span className="text-slate-500">الرقم القومي:</span> {patient.nationalId}</div>}
            {patient.address && <div className="break-words"><span className="text-slate-500">العنوان:</span> {patient.address}</div>}
          </div>
        </div>

        <section className="space-y-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">اطلب جلسة تبييض الأسنان</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                اختر الخدمة أو العرض المتاح والفرع؛ سنسجل الطلب في حجوزاتك، ويتواصل معك الفرع لتأكيد الموعد.
              </p>
            </div>
          </div>

          {whiteningLoadError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
              {whiteningLoadError}
            </p>
          )}
          {whiteningRequestError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
              {whiteningRequestError}
            </p>
          )}
          {whiteningRequestSuccess && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {whiteningRequestSuccess}
            </p>
          )}

          {whiteningLoading ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <LoadingIndicator size="sm" />
              جارٍ تحميل خدمة التبييض والعروض المتاحة...
            </div>
          ) : whiteningServices.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
              لا توجد خدمة تبييض مفعّلة حالياً. يمكنك التواصل مع الفرع أو المحاولة لاحقاً.
            </p>
          ) : (
            <form onSubmit={submitWhiteningRequest} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {whiteningServices.map((service) => {
                  const serviceOffers = whiteningOffers.filter(
                    (offer) => offer.serviceId === service.id
                  );
                  return (
                    <article
                      key={service.id}
                      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <h3 className="font-black text-slate-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-xs leading-5 text-slate-600">{service.description}</p>
                      )}
                      {serviceOffers.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-emerald-800">
                            عرض تبييض متاح — يُطبّق سعر العرض فقط
                          </p>
                          {serviceOffers.map((offer) => (
                            <label
                              key={offer.id}
                              className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors ${
                                selectedWhiteningOffer === offer.id
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-slate-200 bg-white hover:border-emerald-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="whitening-option"
                                checked={selectedWhiteningOffer === offer.id}
                                onChange={() => {
                                  setSelectedWhiteningService(service.id);
                                  setSelectedWhiteningOffer(offer.id);
                                }}
                                className="mt-1 accent-emerald-600"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-black text-slate-900">{offer.title}</span>
                                {offer.description && (
                                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                                    {offer.description}
                                  </span>
                                )}
                                <span className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="font-black text-emerald-700">
                                    {offer.discountPrice.toLocaleString("ar-EG")} ج.م
                                  </span>
                                  {offer.originalPrice !== null && (
                                    <span className="text-xs text-slate-400 line-through">
                                      {offer.originalPrice.toLocaleString("ar-EG")} ج.م
                                    </span>
                                  )}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <label
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-colors ${
                            selectedWhiteningService === service.id && !selectedWhiteningOffer
                              ? "border-cyan-400 bg-cyan-50"
                              : "border-slate-200 bg-white hover:border-cyan-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="whitening-option"
                            checked={selectedWhiteningService === service.id && !selectedWhiteningOffer}
                            onChange={() => {
                              setSelectedWhiteningService(service.id);
                              setSelectedWhiteningOffer("");
                            }}
                            className="accent-cyan-600"
                          />
                          <span className="text-sm font-black text-cyan-800">
                            السعر الأساسي: {service.price.toLocaleString("ar-EG")} ج.م
                          </span>
                        </label>
                      )}
                    </article>
                  );
                })}
              </div>

              <label className="block space-y-1.5 text-xs font-bold text-slate-700">
                فرع جلسة التبييض
                <select
                  required
                  value={selectedBranch}
                  onChange={(event) => setSelectedBranch(event.target.value)}
                  disabled={branches.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">اختر الفرع</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={
                  whiteningRequestLoading ||
                  !selectedBranch ||
                  (!selectedWhiteningService && !selectedWhiteningOffer)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:from-cyan-700 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {whiteningRequestLoading ? (
                  <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ إرسال الطلب...</>
                ) : (
                  "أرسل طلب التبييض"
                )}
              </button>
            </form>
          )}
        </section>

        {/* Section 1: Upcoming Follow-ups */}
        {patient.followUps && patient.followUps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-700" />
              <h2 className="text-lg font-black text-slate-900">مواعيد المتابعة الطبية القادمة</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.followUps.map((f) => {
                const fDate = new Date(f.scheduledDate);
                return (
                  <div key={f.id} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800">
                        {f.branch.name}
                      </span>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {f.status === "SCHEDULED" ? "مجدولة" : "مكتملة"}
                      </span>
                    </div>

                    <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <span>موعد الزيارة: {fDate.toLocaleDateString("ar-EG")}</span>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold">
                      نوع المتابعة: <strong className="text-slate-900">{f.followUpType}</strong>
                    </p>

                    {f.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        توصيات الطبيب: {f.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <section className="space-y-4 rounded-3xl border border-cyan-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-black text-slate-900">إرسال استفسار أو شكوى للفرع</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            اختر الفرع واكتب تفاصيل طلبك. سيتم تسجيله في سجل الحجوزات والطلبات، ويتواصل معك فريق الفرع لتأكيد الموعد أو الرد.
          </p>
          {requestError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
              {requestError}
            </p>
          )}
          {requestSuccess && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {requestSuccess}
            </p>
          )}
          <form onSubmit={submitPatientRequest} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              الفرع
              <select
                required
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value)}
                disabled={branches.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">اختر الفرع</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              نوع الطلب
              <select
                value={requestType}
                onChange={(event) =>
                  setRequestType(event.target.value as "COMPLAINT" | "INQUIRY")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="COMPLAINT">شكوى عاجلة</option>
                <option value="INQUIRY">استفسار</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
              تفاصيل الشكوى أو الاستفسار
              <textarea
                required
                maxLength={2000}
                rows={4}
                value={requestMessage}
                onChange={(event) => setRequestMessage(event.target.value)}
                className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>
            {requestType === "COMPLAINT" && (
              <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                السن أو موضع الألم (اختياري)
                <input
                  value={painLocation}
                  onChange={(event) => setPainLocation(event.target.value)}
                  maxLength={160}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </label>
            )}
            <button
              type="submit"
              disabled={requestLoading || branches.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:from-cyan-700 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
            >
              <Send className="h-4 w-4" />
              {requestLoading ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ الإرسال...</> : "إرسال الطلب"}
            </button>
          </form>
        </section>

        {patient.medicalRecords?.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-black text-slate-900">ملخص العلاج والتوصيات الطبية</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {patient.medicalRecords.map((record) => (
                <article key={record.id} className="space-y-3 rounded-2xl border border-teal-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm font-black text-slate-900">
                      {record.appointment?.branch?.name || "العيادة"}
                    </strong>
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  {record.doctor && (
                    <p className="text-xs font-bold text-teal-800">الطبيب: د. {record.doctor.name}</p>
                  )}
                  <div className="space-y-1 rounded-xl bg-teal-50 p-3 text-xs leading-relaxed">
                    <p><strong>التشخيص:</strong> {record.diagnosis}</p>
                    <p><strong>الإجراء الطبي:</strong> {record.treatmentPerformed}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Appointments & Complaints History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              <h2 className="text-lg font-black text-slate-900">سجل طلبات الحجز والشكاوى السابقة</h2>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              إجمالي الطلبات: {patient.appointments?.length || 0}
            </span>
          </div>

          {patient.appointments?.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">لا توجد حجوزات مسجلة حتى الآن</h3>
              <Link
                href="/book"
                className="inline-block mt-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700"
              >
                احجز كشفك الآن
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {patient.appointments.map((apt) => {
                const aDate = new Date(apt.appointmentDate);
                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md ml-2">
                          {apt.branch.name}
                        </span>
                        <strong className="text-base text-slate-900">
                          {apt.bookingTitle ||
                            apt.offerTitle ||
                            apt.medicalSolution?.titleAr ||
                            apt.service?.name ||
                            "كشف وتشخيص عام"}
                        </strong>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black w-fit ${
                          apt.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : apt.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : apt.status === "COMPLETED"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {apt.status === "PENDING" && <span className="inline-flex items-center gap-1"><Hourglass className="h-3.5 w-3.5" /> قيد مراجعة وتأكيد الاستقبال</span>}
                        {apt.status === "CONFIRMED" && <span className="inline-flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> حجز مؤكد - بانتظار تشريفك</span>}
                        {apt.status === "COMPLETED" && <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> اكتمل العلاج بنجاح</span>}
                        {apt.status === "CANCELLED" && <span className="inline-flex items-center gap-1"><CircleX className="h-3.5 w-3.5" /> تم الإلغاء</span>}
                      </span>
                    </div>

                    {(apt.bookingPrice !== null || apt.offerPrice !== null) && (
                      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-xs ${
                        apt.bookingType === "OFFER"
                          ? "border border-emerald-200 bg-emerald-50"
                          : "border border-cyan-200 bg-cyan-50"
                      }`}>
                        <span className="font-black text-slate-700">
                          {apt.bookingType === "OFFER"
                            ? `عرض خاص: ${apt.bookingTitle || apt.offerTitle}`
                            : `السعر المسجل: ${apt.bookingTitle || apt.service?.name || apt.medicalSolution?.titleAr}`}
                        </span>
                        <span className="font-black text-cyan-800">
                          {(apt.bookingPrice ?? apt.offerPrice)?.toLocaleString("ar-EG")} ج.م
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        {apt.noteType === "COMPLAINT" || apt.noteType === "INQUIRY"
                          ? "وقت تسجيل الطلب:"
                          : "تاريخ الموعد:"}{" "}
                        {aDate.toLocaleDateString("ar-EG")} الساعة {aDate.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {apt.doctor && (
                        <span>الطبيب: د. {apt.doctor.name}</span>
                      )}
                    </div>

                    {/* Complaint History */}
                    {(apt.noteType === "COMPLAINT" || apt.noteType === "INQUIRY") && apt.patientComplaint && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>{apt.noteType === "INQUIRY" ? "الاستفسار الذي أرسلته:" : "الشكوى التي سجلتها:"}</span>
                        </div>
                        <p className="text-rose-900 font-semibold leading-relaxed">
                          &quot;{apt.patientComplaint}&quot;
                        </p>
                        {apt.painLocation && (
                          <span className="inline-block mt-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> موضع الألم: {apt.painLocation}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Suggestion History */}
                    {apt.noteType === "SUGGESTION" && apt.patientSuggestion && (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-cyan-800">
                          <Lightbulb className="w-4 h-4 text-cyan-600" />
                          <span>اقتراحك المسجل للإدارة:</span>
                        </div>
                        <p className="text-cyan-900 font-semibold leading-relaxed">
                          &quot;{apt.patientSuggestion}&quot;
                        </p>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 text-left pt-1">
                      رقم الحجز: <code className="font-mono">{apt.id.slice(-8)}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
