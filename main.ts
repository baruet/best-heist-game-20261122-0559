// The Gilded Hour — hand-in program (Node 22, standard library only).
//
// What it does: copies this repo's game/ and screenshots/ into the output
// directory and writes dossier.json there, the summary the judge reads.
// The dossier is built by the vendored make.fun library, never by hand,
// so the file the judge sees is byte-for-byte what the library produces.
// The program is deterministic: run it twice and /output is identical.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files in all, or a path under game/ over 1000 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    n += entry.isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

function copyTree(src, dest) {
  cpSync(src, dest, { recursive: true });
  return countFiles(dest);
}

mkdirSync(outDir, { recursive: true });
const gameFiles = copyTree(join(repoDir, 'game'), join(outDir, 'game'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
let shotFiles = 0;
if (existsSync(join(repoDir, 'screenshots'))) {
  shotFiles = copyTree(join(repoDir, 'screenshots'), join(outDir, 'screenshots'));
}

const dossier = buildDossier(outDir, DOSSIER_CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`The Gilded Hour: ${gameFiles} game files, ${shotFiles} screenshots, dossier ${dossier.length} bytes -> ${outDir}`);
