"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Activity,
  LogOut,
  ArrowRight,
  Shield,
  FileText,
  Plus,
} from "lucide-react";

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatientData() {
      try {
        const res = await fetch("/api/patient/me");
        const data = await res.json();
        if (data.success && data.patient) {
          setPatient(data.patient);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to load patient data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
  }, [router]);

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
        <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">جاري تحميل ملفك الطبي وحجوزاتك...</p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-950">
                LAVA <span className="text-cyan-600">SMILE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">بوابة المريض والملف الطبي</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
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
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60 inline-block mb-1">
              الملف الطبي الموحد
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              أهلاً بك، {patient.fullName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              تابع من هنا مواعيد حجوزاتك، تاريخ الشكاوى الطبية والمقترحات التي سجلتها، ومواعيد المتابعة الدورية.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs space-y-1 text-right shrink-0">
            <div><span className="text-slate-400">الهاتف:</span> <strong dir="ltr">{patient.phone}</strong></div>
            {patient.nationalId && <div><span className="text-slate-400">الرقم القومي:</span> {patient.nationalId}</div>}
            {patient.address && <div><span className="text-slate-400">العنوان:</span> {patient.address}</div>}
          </div>
        </div>

        {/* Section 1: Upcoming Follow-ups */}
        {patient.followUps && patient.followUps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900">مواعيد المتابعة الطبية القادمة</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.followUps.map((f: any) => {
                const fDate = new Date(f.scheduledDate);
                return (
                  <div key={f.id} className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
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
              {patient.appointments.map((apt: any) => {
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
                          {apt.service?.name || "كشف وتشخيص عام"}
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
                        {apt.status === "PENDING" && "⏳ قيد مراجعة وتأكيد الاستقبال"}
                        {apt.status === "CONFIRMED" && "✔️ حجز مؤكد - بانتظار تشريفك"}
                        {apt.status === "COMPLETED" && "✨ اكتمل العلاج بنجاح"}
                        {apt.status === "CANCELLED" && "❌ تم الإلغاء"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        تاريخ الموعد: {aDate.toLocaleDateString("ar-EG")} الساعة {aDate.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {apt.doctor && (
                        <span>الطبيب: د. {apt.doctor.name}</span>
                      )}
                    </div>

                    {/* Complaint History */}
                    {apt.noteType === "COMPLAINT" && apt.patientComplaint && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>الشكوى التي سجلتها أثناء الحجز:</span>
                        </div>
                        <p className="text-rose-900 font-semibold leading-relaxed">
                          "{apt.patientComplaint}"
                        </p>
                        {apt.painLocation && (
                          <span className="inline-block mt-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                            🎯 موضع الألم: {apt.painLocation}
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
                          "{apt.patientSuggestion}"
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
