import Link from "next/link";
import { useId } from "react";

interface LogoProps {
  className?: string;
  theme?: "light" | "dark";
}

export default function Logo({ className = "", theme = "light" }: LogoProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const primaryText = theme === "dark" ? "text-white" : "text-slate-900";
  const subtitleText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <Link
      href="/"
      aria-label="Lava Smile - الصفحة الرئيسية"
      className={`inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-slate-900 shadow-md shadow-amber-500/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 260"
          aria-hidden="true"
          className="h-7 w-7"
        >
          <defs>
            <linearGradient id={`goldGrad${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFEBB0" />
              <stop offset="50%" stopColor="#C59B27" />
              <stop offset="100%" stopColor="#9A7410" />
            </linearGradient>
            <radialGradient id={`flareGlow${gradientId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M 100 22 C 118 22, 134 20, 148 27 C 165 35, 178 52, 180 74 C 182 98, 172 126, 164 154 C 156 182, 150 208, 142 226 C 136 240, 126 248, 118 226 C 112 210, 108 190, 100 190 C 92 190, 88 210, 82 226 C 74 248, 64 240, 58 226 C 50 208, 44 182, 36 154 C 28 126, 18 98, 20 74 C 22 52, 35 35, 52 27 C 66 20, 82 22, 100 22 Z"
            fill="none"
            stroke={`url(#goldGrad${gradientId})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 75 25 C 88 32, 112 32, 125 25"
            fill="none"
            stroke={`url(#goldGrad${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <g transform="translate(100, 88)">
            <circle cx="0" cy="0" r="32" fill={`url(#flareGlow${gradientId})`} />
            <path
              d="M -40 0 L 40 0 M 0 -40 L 0 40"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
          </g>
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`flex items-center gap-1.5 text-lg font-black tracking-tight font-serif sm:text-xl ${primaryText}`}>
          SMILE <span className="font-sans font-black text-cyan-600">LAVA</span>
        </span>
        <span className={`break-words text-[10px] font-semibold tracking-wider sm:text-xs ${subtitleText}`}>
          مراكز لاڤا لطب وتجميل الأسنان
        </span>
      </span>
    </Link>
  );
}
