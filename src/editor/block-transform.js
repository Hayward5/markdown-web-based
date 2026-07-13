import { editorViewCtx } from '@milkdown/core';
import { lift, setBlockType, wrapIn } from '@milkdown/prose/commands';
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

function setSelectionInside(view, pos, node) {
    const offset = node.type.name === 'blockquote' ? 2 : 1;
    const selectionPos = Math.min(pos + offset, view.state.doc.content.size);
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(selectionPos))));
}

function getDirectTarget(view, targetType) {
    if (targetType === 'paragraph') return { nodeType: view.state.schema.nodes.paragraph };
    if (targetType === 'code-block') return { nodeType: view.state.schema.nodes.code_block };
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

    setSelectionInside(view, pos, node);

    if (currentType === 'blockquote') {
        if (!lift(view.state, view.dispatch)) return false;
    }

    if (targetType === 'blockquote') {
        const paragraph = view.state.schema.nodes.paragraph;
        const blockquote = view.state.schema.nodes.blockquote;
        if (!paragraph || !blockquote) return false;
        if (view.state.selection.$from.parent.type !== paragraph) {
            if (!setBlockType(paragraph)(view.state, view.dispatch)) return false;
        }
        return wrapIn(blockquote)(view.state, view.dispatch);
    }

    const target = getDirectTarget(view, targetType);
    if (!target || !target.nodeType) return false;
    if (view.state.selection.$from.parent.hasMarkup(target.nodeType, target.attrs)) {
        return currentType === 'blockquote';
    }
    return setBlockType(target.nodeType, target.attrs)(view.state, view.dispatch);
}
