import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandLoader from "@/components/BrandLoader";
import BookingForm from "@/components/BookingForm";
import { Sparkles, Shield, Clock, Award, Phone } from "lucide-react";
import { Suspense } from "react";
import { connection } from "next/server";

export const metadata = {
  title: "احجز موعدك الآن | Lava Smile Dental Centers",
  description: "احجز كشفك في مراكز لاڤا سمايل لطب وتجميل الأسنان، واختر الفرع الأنسب لك وسجل شكواك أو اقتراحك مباشرة.",
};

type BookSearchParams = Promise<{
  branch?: string | string[];
  offer?: string | string[];
}>;

async function BookingFormWithParams({ searchParams }: { searchParams?: BookSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const branchId = Array.isArray(params.branch) ? params.branch[0] : params.branch;
  const offerId = Array.isArray(params.offer) ? params.offer[0] : params.offer;
  await connection();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <BookingForm
      preselectedBranchId={branchId}
      preselectedOfferId={offerId}
      initialAppointmentDate={tomorrow.toISOString().split("T")[0]}
    />
  );
}

export default function BookPage({
  searchParams,
}: {
  searchParams?: BookSearchParams;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="booking" className="flex-1 px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-100/70 text-cyan-800 text-xs font-black shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            حجز ذكي وسريع خلال دقيقة واحدة
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            حجز موعد جديد في <span className="text-cyan-600">لاڤا سمايل</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            اختر الفرع الأقرب إليك، وحدد موعد الزيارة وسجل شكواك الطبية أو اقتراحك للإدارة ليتم تحضير ملفك الطبي مسبقاً قبل وصولك.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 block">تعقيم جراحي</span>
              <span className="text-[10px] text-slate-500">وفق بروتوكولات عالمية</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-cyan-500 shrink-0" />
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 block">بدون انتظار</span>
              <span className="text-[10px] text-slate-500">التزام صارم بالمواعيد</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 block">نخبة الاستشاريين</span>
              <span className="text-[10px] text-slate-500">أعلى درجات الخبرة</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 block">تأكيد فوري</span>
              <span className="text-[10px] text-slate-500">عبر الواتساب والمكالمة</span>
            </div>
          </div>
        </div>

        {/* The Form */}
        <Suspense fallback={<BrandLoader message="جاري تجهيز نموذج الحجز..." />}>
          <BookingFormWithParams searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
