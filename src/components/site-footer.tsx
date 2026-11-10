import { INSTAGRAM_URL, MAPS_SAHLOUL } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-[70px] pb-[110px] text-center text-[0.85rem] text-muted">
      <p className="font-display mb-1.5 text-base tracking-[0.16em] text-gold">
        O'my Fleur · Fleuriste d'Exception
      </p>
      <p className="mb-4 text-[0.78rem] tracking-wide">
        Des fleurs qui touchent le cœur — pour vos moments inoubliables
      </p>
      <p>&copy; {new Date().getFullYear()} Fleuriste O'my Fleur. Tous droits réservés.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-5">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.75rem] tracking-[0.2em] text-gold uppercase no-underline transition-[letter-spacing,color] hover:tracking-[0.28em] hover:text-gold-soft"
        >
          Instagram
        </a>
        <a
          href={MAPS_SAHLOUL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.75rem] tracking-[0.2em] text-gold uppercase no-underline transition-[letter-spacing,color] hover:tracking-[0.28em] hover:text-gold-soft"
        >
          Sahloul
        </a>
      </div>
    </footer>
  );
}
