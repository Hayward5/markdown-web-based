import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftRecord, createDraftScheduler } from '../../src/storage/draft-store.js';

test('createDraftRecord returns the single latest record shape', () => {
    assert.deepEqual(
        createDraftRecord({ filename: 'a.md', content: '# A', now: 123 }),
        { id: 'latest', filename: 'a.md', markdown: '# A', updatedAt: 123 }
    );
});

test('scheduler coalesces updates and flush writes the newest record', async () => {
    const writes = [];
    const store = { saveLatest: async (record) => writes.push(record) };
    const scheduler = createDraftScheduler({ store, delay: 60_000 });
    scheduler.schedule({ id: 'latest', markdown: 'one' });
    scheduler.schedule({ id: 'latest', markdown: 'two' });
    scheduler.schedule({ id: 'latest', markdown: 'three' });
    await scheduler.flush();
    assert.deepEqual(writes, [{ id: 'latest', markdown: 'three' }]);
    scheduler.cancel();
});
