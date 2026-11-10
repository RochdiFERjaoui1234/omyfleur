import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, dbSource, type Sql } from "@/lib/db";
import { CATEGORY_IDS, DEFAULT_PRICE_LABEL, parseCategory, type CatalogItem } from "@/lib/catalog";

type CatalogRow = {
  id: number;
  name: string;
  category: string;
  image_url: string;
  photo_id: string | null;
  price_label: string;
  description: string;
  sort_order: number;
  available: boolean;
  created_at: string | Date;
};

function mapItem(row: CatalogRow): CatalogItem {
  return {
    id: Number(row.id),
    name: row.name,
    category: parseCategory(row.category),
    imageUrl: row.image_url,
    priceLabel: row.price_label,
    description: row.description ?? "",
    sortOrder: Number(row.sort_order),
    available: Boolean(row.available),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

const itemInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Le nom est requis")
    .max(120, "Le nom est trop long (120 caractères maximum)."),
  category: z.enum(CATEGORY_IDS),
  priceLabel: z.string().trim().min(1)
    .max(80, "Le prix affiché est trop long.").default(DEFAULT_PRICE_LABEL),
  description: z.string().trim()
    .max(600, "La description est trop longue (600 caractères maximum).").default(""),
  sortOrder: z.number().int().min(0).max(9999),
  available: z.boolean(),
});

function submission(input: unknown): FormData {
  if (!(input instanceof FormData)) throw new Error("Formulaire non valide.");
  return input;
}

async function readSubmission(form: FormData) {
  const metadata = form.get("item");
  if (typeof metadata !== "string" || metadata.length > 8000) {
    throw new Error("Formulaire non valide.");
  }
  let input: unknown;
  try {
    input = JSON.parse(metadata);
  } catch {
    throw new Error("Formulaire non valide.");
  }
  const parsed = itemInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Vérifiez le formulaire.");
  }
  const file = form.get("photo");
  const { readCatalogPhoto } = await import("./catalog-photo.server");
  const photo = file instanceof File && file.size > 0 ? await readCatalogPhoto(file) : null;
  return { item: parsed.data, photo };
}

async function requireOwner() {
  const { assertAtelierOpen } = await import("./atelier-session.server");
  await assertAtelierOpen();
}

type Photo = NonNullable<Awaited<ReturnType<typeof readSubmission>>["photo"]>;

async function savePhoto(sql: Sql, photo: Photo) {
  // Hold the row lock until the product reference is committed. Deduplicate
  // identical uploads without a concurrent deletion removing the shared photo.
  await sql`
    insert into catalog_photos (id, content_type, bytes)
    values (${photo.id}, ${photo.contentType}, ${photo.bytes})
    on conflict (id) do update set id = excluded.id
  `;
}

async function removeUnusedPhoto(sql: Sql, id: string | null) {
  if (!id) return;
  await sql`delete from catalog_photos where id = ${id}
    and not exists (select 1 from catalog_items where photo_id = ${id})`;
}

export const listAvailableItems = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<CatalogRow>`
    select id, name, category, image_url, price_label, description, sort_order, available, created_at
    from catalog_items where available = true order by category, sort_order, id
  `;
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  // Only the public catalogue is cached. Owner data and mutations are no-store.
  // No background polling, cron jobs, or rebuild for a catalogue edit.
  setResponseHeader("Cache-Control", "public, max-age=0, s-maxage=30, must-revalidate");
  return rows.map(mapItem);
});

export const loadAtelier = createServerFn({ method: "GET" }).handler(async () => {
  const { atelierIsOpen, atelierIsConfigured } = await import("./atelier-session.server");
  if (!(await atelierIsOpen())) {
    return { unlocked: false as const, configured: atelierIsConfigured() };
  }
  const sql = await getSql();
  const rows = await sql<CatalogRow>`
    select id, name, category, image_url, price_label, description, sort_order, available, created_at
    from catalog_items order by category, sort_order, id
  `;
  return { unlocked: true as const, items: rows.map(mapItem), preview: dbSource === "pglite" };
});

export const unlockAtelier = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ password: z.string().min(1).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const { tryUnlock } = await import("./atelier-session.server");
    return tryUnlock(data.password);
  });

export const lockAtelier = createServerFn({ method: "POST" }).handler(async () => {
  const { closeAtelier } = await import("./atelier-session.server");
  await closeAtelier();
  return { ok: true as const };
});

export const createCatalogItem = createServerFn({ method: "POST" })
  .validator(submission)
  .handler(async ({ data }) => {
    await requireOwner();
    const { item, photo } = await readSubmission(data);
    if (!photo) throw new Error("Ajoutez une photo.");
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      await savePhoto(tx, photo);
      const rows = await tx<CatalogRow>`
        insert into catalog_items
          (name, category, image_url, photo_id, price_label, description, sort_order, available)
        values (${item.name}, ${item.category}, ${photo.imageUrl}, ${photo.id}, ${item.priceLabel},
          ${item.description},
          (select coalesce(max(sort_order), 0) + 1 from catalog_items where category = ${item.category}),
          ${item.available})
        returning *
      `;
      if (!rows[0]) throw new Error("Impossible d'ajouter la création.");
      return mapItem(rows[0]);
    });
  });

export const updateCatalogItem = createServerFn({ method: "POST" })
  .validator(submission)
  .handler(async ({ data }) => {
    await requireOwner();
    const { item, photo } = await readSubmission(data);
    if (!item.id) throw new Error("Création introuvable.");
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      const [previous] = await tx<CatalogRow>`
        select * from catalog_items where id = ${item.id} for update
      `;
      if (!previous) throw new Error("Création introuvable.");
      if (photo) await savePhoto(tx, photo);
      const rows = await tx<CatalogRow>`
        update catalog_items set name = ${item.name}, category = ${item.category},
          image_url = ${photo?.imageUrl ?? previous.image_url},
          photo_id = ${photo?.id ?? previous.photo_id},
          price_label = ${item.priceLabel}, description = ${item.description},
          sort_order = ${item.sortOrder}, available = ${item.available}
        where id = ${item.id} returning *
      `;
      if (photo && photo.id !== previous.photo_id) await removeUnusedPhoto(tx, previous.photo_id);
      return mapItem(rows[0]);
    });
  });

export const deleteCatalogItem = createServerFn({ method: "POST" })
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    await requireOwner();
    const sql = await getSql();
    await sql.transaction(async (tx) => {
      const [removed] = await tx<{ photo_id: string | null }>`
        delete from catalog_items where id = ${data.id} returning photo_id
      `;
      if (removed) await removeUnusedPhoto(tx, removed.photo_id);
    });
    return { ok: true as const };
  });
