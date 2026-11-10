import { createHmac } from "node:crypto";
import {
  getRequestIP,
  getRequestProtocol,
  setResponseHeader,
  useSession,
} from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { ownerConfig, verifyOwnerPassword } from "./store-config.server";
import { reserveLoginAttempt } from "./atelier-rate-limit.server";

export function privateAtelierRequest() {
  assertSameSiteRequest();
  setResponseHeader("Cache-Control", "private, no-store");
  setResponseHeader("Vercel-CDN-Cache-Control", "no-store");
}

function sessionConfig() {
  const { sessionSecret } = ownerConfig();
  const secure =
    Boolean(process.env.VERCEL) || getRequestProtocol({ xForwardedProto: true }) === "https";
  return {
    password: sessionSecret,
    name: "omy-atelier",
    sessionHeader: false as const,
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
    },
  };
}

export function atelierIsConfigured() {
  try {
    ownerConfig();
    return true;
  } catch {
    return false;
  }
}

export async function atelierIsOpen() {
  privateAtelierRequest();
  if (!atelierIsConfigured()) return false;
  const session = await useSession<{ owner?: string }>(sessionConfig());
  return session.data.owner === ownerConfig().credentialVersion;
}

export async function assertAtelierOpen() {
  if (!(await atelierIsOpen())) {
    throw new Error("Atelier verrouillé");
  }
}

export async function closeAtelier() {
  privateAtelierRequest();
  const session = await useSession<{ owner?: string }>(sessionConfig());
  await session.clear();
}

export async function tryUnlock(
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  privateAtelierRequest();
  if (!atelierIsConfigured()) {
    return {
      ok: false,
      message: "L'atelier n'est pas encore configuré. Contactez la personne qui gère le site.",
    };
  }
  const config = ownerConfig();
  const sql = await getSql();
  const ip = getRequestIP({ xForwardedFor: true }) ?? "local";
  const bucket = createHmac("sha256", config.sessionSecret).update(ip).digest("hex");
  // Also cap total password hashing work if callers rotate addresses.
  if (
    !(await reserveLoginAttempt(sql, bucket, 8)) ||
    !(await reserveLoginAttempt(sql, "owner-global", 40))
  ) {
    return { ok: false, message: "Trop d'essais. Patientez dix minutes." };
  }
  if (!(await verifyOwnerPassword(password, config.passwordHash))) {
    return { ok: false, message: "Mot de passe incorrect." };
  }
  await sql`delete from atelier_login_limits where bucket_key = ${bucket}`;
  const session = await useSession<{ owner?: string }>(sessionConfig());
  await session.clear();
  await session.update({ owner: config.credentialVersion });
  return { ok: true };
}
