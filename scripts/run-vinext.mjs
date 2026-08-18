import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "node_modules", "vinext", "package.json");
if (!fs.existsSync(manifestPath)) {
  console.error("vinext is not installed. Run npm install before starting or building the web application.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const binEntry = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.vinext;
if (!binEntry) {
  console.error("The installed vinext package does not expose its CLI entry point.");
  process.exit(1);
}
const executable = path.resolve(path.dirname(manifestPath), binEntry);
const child = spawn(process.execPath, [executable, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    WRANGLER_LOG_PATH:
      process.env.WRANGLER_LOG_PATH || ".wrangler/wrangler.log",
  },
  shell: false,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
