"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Printer,
  Stethoscope,
  Users,
} from "lucide-react";
import Logo from "@/components/Logo";
import BrandLoader from "@/components/BrandLoader";

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  branchId: string;
}

interface ReportAppointment {
  id: string;
  appointmentDate: string;
  status: string;
  bookingType: string;
  bookingTitle: string | null;
  bookingPrice: number | null;
  patientId: string;
  branchId: string;
  doctorId: string | null;
  branch: { id: string; name: string; city: string } | null;
  doctor: { id: string; name: string; specialty: string } | null;
  patient: { fullName: string } | null;
  service: { name: string } | null;
  medicalSolution: { titleAr: string } | null;
}

interface ReportResponse {
  success: boolean;
  message?: string;
  branches: BranchOption[];
  doctors: DoctorOption[];
  appointments: ReportAppointment[];
}

function localDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function getDefaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: localDateValue(from), to: localDateValue(to) };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    CONFIRMED: "مؤكد",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    NO_SHOW: "لم يحضر",
  };
  return labels[status] ?? status;
}

function bookingTitle(appointment: ReportAppointment) {
  return (
    appointment.bookingTitle ||
    appointment.medicalSolution?.titleAr ||
    appointment.service?.name ||
    "كشف عام"
  );
}

function csvCell(value: string | number) {
  let safeValue = String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(safeValue)) {
    safeValue = `'${safeValue}`;
  }
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function downloadCsv(appointments: ReportAppointment[]) {
  const headers = [
    "تاريخ الحجز",
    "اسم المريض",
    "الفرع",
    "الطبيب",
    "الخدمة",
    "الحالة",
    "القيمة التقديرية المسجلة",
    "رقم الحجز",
  ];
  const rows = appointments.map((appointment) => [
    formatDate(appointment.appointmentDate),
    appointment.patient?.fullName ?? "غير مسجل",
    appointment.branch?.name ?? "غير محدد",
    appointment.doctor?.name ?? "لم يحدد",
    bookingTitle(appointment),
    statusLabel(appointment.status),
    appointment.bookingPrice ?? "",
    appointment.id,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lava-smile-report-${localDateValue(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [branchId, setBranchId] = useState("ALL");
  const [doctorId, setDoctorId] = useState("ALL");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [appointments, setAppointments] = useState<ReportAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchReport() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ from, to, branchId, doctorId });
        const response = await fetch(`/api/admin/reports?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ReportResponse;
        if (response.status === 403) {
          if (active) setAccessDenied(true);
          return;
        }
        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل التقرير.");
        }
        if (active) {
          setBranches(data.branches);
          setDoctors(data.doctors);
          setAppointments(data.appointments);
        }
      } catch (loadError) {
        if (active && !controller.signal.aborted) {
          setError(
            loadError instanceof Error ? loadError.message : "تعذر تحميل التقرير."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchReport();
    return () => {
      active = false;
      controller.abort();
    };
  }, [branchId, doctorId, from, to, refreshKey]);

  const filteredDoctors = doctors.filter(
    (doctor) => branchId === "ALL" || doctor.branchId === branchId
  );
  const branchLabel =
    branchId === "ALL"
      ? "جميع الفروع"
      : branches.find((branch) => branch.id === branchId)?.name ?? "الفرع المحدد";
  const doctorLabel =
    doctorId === "ALL"
      ? "جميع الأطباء"
      : doctors.find((doctor) => doctor.id === doctorId)?.name ?? "الطبيب المحدد";
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;
  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;
  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;
  const cancelledCount = appointments.filter(
    (appointment) =>
      appointment.status === "CANCELLED" || appointment.status === "NO_SHOW"
  ).length;
  const estimatedValue = appointments.reduce(
    (total, appointment) => total + (appointment.bookingPrice ?? 0),
    0
  );
  const uniquePatients = new Set(appointments.map((item) => item.patientId)).size;

  const doctorReport = useMemo(() => {
    const grouped = new Map<
      string,
      { id: string; name: string; specialty: string; total: number; completed: number; patients: Set<string> }
    >();
    for (const doctor of doctors) {
      if (
        (branchId !== "ALL" && doctor.branchId !== branchId) ||
        (doctorId !== "ALL" && doctor.id !== doctorId)
      ) {
        continue;
      }
      grouped.set(doctor.id, {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        total: 0,
        completed: 0,
        patients: new Set<string>(),
      });
    }
    for (const appointment of appointments) {
      const key = appointment.doctorId ?? "UNASSIGNED";
      const item = grouped.get(key) ?? {
        id: key,
        name: appointment.doctor?.name ?? "لم يحدد طبيب",
        specialty: appointment.doctor?.specialty ?? "—",
        total: 0,
        completed: 0,
        patients: new Set<string>(),
      };
      item.total += 1;
      if (appointment.status === "COMPLETED") item.completed += 1;
      item.patients.add(appointment.patientId);
      grouped.set(key, item);
    }
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [appointments, branchId, doctorId, doctors]);

  const branchReport = useMemo(() => {
    const grouped = new Map<
      string,
      { id: string; name: string; city: string; total: number; completed: number; patients: Set<string> }
    >();
    for (const branch of branches) {
      if (branchId !== "ALL" && branch.id !== branchId) continue;
      grouped.set(branch.id, {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        total: 0,
        completed: 0,
        patients: new Set<string>(),
      });
    }
    for (const appointment of appointments) {
      const key = appointment.branchId;
      const item = grouped.get(key) ?? {
        id: key,
        name: appointment.branch?.name ?? "فرع غير معروف",
        city: appointment.branch?.city ?? "",
        total: 0,
        completed: 0,
        patients: new Set<string>(),
      };
      item.total += 1;
      if (appointment.status === "COMPLETED") item.completed += 1;
      item.patients.add(appointment.patientId);
      grouped.set(key, item);
    }
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [appointments, branchId, branches]);

  const serviceReport = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const appointment of appointments) {
      const title = bookingTitle(appointment);
      grouped.set(title, (grouped.get(title) ?? 0) + 1);
    }
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  }, [appointments]);

  if (accessDenied) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">التقارير متاحة للمدير العام فقط</h1>
          <Link href="/admin" className="mt-5 inline-flex items-center gap-2 font-bold text-cyan-700">
            <ArrowRight className="h-4 w-4" /> العودة إلى لوحة الإدارة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-5 text-slate-900 sm:px-6 sm:py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl space-y-5 print:max-w-none print:space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-cyan-700">
            <ArrowRight className="h-4 w-4" /> العودة للوحة الإدارة
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(appointments)}
              disabled={appointments.length === 0 || loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> تصدير CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || appointments.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> طباعة / حفظ PDF
            </button>
          </div>
        </header>

        <section className="report-paper overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="relative overflow-hidden bg-gradient-to-l from-slate-950 via-slate-800 to-cyan-900 px-5 py-7 text-white sm:px-8 sm:py-9 print:bg-slate-900 print:px-6 print:py-5">
            <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="rounded-2xl bg-white px-4 py-2">
                <Logo />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold tracking-widest text-cyan-200">REPORT • تقرير إداري</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">تقرير أداء الفروع والحالات</h1>
                <p className="mt-2 text-sm text-slate-200">
                  تقرير تشغيلي للفترة من {from} إلى {to}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-7 print:space-y-4 print:p-5">
            <section aria-label="مرشحات التقرير" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 print:hidden">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
                <Filter className="h-4 w-4 text-cyan-700" />
                تخصيص التقرير
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1 text-xs font-bold text-slate-600">
                  <span>من تاريخ</span>
                  <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
                </label>
                <label className="space-y-1 text-xs font-bold text-slate-600">
                  <span>إلى تاريخ</span>
                  <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
                </label>
                <label className="space-y-1 text-xs font-bold text-slate-600">
                  <span>الفرع</span>
                  <select value={branchId} onChange={(event) => { setBranchId(event.target.value); setDoctorId("ALL"); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900">
                    <option value="ALL">جميع الفروع</option>
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} — {branch.city}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-bold text-slate-600">
                  <span>الطبيب</span>
                  <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900">
                    <option value="ALL">جميع الأطباء</option>
                    {filteredDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} — {doctor.specialty}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading} className="inline-flex min-h-11 self-end items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  <CalendarDays className="h-4 w-4" />
                  {loading ? "جارٍ التحديث..." : "تحديث التقرير"}
                </button>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-xs sm:text-sm">
              <p><span className="font-bold text-slate-500">النطاق:</span> <strong>{branchLabel}</strong></p>
              <p><span className="font-bold text-slate-500">الطبيب:</span> <strong>{doctorLabel}</strong></p>
              <p><span className="font-bold text-slate-500">تاريخ الإصدار:</span> <strong>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}</strong></p>
            </div>

            {error && (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 print:hidden">
                {error}
              </div>
            )}
            {loading && <BrandLoader message="جارٍ إعداد التقرير..." />}
            {!loading && !error && (
              <>
                <section aria-label="ملخص التقرير" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "إجمالي الحجوزات", value: appointments.length, Icon: ClipboardList, color: "text-cyan-700", bg: "bg-cyan-50" },
                    { label: "حالات مكتملة", value: completedCount, Icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
                    { label: "حجوزات مؤكدة", value: confirmedCount, Icon: CalendarDays, color: "text-blue-700", bg: "bg-blue-50" },
                    { label: "بانتظار التأكيد", value: pendingCount, Icon: CalendarDays, color: "text-amber-700", bg: "bg-amber-50" },
                    { label: "مرضى فريدون", value: uniquePatients, Icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
                    { label: "ملغاة / لم يحضر", value: cancelledCount, Icon: Stethoscope, color: "text-rose-700", bg: "bg-rose-50" },
                  ].map(({ label, value, Icon, color, bg }) => (
                    <article key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 print:p-2">
                      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color} print:hidden`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 sm:text-xs">{label}</p>
                      <p className={`mt-1 text-2xl font-black ${color}`}>{value.toLocaleString("ar-EG")}</p>
                    </article>
                  ))}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-black">مؤشر الأطباء</h2>
                      <p className="mt-1 text-xs text-slate-500">عدد الحجوزات المسندة والحالات المكتملة لكل طبيب</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{doctorReport.length} طبيب / مجموعة</span>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[540px] text-right text-sm">
                      <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="px-3 py-3">الطبيب</th><th className="px-3 py-3">التخصص</th><th className="px-3 py-3">الحالات المسندة</th><th className="px-3 py-3">مكتملة</th><th className="px-3 py-3">مرضى فريدون</th></tr></thead>
                      <tbody>
                        {doctorReport.map((doctor) => (
                          <tr key={doctor.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-3 font-bold">{doctor.name}</td><td className="px-3 py-3 text-slate-600">{doctor.specialty}</td><td className="px-3 py-3 font-black">{doctor.total.toLocaleString("ar-EG")}</td><td className="px-3 py-3 font-bold text-emerald-700">{doctor.completed.toLocaleString("ar-EG")}</td><td className="px-3 py-3">{doctor.patients.size.toLocaleString("ar-EG")}</td>
                          </tr>
                        ))}
                        {doctorReport.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">لا توجد حالات في الفترة المحددة.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <h2 className="font-black">ملخص الفروع</h2>
                    <div className="mt-3 space-y-2">
                      {branchReport.map((branch) => (
                        <div key={branch.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                          <div className="min-w-0"><p className="truncate font-bold">{branch.name}</p><p className="text-xs text-slate-500">{branch.city} · {branch.patients.size.toLocaleString("ar-EG")} مريض</p></div>
                          <div className="shrink-0 text-left"><p className="font-black">{branch.total.toLocaleString("ar-EG")} حجز</p><p className="text-xs text-emerald-700">{branch.completed.toLocaleString("ar-EG")} مكتمل</p></div>
                        </div>
                      ))}
                      {branchReport.length === 0 && <p className="py-5 text-center text-sm text-slate-500">لا توجد بيانات للفترة.</p>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <h2 className="font-black">أكثر الخدمات طلبًا</h2>
                    <div className="mt-3 space-y-3">
                      {serviceReport.slice(0, 8).map(([service, count]) => {
                        const percent = appointments.length ? (count / appointments.length) * 100 : 0;
                        return (
                          <div key={service}>
                            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate font-bold">{service}</span><span className="shrink-0 font-black text-cyan-800">{count.toLocaleString("ar-EG")}</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-cyan-700 to-teal-400" style={{ width: `${percent}%` }} /></div>
                          </div>
                        );
                      })}
                      {serviceReport.length === 0 && <p className="py-5 text-center text-sm text-slate-500">لا توجد بيانات للفترة.</p>}
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div><h2 className="font-black">تفاصيل الحالات</h2><p className="mt-1 text-xs text-slate-500">{appointments.length.toLocaleString("ar-EG")} سجل في النتائج</p></div>
                    <p className="text-xs text-slate-500">القيمة التقديرية المسجلة: <strong className="text-slate-900">{estimatedValue.toLocaleString("ar-EG")} ج.م</strong></p>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[900px] text-right text-xs sm:text-sm">
                      <thead><tr className="border-b border-slate-200 text-[11px] text-slate-500"><th className="px-2 py-3">التاريخ</th><th className="px-2 py-3">المريض</th><th className="px-2 py-3">الفرع</th><th className="px-2 py-3">الطبيب</th><th className="px-2 py-3">الخدمة</th><th className="px-2 py-3">الحالة</th><th className="px-2 py-3">قيمة مسجلة</th></tr></thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr key={appointment.id} className="border-b border-slate-100 last:border-0">
                            <td className="whitespace-nowrap px-2 py-3">{formatDate(appointment.appointmentDate)}</td><td className="px-2 py-3 font-bold">{appointment.patient?.fullName ?? "غير مسجل"}</td><td className="px-2 py-3">{appointment.branch?.name ?? "—"}</td><td className="px-2 py-3">{appointment.doctor?.name ?? "لم يحدد"}</td><td className="max-w-48 truncate px-2 py-3">{bookingTitle(appointment)}</td><td className="px-2 py-3">{statusLabel(appointment.status)}</td><td className="whitespace-nowrap px-2 py-3">{appointment.bookingPrice !== null ? `${appointment.bookingPrice.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                          </tr>
                        ))}
                        {appointments.length === 0 && <tr><td colSpan={7} className="px-2 py-10 text-center text-slate-500">لا توجد حجوزات في نطاق التقرير المحدد.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-[10px] text-slate-500 sm:text-xs">
              <p>مراكز لاڤا لطب وتجميل الأسنان · تقرير داخلي للاستخدام الإداري</p>
              <p>القيم المالية للحجوزات تقديرية ومسجلة، وليست تقريرًا للتحصيل الفعلي.</p>
            </footer>
          </div>
        </section>
      </div>
      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .report-paper { color: #111827; }
          thead { display: table-header-group; }
          tr, article, section { break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}
