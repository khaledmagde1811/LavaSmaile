"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SmileWhiteningModal from "@/components/SmileWhiteningModal";
import {
  PiArrowLeftBold,
  PiCalendarCheckBold,
  PiMapPinLineBold,
  PiPhoneBold,
  PiSealCheckBold,
  PiSealCheckFill,
  PiSparkleFill,
  PiStarFill,
  PiToothFill,
  PiUsersThreeFill,
} from "react-icons/pi";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";

const stats = [
  { value: "+15k", label: "حالة ناجحة", Icon: PiUsersThreeFill },
  { value: "100%", label: "ضمان الجودة", Icon: PiSealCheckFill },
  { value: "4.9", label: "تقييم المرضى", Icon: PiStarFill },
];

export default function HeroSection({ services }: { services: string[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isSmileModalOpen, setIsSmileModalOpen] = useState(false);
  const closeSmileModal = useCallback(() => setIsSmileModalOpen(false), []);

  function handleQuickBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneNumber = phone.trim();
    if (!phoneNumber) return;
    router.push(`/?phone=${encodeURIComponent(phoneNumber)}#booking`);
  }

  return (
    <section
      dir="rtl"
      aria-labelledby="hero-title"
      className="relative isolate w-full overflow-hidden bg-[#F4F7F8] font-sans"
    >
      <style>{`
        @keyframes ls-marquee { to { transform: translateX(50%); } }
        @keyframes ls-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes ls-spin { to { transform: rotate(360deg); } }
        @keyframes ls-draw { from { stroke-dashoffset: 400 } to { stroke-dashoffset: 0 } }
        .ls-marquee { animation: ls-marquee 28s linear infinite; }
        .ls-float { animation: ls-float 5s ease-in-out infinite; }
        .ls-float-slow { animation: ls-float 7s ease-in-out infinite; }
        .ls-spin { animation: ls-spin 40s linear infinite; }
        .ls-draw { stroke-dasharray: 400; animation: ls-draw 1.6s .4s ease-in-out infinite alternate; }
        @media (max-width: 639px) {
          .ls-float,.ls-float-slow,.ls-spin { animation: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ls-marquee,.ls-float,.ls-float-slow,.ls-spin,.ls-draw { animation: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-20 right-0 -z-10 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 -z-10 select-none text-center text-[22vw] font-black leading-none tracking-tighter text-transparent [-webkit-text-stroke:2px_rgba(8,145,178,0.12)] lg:text-[16rem]">
        LAVA
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="relative z-10 space-y-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-800 sm:text-sm">
                الحجوزات متاحة اليوم بجميع الفروع
              </span>
            </div>

            <h1 id="hero-title" className="text-6xl font-black leading-[0.95] tracking-tight text-slate-900 sm:text-7xl lg:text-[8rem]">
              <span className="block">LAVA</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-cyan-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
                  SMILE
                </span>
                <svg aria-hidden="true" viewBox="0 0 300 40" className="absolute -bottom-3 left-0 h-6 w-full sm:h-8" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="ls-smile" x1="0" x2="1">
                      <stop offset="0" stopColor="#0e7490" />
                      <stop offset="1" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  <path className="ls-draw" d="M6 8 C 80 44, 220 44, 294 8" stroke="url(#ls-smile)" strokeWidth="9" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <div className="max-w-xl space-y-4 pt-3">
  {/* النص التمهيدي */}
  <p className="text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
    نوفر لك أحدث الحلول الرقمية لتجميل وزراعة الأسنان مع فريقنا الاستشاري بجميع الفروع لتجربة علاجية رفيعة المستوى:
  </p>

  {/* شارات الخدمات الرئيسية */}
  <div className="flex flex-wrap items-center gap-2.5 pt-1">
    <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/80 bg-cyan-50/80 px-3.5 py-2 text-xs font-bold text-cyan-900 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-100/80 sm:text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-cyan-600" />
      ابتسامة هوليوود الرقمية
    </span>

    <span className="inline-flex items-center gap-2 rounded-xl border border-teal-200/80 bg-teal-50/80 px-3.5 py-2 text-xs font-bold text-teal-900 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-100/80 sm:text-sm">
      <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
      زراعة الأسنان الفورية
    </span>

    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-cyan-200 sm:text-sm">
      <Clock className="h-4 w-4 shrink-0 text-cyan-600" />
      بدون ألم وفي جلسة واحدة
    </span>
  </div>
</div>

            <form onSubmit={handleQuickBooking} className="flex max-w-2xl flex-col gap-2 rounded-[1.75rem] border border-white bg-white p-2.5 shadow-2xl shadow-cyan-900/10 ring-1 ring-[#E3EAEE] sm:flex-row sm:items-center sm:rounded-full">
              <label className="flex flex-1 items-center gap-3 rounded-full px-4 py-3 transition-colors focus-within:bg-cyan-50/70">
                <PiPhoneBold className="shrink-0 text-xl text-teal-600" aria-hidden="true" />
                <span className="sr-only">رقم الهاتف</span>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={32}
                  placeholder="رقم موبايلك للحجز السريع"
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                />
              </label>
              <button type="submit" className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-colors duration-300 hover:from-cyan-700 hover:to-teal-600 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 active:scale-[0.99]">
                <PiCalendarCheckBold className="text-lg" aria-hidden="true" />
                احجز استشارتك
                <PiArrowLeftBold className="transition-transform duration-300 group-hover:-translate-x-1.5" aria-hidden="true" />
              </button>
            </form>

            <Link href="#branches" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition-colors hover:text-cyan-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-cyan-300">
                <PiMapPinLineBold className="text-lg text-teal-600" aria-hidden="true" />
              </span>
              أو استكشف الفروع القريبة منك
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
            <div aria-hidden="true" className="ls-spin absolute -inset-6 rounded-full border-2 border-dashed border-cyan-300/60" />
            <div aria-hidden="true" className="absolute -inset-12 rounded-full border border-cyan-200/60" />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] border-[6px] border-white bg-slate-900 shadow-2xl shadow-cyan-900/25 lg:h-[620px] lg:aspect-auto">
              <Image
                src="/imges/background.jpg"
                alt="فريق Lava Smile في عيادات الأسنان"
                fill
                priority
                quality={95}
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="object-cover object-center"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-cyan-900/10" />
              <p className="absolute inset-x-0 bottom-6 px-6 text-center text-sm font-bold text-white drop-shadow">
                نخبة من استشاريي الأسنان لخدمتكم
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSmileModalOpen(true)}
              className="ls-float absolute -right-3 top-24 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-right shadow-2xl shadow-cyan-900/20 backdrop-blur-md transition-all hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 active:scale-95 sm:-right-8"
              aria-haspopup="dialog"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-md shadow-cyan-600/20">
                <PiToothFill className="text-xl" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-black text-slate-900">جرب تبييض ابتسامتك إلكترونياً </span>
                <span className="mt-1 block text-[11px] font-bold text-cyan-700">شاهد شكل أسنانك بعد التبييض فوراً</span>
              </span>
            </button>

            <div className="ls-float-slow absolute -left-3 bottom-28 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md sm:-left-8">
              <PiStarFill className="text-xl text-amber-400" aria-hidden="true" />
              <div className="leading-tight">
                <p className="text-sm font-black text-slate-900">4.9</p>
                <p className="text-[11px] font-bold text-slate-500">تقييم المرضى</p>
              </div>
            </div>
            <div aria-hidden="true" className="ls-float absolute -left-2 top-10 text-cyan-500 sm:left-2">
              <PiSparkleFill className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/20 overflow-hidden rounded-[2rem] bg-gradient-to-l from-cyan-700 via-cyan-600 to-teal-500 shadow-xl shadow-cyan-900/20">
          {stats.map(({ value, label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-2 py-5 text-center text-white transition-colors hover:bg-white/10 sm:flex-row sm:justify-center sm:gap-4 sm:py-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 sm:h-12 sm:w-12">
                <Icon className="text-xl sm:text-2xl" aria-hidden="true" />
              </span>
              <div className="sm:text-right">
                <div className="text-xl font-black sm:text-3xl">{value}</div>
                <div className="text-xs font-bold text-cyan-50/90">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden border-y border-slate-200/70 bg-white/60 py-4 backdrop-blur" aria-label="خدماتنا">
        <div className="ls-marquee flex w-max gap-10 whitespace-nowrap">
          {[...services, ...services, ...services, ...services].map((service, index) => (
            <Link
              key={`${service}-${index}`}
              href="#services"
              className="inline-flex items-center gap-3 text-sm font-extrabold text-slate-600 transition-colors hover:text-cyan-600 sm:text-base"
              aria-label={`استكشف خدمة ${service}`}
            >
              <PiSealCheckBold className="text-teal-500" aria-hidden="true" />
              {service}
            </Link>
          ))}
        </div>
      </div>

      <SmileWhiteningModal
        isOpen={isSmileModalOpen}
        onClose={closeSmileModal}
      />
    </section>
  );
}
