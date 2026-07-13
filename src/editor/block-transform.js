import { editorViewCtx } from '@milkdown/core';
import { setBlockType } from '@milkdown/prose/commands';
import { TextSelection } from '@milkdown/prose/state';

export function getBlockType(node) {
    if (!node) return null;
    if (node.type.name === 'paragraph') return 'paragraph';
    if (node.type.name === 'heading') return `heading-${node.attrs.level}`;
    if (node.type.name === 'blockquote' && node.childCount === 1 && node.firstChild?.isTextblock) {
        return 'blockquote';
    }
    if (node.type.name === 'code_block') return 'code-block';
    return null;
}

function getTarget(view, targetType) {
    if (targetType === 'paragraph') return { nodeType: view.state.schema.nodes.paragraph };
    if (targetType.startsWith('heading-')) {
        return {
            nodeType: view.state.schema.nodes.heading,
            attrs: { level: Number(targetType.slice('heading-'.length)) },
        };
    }
    return null;
}

export function transformBlockAt(ctx, pos, targetType, expectedNode = null) {
    const view = ctx.get(editorViewCtx);
    const node = view.state.doc.nodeAt(pos);
    if (expectedNode && node !== expectedNode) return false;
    const currentType = getBlockType(node);
    if (!currentType || currentType === targetType) return false;

    const target = getTarget(view, targetType);
    if (!target || !target.nodeType) return false;
    const selectionPos = Math.min(pos + 1, view.state.doc.content.size);
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(selectionPos))));
    return setBlockType(target.nodeType, target.attrs)(view.state, view.dispatch);
}
