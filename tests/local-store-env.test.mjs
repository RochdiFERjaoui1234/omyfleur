import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { localStoreConfigPath, localStoreEnvironment } from "../scripts/local-store-env.mjs";

const directory = mkdtempSync(join(tmpdir(), "store-env-test-"));
const path = join(directory, "settings.json");
writeFileSync(path, JSON.stringify({
  DATABASE_URL: "postgres://local-test",
  ATELIER_PASSWORD_HASH: "test-hash",
  ATELIER_SESSION_SECRET: "test-secret",
  VITE_SECRET: "must-never-be-loaded",
}));
after(() => rmSync(directory, { recursive: true, force: true }));

test("local settings expose only server keys and preserve environment overrides", () => {
  assert.deepEqual(localStoreEnvironment({ DATABASE_URL: "postgres://override" }, path), {
    DATABASE_URL: "postgres://override",
    ATELIER_PASSWORD_HASH: "test-hash",
    ATELIER_SESSION_SECRET: "test-secret",
  });
  assert.notEqual(localStoreConfigPath(join(directory, "one")), localStoreConfigPath(join(directory, "two")));
});

test("Vercel never reads or falls back to local credentials", () => {
  assert.deepEqual(localStoreEnvironment({ VERCEL: "1" }, path), { VERCEL: "1" });
});

test("missing local settings are optional; corrupt settings fail without leaking values", () => {
  assert.deepEqual(localStoreEnvironment({ PATH: "test" }, join(directory, "missing.json")), { PATH: "test" });
  const invalid = join(directory, "invalid.json");
  writeFileSync(invalid, "sensitive-malformed-input");
  assert.throws(() => localStoreEnvironment({}, invalid), {
    message: "The local store configuration could not be read.",
  });
});
