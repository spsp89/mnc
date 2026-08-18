import fs from "node:fs";
import path from "node:path";

if (process.platform !== "win32") process.exit(0);

const target = path.resolve(
  "node_modules",
  "vinext",
  "dist",
  "server",
  "static-file-cache.js",
);

if (!fs.existsSync(target)) process.exit(0);

const source = fs.readFileSync(target, "utf8");
const original = "relativePath: path.relative(base, batch[j]),";
const patched =
  'relativePath: path.relative(base, batch[j]).split(path.sep).join("/"),';

if (source.includes(patched)) process.exit(0);
if (!source.includes(original)) {
  throw new Error(
    "The installed Vinext static-file cache has changed; review the Windows path patch.",
  );
}

fs.writeFileSync(target, source.replace(original, patched));
console.log("Patched Vinext static asset paths for Windows.");
