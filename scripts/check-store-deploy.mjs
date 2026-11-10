import { assertPersistentDatabase, ownerConfig } from "../src/lib/store-config.server.ts";

// Vercel builds must never succeed with an ephemeral catalogue or default login.
// Local builds remain available for QA; the runtime has the same database guard.
if (process.env.VERCEL) {
  assertPersistentDatabase(process.env);
  ownerConfig(process.env);
  console.log("[store] Permanent database and owner credentials configured.");
}
