import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentSession } from '../../src/document/document-session.js';

test('editing and saving transitions dirty state', () => {
    const session = new DocumentSession({ filename: 'a.md', content: '# A' });
    assert.equal(session.isDirty, false);
    session.updateContent('# B');
    assert.equal(session.isDirty, true);
    session.markSaved();
    assert.equal(session.isDirty, false);
});

test('load replaces handle and resets dirty state', () => {
    const handle = { name: 'opened.md' };
    const session = new DocumentSession();
    session.load({ filename: 'opened.md', content: '', handle });
    assert.deepEqual(session.snapshot(), {
        filename: 'opened.md', content: '', savedContent: '', handle, isDirty: false,
    });
});

test('failed or cancelled saves do not call markSaved', () => {
    const session = new DocumentSession({ content: 'one' });
    session.updateContent('two');
    assert.equal(session.isDirty, true);
    assert.equal(session.filename, 'document.md');
});
