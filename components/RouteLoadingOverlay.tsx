"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLoader from "@/components/BrandLoader";

const MINIMUM_LOADER_DURATION_MS = 2000;

function TimedLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setIsVisible(false),
      MINIMUM_LOADER_DURATION_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, []);

  return isVisible ? (
    <BrandLoader message="جارٍ تحميل الصفحة..." fullScreen />
  ) : null;
}

export default function RouteLoadingOverlay() {
  const pathname = usePathname();

  return <TimedLoader key={pathname} />;
}
