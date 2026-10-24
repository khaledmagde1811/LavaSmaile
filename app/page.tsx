import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import HeroSection from "@/components/HeroSection";
import BranchesSection from "@/components/BranchesSection";
import OffersSection from "@/components/OffersSection";
import MedicalSolutionsSection from "@/components/MedicalSolutionsSection";
import TreatmentResultsSection from "@/components/TreatmentResultsSection";
import SuccessStoriesSection from "@/components/SuccessStoriesSection";
import BrandLoader from "@/components/BrandLoader";
import Reveal from "@/components/Reveal";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  ShieldCheck,
  MapPin,
  HeartHandshake,
} from "lucide-react";
const services = [
  "ابتسامة هوليوود",
  "زراعة الأسنان الفورية",
  "تصميم الابتسامة رقمياً",
  "تقويم الأسنان",
  "تبييض الأسنان",
  "عدسات الفينير",
];
async function BookingFormForCurrentDate() {
  await connection();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <BookingForm initialAppointmentDate={tomorrow.toISOString().split("T")[0]} />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans dir-rtl">
      <Navbar />

      <HeroSection services={services} />

      <Reveal>
        <BranchesSection />
      </Reveal>

      <Reveal delay={0.05}>
        <MedicalSolutionsSection />
      </Reveal>

      <Reveal delay={0.1}>
        <OffersSection />
      </Reveal>

      <Reveal delay={0.05}>
        <TreatmentResultsSection />
      </Reveal>

      <Reveal delay={0.05}>
        <SuccessStoriesSection />
      </Reveal>

      {/* ================= INTERACTIVE BOOKING CANVAS ================= */}
      <Reveal>
      <section id="booking" className="relative mx-4 my-12 overflow-hidden rounded-[40px] bg-[#0E1B24] py-12 sm:mx-6 sm:my-16 sm:py-16 lg:mx-8 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:px-8 xl:grid-cols-[0.7fr_1.3fr] xl:gap-10">
          <div className="mb-8 space-y-5 text-center sm:mb-12 xl:mb-0 xl:text-right">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
              حجز موعد إلكتروني
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              سجل حجزك وملاحظاتك الآن
            </h2>
            <p className="mx-auto max-w-md text-sm leading-7 text-[#B7C8D1] xl:me-0">
              سيقوم نظامنا بتوجيه بيانات حجزك وشكواك إلى الفرع المختار والمدير الطبي فوراً.
            </p>
          </div>

          <div className="min-w-0">
            <Suspense fallback={<BrandLoader message="جاري تجهيز نموذج الحجز..." />}>
              <BookingFormForCurrentDate />
            </Suspense>
          </div>
        </div>
      </section>
      </Reveal>

      {/* ================= WHY CHOOSE US ================= */}
      <Reveal>
      <section id="features" className="border-t border-slate-100 bg-white py-14 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              لماذا يُفضل المرضى <span className="text-blue-600">Lava Smile</span>؟
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              تجربة علاجية صُممت للتخلص تماماً من رهبة زيارات طبيب الأسنان التقليدية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-md sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">ملف طبي سحابي موحد</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                ملفك ينقل معك بسلاسة بين المهندسين، مدينة نصر، والتجمع الخامس دون الحاجة لإعادة الشرح أو الفحوصات.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-md sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">رعاية ما بعد الإجراء</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                نستمر بالتواصل معك والاطمئنان على التئام الأسنان مع توفير تذكيرات آلية بالمواعيد الدورية.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-md sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">صوت المريض أولويتنا</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                أي ملاحظة أو شكوى تصل فوراً للإدارة الطبية لضمان تقديم أفضل تجربة علاجية تلبي توقعاتك.
              </p>
            </div>
          </div>

        </div>
      </section>
      </Reveal>

      <Footer />
    </div>
  );
}