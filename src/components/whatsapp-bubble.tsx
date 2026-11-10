import { useState } from "react";
import { WA_PHONE } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function WhatsAppBubble() {
  const [calm, setCalm] = useState(false);

  return (
    <a
      className="fixed right-7 bottom-7 z-50 block size-16 transition-transform duration-300 hover:scale-110 hover:rotate-6 max-[860px]:right-[18px] max-[860px]:bottom-[18px] max-[860px]:size-14"
      href={`https://wa.me/${WA_PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter sur WhatsApp"
      onMouseEnter={() => setCalm(true)}
      onClick={() => setCalm(true)}
    >
      <span
        className={cn(
          "contact-pulse flex size-full items-center justify-center rounded-full bg-gold shadow-[var(--shadow-gold)]",
          !calm && "animate-[gold-pulse_2.6s_ease-in-out_infinite]",
        )}
      >
        <svg viewBox="0 0 32 32" className="size-[34px] text-bg max-[860px]:size-7" aria-hidden>
          <path
            fill="currentColor"
            d="M16 3C9.4 3 4 8.4 4 15c0 2.3.7 4.5 1.9 6.4L4 29l7.8-1.9c1.4.6 2.8.9 4.2.9 6.6 0 12-5.4 12-12S22.6 3 16 3zm6.6 17.1c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.4.1-2.2-.1-1.9-.5-4-1.6-5.6-3.4-1.7-1.9-2.7-3.7-3.1-5.6-.3-1.4.1-2.4.7-2.7.3-.2.6-.2.9-.2.2 0 .4 0 .6.1.2.1.5.5.7.8.2.3.7 1.3.7 1.4.1.1.1.3 0 .5-.1.2-.2.3-.4.5-.2.2-.4.4-.5.5-.2.2-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1.1 2 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1.2.1 1.4.7 1.7.8.3.1.4.2.5.3.1.2.1.7-.2 1.5z"
          />
        </svg>
      </span>
    </a>
  );
}
