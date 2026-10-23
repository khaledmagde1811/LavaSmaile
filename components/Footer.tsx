"use client";

import Link from "next/link";
import { Sparkles, Phone, MapPin, Clock, Heart, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Col */}
   <div className="space-y-4">
  <div className="flex items-center gap-3">
    {/* Icon Box with Golden Tooth SVG */}
    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md shadow-amber-500/10 border border-amber-500/20 shrink-0">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 260" 
        className="w-7 h-7"
      >
        <defs>
          <linearGradient id="goldGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEBB0"/>
            <stop offset="50%" stopColor="#C59B27"/>
            <stop offset="100%" stopColor="#9A7410"/>
          </linearGradient>
          <radialGradient id="flareGlowFooter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
          </radialGradient>
        </defs>
        
        <path d="M 100 22 C 118 22, 134 20, 148 27 C 165 35, 178 52, 180 74 C 182 98, 172 126, 164 154 C 156 182, 150 208, 142 226 C 136 240, 126 248, 118 226 C 112 210, 108 190, 100 190 C 92 190, 88 210, 82 226 C 74 248, 64 240, 58 226 C 50 208, 44 182, 36 154 C 28 126, 18 98, 20 74 C 22 52, 35 35, 52 27 C 66 20, 82 22, 100 22 Z" fill="none" stroke="url(#goldGradFooter)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 75 25 C 88 32, 112 32, 125 25" fill="none" stroke="url(#goldGradFooter)" strokeWidth="8" strokeLinecap="round"/>
        
        <g transform="translate(100, 88)">
          <circle cx="0" cy="0" r="32" fill="url(#flareGlowFooter)"/>
          <path d="M -40 0 L 40 0 M 0 -40 L 0 40" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="4" fill="#FFFFFF"/>
        </g>
      </svg>
    </div>

    {/* Typography */}
    <div className="flex flex-col">
      <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-serif">
        LAVA <span className="text-amber-500 font-sans font-bold">SMILE</span>
      </span>
      <span className="text-xs font-semibold text-slate-400 tracking-wider">
        مراكز لاڤا لطب وتجميل الأسنان
      </span>
    </div>
  </div>

  <p className="text-sm text-slate-400 leading-relaxed">
    المراكز المتخصصة الأولى في مصر لابتسامة هوليوود وزراعة الأسنان الفورية، بأعلى معايير التعقيم العالمية وأحدث الأجهزة الرقمية.
  </p>

  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl">
    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
    <span>ضمان شامل ومكتوب على جميع التركيبات والزراعات</span>
  </div>
</div>

          {/* Branches Col */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base border-b border-slate-800 pb-2">فروعنا الحالية</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-white block">فرع المهندسين (الرئيسي):</span>
                  <span className="text-slate-400 text-xs">شارع جامعة الدول العربية، أمام نادي الصيد</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-white block">فرع مدينة نصر:</span>
                  <span className="text-slate-400 text-xs">شارع عباس العقاد، بجوار كيدزانيا</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-white block">فرع التجمع الخامس:</span>
                  <span className="text-slate-400 text-xs">شارع التسعين الشمالي، ميديكال بارك</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base border-b border-slate-800 pb-2">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/book" className="hover:text-cyan-400 transition-colors">
                  حجز كشف جديد مع تسجيل شكوى
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-cyan-400 transition-colors">
                  قائمة الخدمات والأسعار
                </Link>
              </li>
              <li>
                <Link href="#branches" className="hover:text-cyan-400 transition-colors">
                  مواعيد عمل الفروع
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors text-cyan-300 font-semibold">
                  لوحة الإدارة والمتابعة (Staff Only)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base border-b border-slate-800 pb-2">خدمة العملاء والحجز</h4>
            <p className="text-xs text-slate-400">
              فريق الاستقبال متواجد يومياً للرد على استفساراتكم وشكاواكم طوال ساعات العمل.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span dir="ltr">010 1234 5671</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>يومياً من 10:00 صباحاً حتى 10:00 مساءً</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Lava Smile Dental Clinics. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            صُمم بأحدث التقنيات لخدمة ابتسامتكم <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
