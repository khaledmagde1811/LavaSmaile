"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function SmileIllustration({ whitened }: { whitened: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 420"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={whitened ? "whitened-bg" : "natural-bg"} x2="0" y2="1">
          <stop offset="0" stopColor={whitened ? "#d8f5f1" : "#e7edf1"} />
          <stop offset="1" stopColor={whitened ? "#8bd5ca" : "#aab9c2"} />
        </linearGradient>
        <linearGradient id={whitened ? "whitened-teeth" : "natural-teeth"} x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor={whitened ? "#e8fffb" : "#e2d9ca"} />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill={`url(#${whitened ? "whitened-bg" : "natural-bg"})`} />
      <ellipse cx="320" cy="215" rx="224" ry="148" fill={whitened ? "#bd766d" : "#8e5d5a"} opacity=".84" />
      <path
        d="M118 193 Q320 337 522 193 Q498 335 320 354 Q142 335 118 193Z"
        fill={whitened ? "#9f534e" : "#794945"}
        opacity=".85"
      />
      <path
        d="M125 188 Q320 115 515 188 Q492 252 448 270 Q404 282 360 272 Q320 289 280 272 Q236 282 192 270 Q148 252 125 188Z"
        fill={`url(#${whitened ? "whitened-teeth" : "natural-teeth"})`}
        stroke={whitened ? "#fff" : "#d5cabb"}
        strokeWidth="5"
      />
      {[0, 1, 2, 3, 4, 5, 6].map((tooth) => {
        const x = 165 + tooth * 49;
        const width = tooth === 3 ? 50 : tooth === 2 || tooth === 4 ? 48 : 42;
        return (
          <path
            key={tooth}
            d={`M${x} 164 Q${x + width / 2} 152 ${x + width} 164 L${x + width - 3} 225 Q${x + width / 2} 244 ${x + 3} 225Z`}
            fill="none"
            stroke={whitened ? "#c9e8e2" : "#c8bcad"}
            strokeWidth="3"
          />
        );
      })}
      <text x="320" y="390" textAnchor="middle" fill={whitened ? "#145c55" : "#43525b"} fontSize="19" fontWeight="700">
        رسم توضيحي 
      </text>
    </svg>
  );
}

