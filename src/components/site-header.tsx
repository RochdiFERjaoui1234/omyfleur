import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { INSTAGRAM_URL, MAPS_SAHLOUL } from "@/lib/catalog";

const NAV = [
  { href: "/#catalogue", label: "Collections" },
  { href: "/#boutiques", label: "Boutiques" },
  { href: INSTAGRAM_URL, label: "Instagram", external: true },
  { href: MAPS_SAHLOUL, label: "Localisation", external: true },
] as const;

export function SiteHeader({
  atelier = false,
  onLock,
}: {
  atelier?: boolean;
  onLock?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 860) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/82 shadow-[0_6px_20px_rgb(0_0_0_/_0.55)] backdrop-blur-[20px]">
      <nav
        className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-5 py-[22px] sm:px-8"
        aria-label="Navigation principale"
      >
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3.5 text-fg no-underline"
          aria-label="O'my Fleur — accueil"
          onClick={() => setOpen(false)}
        >
          <img
            src="/logo.jpg"
            alt="Logo O'my Fleur"
            className="size-12 rounded-full border border-gold object-cover"
          />
          <span className="leading-none">
            <span className="font-display block text-[1.3rem] tracking-[0.18em] text-gold uppercase max-[860px]:text-[1.05rem]">
              O'my Fleur
            </span>
            <span className="mt-1 block text-[0.65rem] tracking-[0.28em] text-muted uppercase max-[860px]:hidden">
              {atelier ? "Atelier" : "Fleuriste d'Exception"}
            </span>
          </span>
        </Link>

        <button
          type="button"
          className="relative hidden size-11 shrink-0 rounded-full border border-border bg-glass max-[860px]:block"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn(
              "absolute top-1/2 left-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-fg transition-transform",
              open ? "-translate-y-1/2 rotate-45" : "-translate-y-[6px]",
            )}
          />
          <span
            className={cn(
              "absolute top-1/2 left-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 bg-fg transition-opacity",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute top-1/2 left-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-fg transition-transform",
              open ? "-translate-y-1/2 -rotate-45" : "translate-y-[5px]",
            )}
          />
        </button>

        <ul
          className={cn(
            "flex items-center gap-3",
            "max-[860px]:absolute max-[860px]:top-full max-[860px]:right-0 max-[860px]:left-0 max-[860px]:z-50 max-[860px]:max-h-[calc(100vh-92px)] max-[860px]:flex-col max-[860px]:items-stretch max-[860px]:gap-2 max-[860px]:overflow-y-auto max-[860px]:border-b max-[860px]:border-border max-[860px]:bg-bg/96 max-[860px]:px-5 max-[860px]:py-4 max-[860px]:backdrop-blur-xl",
            "max-[860px]:pointer-events-none max-[860px]:translate-y-[-12px] max-[860px]:opacity-0 max-[860px]:transition-[transform,opacity]",
            open &&
              "max-[860px]:pointer-events-auto max-[860px]:translate-y-0 max-[860px]:opacity-100",
          )}
        >
          {atelier ? (
            <>
              <li className="max-[860px]:w-full">
                <Link to="/" className="bubble-link" onClick={() => setOpen(false)}>
                  Boutique
                </Link>
              </li>
              <li className="max-[860px]:w-full">
                <button
                  type="button"
                  className="bubble-link"
                  onClick={() => {
                    setOpen(false);
                    onLock?.();
                  }}
                >
                  Fermer
                </button>
              </li>
            </>
          ) : (
            NAV.map((item) => (
              <li key={item.label} className="max-[860px]:w-full">
                {"external" in item ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bubble-link"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    href={item.href}
                    className="bubble-link"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))
          )}
        </ul>
      </nav>
    </header>
  );
}
