import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, normalizePreviewUrl } from '../../src/preview/preview-renderer.js';

test('escapeHtml converts raw tags and event attributes to text', () => {
    assert.equal(
        escapeHtml('<img src=x onerror=alert(1)>'),
        '&lt;img src=x onerror=alert(1)&gt;'
    );
});

test('image policy blocks active and remote URLs', () => {
    assert.equal(normalizePreviewUrl('javascript:alert(1)', 'image'), null);
    assert.equal(normalizePreviewUrl('https://example.invalid/x.png', 'image'), null);
    assert.equal(normalizePreviewUrl('data:text/html;base64,PHNjcmlwdD4=', 'image'), null);
});

test('image policy allows local and safe embedded images', () => {
    assert.equal(normalizePreviewUrl('./images/a.png', 'image'), './images/a.png');
    assert.equal(normalizePreviewUrl('file:///C:/docs/a.png', 'image'), 'file:///C:/docs/a.png');
    assert.equal(
        normalizePreviewUrl('data:image/png;base64,AAAA', 'image'),
        'data:image/png;base64,AAAA'
    );
});

test('link policy blocks script schemes but preserves explicit web links', () => {
    assert.equal(normalizePreviewUrl('vbscript:msgbox(1)', 'link'), null);
    assert.equal(normalizePreviewUrl('https://example.com', 'link'), 'https://example.com');
});
