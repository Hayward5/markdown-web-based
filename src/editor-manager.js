// Milkdown/Crepe 編輯器管理模組
import { CrepeBuilder } from '@milkdown/crepe/builder';
import { blockEdit } from '@milkdown/crepe/feature/block-edit';
import { cursor } from '@milkdown/crepe/feature/cursor';
import { imageBlock } from '@milkdown/crepe/feature/image-block';
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip';
import { listItem } from '@milkdown/crepe/feature/list-item';
import { placeholder } from '@milkdown/crepe/feature/placeholder';
import { table } from '@milkdown/crepe/feature/table';
import { toolbar } from '@milkdown/crepe/feature/toolbar';
import { editorViewCtx, serializerCtx } from '@milkdown/core';
import { $prose, replaceAll } from '@milkdown/kit/utils';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@milkdown/prose/state';
import { Fragment } from '@milkdown/prose/model';
import { BlockTypeMenu, isClickGesture } from './editor/block-type-menu.js';
import { getBlockType, transformBlockAt } from './editor/block-transform.js';


// 引入 Crepe 預設樣式（排除 latex.css 以減少字體檔案）
import '@milkdown/crepe/theme/common/prosemirror.css';
import '@milkdown/crepe/theme/common/reset.css';
import '@milkdown/crepe/theme/common/block-edit.css';
import '@milkdown/crepe/theme/common/cursor.css';
import '@milkdown/crepe/theme/common/image-block.css';
import '@milkdown/crepe/theme/common/link-tooltip.css';
import '@milkdown/crepe/theme/common/list-item.css';
import '@milkdown/crepe/theme/common/placeholder.css';
import '@milkdown/crepe/theme/common/toolbar.css';
import '@milkdown/crepe/theme/common/table.css';
// import '@milkdown/crepe/theme/common/latex.css'; // 已移除 KaTeX 數學公式
import '@milkdown/crepe/theme/frame.css';

export class EditorManager {
    constructor() {
        this.editor = null;
        this.crepe = null;
        this.onChangeCallback = null;
        this.blockHandleCleanup = null;
        this.blockTypeMenu = null;
        this.selectedBlock = null;
    }

    /**
     * 建立 Milkdown 編輯器
     * @param {string} defaultValue - 初始內容
     */
    async create(defaultValue = '') {
        const exitListOnBackspace = $prose(() => {
            return new Plugin({
                key: new PluginKey('exit-list-on-backspace'),
                props: {
                    handleKeyDown(view, event) {
                        if (event.key !== 'Backspace' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
                            return false;
                        }

                        const { state } = view;
                        const { $from, empty } = state.selection;
                        if (!empty) {
                            return false;
                        }

                        let listItemDepth = null;
                        for (let depth = $from.depth; depth > 0; depth -= 1) {
                            if ($from.node(depth).type.name === 'list_item') {
                                listItemDepth = depth;
                                break;
                            }
                        }

                        if (!listItemDepth) {
                            return false;
                        }

                        const listItem = $from.node(listItemDepth);
                        const parent = $from.node(listItemDepth - 1);
                        if (!parent || (parent.type.name !== 'ordered_list' && parent.type.name !== 'bullet_list')) {
                            return false;
                        }

                        if ($from.parent.type.name !== 'paragraph') {
                            return false;
                        }

                        if ($from.parentOffset !== 0) {
                            return false;
                        }

                        const paragraph = $from.parent;
                        const paragraphIndex = $from.index(listItemDepth);
                        const beforeNodes = [];
                        const afterNodes = [];

                        for (let index = 0; index < listItem.childCount; index += 1) {
                            const child = listItem.child(index);
                            if (index < paragraphIndex) {
                                beforeNodes.push(child);
                            } else if (index > paragraphIndex) {
                                afterNodes.push(child);
                            }
                        }

                        const listNode = parent;
                        const listDepth = listItemDepth - 1;
                        const listPos = $from.before(listDepth);
                        const listEnd = $from.after(listDepth);
                        const listItemIndex = $from.index(listDepth);

                        const listItemsBefore = [];
                        const listItemsAfter = [];

                        for (let index = 0; index < listNode.childCount; index += 1) {
                            const child = listNode.child(index);
                            if (index < listItemIndex) {
                                listItemsBefore.push(child);
                            } else if (index > listItemIndex) {
                                listItemsAfter.push(child);
                            }
                        }

                        if (beforeNodes.length > 0) {
                            const beforeItem = listItem.type.create(listItem.attrs, Fragment.fromArray(beforeNodes));
                            listItemsBefore.push(beforeItem);
                        }

                        if (afterNodes.length > 0) {
                            const afterItem = listItem.type.create(listItem.attrs, Fragment.fromArray(afterNodes));
                            listItemsAfter.unshift(afterItem);
                        }

                        const paragraphNode = paragraph.type.create(paragraph.attrs, paragraph.content);
                        if (!paragraphNode) {
                            return false;
                        }

                        const replacementNodes = [];
                        if (listItemsBefore.length > 0) {
                            const beforeList = listNode.type.create(listNode.attrs, Fragment.fromArray(listItemsBefore));
                            replacementNodes.push(beforeList);
                        }

                        replacementNodes.push(paragraphNode);

                        if (listItemsAfter.length > 0) {
                            const afterList = listNode.type.create(listNode.attrs, Fragment.fromArray(listItemsAfter));
                            replacementNodes.push(afterList);
                        }

                        const tr = state.tr;
                        tr.replaceWith(listPos, listEnd, Fragment.fromArray(replacementNodes));

                        const beforeSize = listItemsBefore.length > 0 ? replacementNodes[0].nodeSize : 0;
                        const selectionPos = listPos + beforeSize + 1;
                        tr.setSelection(TextSelection.create(tr.doc, selectionPos));
                        view.dispatch(tr);
                        event.preventDefault();
                        return true;
                    },
                },
            });
        });

        const crepe = new CrepeBuilder({ root: '#editor', defaultValue })
            .addFeature(cursor)
            .addFeature(listItem)
            .addFeature(linkTooltip)
            .addFeature(imageBlock)
            .addFeature(blockEdit)
            .addFeature(placeholder, { text: '輸入 / 開啟命令選單，或開始編寫 Markdown...' })
            .addFeature(toolbar)
            .addFeature(table);

        // 設定事件監聽
        this.setupListeners(crepe);

        // 建立編輯器
        crepe.editor.use(exitListOnBackspace);
        await crepe.create();

        this.crepe = crepe;
        this.editor = crepe.editor;
        this.blockTypeMenu = new BlockTypeMenu({
            onSelect: (targetType) => {
                const selectedBlock = this.selectedBlock;
                this.blockTypeMenu?.hide();
                if (!selectedBlock) return;
                this.editor?.action((ctx) => transformBlockAt(
                    ctx,
                    selectedBlock.pos,
                    targetType,
                    selectedBlock.node
                ));
            },
        });
        this.setupBlockHandleClick();


        return this;
    }

