import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const COST = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const HASH_FORMAT = /^scrypt\$65536\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, COST, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashOwnerPassword(password: string): Promise<string> {
  if (password.length < 14 || password.length > 128) {
    throw new Error("Choose an owner password between 14 and 128 characters.");
  }
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt$65536$8$1$${salt}$${key.toString("hex")}`;
}

export async function verifyOwnerPassword(password: string, hash: string): Promise<boolean> {
  const match = HASH_FORMAT.exec(hash);
  if (!match || password.length > 128) return false;
  const key = await derive(password, match[1]);
  return timingSafeEqual(key, Buffer.from(match[2], "hex"));
}

export function ownerConfig(environment: NodeJS.ProcessEnv = process.env) {
  const passwordHash = environment.ATELIER_PASSWORD_HASH?.trim();
  const sessionSecret = environment.ATELIER_SESSION_SECRET?.trim();
  if (!passwordHash || !HASH_FORMAT.test(passwordHash)) {
    throw new Error("ATELIER_PASSWORD_HASH is missing or invalid.");
  }
  if (!sessionSecret || !/^[A-Za-z0-9_-]{43,128}$/.test(sessionSecret)) {
    throw new Error("ATELIER_SESSION_SECRET must be a random secret of at least 32 bytes (base64url).");
  }
  return {
    passwordHash,
    sessionSecret,
    // Password rotation invalidates old sessions even if the sealing key stays the same.
    credentialVersion: createHash("sha256").update(passwordHash).digest("hex"),
  };
}

export function localDatabaseAllowed(environment: NodeJS.ProcessEnv = process.env): boolean {
  // A preview-only switch can NEVER enable ephemeral storage on Vercel.
  if (environment.VERCEL) return false;
  return environment.NODE_ENV !== "production" || environment.APP_LOCAL_PREVIEW === "1";
}

export function assertPersistentDatabase(environment: NodeJS.ProcessEnv = process.env): void {
  if (!environment.DATABASE_URL?.trim() && !localDatabaseAllowed(environment)) {
    throw new Error(
      "DATABASE_URL is required: the deployed catalogue needs permanent PostgreSQL storage.",
    );
  }
}
