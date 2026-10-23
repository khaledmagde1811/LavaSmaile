"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, Phone, Calendar, Menu, X, Shield, MapPin, LayoutDashboard, User } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
  {/* Logo & Brand */}
<Link href="/" className="flex items-center gap-3 group">
  {/* Icon Box with Golden Tooth SVG */}
  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform duration-200 border border-amber-500/20">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 260" 
      className="w-7 h-7"
    >
      <defs>
        <linearGradient id="goldGradBox" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEBB0"/>
          <stop offset="50%" stopColor="#C59B27"/>
          <stop offset="100%" stopColor="#9A7410"/>
        </linearGradient>
        <radialGradient id="flareGlowBox" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      <path d="M 100 22 C 118 22, 134 20, 148 27 C 165 35, 178 52, 180 74 C 182 98, 172 126, 164 154 C 156 182, 150 208, 142 226 C 136 240, 126 248, 118 226 C 112 210, 108 190, 100 190 C 92 190, 88 210, 82 226 C 74 248, 64 240, 58 226 C 50 208, 44 182, 36 154 C 28 126, 18 98, 20 74 C 22 52, 35 35, 52 27 C 66 20, 82 22, 100 22 Z" fill="none" stroke="url(#goldGradBox)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 75 25 C 88 32, 112 32, 125 25" fill="none" stroke="url(#goldGradBox)" strokeWidth="8" strokeLinecap="round"/>
      
      <g transform="translate(100, 88)">
        <circle cx="0" cy="0" r="32" fill="url(#flareGlowBox)"/>
        <path d="M -40 0 L 40 0 M 0 -40 L 0 40" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="4" fill="#FFFFFF"/>
      </g>
    </svg>
  </div>

  {/* Typography */}
  <div className="flex flex-col">
    <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 font-serif">
      LAVA <span className="text-amber-600 font-sans font-bold">SMILE</span>
    </span>
    <span className="text-xs font-semibold text-slate-500 tracking-wider">
      مراكز لاڤا لطب وتجميل الأسنان
    </span>
  </div>
</Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="/" className="hover:text-cyan-600 transition-colors">الرئيسية</Link>
            <Link href="#branches" className="hover:text-cyan-600 transition-colors">فروعنا (3 فروع)</Link>
            <Link href="#services" className="hover:text-cyan-600 transition-colors">خدماتنا</Link>
            <Link href="#features" className="hover:text-cyan-600 transition-colors">لماذا لاڤا؟</Link>
            <Link href="#testimonials" className="hover:text-cyan-600 transition-colors">قصص النجاح</Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <User className="w-4 h-4 text-cyan-600" />
              تسجيل الدخول / حسابي
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 shadow-md shadow-cyan-500/25 transition-all hover:shadow-lg active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              احجز كشفك الآن
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/book"
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600"
            >
              حجز
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="القائمة"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            الرئيسية
          </Link>
          <Link
            href="#branches"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            فروعنا (المهندسين، مدينة نصر، التجمع)
          </Link>
          <Link
            href="#services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            خدماتنا
          </Link>
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-cyan-700 bg-cyan-50"
          >
            تسجيل الدخول / حسابي
          </Link>
          <Link
            href="/book"
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 shadow-md"
          >
            احجز موعدك وسجل شكواك
          </Link>
        </div>
      )}
    </header>
  );
}
