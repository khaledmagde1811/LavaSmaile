import { FaWhatsapp } from "react-icons/fa";

const whatsappUrl =
  "https://wa.me/201155061774?text=" +
  encodeURIComponent("مرحباً، أود الاستفسار عن حجز موعد في عيادات Lava Smile.");

export default function WhatsAppContactButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-5 left-5 z-50 inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 print:hidden"
    >
      <FaWhatsapp aria-hidden="true" className="h-7 w-7" />
      <span className="hidden text-sm font-bold sm:inline">تواصل معنا</span>
    </a>
  );
}
