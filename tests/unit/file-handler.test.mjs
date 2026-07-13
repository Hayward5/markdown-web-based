import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFilename, readUtf8File } from '../../src/file-handler.js';

const fakeFile = (name, bytes) => ({
    name, size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer,
});

test('normalizeFilename preserves supported extensions', () => {
    assert.equal(normalizeFilename('notes.md'), 'notes.md');
    assert.equal(normalizeFilename('notes.markdown'), 'notes.markdown');
    assert.equal(normalizeFilename('notes.txt'), 'notes.txt');
    assert.equal(normalizeFilename('README'), 'README.md');
});

test('readUtf8File accepts an empty file', async () => {
    assert.equal(await readUtf8File(fakeFile('empty.md', [])), '');
});

test('readUtf8File rejects malformed UTF-8', async () => {
    await assert.rejects(() => readUtf8File(fakeFile('bad.md', [0xc3, 0x28])), /UTF-8/);
});

test('large file requires confirmation before decoding', async () => {
    const file = { name: 'large.md', size: 5 * 1024 * 1024 + 1, arrayBuffer: async () => new ArrayBuffer(0) };
    await assert.rejects(() => readUtf8File(file, { confirmLarge: () => false }), /已取消/);
});
