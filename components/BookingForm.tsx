"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  User,
  Phone,
  Mail,
  Home,
  FileText,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
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

export default function BookingForm({
  preselectedBranchId,
}: {
  preselectedBranchId?: string;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [selectedBranch, setSelectedBranch] = useState(preselectedBranchId || "");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("12:00");

  // Patient Info State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
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
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load initial branches and services
  useEffect(() => {
    async function loadData() {
      try {
        const [branchRes, serviceRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/services"),
        ]);
        const branchData = await branchRes.json();
        const serviceData = await serviceRes.json();

        if (branchData.success) {
          setBranches(branchData.branches);
          if (!preselectedBranchId && branchData.branches.length > 0) {
            setSelectedBranch(branchData.branches[0].id);
          }
        }
        if (serviceData.success) {
          setServices(serviceData.services);
          if (serviceData.services.length > 0) {
            setSelectedService(serviceData.services[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load booking dependencies:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [preselectedBranchId]);

  // Set default appointment date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setAppointmentDate(dateStr);
  }, []);

  const activeBranchObj = branches.find((b) => b.id === selectedBranch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

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
          serviceId: selectedService || null,
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
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ غير متوقع، يرجى إعادة المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold">جاري تحميل الفروع والخدمات المتاحة...</p>
      </div>
    );
  }

  // Success Receipt Screen
  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-100 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
            تم تسجيل موعدك في <strong className="text-cyan-700">{submissionSuccess.appointment?.branch?.name}</strong> بنجاح. سيقوم فريق الاستقبال بمراجعة تفاصيل طلبك وشكواك والتواصل معك عبر الواتساب لتأكيد الساعة.
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
            <span className="text-slate-500">الخدمة المطلوبة:</span>
            <span className="font-bold text-cyan-600">{submissionSuccess.appointment?.service?.name || "كشف واستشارة عامة"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">رقم الهاتف الأساسي:</span>
            <span className="font-bold text-slate-900" dir="ltr">{phone}</span>
          </div>
          {noteType === "COMPLAINT" && patientComplaint && (
            <div className="pt-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="font-bold block mb-1">الشكوى المسجلة لدى الطبيب:</span>
              <p>"{patientComplaint}"</p>
              {painLocation && <p className="mt-1 font-semibold text-amber-900">موضع الألم: {painLocation}</p>}
            </div>
          )}
          {noteType === "SUGGESTION" && patientSuggestion && (
            <div className="pt-2 text-xs text-cyan-800 bg-cyan-50 p-3 rounded-xl border border-cyan-200">
              <span className="font-bold block mb-1">اقتراحك المسجل للإدارة:</span>
              <p>"{patientSuggestion}"</p>
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
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            حجز موعد آخر
          </button>
          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 space-y-8"
    >
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Branch Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-sm">
            1
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">اختر الفرع المناسب لك</h3>
            <p className="text-xs text-slate-500">اختر أحد فروعنا الثلاثة الأقرب إليك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((branch) => {
            const isSelected = selectedBranch === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-cyan-600 bg-cyan-50/40 shadow-md ring-2 ring-cyan-600/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 left-3 w-5 h-5 bg-cyan-600 text-white rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className={`w-4 h-4 ${isSelected ? "text-cyan-600" : "text-slate-400"}`} />
                  <span className="font-black text-slate-900 text-base">{branch.name}</span>
                </div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{branch.address}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  <span>{branch.workingHours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Service & Doctor */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-sm">
            2
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">الخدمة المطلوبة والطبيب (اختياري)</h3>
            <p className="text-xs text-slate-500">حدد نوع الاستشارة أو الإجراء المطلوب</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع الخدمة / الكشف
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">كشف وتشخيص عام (استشارة مبدئية)</option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} — {srv.price.toLocaleString("ar-EG")} ج.م
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الطبيب المفضل (اختياري)
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-600" />
              تاريخ الموعد المقترح
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-600" />
              الفترة المفضلة
            </label>
            <select
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

      {/* SECTION 3: Patient Full Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-sm">
            3
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">بيانات المريض والتواصل الكاملة</h3>
            <p className="text-xs text-slate-500">نرجو كتابة أرقام صحيحة للتواصل وتأكيد الحجز</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-600" />
              الاسم بالكامل *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أحمد عبد الله محمود"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              رقم الهاتف الأساسي (الواتساب) *
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-cyan-600" />
              رقم هاتف إضافي / طوارئ (اختياري)
            </label>
            <input
              type="tel"
              dir="ltr"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
              placeholder="011XXXXXXXX"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-cyan-600" />
              البريد الإلكتروني (اختياري)
            </label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-cyan-600" />
              العنوان / المنطقة
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: المعادي، القاهرة"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              الرقم القومي (لربط الملف الطبي)
            </label>
            <input
              type="text"
              dir="ltr"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="الرقم القومي المكون من 14 رقم"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Complaint or Suggestion Module */}
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
            4
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">إضافة شكوى أو اقتراح مع الحجز</h3>
            <p className="text-xs text-slate-500">اختر طبيعة رسالتك لتسجيلها في ملف الحجز الخاص بك</p>
          </div>
        </div>

        {/* Note Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setNoteType("COMPLAINT")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black transition-all ${
              noteType === "COMPLAINT"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>شكوى طبية / ألم</span>
          </button>

          <button
            type="button"
            onClick={() => setNoteType("SUGGESTION")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black transition-all ${
              noteType === "SUGGESTION"
                ? "bg-white text-cyan-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>اقتراح للإدارة</span>
          </button>

          <button
            type="button"
            onClick={() => setNoteType("INQUIRY")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black transition-all ${
              noteType === "INQUIRY"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600 hover:from-cyan-700 hover:to-teal-600 shadow-xl shadow-cyan-600/25 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
