"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  HeartPulse,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";

interface MedicalSolution {
  id: string;
  titleAr: string;
  titleEn: string | null;
  slug: string;
  shortDescription: string;
  content: string | null;
  price: number | null;
  icon: string | null;
  imageUrl: string | null;
  category: string | null;
  displayOrder: number;
}

const icons = {
  Activity,
  HeartPulse,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
};

function SolutionIcon({ icon }: { icon: string | null }) {
  const Icon = icon && icon in icons
    ? icons[icon as keyof typeof icons]
    : Sparkles;
  return <Icon className="h-6 w-6" aria-hidden="true" />;
}

export default function MedicalSolutionsSection() {
  const [solutions, setSolutions] = useState<MedicalSolution[]>([]);
  const [selected, setSelected] = useState<MedicalSolution | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSolutions() {
      try {
        const response = await fetch("/api/medical-solutions");
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل الخدمات الطبية");
        }
        if (isMounted) setSolutions(data.solutions);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الخدمات الطبية");
        }
      }
    }

    void loadSolutions();
    return () => { isMounted = false; };
  }, []);

  if (!error && solutions.length === 0) return null;

  const categories = [
    ...new Set(
      solutions
        .map((solution) => solution.category)
        .filter((category): category is string => Boolean(category))
    ),
  ];

  return (
    <section id="services" dir="rtl" className="relative bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 sm:mb-16 max-w-3xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800">
            حلولنا وخدماتنا الطبية
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            حلول طبية متكاملة برعايات عالمية
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            اكتشف خدماتنا الطبية المصممة لتلبية احتياجاتك بأعلى معايير الجودة.
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-700">{error}</p>
        ) : (
          <div className="space-y-12">
            {categories.length > 0
              ? categories.map((category) => (
                  <div key={category}>
                    <h3 className="mb-5 text-xl font-black text-slate-900">{category}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                      {solutions.filter((solution) => solution.category === category).map((solution) => (
                        <SolutionCard key={solution.id} solution={solution} onSelect={setSelected} />
                      ))}
                    </div>
                  </div>
                ))
              : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {solutions.filter((solution) => !solution.category).map((solution) => (
                <SolutionCard key={solution.id} solution={solution} onSelect={setSelected} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <article role="dialog" aria-modal="true" aria-labelledby="solution-title" className="relative my-2 w-[95%] max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl sm:my-auto sm:w-full sm:max-w-2xl">
            <button type="button" onClick={() => setSelected(null)} className="absolute left-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow" aria-label="إغلاق التفاصيل">
              <X size={20} />
            </button>
            {selected.imageUrl && (
              <div className="relative h-56 bg-slate-100">
                <Image src={selected.imageUrl} alt={selected.titleAr} fill unoptimized sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
              </div>
            )}
            <div className="space-y-4 p-4 sm:p-7">
              {selected.category && (
                <p className="text-xs font-bold text-cyan-700">{selected.category}</p>
              )}
              <h3 id="solution-title" className="break-words text-xl font-black text-slate-900 sm:text-2xl">{selected.titleAr}</h3>
              {selected.titleEn && <p className="text-sm font-semibold text-slate-500" dir="ltr">{selected.titleEn}</p>}
              <p className="leading-7 text-slate-600">{selected.content || selected.shortDescription}</p>
              {selected.price !== null && (
                <p className="text-lg font-black text-cyan-700">
                  السعر: {selected.price.toLocaleString("ar-EG")} ج.م
                </p>
              )}
              <Link href="/book#booking" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-3 font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-95">
                احجز استشارتك <ArrowLeft size={18} />
              </Link>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function SolutionCard({
  solution,
  onSelect,
}: {
  solution: MedicalSolution;
  onSelect: (solution: MedicalSolution) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(solution)}
      className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md"
      aria-label={`عرض تفاصيل ${solution.titleAr}`}
    >
      {solution.imageUrl && (
        <div className="relative h-40 w-full bg-slate-100">
          <Image src={solution.imageUrl} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
        </div>
      )}
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
          <SolutionIcon icon={solution.icon} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-cyan-700">{solution.titleAr}</h3>
          {solution.titleEn && <p className="text-xs font-semibold text-slate-400" dir="ltr">{solution.titleEn}</p>}
          <p className="line-clamp-4 text-xs leading-relaxed text-slate-500">{solution.shortDescription}</p>
          {solution.price !== null && (
            <p className="text-sm font-bold text-cyan-700">
              السعر: {solution.price.toLocaleString("ar-EG")} ج.م
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
          اكتشف المزيد <ArrowLeft size={16} />
        </span>
      </div>
    </button>
  );
}
