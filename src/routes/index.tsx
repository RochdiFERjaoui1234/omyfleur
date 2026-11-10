import { createFileRoute } from "@tanstack/react-router";
import { listAvailableItems } from "@/lib/catalog-fns";
import { MorphBg } from "@/components/morph-bg";
import { SiteHeader } from "@/components/site-header";
import { CatalogSection } from "@/components/catalog-section";
import { Boutiques } from "@/components/boutiques";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppBubble } from "@/components/whatsapp-bubble";

export const Route = createFileRoute("/")({
  loader: () => listAvailableItems(),
  pendingComponent: PendingScreen,
  component: Home,
});

function PendingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="font-display tracking-[0.2em] text-gold uppercase">O'my Fleur</p>
    </div>
  );
}

function Home() {
  const items = Route.useLoaderData();

  return (
    <div className="relative min-h-screen">
      <MorphBg />
      <div className="relative z-10">
        <SiteHeader />
        <main>
          <section className="mx-auto max-w-[1200px] px-5 pt-[clamp(80px,12vh,140px)] pb-[clamp(40px,6vh,70px)] text-center sm:px-8">
            <p className="mb-4 inline-block border-b border-gold/20 pb-1.5 text-[0.72rem] tracking-[0.4em] text-gold uppercase">
              Sousse · Hammam Sousse · Sahloul
            </p>
            <h2 className="font-display mb-4 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.12] tracking-[0.08em]">
              L'art floral <em className="italic text-gold">raffiné</em>
            </h2>
            <p className="mx-auto mb-7 max-w-xl text-[clamp(0.95rem,1.5vw,1.1rem)] font-light tracking-wide text-muted">
              Des fleurs qui touchent le cœur pour vos moments inoubliables
            </p>
            <a href="#catalogue" className="bubble-link inline-block w-auto">
              Découvrir la collection
            </a>
          </section>
          <CatalogSection items={items} />
          <Boutiques />
        </main>
        <SiteFooter />
        <WhatsAppBubble />
      </div>
    </div>
  );
}
