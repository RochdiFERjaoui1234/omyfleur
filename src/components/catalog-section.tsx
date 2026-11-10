import { useMemo, useState } from "react";
import type { CatalogItem, CategoryId } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/catalog";
import { FlowerCard } from "@/components/flower-card";
import { ItemDialog } from "@/components/item-dialog";
import { cn } from "@/lib/utils";

export function CatalogSection({ items }: { items: CatalogItem[] }) {
  const [filter, setFilter] = useState<"all" | CategoryId>("all");
  const [active, setActive] = useState<CatalogItem | null>(null);

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category === cat.id),
    })).filter((group) => group.items.length > 0);
  }, [items]);

  const visible = filter === "all" ? grouped : grouped.filter((g) => g.id === filter);

  return (
    <>
      <section
        className="sticky top-[92px] z-30 border-b border-border bg-bg/92 py-3.5 backdrop-blur-md"
        aria-label="Filtrer par catégorie"
      >
        <div
          className="mx-auto flex max-w-[1200px] items-center gap-2.5 overflow-x-auto px-5 py-1 sm:px-8 max-[860px]:justify-start min-[861px]:flex-wrap min-[861px]:justify-between [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          <Chip
            label="Tout voir"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              active={filter === cat.id}
              onClick={() => setFilter(cat.id)}
            />
          ))}
        </div>
      </section>

      <section
        id="catalogue"
        className="mx-auto max-w-[1200px] scroll-mt-28 px-5 sm:px-8"
        aria-label="Catalogue floral"
      >
        {visible.length === 0 ? (
          <p className="font-display py-24 text-center text-muted italic">
            Aucune création pour le moment.
          </p>
        ) : (
          visible.map((group) => (
            <div key={group.id} className="py-16 first:pt-10 last:pb-8">
              <div className="mb-10 text-center">
                <h2 className="font-display mb-2.5 inline-flex items-center gap-3.5 text-[clamp(1.6rem,2.8vw,2.2rem)] text-gold">
                  <span className="hidden h-px w-8 bg-gold/30 sm:block" />
                  {group.label}
                  <span className="hidden h-px w-8 bg-gold/30 sm:block" />
                </h2>
                <p className="font-display text-[clamp(0.85rem,1.3vw,1rem)] text-muted italic">
                  {group.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[clamp(28px,4vw,50px)] max-[860px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-[860px]:gap-[18px] max-[420px]:grid-cols-[repeat(auto-fill,minmax(135px,1fr))]">
                {group.items.map((item) => (
                  <FlowerCard key={item.id} item={item} onOpen={setActive} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <ItemDialog item={active} onOpenChange={(open) => !open && setActive(null)} />
    </>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-pill border px-[22px] py-2.5 text-[0.78rem] tracking-[0.12em] uppercase transition-[transform,background-color,color,border-color,box-shadow] duration-300",
        active
          ? "border-gold bg-gold text-bg shadow-[var(--shadow-gold)]"
          : "border-border bg-glass text-fg hover:-translate-y-0.5 hover:border-gold",
      )}
    >
      {label}
    </button>
  );
}
