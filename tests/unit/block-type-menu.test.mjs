import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isClickGesture,
    shouldTransformBlock,
} from '../../src/editor/block-type-menu.js';

test('a stationary block handle gesture is a click', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 13, y: 14 }), true);
});

test('a block handle gesture over five pixels is a drag', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 16, y: 10 }), false);
});

test('selecting the active block type is a no-op', () => {
    assert.equal(shouldTransformBlock('heading-1', 'heading-1'), false);
    assert.equal(shouldTransformBlock('heading-1', 'heading-2'), true);
});