    /**
     * 設定編輯器事件監聽
     */
    setupListeners(crepe) {
        let prevMarkdown = '';

        crepe.on((api) => {
            api.updated((ctx) => {
                const markdown = this.getMarkdown(ctx);
                if (prevMarkdown !== markdown) {
                    prevMarkdown = markdown;
                    if (this.onChangeCallback) {
                        this.onChangeCallback(markdown);
                    }
                }
            });
        });
    }

    /**
     * 從上下文取得 Markdown 內容
     */
    getMarkdown(ctx) {
        try {
            const serializer = ctx.get(serializerCtx);
            const view = ctx.get(editorViewCtx);
            return serializer(view.state.doc);
        } catch (e) {
            console.error('Failed to get markdown:', e);
            return '';
        }
    }

    /**
     * 取得當前 Markdown 內容
     */
    getContent() {
        if (!this.editor) return '';

        return this.editor.action((ctx) => {
            return this.getMarkdown(ctx);
        });
    }

    /**
     * 設定編輯器內容
     * @param {string} markdown - Markdown 內容
     */
    setContent(markdown) {
        if (!this.editor) return;

        this.editor.action((ctx) => {
            replaceAll(markdown)(ctx);
        });
    }

    setupBlockHandleClick() {
        const root = document.querySelector('#editor');
        if (!root) return;

        let pointerStart = null;
        const findDragHandle = (target) => target instanceof Element
            ? target.closest('.milkdown-block-handle .operation-item:last-child')
            : null;

        const onPointerDown = (event) => {
            const handle = findDragHandle(event.target);
            if (!handle || !root.contains(handle)) return;
            pointerStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, handle };
        };

        const onPointerUp = (event) => {
            const handle = findDragHandle(event.target);
            const start = pointerStart;
            pointerStart = null;
            if (!handle || !start || handle !== start.handle || event.pointerId !== start.pointerId) return;
            if (!isClickGesture(start, { x: event.clientX, y: event.clientY })) return;

            this.editor?.action((ctx) => {
                const view = ctx.get(editorViewCtx);
                const { selection } = view.state;
                if (!(selection instanceof NodeSelection)) return;
                const currentType = getBlockType(selection.node);
                if (!currentType) return;
                this.selectedBlock = { pos: selection.from, node: selection.node };
                this.blockTypeMenu?.show({
                    anchorRect: handle.getBoundingClientRect(),
                    currentType,
                });
            });
        };

        const onPointerCancel = () => { pointerStart = null; };
        const onDragStart = () => {
            pointerStart = null;
            this.blockTypeMenu?.hide();
        };
        root.addEventListener('pointerdown', onPointerDown, true);
        root.addEventListener('pointerup', onPointerUp, true);
        root.addEventListener('pointercancel', onPointerCancel, true);
        root.addEventListener('dragstart', onDragStart, true);
        this.blockHandleCleanup = () => {
            root.removeEventListener('pointerdown', onPointerDown, true);
            root.removeEventListener('pointerup', onPointerUp, true);
            root.removeEventListener('pointercancel', onPointerCancel, true);
            root.removeEventListener('dragstart', onDragStart, true);
        };
    }


    /**
     * 註冊內容變更回調
     * @param {Function} callback - 回調函數
     */
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    /**
     * 銷毀編輯器
     */
    destroy() {
        this.blockTypeMenu?.destroy();
        this.blockTypeMenu = null;
        this.selectedBlock = null;
        this.blockHandleCleanup?.();
        this.blockHandleCleanup = null;
        if (this.crepe) {
            this.crepe.destroy();
            this.crepe = null;
            this.editor = null;
        }
    }
}
