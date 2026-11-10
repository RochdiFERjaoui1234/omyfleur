import { useState } from "react";
import type { CatalogItem } from "@/lib/catalog";
import { categoryById } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function FlowerCard({
  item,
  onOpen,
  compact = false,
}: {
  item: CatalogItem;
  onOpen: (item: CatalogItem) => void;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const cat = categoryById(item.category);

  return (
    <article
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-glass p-[18px] transition-[transform,background-color,border-color,box-shadow] duration-500",
        "hover:-translate-y-2.5 hover:border-gold hover:bg-fg/5 hover:shadow-[var(--shadow-card),var(--shadow-gold)]",
        "focus-visible:border-gold focus-visible:outline-none",
        compact && "p-3",
      )}
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div
        className={cn(
          "relative mb-[18px] aspect-[4/5] overflow-hidden rounded-[14px] bg-linear-to-br from-surface to-bg",
          compact && "mb-3 rounded-md",
        )}
      >
        {broken ? (
          <div className="flex h-full items-center justify-center bg-surface font-display text-gold/40">
            {cat.singular}
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-[transform,filter] duration-700 group-hover:scale-105 group-hover:brightness-105"
            onError={() => setBroken(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-gold/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 [transform:translateX(-100%)] group-hover:[transform:translateX(100%)] group-hover:transition-transform group-hover:duration-900" />
      </div>
      <div className="px-1 py-1 text-center">
        <h3 className="font-display mb-1.5 text-[1.1rem] font-light tracking-wide text-fg">
          {item.name}
        </h3>
        <p className="text-[0.78rem] font-light tracking-[0.18em] text-gold uppercase">
          {item.priceLabel}
        </p>
      </div>
    </article>
  );
}
