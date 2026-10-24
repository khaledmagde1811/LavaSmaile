"use client";

import { Sparkles, Smile } from "lucide-react";

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface BrandLoaderProps extends LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-9 w-9 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingIndicator({
  size = "md",
  className = "",
}: LoadingIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-cyan-600 border-t-amber-400 ${spinnerSizes[size]} ${className}`}
    />
  );
}

export default function BrandLoader({
  message = "جارٍ التحميل...",
  size = "lg",
  fullScreen = false,
  className = "",
}: BrandLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className={`${
        fullScreen
          ? "fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-[#F4F7F8]/90 p-6 backdrop-blur-md"
          : "flex flex-col items-center justify-center gap-3 p-6"
      } ${className}`}
    >
      {fullScreen ? (
        <>
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20 [animation-duration:2s]" />
            <span className="absolute inset-1 animate-pulse rounded-full border border-teal-300/60" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white text-cyan-700 shadow-xl">
              <Smile className="h-10 w-10" strokeWidth={1.8} aria-hidden="true" />
              <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-teal-500" aria-hidden="true" />
            </span>
          </div>
          <span className="text-lg font-black tracking-wide text-slate-900">
            LAVA <span className="text-cyan-700">SMILE</span>
          </span>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-600 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
          </div>
          {message && (
            <span className="break-words text-center text-xs font-bold tracking-wide text-slate-600">
              {message}
            </span>
          )}
        </>
      ) : (
        <>
          <LoadingIndicator size={size} />
          {message && (
            <span className="break-words text-center text-sm font-bold text-slate-600">
              {message}
            </span>
          )}
        </>
      )}
    </div>
  );
}
