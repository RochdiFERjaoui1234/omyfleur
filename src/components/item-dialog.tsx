import { useEffect, useState } from "react";
import type { CatalogItem } from "@/lib/catalog";
import { categoryById, waOrderUrl } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ItemDialog({
  item,
  onOpenChange,
}: {
  item: CatalogItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [item?.imageUrl]);
  const cat = item ? categoryById(item.category) : null;

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) setBroken(false);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        {item && cat ? (
          <div className="grid max-h-[calc(100dvh-2rem)] min-h-0 gap-0 overflow-y-auto overscroll-contain sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="aspect-[4/3] bg-surface sm:aspect-auto sm:min-h-[420px]">
              {broken ? (
                <div className="flex h-full min-h-[280px] items-center justify-center font-display text-gold/40">
                  {cat.singular}
                </div>
              ) : (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  onError={() => setBroken(true)}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-4 p-6 wrap-anywhere sm:p-7">
              <DialogHeader>
                <p className="text-[0.68rem] tracking-[0.28em] text-gold uppercase">
                  {cat.label}
                </p>
                <DialogTitle className="text-2xl">{item.name}</DialogTitle>
                <DialogDescription className="text-gold">
                  {item.priceLabel}
                </DialogDescription>
              </DialogHeader>
              {item.description ? (
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              ) : (
                <p className="font-display text-sm leading-relaxed text-muted italic">
                  {cat.subtitle}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2 pt-2">
                <Button asChild className="w-full">
                  <a
                    href={waOrderUrl(item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Commander sur WhatsApp
                  </a>
                </Button>
                <p className="text-center text-[0.72rem] tracking-wide text-muted">
                  Réponse de l'atelier, à Sousse
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
