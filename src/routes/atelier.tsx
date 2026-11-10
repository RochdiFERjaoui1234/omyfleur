import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lockAtelier, loadAtelier, unlockAtelier } from "@/lib/catalog-fns";
import { MorphBg } from "@/components/morph-bg";
import { SiteHeader } from "@/components/site-header";
import { AdminStudio } from "@/components/admin-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/atelier")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  loader: () => loadAtelier(),
  pendingComponent: PendingScreen,
  component: AtelierPage,
});

function PendingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="font-display tracking-[0.2em] text-gold uppercase">Atelier</p>
    </div>
  );
}

function AtelierPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const unlockFn = useServerFn(unlockAtelier);
  const lockFn = useServerFn(lockAtelier);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    // Read the actual input too: browser autofill can precede React hydration.
    const entered = String(new FormData(event.currentTarget as HTMLFormElement).get("password") ?? "");
    setBusy(true);
    setError("");
    try {
      const result = await unlockFn({ data: { password: entered } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPassword("");
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ouvrir l'atelier");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    try {
      await lockFn();
      await router.invalidate();
    } catch {
      toast.error("L'atelier n'a pas pu être fermé. Réessayez.");
    }
  }

  return (
    <div className="relative min-h-screen">
      <MorphBg />
      <div className="relative z-10">
        <SiteHeader atelier={data.unlocked} onLock={() => void lock()} />
        <main>
          {data.unlocked ? (
            <AdminStudio items={data.items} preview={data.preview} />
          ) : (
            <form
              onSubmit={(event) => void unlock(event)}
              className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16"
            >
              <p className="mb-3 text-[0.72rem] tracking-[0.4em] text-gold uppercase">
                Privé
              </p>
              <h1 className="font-display text-4xl tracking-wide">Atelier</h1>
              <p className="mt-3 mb-8 text-sm text-muted">
                Réservé à la fleuriste. Le mot de passe n'est pas affiché dans la boutique.
              </p>
              <div className="grid gap-2">
                {!data.configured ? (
                  <p role="status" className="mb-3 text-sm text-gold">
                    L'accès privé doit être configuré par la personne qui gère le site.
                  </p>
                ) : null}
                <Label htmlFor="atelier-password">Mot de passe</Label>
                <Input
                  id="atelier-password"
                  name="password"
                  maxLength={128}
                  disabled={!data.configured || busy}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="justify-self-start text-xs tracking-wide text-gold"
                  onClick={() => setShow((value) => !value)}
                >
                  {show ? "Masquer" : "Afficher"}
                </button>
              </div>
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="mt-6" disabled={busy || !data.configured}>
                {busy ? "Ouverture…" : "Ouvrir l'atelier"}
              </Button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
