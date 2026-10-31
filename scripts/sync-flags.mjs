// @ts-check
import { copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy the flags we actually dial into `public/flags/`.
 *
 * Run with `npm run generate:flags`. Re-run after adding a country to
 * `DIAL_COUNTRIES`; the check below will tell you if you forgot.
 *
 * Why files rather than emoji: the picker used `String.fromCodePoint` to
 * build a regional-indicator pair, which is the cheapest possible flag and
 * renders beautifully on macOS, iOS and Android. Windows ships no flag
 * glyphs at all, so Chrome there falls back to drawing the two letters —
 * every row read "TR +90" instead of showing a Turkish flag. An <img> is
 * the only thing that looks the same on all four.
 *
 * Why only 98 of the 271 `flag-icons` ships: the rest are countries we
 * neither haul to nor plausibly receive visitors from, and three quarters
 * of a megabyte is already more than this needs to be.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const SOURCE = join(root, "node_modules", "flag-icons", "flags", "4x3");
const TARGET = join(root, "public", "flags");

/** The one source of truth for which countries exist, read rather than copied. */
async function dialIsoCodes() {
  const source = await readFile(join(root, "src", "lib", "phone.ts"), "utf8");
  const block = source.match(/const RAW[\s\S]*?\n\];/);
  if (!block) throw new Error("Could not find the RAW dial table in src/lib/phone.ts");
  const codes = [...block[0].matchAll(/\["([A-Z]{2})",\s*"\d+"\]/g)].map((m) => m[1]);
  if (codes.length === 0) throw new Error("Parsed the dial table but found no ISO codes");
  return [...new Set(codes)];
}

const isos = await dialIsoCodes();

await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });

let bytes = 0;
const missing = [];

for (const iso of isos) {
  const name = `${iso.toLowerCase()}.svg`;
  const from = join(SOURCE, name);
  try {
    const info = await stat(from);
    await copyFile(from, join(TARGET, name));
    bytes += info.size;
  } catch {
    missing.push(iso);
  }
}

const written = (await readdir(TARGET)).length;
console.log(`flags: ${written} copied, ${(bytes / 1024).toFixed(0)} KB`);

if (missing.length > 0) {
  console.error(`flags: no SVG for ${missing.join(", ")}`);
  process.exit(1);
}
