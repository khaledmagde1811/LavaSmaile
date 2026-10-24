"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BrandLoader from "@/components/BrandLoader";
import {
  ArrowLeft,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

const stats = [
  { value: "+15k", label: "حالة ناجحة", Icon: UsersRound },
  { value: "4.9/5", label: "تقييم المرضى", Icon: Star },
  { value: "100%", label: "ضمان الجودة", Icon: ShieldCheck },
];

export default function SuccessStoriesSection() {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  return (
    <section
      id="testimonials"
      dir="rtl"
      aria-labelledby="success-stories-title"
      className="relative overflow-hidden bg-white py-12 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 h-64 w-64 rounded-full bg-cyan-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 px-5 sm:px-6 lg:grid-cols-12 lg:px-8">
        <article className="order-last rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-xl shadow-slate-900/[0.04] backdrop-blur-sm sm:p-9 lg:order-first lg:col-span-7 lg:p-10">
          <Logo className="mb-5" />

          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-bold text-cyan-800 sm:text-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            حكاية شغف ورعاية
          </span>

          <h2
            id="success-stories-title"
            className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
          >
            رحلة شغف ونجاح.. كيف بدأت قصتنا في{" "}
            <span className="bg-gradient-to-l from-cyan-700 to-teal-500 bg-clip-text text-transparent">
              Lava Smile؟
            </span>
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            بدأت قصتنا برؤية الدكتور المؤسس لتقديم تجربة مختلفة في طب الأسنان؛
            رعاية متميزة تضع راحة المريض وثقته في المقام الأول، وتساعده على خوض
            رحلة العلاج دون خوف. ومع التطوير المستمر والاهتمام بأحدث تقنيات طب
            الأسنان، نواصل العمل لنمنح كل مراجع تجربة علاجية تليق بابتسامته.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
            {stats.map(({ value, label, Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition-colors hover:border-cyan-300 sm:p-4"
              >
                <Icon
                  className="mb-2 h-4 w-4 text-cyan-700 sm:mb-3 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <p className="text-lg font-black tracking-tight text-slate-900 sm:text-2xl">
                  {value}
                </p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500 sm:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book#booking"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-cyan-700 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              احجز استشارة الآن
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 sm:justify-start">
              <Heart className="h-4 w-4 text-teal-600" aria-hidden="true" />
              راحتك أولويتنا في كل خطوة
            </span>
          </div>
        </article>

        <div className="relative order-first mx-auto w-full max-w-[280px] lg:order-last lg:col-span-5">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[3.5rem] bg-gradient-to-br from-cyan-100/80 via-white/50 to-teal-100/80 blur-xl"
          />
          <div className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-[2rem] border-4 border-slate-800 bg-slate-900 shadow-2xl shadow-slate-900/25">
            {isVideoLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <BrandLoader message="جارٍ تحميل قصة النجاح..." />
              </div>
            )}
            <iframe
              title="قصة تأسيس وتطور Lava Smile مع الدكتور المؤسس"
              src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F2246404789152647%2F&show_text=false&width=267"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              onLoad={() => setIsVideoLoading(false)}
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen={true}
            />
          </div>
          <p className="mt-5 text-center text-xs font-medium text-slate-500">
            شاهد حكاية Lava Smile من رؤية المؤسس
          </p>
        </div>
      </div>
    </section>
  );
}
