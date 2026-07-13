import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = path.join(root, '.release-build');
const releaseDir = path.join(root, 'release');

process.env.VITE_SINGLEFILE = 'true';
await rm(tempDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });
await build({ root, build: { outDir: tempDir, emptyOutDir: true } });
await rename(path.join(tempDir, 'index.html'), path.join(releaseDir, 'markdown-editor.html'));
await rm(tempDir, { recursive: true, force: true });
