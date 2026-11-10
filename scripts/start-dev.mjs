import { spawn } from "node:child_process";
import { mkdirSync, openSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  const response = await fetch("http://127.0.0.1:8080/", { signal: AbortSignal.timeout(2000) });
  if (response.ok) process.exit(0);
} catch { /* The dev server is down. */ }
mkdirSync(join(root, ".grok"), { recursive: true });
const log = openSync(join(root, ".grok/dev.log"), "a");
const windows = process.platform === "win32";
const child = spawn(windows ? "cmd.exe" : "npm", windows ? ["/d", "/s", "/c", "npm run dev"] : ["run", "dev"], {
  cwd: root, detached: true, stdio: ["ignore", log, log], windowsHide: true,
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.unref();
