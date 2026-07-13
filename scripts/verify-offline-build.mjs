import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const artifact = path.join(releaseDir, 'markdown-editor.html');
const content = await readFile(artifact, 'utf8');
if (/\b(?:src|href)\s*=\s*["']https?:\/\//i.test(content)
    || /@import\s+(?:url\()?\s*["']?https?:\/\//i.test(content)) {
    throw new Error('正式成品含有遠端 runtime 依賴。');
}
const size = (await stat(artifact)).size;
const hash = createHash('sha256').update(content).digest('hex');
await writeFile(path.join(releaseDir, 'SHA256SUMS.txt'), `${hash}  markdown-editor.html\n`);
await writeFile(path.join(releaseDir, 'build-info.json'), `${JSON.stringify({ artifact: 'markdown-editor.html', bytes: size, sha256: hash }, null, 2)}\n`);
console.log(`Verified ${size} bytes, sha256 ${hash}`);
