import { MAPS_HAMMAM, MAPS_SAHLOUL } from "@/lib/catalog";

export function Boutiques() {
  return (
    <section
      id="boutiques"
      className="mx-auto mt-12 max-w-[1200px] scroll-mt-28 border-t border-border px-5 py-[clamp(80px,10vw,150px)] text-center sm:px-8"
      tabIndex={-1}
    >
      <p className="mb-4 inline-block border-b border-gold/20 pb-1.5 text-[0.72rem] tracking-[0.4em] text-gold uppercase">
        Nous rendre visite
      </p>
      <h2 className="font-display mb-12 text-[clamp(1.9rem,4vw,3rem)] tracking-[0.08em]">
        Nos Boutiques
      </h2>
      <div className="flex flex-wrap justify-center gap-8">
        <article className="w-full max-w-[450px] rounded-2xl border border-border bg-glass p-[clamp(32px,4vw,50px)] transition-[transform,border-color,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:border-gold hover:bg-fg/5 hover:shadow-[var(--shadow-card)]">
          <h3 className="font-display mb-3.5 text-[clamp(1.4rem,2.5vw,1.8rem)] text-gold">
            Hammam Sousse
          </h3>
          <p className="mb-7 tracking-wide text-muted">
            Av. Alexandrie – près de The Diesel
          </p>
          <a
            href={MAPS_HAMMAM}
            target="_blank"
            rel="noopener noreferrer"
            className="bubble-link inline-block w-auto"
          >
            S'y rendre
          </a>
        </article>
        <article className="w-full max-w-[450px] rounded-2xl border border-border bg-glass p-[clamp(32px,4vw,50px)] transition-[transform,border-color,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:border-gold hover:bg-fg/5 hover:shadow-[var(--shadow-card)]">
          <h3 className="font-display mb-3.5 text-[clamp(1.4rem,2.5vw,1.8rem)] text-gold">
            Sahloul
          </h3>
          <p className="mb-7 tracking-wide text-muted">
            Près du rond-point, Sahloul, Sousse
          </p>
          <a
            href={MAPS_SAHLOUL}
            target="_blank"
            rel="noopener noreferrer"
            className="bubble-link inline-block w-auto"
          >
            S'y rendre
          </a>
        </article>
      </div>
    </section>
  );
}
