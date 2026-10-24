"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BadgeCheck, Sparkles } from "lucide-react";

interface TreatmentResult {
  id: string;
  procedure: string;
  branchName: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

export default function TreatmentResultsSection() {
  const [results, setResults] = useState<TreatmentResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadResults() {
      try {
        const response = await fetch("/api/treatment-results", {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.treatmentResults)) {
          throw new Error(data.message || "تعذر تحميل نتائج العلاج.");
        }
        setResults(data.treatmentResults);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error("Failed to load treatment results:", loadError);
        setError(
          loadError instanceof Error ? loadError.message : "تعذر تحميل نتائج العلاج."
        );
      }
    }

    void loadResults();
    return () => controller.abort();
  }, []);

  if (!error && results.length === 0) return null;

  return (
    <section
      id="treatment-results"
      dir="rtl"
      aria-labelledby="treatment-results-title"
      className="bg-slate-50 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3.5 py-2 text-xs font-bold text-cyan-800">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            نتائج بموافقة أصحابها
          </span>
          <h2
            id="treatment-results-title"
            className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl"
          >
            ابتسامات حقيقية، خطوة بخطوة
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            استعرض صورًا لحالات علاجية منشورة بعد الحصول على موافقة أصحابها.
            تختلف النتائج وخطة العلاج من حالة لأخرى.
          </p>
        </div>

        {error ? (
          <p
            role="status"
            className="rounded-2xl border border-rose-200 bg-white p-5 text-center text-sm text-rose-700"
          >
            {error}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {results.map((result) => (
              <article
                key={result.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200">
                    {result.beforeImageUrl && (
                      <Image
                        src={result.beforeImageUrl}
                        alt={`قبل العلاج: ${result.procedure}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 45vw, (max-width: 1280px) 22vw, 15vw"
                        className="object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white">
                      قبل
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200">
                    {result.afterImageUrl && (
                      <Image
                        src={result.afterImageUrl}
                        alt={`بعد العلاج: ${result.procedure}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 45vw, (max-width: 1280px) 22vw, 15vw"
                        className="object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-emerald-700/90 px-2.5 py-1 text-[11px] font-bold text-white">
                      بعد
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <BadgeCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900">{result.procedure}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {result.branchName}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
