"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgePercent } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number | null;
  discountPrice: number;
  endDate: string | null;
}

export default function OffersSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOffers() {
      try {
        const response = await fetch("/api/offers");
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل العروض");
        }
        setOffers(data.offers);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل العروض");
      }
    }

    void loadOffers();
  }, []);

  if (!error && offers.length === 0) return null;

  return (
    <section id="offers" dir="rtl" className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">
              <BadgePercent size={15} /> عروض لفترة محدودة
            </span>
            <h2 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">عروض وخصومات مميزة</h2>
            <p className="mt-2 text-sm text-slate-600">اختر العرض المناسب واحجز موعدك بسهولة.</p>
          </div>
          <Link href="#booking" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
            احجز استشارتك <ArrowLeft size={18} />
          </Link>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-700">{error}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {offers.map((offer) => {
              const discount = offer.originalPrice && offer.originalPrice > offer.discountPrice
                ? Math.round((1 - offer.discountPrice / offer.originalPrice) * 100)
                : null;

              return (
                <article key={offer.id} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md">
                  <div className="relative h-56 bg-slate-100">
                    {offer.imageUrl ? (
                      <Image src={offer.imageUrl} alt={offer.title} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">Lava Smile</div>
                    )}
                    {discount !== null && (
                      <span className="absolute right-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-sm font-black text-white">
                        خصم {discount}٪
                      </span>
                    )}
                  </div>
                  <div className="space-y-4 p-4 sm:p-6">
                    <h3 className="break-words text-lg font-black text-slate-900 sm:text-xl">{offer.title}</h3>
                    {offer.description && <p className="line-clamp-3 min-h-12 break-words text-sm leading-6 text-slate-600">{offer.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-lg font-black text-blue-600 sm:text-xl">{offer.discountPrice.toLocaleString("ar-EG")} ج.م</span>
                      {offer.originalPrice !== null && (
                        <span className="text-sm text-slate-400 line-through">{offer.originalPrice.toLocaleString("ar-EG")} ج.م</span>
                      )}
                    </div>
                    {offer.endDate && (
                      <p className="text-xs text-slate-500">
                        ساري حتى {new Date(offer.endDate).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                    <Link href={`/book?offer=${encodeURIComponent(offer.id)}#booking`} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3 font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-[.98]">
                      احجز بهذا العرض <ArrowLeft size={18} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
