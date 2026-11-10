import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CatalogItem, CatalogItemInput, CategoryId } from "@/lib/catalog";
import {
  CATEGORIES,
  DEFAULT_PRICE_LABEL,
  categoryById,
} from "@/lib/catalog";
import {
  createCatalogItem,
  deleteCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { preparePhoto } from "@/lib/prepare-photo";

const EMPTY: CatalogItemInput = {
  name: "",
  category: "bouquets",
  imageUrl: "",
  priceLabel: DEFAULT_PRICE_LABEL,
  description: "",
  sortOrder: 0,
  available: true,
};

export function AdminStudio({
  items,
  preview = false,
}: {
  items: CatalogItem[];
  preview?: boolean;
}) {
  const router = useRouter();
  const createFn = useServerFn(createCatalogItem);
  const updateFn = useServerFn(updateCatalogItem);
  const deleteFn = useServerFn(deleteCatalogItem);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CategoryId>("all");
  const [editor, setEditor] = useState<null | { mode: "create" } | { mode: "edit"; item: CatalogItem }>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.priceLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const counts = useMemo(() => {
    const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<
      CategoryId,
      number
    >;
    for (const item of items) byCat[item.category] += 1;
    return byCat;
  }, [items]);

  async function persist(input: CatalogItemInput, photo: File | null, id?: number) {
    if (busy) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set("item", JSON.stringify({ ...input, id }));
      if (photo) data.set("photo", photo);
      if (id) {
        await updateFn({ data });
        toast.success("Création mise à jour");
      } else {
        await createFn({ data });
        toast.success("Création ajoutée au catalogue");
      }
      setEditor(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: CatalogItem) {
    setBusy(true);
    try {
      await deleteFn({ data: { id: item.id } });
      toast.success("Création retirée");
      setPendingDelete(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      {preview ? (
        <p className="mb-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Aperçu local : les modifications disparaissent au redémarrage. La boutique publiée utilise une base permanente.
        </p>
      ) : null}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-[0.72rem] tracking-[0.4em] text-gold uppercase">
            Atelier
          </p>
          <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] tracking-wide">
            Gérer le catalogue
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Touchez Nouvelle création, choisissez une photo, donnez un nom.
            La boutique se met à jour sous trente secondes, sans autre manipulation.
          </p>
        </div>
        <Button
          onClick={() => setEditor({ mode: "create" })}
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus />
          Nouvelle création
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={cn(
              "rounded-xl border px-4 py-4 text-left transition-colors",
              filter === cat.id
                ? "border-gold bg-gold/10"
                : "border-border bg-glass hover:border-gold/50",
            )}
          >
            <p className="text-[0.68rem] tracking-[0.16em] text-muted uppercase">
              {cat.label}
            </p>
            <p className="font-display mt-1 text-2xl text-gold">{counts[cat.id]}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une création"
            className="pl-10"
            aria-label="Rechercher une création"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label={`Tout (${items.length})`}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <p className="font-display text-xl text-fg">Aucune pièce</p>
          <p className="mt-2 text-sm text-muted">
            Ajoutez une création pour la faire apparaître dans la boutique.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <AdminCard
              key={item.id}
              item={item}
              onEdit={() => setEditor({ mode: "edit", item })}
              onDelete={() => setPendingDelete(item)}
            />
          ))}
        </div>
      )}

      {editor ? (
        <ItemEditor
          key={editor.mode === "edit" ? `edit-${editor.item.id}` : "create"}
          open
          busy={busy}
          title={editor.mode === "edit" ? "Modifier la création" : "Nouvelle création"}
          initial={
            editor.mode === "edit"
              ? {
                  name: editor.item.name,
                  category: editor.item.category,
                  imageUrl: editor.item.imageUrl,
                  priceLabel: editor.item.priceLabel,
                  description: editor.item.description,
                  sortOrder: editor.item.sortOrder,
                  available: editor.item.available,
                }
              : {
                  ...EMPTY,
                  sortOrder:
                    items.filter((i) => i.category === "bouquets").length + 1,
                }
          }
          onOpenChange={(open) => !open && setEditor(null)}
          onSave={(input, photo) =>
            persist(input, photo, editor.mode === "edit" ? editor.item.id : undefined)
          }
        />
      ) : null}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette création ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} disparaîtra de la boutique. Cette action est définitive.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !pendingDelete}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) void remove(pendingDelete);
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterChip({
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
      onClick={onClick}
      className={cn(
        "rounded-pill border px-4 py-2 text-xs tracking-[0.12em] uppercase",
        active ? "border-gold bg-gold text-bg" : "border-border bg-glass text-fg",
      )}
    >
      {label}
    </button>
  );
}

function AdminCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CatalogItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = categoryById(item.category);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [item.imageUrl]);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-glass">
      <div className="relative aspect-[4/5] bg-surface">
        {broken ? (
          <div className="flex h-full items-center justify-center font-display text-gold/40">
            {cat.singular}
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={item.available ? "default" : "muted"}>
            {item.available ? "En vitrine" : "Masquée"}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[0.68rem] tracking-[0.16em] text-gold uppercase">
          {cat.label}
        </p>
        <h3 className="font-display mt-1 text-lg text-fg">{item.name}</h3>
        <p className="mt-1 text-xs tracking-wide text-muted">{item.priceLabel}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-danger hover:text-danger"
            onClick={onDelete}
            aria-label={`Retirer ${item.name}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}

function ItemEditor({
  open,
  busy,
  title,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  busy: boolean;
  title: string;
  initial: CatalogItemInput;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CatalogItemInput, photo: File | null) => void;
}) {
  const [form, setForm] = useState<CatalogItemInput>(initial);
  const [previewBroken, setPreviewBroken] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        className="max-h-[min(92dvh,880px)] max-w-2xl overflow-y-auto"
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onPointerDownOutside={(event) => busy && event.preventDefault()}
      >
        <EditorBody
          title={title}
          busy={busy}
          form={form}
          setForm={setForm}
          previewBroken={previewBroken}
          setPreviewBroken={setPreviewBroken}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditorBody({
  title,
  busy,
  form,
  setForm,
  previewBroken,
  setPreviewBroken,
  onSave,
}: {
  title: string;
  busy: boolean;
  form: CatalogItemInput;
  setForm: Dispatch<SetStateAction<CatalogItemInput>>;
  previewBroken: boolean;
  setPreviewBroken: (v: boolean) => void;
  onSave: (input: CatalogItemInput, photo: File | null) => void;
}) {
  const [preparing, setPreparing] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const selection = useRef(0);
  useEffect(() => () => {
    selection.current += 1;
  }, []);
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const imageUrl = photoPreview || form.imageUrl;

  function patch(partial: Partial<CatalogItemInput>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function onFile(file: File | undefined) {
    if (!file || busy) return;
    const current = ++selection.current;
    setPreparing(true);
    try {
      const prepared = await preparePhoto(file);
      if (selection.current !== current) return;
      setPreviewBroken(false);
      // Updating the photo never restores an old snapshot of the text fields.
      setPhoto(prepared);
    } catch (err) {
      if (selection.current === current) {
        toast.error(err instanceof Error ? err.message : "Photo impossible");
      }
    } finally {
      if (selection.current === current) setPreparing(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Une photo, un nom, et c'est en boutique.
        </DialogDescription>
      </DialogHeader>

      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy || preparing) return;
          if (!form.name.trim() || (!photo && !form.imageUrl.trim())) {
            toast.error("Ajoutez une photo et un nom.");
            return;
          }
          onSave(
            {
              ...form,
              name: form.name.trim(),
              imageUrl: form.imageUrl.trim(),
              priceLabel: form.priceLabel.trim() || DEFAULT_PRICE_LABEL,
              description: form.description.trim(),
            },
            photo,
          );
        }}
      >
        <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-gold/40 bg-surface">
          <input
            type="file"
            accept="image/*"
            disabled={busy || preparing}
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            aria-label="Choisir une photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onFile(file);
            }}
          />
          <div className="aspect-[4/3] max-h-72 sm:aspect-[4/5] sm:max-h-80">
            {imageUrl && !previewBroken ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setPreviewBroken(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <ImagePlus className="size-8 text-gold" />
                <p className="font-display text-lg text-fg">Ajouter une photo</p>
                <p className="text-sm text-muted">
                  Touchez ici — téléphone ou ordinateur
                </p>
              </div>
            )}
          </div>
          {imageUrl && !previewBroken ? (
            <p className="border-t border-border bg-bg/80 px-4 py-2 text-center text-xs tracking-wide text-gold uppercase">
              {preparing ? "Préparation…" : "Changer la photo"}
            </p>
          ) : preparing ? (
            <p className="px-4 py-2 text-center text-xs text-muted">Préparation de la photo…</p>
          ) : null}
        </label>

        <div className="grid gap-1.5">
          <Label htmlFor="item-name">Nom</Label>
          <Input
            id="item-name"
            maxLength={120}
            disabled={busy}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Bouquet Éclat Rouge"
            required
          />
        </div>

        <div className="grid gap-2">
          <p className="text-sm text-fg">Collection</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={busy}
                onClick={() => patch({ category: cat.id })}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left text-sm",
                  form.category === cat.id
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border bg-bg text-fg",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="item-price">Prix affiché</Label>
          <Input
            id="item-price"
            maxLength={80}
            disabled={busy}
            value={form.priceLabel}
            onChange={(e) => patch({ priceLabel: e.target.value })}
            placeholder="85 DT — ou laissez tel quel"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="item-desc">Un mot (facultatif)</Label>
          <Textarea
            id="item-desc"
            maxLength={600}
            disabled={busy}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Roses rouges et papier noir et or…"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg px-4 py-3">
          <div>
            <p className="text-sm text-fg">Montrer dans la boutique</p>
            <p className="text-xs text-muted">Décochez pour la garder de côté.</p>
          </div>
          <Switch
            disabled={busy}
            checked={form.available}
            onCheckedChange={(checked) => patch({ available: checked })}
            aria-label="Montrer dans la boutique"
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={busy || preparing} className="w-full sm:w-auto">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
