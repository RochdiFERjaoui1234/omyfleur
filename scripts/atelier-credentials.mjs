import { randomBytes } from "node:crypto";
import { hashOwnerPassword } from "../src/lib/store-config.server.ts";

// One-time operator setup, not a password-reset feature. No files are written.
const password = randomBytes(18).toString("base64url");
console.log(JSON.stringify({
  ownerPassword: password,
  ATELIER_PASSWORD_HASH: await hashOwnerPassword(password),
  ATELIER_SESSION_SECRET: randomBytes(48).toString("base64url"),
}, null, 2));