export default function SmileWhiteningModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"demo" | "upload">("demo");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [whiteningLevel, setWhiteningLevel] = useState(55);
  const [userImage, setUserImage] = useState("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [maskRevision, setMaskRevision] = useState(0);
  const [brushMode, setBrushMode] = useState<"whiten" | "erase">("whiten");
  const [brushSize, setBrushSize] = useState(24);
  const [imageError, setImageError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchError, setBranchError] = useState("");
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!userImage) {
      uploadedImageRef.current = null;
      return;
    }

    const maskCanvas = maskCanvasRef.current;
    const maskContext = maskCanvas?.getContext("2d", { willReadFrequently: true });
    if (maskCanvas && maskContext) {
      maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    const image = new window.Image();
    image.onload = () => {
      uploadedImageRef.current = image;
      setIsImageLoaded(true);
    };
    image.onerror = () => setImageError("تعذرت معاينة الصورة على هذا الجهاز.");
    image.src = userImage;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [userImage]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const image = uploadedImageRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    const maskContext = maskCanvas?.getContext("2d", { willReadFrequently: true });
    if (!isImageLoaded || !canvas || !maskCanvas || !image || !context || !maskContext) return;

    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, width, height);

    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    const imageX = (width - imageWidth) / 2;
    const imageY = (height - imageHeight) / 2;
    context.drawImage(image, imageX, imageY, imageWidth, imageHeight);

    if (whiteningLevel === 0) return;

    const imageData = context.getImageData(0, 0, width, height);
    const maskData = maskContext.getImageData(0, 0, width, height).data;
    const amount = whiteningLevel / 100;
    for (let index = 0; index < imageData.data.length; index += 4) {
      const mask = (maskData[index + 3] / 255) * amount;
      if (mask === 0) continue;

      imageData.data[index] += (255 - imageData.data[index]) * 0.3 * mask;
      imageData.data[index + 1] += (255 - imageData.data[index + 1]) * 0.56 * mask;
      imageData.data[index + 2] += (255 - imageData.data[index + 2]) * 0.86 * mask;
    }
    context.putImageData(imageData, 0, 0);
  }, [isImageLoaded, maskRevision, whiteningLevel]);

  useEffect(
    () => () => {
      if (renderFrameRef.current !== null) {
        window.cancelAnimationFrame(renderFrameRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || branches.length > 0) return;

    let isCurrent = true;
    async function loadBranches() {
      setIsLoadingBranches(true);
      setBranchLoadError("");
      try {
        const response = await fetch("/api/branches");
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.branches)) {
          throw new Error(data.message || "تعذر تحميل الفروع");
        }
        if (isCurrent) setBranches(data.branches);
      } catch (error) {
        if (isCurrent) {
          setBranchLoadError(error instanceof Error ? error.message : "تعذر تحميل الفروع");
        }
      } finally {
        if (isCurrent) setIsLoadingBranches(false);
      }
    }

    void loadBranches();
    return () => {
      isCurrent = false;
    };
  }, [branches.length, isOpen]);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("يرجى اختيار ملف صورة صالح.");
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("حجم الصورة يجب ألا يتجاوز 8 ميجابايت.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIsImageLoaded(false);
        setUserImage(reader.result);
      }
    };
    reader.onerror = () => setImageError("تعذرت معاينة الصورة على هذا الجهاز.");
    reader.readAsDataURL(file);
  }

  function schedulePreviewRender() {
    if (renderFrameRef.current !== null) return;
    renderFrameRef.current = window.requestAnimationFrame(() => {
      renderFrameRef.current = null;
      setMaskRevision((revision) => revision + 1);
    });
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function drawMaskStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    const point = getCanvasPoint(event);
    const previousPoint = lastPointRef.current;
    if (!canvas || !context || !point || !previousPoint) return;

    context.globalCompositeOperation = brushMode === "whiten" ? "source-over" : "destination-out";
    context.strokeStyle = "#fff";
    context.lineWidth = (brushSize * canvas.width) / event.currentTarget.getBoundingClientRect().width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
    schedulePreviewRender();
  }

  function clearWhiteningMask() {
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setMaskRevision((revision) => revision + 1);
  }

  function continueToBooking() {
    if (branches.length > 0 && !selectedBranch) {
      setBranchError("يرجى اختيار الفرع المفضل للمتابعة.");
      return;
    }
    onClose();
    const branchQuery = selectedBranch ? `?branch=${encodeURIComponent(selectedBranch)}` : "";
    router.push(`/book${branchQuery}#booking`);
  }

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="smile-modal-title"
        className="relative my-auto max-h-[95svh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="إغلاق محاكي التبييض"
          className="absolute left-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pe-10 text-center sm:text-right">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            محاكي التبييض الرقمي
          </span>
          <h2 id="smile-modal-title" className="mt-3 text-xl font-black text-slate-900 sm:text-2xl">
            شاهد ابتسامتك الناصعة قبل العلاج
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            محاكاة بصرية تقريبية للتجربة فقط، ولا تمثل نتيجة علاج مضمونة.
          </p>
        </div>

        <div role="tablist" aria-label="خيارات محاكي الابتسامة" className="flex rounded-2xl bg-slate-100 p-1">
          <button
            id="smile-demo-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "demo"}
            aria-controls="smile-demo-panel"
            onClick={() => setActiveTab("demo")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "demo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            مقارنة نموذجية (قبل / بعد)
          </button>
          <button
            id="smile-upload-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "upload"}
            aria-controls="smile-upload-panel"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "upload" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            جرب على صورتك الشخصية
          </button>
        </div>

        {activeTab === "demo" ? (
          <div id="smile-demo-panel" role="tabpanel" aria-labelledby="smile-demo-tab" className="space-y-4">
            <div className="relative aspect-[16/10] select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <SmileIllustration whitened />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
                <SmileIllustration whitened={false} />
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-bold text-white">قبل</span>
              <span className="absolute left-3 top-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-bold text-white">بعد</span>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ right: `${sliderPosition}%` }}>
                <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-cyan-700 text-white shadow-lg">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <label className="sr-only" htmlFor="smile-comparison">موضع المقارنة بين قبل وبعد</label>
              <input
                id="smile-comparison"
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(event) => setSliderPosition(Number(event.target.value))}
                className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>
            <p className="text-center text-xs font-bold text-slate-500">
              حرك الشريط لمقارنة درجة اللون في الرسم التوضيحي
            </p>
          </div>
        ) : (
          <div id="smile-upload-panel" role="tabpanel" aria-labelledby="smile-upload-tab" className="space-y-4">
            {!userImage ? (
              <label className="flex h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/30 p-6 text-center transition-colors hover:bg-cyan-50/60">
                <Upload className="mb-2 h-10 w-10 text-cyan-600" aria-hidden="true" />
                <span className="text-sm font-bold text-slate-800">اضغط لرفع صورة لابتسامتك</span>
                <span className="mt-1 text-xs text-slate-500">يُفضل صورة واضحة وتظهر فيها الأسنان</span>
                <input
                  id="smile-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-xs font-bold leading-5 text-slate-600">
                  ظلّل الأسنان بالفرشاة؛ سيُعدّل لون المنطقة المحددة فقط دون تغيير إضاءة الصورة.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    aria-pressed={brushMode === "whiten"}
                    onClick={() => setBrushMode("whiten")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      brushMode === "whiten"
                        ? "bg-cyan-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    فرشاة التبييض
                  </button>
                  <button
                    type="button"
                    aria-pressed={brushMode === "erase"}
                    onClick={() => setBrushMode("erase")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      brushMode === "erase"
                        ? "bg-cyan-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    ممحاة
                  </button>
                  <button
                    type="button"
                    onClick={clearWhiteningMask}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    إعادة التحديد
                  </button>
                </div>
                <div className="relative aspect-[2/1] w-full touch-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                  <canvas
                    ref={previewCanvasRef}
                    width={720}
                    height={360}
                    role="img"
                    aria-label="معاينة صورتك مع تبييض لون المناطق التي تحددها"
                    className="h-full w-full touch-none object-contain"
                    onPointerDown={(event) => {
                      const point = getCanvasPoint(event);
                      const canvas = maskCanvasRef.current;
                      const context = canvas?.getContext("2d", { willReadFrequently: true });
                      if (!point || !canvas || !context) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      isDrawingRef.current = true;
                      lastPointRef.current = point;
                      const bounds = event.currentTarget.getBoundingClientRect();
                      const lineWidth = (brushSize * canvas.width) / bounds.width;
                      context.globalCompositeOperation = brushMode === "whiten" ? "source-over" : "destination-out";
                      context.fillStyle = "#fff";
                      context.beginPath();
                      context.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
                      context.fill();
                      schedulePreviewRender();
                    }}
                    onPointerMove={drawMaskStroke}
                    onPointerUp={() => {
                      isDrawingRef.current = false;
                      lastPointRef.current = null;
                    }}
                    onPointerCancel={() => {
                      isDrawingRef.current = false;
                      lastPointRef.current = null;
                    }}
                  />
                  <canvas ref={maskCanvasRef} width={720} height={360} className="hidden" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-bold text-white">
                    معاينة تجريبية
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsImageLoaded(false);
                      setUserImage("");
                    }}
                    aria-label="إزالة الصورة"
                    className="absolute left-3 top-3 rounded-full bg-slate-950/65 p-2 text-white hover:bg-slate-950/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {!isImageLoaded && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-sm font-bold text-white">
                      جارٍ تجهيز المعاينة...
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="whitening-level" className="flex justify-between text-xs font-bold text-slate-700">
                    <span>شدة تبييض اللون المحدد</span>
                    <span className="text-cyan-700">{whiteningLevel}%</span>
                  </label>
                  <input
                    id="whitening-level"
                    type="range"
                    min="0"
                    max="100"
                    value={whiteningLevel}
                    onChange={(event) => setWhiteningLevel(Number(event.target.value))}
                    className="w-full cursor-pointer accent-cyan-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="whitening-brush-size" className="flex justify-between text-xs font-bold text-slate-700">
                    <span>حجم الفرشاة</span>
                    <span className="text-cyan-700">{brushSize}px</span>
                  </label>
                  <input
                    id="whitening-brush-size"
                    type="range"
                    min="8"
                    max="48"
                    value={brushSize}
                    onChange={(event) => setBrushSize(Number(event.target.value))}
                    className="w-full cursor-pointer accent-cyan-600"
                  />
                </div>
              </div>
            )}
            {imageError && (
              <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {imageError}
              </p>
            )}
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
              تتم معاينة الصورة على جهازك فقط؛ لا يتم رفعها أو إرسالها إلى العيادة.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="smile-branch" className="mb-1.5 block text-xs font-bold text-slate-700">
            الفرع المفضل (اختياري)
          </label>
          <select
            id="smile-branch"
            value={selectedBranch}
            onChange={(event) => {
              setSelectedBranch(event.target.value);
              setBranchError("");
            }}
            disabled={isLoadingBranches || branches.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60"
          >
            <option value="">
              {isLoadingBranches ? "جارٍ تحميل الفروع..." : "اختر الفرع"}
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} - {branch.city}
              </option>
            ))}
          </select>
          {branchLoadError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{branchLoadError}</p>
          )}
          {branchError && (
            <p role="alert" className="mt-2 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {branchError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={continueToBooking}
          disabled={isLoadingBranches}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-teal-600 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          أعجبتك النتيجة؟ احجز جلسة تبييضك الآن
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        </button>
      </section>
    </div>,
    document.body
  );
}
