"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Phone, RefreshCw, Stethoscope } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  mapUrl: string | null;
  doctors: { id: string; name: string; specialty: string }[];
}

interface BranchesResponse {
  success: boolean;
  branches: Branch[];
  message?: string;
}

async function getBranches(): Promise<Branch[]> {
  const response = await fetch("/api/branches");
  const result = (await response.json()) as Partial<BranchesResponse>;
  if (!response.ok || !result.success || !Array.isArray(result.branches)) {
    throw new Error(result.message || "تعذر تحميل الفروع. يرجى المحاولة مرة أخرى.");
  }
  return result.branches;
}

function getMapUrl(branch: Branch): string {
  if (branch.mapUrl) {
    try {
      const url = new URL(branch.mapUrl);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      // Fall back to searching by the branch address.
    }
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${branch.name}, ${branch.address}, ${branch.city}`
  )}`;
}

export default function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void getBranches()
      .then((data) => {
        if (!cancelled) setBranches(data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load branches:", error);
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "تعذر تحميل الفروع. يرجى المحاولة مرة أخرى."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retryLoadingBranches = useCallback(() => {
    setLoading(true);
    setErrorMessage("");
    void getBranches()
      .then(setBranches)
      .catch((error: unknown) => {
        console.error("Failed to load branches:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "تعذر تحميل الفروع. يرجى المحاولة مرة أخرى."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="branches" className="relative bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-16 flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-800 shadow-sm">
              شبكة الفروع الموحدة
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              عياداتنا القريبة منك
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
            ملفك الطبي وسجل علاجك موحدان عبر جميع فروعنا لخدمتك أينما كنت.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3" aria-label="جاري تحميل الفروع">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-8"
              >
                <div className="h-6 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
                <div className="h-10 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={retryLoadingBranches}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-rose-700 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : branches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
            لا توجد فروع متاحة للحجز حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {branches.map((branch) => (
              <article
                key={branch.id}
                className="group flex flex-col justify-between space-y-6 sm:space-y-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md sm:p-8"
              >
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-blue-600">{branch.city}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-cyan-700">
                      {branch.name}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-relaxed text-slate-500">{branch.address}</p>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-5 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </span>
                      <span className="break-words">{branch.workingHours}</span>
                    </div>
                    <a
                      href={`tel:${branch.phone}`}
                      className="flex items-center gap-3 hover:text-emerald-700"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </span>
                      <span dir="ltr">{branch.phone}</span>
                    </a>
                    {branch.doctors?.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                          <Stethoscope className="h-4 w-4 text-cyan-600" />
                        </span>
                        <span className="break-words pt-2">
                          {branch.doctors
                            .map((doctor) => `${doctor.name} (${doctor.specialty})`)
                            .join("، ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Link
                    href={`/book?branch=${encodeURIComponent(branch.id)}#booking`}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-[.98]"
                  >
                    حجز موعد بهذا الفرع
                  </Link>
                  <a
                    href={getMapUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    title={`موقع ${branch.name} على الخريطة`}
                    aria-label={`افتح موقع ${branch.name} على الخريطة`}
                  >
                    <MapPin className="h-5 w-5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
