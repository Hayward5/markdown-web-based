import test from 'node:test';
import assert from 'node:assert/strict';
import { isClickGesture } from '../../src/editor/block-type-menu.js';

test('a stationary block handle gesture is a click', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 13, y: 14 }), true);
});

test('a block handle gesture over five pixels is a drag', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 16, y: 10 }), false);
});
