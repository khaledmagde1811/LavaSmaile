import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import Image from "next/image";


import {
  Sparkles,
  ArrowLeft,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle2,
  Phone,
  Clock,
  Award,
  ChevronLeft,
  Users,
  Activity,
  HeartHandshake,
  Star,
  ArrowUpRight,
  Stethoscope,
  Smile,
  Zap,
  Check,
  Compass,


} from "lucide-react";
import {
  PiArrowLeftBold,
  PiCalendarCheckBold,
  PiMapPinLineBold,
  PiSealCheckFill,
  PiStarFill,
  PiUsersThreeFill,
  PiClockBold,
  PiPhoneBold,
  PiStethoscopeBold,
  PiMapPinBold,
} from "react-icons/pi";

const stats = [
  { value: "+15k", label: "حالة ناجحة", Icon: PiUsersThreeFill },
  { value: "100%", label: "ضمان الجودة", Icon: PiSealCheckFill },
  { value: "4.9", label: "تقييم المرضى", Icon: PiStarFill },
];
export default function Home() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black dir-rtl">
      <Navbar />

      {/* ================= HERO BENTO SECTION ================= */}
      <section dir="rtl" className="relative min-h-screen w-full flex items-center bg-white overflow-hidden pt-24 pb-16 font-sans">
        {/* خلفية الصورة - واضحة وممتدة على الجانب الأيسر */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-3/5 z-0">
          <Image
            src="/imges/background.jpg"
            alt="Lava Smile Dental Care"
            fill
            priority
            quality={95}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-center"
          />
          {/* تدرج تظليل خفيف جداً على الصورة من اليسار لإبراز تفاصيلها */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-white lg:to-white" />
          {/* دمج أبيض مع الجزء الأيمن في الشاشات الكبيرة */}
          <div className="hidden lg:block absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent" />
        </div>

        {/* التغطية البيضاء الشفافة للشاشات الصغيرة لضمان وضوح النص */}
        <div className="absolute inset-0 bg-white/90 lg:bg-transparent z-0 lg:hidden" />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl lg:max-w-2xl">

            {/* محتوى الـ Hero على خلفية بيضاء نقية */}
            <div className="space-y-8 lg:pr-4">

              {/* Badge الحالة المتاحة */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-800 sm:text-sm">
                  الحجوزات متاحة اليوم بجميع الفروع
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                LAVA{" "}
                <span className="bg-gradient-to-l from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  SMILE
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
                سواء كنت تبحث عن ابتسامة هوليوود المصممة رقمياً أو زراعة الأسنان
                الفورية، فريقنا الاستشاري متواجد بفرعك المفضل لتجربة علاجية رفيعة
                المستوى.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
                <Link
                  href="#booking"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-9 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 active:translate-y-0"
                >
                  <PiCalendarCheckBold className="text-xl" />
                  حجز موعد الاستشارة
                  <PiArrowLeftBold className="text-lg transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>

                <Link
                  href="#branches"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-9 py-4 text-base font-bold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/50 active:translate-y-0"
                >
                  <PiMapPinLineBold className="text-xl text-blue-600" />
                  استكشاف الفروع
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200/80">
                {stats.map(({ value, label, Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                  >
                    <Icon className="mb-2 text-xl text-blue-600 sm:text-2xl" />
                    <div className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      {value}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>
      {/* ================= BRANCHES SHOWCASE SECTION ================= */}
      <section id="branches" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
                شبكة الفروع الموحدة
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
                عياداتنا القريبة منك
              </h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base max-w-md leading-relaxed">
              ملفك الطبي وسجل علاجك موحدين تماماً عبر السحابة في جميع فروعنا، لخدمتك أينما كنت بنفس معايير الجودة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Branch 1 */}
            <div className="group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:border-blue-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between space-y-8 relative overflow-hidden">

              <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                    الفرع الرئيسي
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    مفتوح الآن
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">فرع المهندسين</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    شارع جامعة الدول العربية، أمام نادي الصيد مباشرة — الجيزة.
                  </p>
                </div>

                <div className="space-y-4 pt-5 border-t border-slate-100 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <PiClockBold className="text-lg text-blue-600" />
                    </span>
                    <span>يومياً: 10:00 ص - 10:00 م</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <PiPhoneBold className="text-lg text-emerald-600" />
                    </span>
                    <span dir="ltr">01012345671</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                      <PiStethoscopeBold className="text-lg text-cyan-600" />
                    </span>
                    <span>د. أحمد زهران (استشاري جراحة وزراعة الأسنان)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 relative">
                <Link
                  href="#booking"
                  className="flex-1 py-3.5 px-4 rounded-full text-center font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                >
                  حجز موعد بالمهندسين
                </Link>
                <a
                  href="https://maps.google.com/?q=30.0526,31.2017"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-colors"
                  title="الموقع على Google Maps"
                >
                  <PiMapPinBold className="text-xl" />
                </a>
              </div>
            </div>

            {/* Branch 2 */}
            <div className="group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:border-blue-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between space-y-8 relative overflow-hidden">

              <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                    فرع شرق القاهرة
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    مفتوح الآن
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">فرع مدينة نصر</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    شارع عباس العقاد، أمام مول سيتي ستارز مباشرة — القاهرة.
                  </p>
                </div>

                <div className="space-y-4 pt-5 border-t border-slate-100 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <PiClockBold className="text-lg text-blue-600" />
                    </span>
                    <span>يومياً: 11:00 ص - 11:00 م</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <PiPhoneBold className="text-lg text-emerald-600" />
                    </span>
                    <span dir="ltr">01012345672</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                      <PiStethoscopeBold className="text-lg text-cyan-600" />
                    </span>
                    <span>د. دينا عادل (أخصائية تجميل وهوليوود سمايل)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 relative">
                <Link
                  href="#booking"
                  className="flex-1 py-3.5 px-4 rounded-full text-center font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                >
                  حجز موعد بمدينة نصر
                </Link>
                <a
                  href="https://maps.google.com/?q=30.0561,31.3437"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-colors"
                  title="الموقع على Google Maps"
                >
                  <PiMapPinBold className="text-xl" />
                </a>
              </div>
            </div>

            {/* Branch 3 */}
            <div className="group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:border-blue-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between space-y-8 relative overflow-hidden">

              <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                    فرع القاهرة الجديدة
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    مفتوح الآن
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">فرع التجمع الخامس</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    شارع التسعين الشمالي، مجمع ميديكال بارك بريميير — التجمع.
                  </p>
                </div>

                <div className="space-y-4 pt-5 border-t border-slate-100 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <PiClockBold className="text-lg text-blue-600" />
                    </span>
                    <span>يومياً: 12:00 م - 10:00 م</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <PiPhoneBold className="text-lg text-emerald-600" />
                    </span>
                    <span dir="ltr">01012345673</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                      <PiStethoscopeBold className="text-lg text-cyan-600" />
                    </span>
                    <span>د. كريم الشناوي (أخصائي تقويم الأسنان)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 relative">
                <Link
                  href="#booking"
                  className="flex-1 py-3.5 px-4 rounded-full text-center font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                >
                  حجز موعد بالتجمع
                </Link>
                <a
                  href="https://maps.google.com/?q=30.0264,31.4883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-colors"
                  title="الموقع على Google Maps"
                >
                  <PiMapPinBold className="text-xl" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= SERVICES GRID SECTION ================= */}
      <section id="services" className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
              التخصصات المتقدمة
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              حلول طبية متكاملة برعايات عالمية
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              نستخدم أحدث المواد المعتمدة من منظمة الغذاء والدواء الأمريكية (FDA) مع تقنيات علاج بدون ألم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Service 1 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">ابتسامة هوليوود (3D Lava)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  عدسات إيماكس وفينير ألماني فائق النقاء وتصميم رقمي مطابق تماماً لملامح وجهك.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">تبدأ من</span>
                <span className="text-sm font-bold text-blue-600">18,000 ج.م</span>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">الزراعة الفورية بدون جراحة</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  غرسات تيتانيوم ألمانية وسويسرية مع إمكانية التركيب الفوري في نفس الجلسة.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">تبدأ من</span>
                <span className="text-sm font-bold text-cyan-600">9,500 ج.م</span>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-sky-500 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">تبييض الأسنان بالليزر</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تقنية Zoom 4 المتقدمة لتفتيح حتى 8 درجات في جلسة واحدة خلال 45 دقيقة.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">تبدأ من</span>
                <span className="text-sm font-bold text-sky-600">2,500 ج.م</span>
              </div>
            </div>

            {/* Service 4 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">علاج الجذور بالميكروسكوب</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تنظيف وحشو العصب بأحدث أجهزة الروتاري والميكروسكوب لضمان أعلى نسب النجاح.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">تبدأ من</span>
                <span className="text-sm font-bold text-indigo-600">1,800 ج.م</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE BOOKING CANVAS ================= */}
      <section id="booking" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
              حجز موعد إلكتروني
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              سجل حجزك وملاحظاتك الآن
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              سيقوم نظامنا بتوجيه بيانات حجزك وشكواك إلى الفرع المختار والمدير الطبي فوراً.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50">
            <BookingForm />
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              لماذا يُفضل المرضى <span className="text-blue-600">Lava Smile</span>؟
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              تجربة علاجية صُممت للتخلص تماماً من رهبة زيارات طبيب الأسنان التقليدية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ملف طبي سحابي موحد</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                ملفك ينقل معك بسلاسة بين المهندسين، مدينة نصر، والتجمع الخامس دون الحاجة لإعادة الشرح أو الفحوصات.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">رعاية ما بعد الإجراء</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                نستمر بالتواصل معك والاطمئنان على التئام الأسنان مع توفير تذكيرات آلية بالمواعيد الدورية.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">صوت المريض أولويتنا</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                أي ملاحظة أو شكوى تصل فوراً للإدارة الطبية لضمان تقديم أفضل تجربة علاجية تلبي توقعاتك.
              </p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}