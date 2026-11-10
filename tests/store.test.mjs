import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { assertPersistentDatabase, hashOwnerPassword, localDatabaseAllowed, ownerConfig, verifyOwnerPassword } from "../src/lib/store-config.server.ts";
import { reserveLoginAttempt } from "../src/lib/atelier-rate-limit.server.ts";
import { readCatalogPhoto } from "../src/lib/catalog-photo.server.ts";

const pg = new PGlite();
const legacyBytes = await readFile(new URL("../public/logo.jpg", import.meta.url));
const legacyUrl = `data:image/jpeg;base64,${legacyBytes.toString("base64")}`;
const sql = async (strings, ...values) => {
  const text = strings.reduce((result, part, index) => result + (index ? `$${index}` : "") + part, "");
  return (await pg.query(text, values)).rows;
};

before(async () => {
  await pg.waitReady;
  await pg.exec(await readFile(new URL("../migrations/0002_catalog.sql", import.meta.url), "utf8"));
  await pg.query("insert into catalog_items (name, category, image_url) values ($1, $2, $3)", ["Legacy upload", "bouquets", legacyUrl]);
  await pg.transaction(async (tx) => {
    await tx.exec(await readFile(new URL("../migrations/0003_catalog_photos_and_login_limits.sql", import.meta.url), "utf8"));
  });
});
after(() => pg.close());

test("the production database guard cannot be bypassed by the local-preview flag on Vercel", () => {
  assert.throws(() => assertPersistentDatabase({ VERCEL: "1", APP_LOCAL_PREVIEW: "1" }), /DATABASE_URL/);
  assert.throws(() => assertPersistentDatabase({ NODE_ENV: "production", DATABASE_URL: "   " }), /DATABASE_URL/);
  assert.doesNotThrow(() => assertPersistentDatabase({ VERCEL: "1", DATABASE_URL: "postgres://configured" }));
  assert.equal(localDatabaseAllowed({ NODE_ENV: "production", APP_LOCAL_PREVIEW: "1" }), true);
  assert.equal(localDatabaseAllowed({ NODE_ENV: "development" }), true);
});

test("owner credentials are salted, checked correctly, and required", async () => {
  const password = randomBytes(18).toString("base64url");
  const hash = await hashOwnerPassword(password);
  const second = await hashOwnerPassword(password);
  assert.notEqual(hash, second);
  assert.equal(await verifyOwnerPassword(password, hash), true);
  assert.equal(await verifyOwnerPassword("incorrect-password", hash), false);
  assert.equal(await verifyOwnerPassword(password, "invalid-hash"), false);
  assert.throws(() => ownerConfig({}), /ATELIER_PASSWORD_HASH/);
  assert.throws(() => ownerConfig({ ATELIER_PASSWORD_HASH: hash, ATELIER_SESSION_SECRET: "weak" }), /SESSION_SECRET/);
  const base = { ATELIER_PASSWORD_HASH: hash, ATELIER_SESSION_SECRET: randomBytes(48).toString("base64url") };
  assert.notEqual(ownerConfig(base).credentialVersion, ownerConfig({ ...base, ATELIER_PASSWORD_HASH: second }).credentialVersion);
});

test("the media migration preserves existing product data and exact photo bytes", async () => {
  const { rows } = await pg.query(`
    select i.name, i.image_url, i.photo_id, p.bytes, p.content_type
    from catalog_items i join catalog_photos p on p.id = i.photo_id where i.name = 'Legacy upload'
  `);
  assert.equal(rows.length, 1);
  assert.match(rows[0].image_url, /^\/media\/[a-f0-9]{32}$/);
  assert.equal(rows[0].content_type, "image/jpeg");
  assert.deepEqual(Buffer.from(rows[0].bytes), legacyBytes);
  assert.equal((await pg.query("select count(*)::integer as n from catalog_items")).rows[0].n, 127);
  const { rows: products } = await pg.query("select image_url from catalog_items");
  assert.equal(products.some((item) => item.image_url.startsWith("data:")), false);
});

test("the schema prevents future inline Base64 photos in catalogue responses", async () => {
  await assert.rejects(pg.query("update catalog_items set image_url = $1 where name = 'Legacy upload'", [legacyUrl]), /catalog_items_image_reference/);
});

test("concurrent requests share one atomic eight-attempt login budget", async () => {
  const results = await Promise.all(Array.from({ length: 24 }, () => reserveLoginAttempt(sql, "concurrent-test", 8)));
  assert.equal(results.filter(Boolean).length, 8);
  assert.equal((await pg.query("select attempts from atelier_login_limits where bucket_key = 'concurrent-test'")).rows[0].attempts, 8);
});

test("an expired login window resets and expired buckets are cleaned up", async () => {
  await pg.exec("update atelier_login_limits set expires_at = now() - interval '1 second' where bucket_key = 'concurrent-test'");
  assert.equal(await reserveLoginAttempt(sql, "concurrent-test", 8), true);
  assert.equal((await pg.query("select attempts from atelier_login_limits where bucket_key = 'concurrent-test'")).rows[0].attempts, 1);
  await pg.exec("insert into atelier_login_limits values ('expired-test', 1, now() - interval '2 days')");
  await reserveLoginAttempt(sql, "another-test", 8);
  assert.equal((await pg.query("select * from atelier_login_limits where bucket_key = 'expired-test'")).rows.length, 0);
});

test("photo input enforces byte limits and raster signatures, not just a supplied MIME type", async () => {
  const webp = await readFile(new URL("../public/catalog/bouquets/1.webp", import.meta.url));
  const photo = await readCatalogPhoto(new File([webp], "photo.webp", { type: "image/webp" }));
  assert.match(photo.id, /^[a-f0-9]{64}$/);
  assert.equal(photo.imageUrl, `/media/${photo.id}`);
  assert.deepEqual(photo.bytes, webp);
  const duplicate = await readCatalogPhoto(new File([webp], "different-name.webp", { type: "image/webp" }));
  assert.equal(photo.id, duplicate.id);
  await assert.rejects(readCatalogPhoto(new File(["<svg onload='alert(1)'/>"], "photo.jpg", { type: "image/jpeg" })), /non valide/);
  await assert.rejects(readCatalogPhoto(new File([webp], "photo.jpg", { type: "image/jpeg" })), /non valide/);
  await assert.rejects(readCatalogPhoto(new File([new Uint8Array(350001)], "huge.jpg", { type: "image/jpeg" })), /lourde/);
});
