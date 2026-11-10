import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_KEYS = ["DATABASE_URL", "ATELIER_PASSWORD_HASH", "ATELIER_SESSION_SECRET"];

/** Local-only credentials live outside the source tree and workspace snapshots. */
export function localStoreConfigPath(workspace = root) {
  const key = createHash("sha256").update(resolve(workspace)).digest("hex").slice(0, 16);
  return join(homedir(), ".config", "omy-fleur", `${key}.json`);
}

export function localStoreEnvironment(environment = process.env, path = localStoreConfigPath()) {
  // Hosting always uses the project's configured environment, never local credentials.
  if (environment.VERCEL) return { ...environment };

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { ...environment };
    throw new Error("The local store configuration could not be read.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The local store configuration is invalid.");
  }

  const local = {};
  for (const key of SERVER_KEYS) {
    if (typeof parsed[key] === "string" && parsed[key].trim()) local[key] = parsed[key];
  }
  return { ...local, ...environment };
}
