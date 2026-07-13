# Block Type Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓使用者點擊六點把手後，可將目前文字區塊轉換為一般文字、Heading 1–6、引用或程式碼區塊，並保留可保留的內容。

**Architecture:** 以獨立 `BlockTypeMenu` 管理選單 DOM、定位與關閉行為，以 `block-transform` 模組管理 ProseMirror 節點判定與轉換；`EditorManager` 只負責辨識六點把手的點擊／拖曳、保存目前區塊位置並協調兩者。不要呼叫 Crepe Slash 選單的私有 `menuAPICtx`，也不要清空目前區塊。

**Tech Stack:** JavaScript ES modules、Milkdown/Crepe 7.21.3、ProseMirror、CSS、Node.js `node:test`、Playwright Core、Google Chrome for Testing 147.0.7727.102、Vite single-file build。

## Global Constraints

- 不新增第三方套件、CDN、線上服務或執行時網路需求。
- 正式成品必須維持單一 `release/markdown-editor.html`，可用 Chrome 147.0.7727.102 透過 `file://` 完全離線開啟。
- 不執行 Chrome 150 或 Windows 11 實機驗收。
- 不納入十種主題切換，也不進行無關的安全性檢查或重構。
- 保留六點把手原有拖曳行為；只有移動距離不超過 5 px 的按下／放開才視為點擊。
- 已載入 repo 內的 `src/editor-manager.js` 與 `tests/ui/offline-editor.mjs` 有本次除錯產生、尚未提交的修改；執行時以本計畫實作取代錯誤的 Slash 選單串接，不得重設其他使用者修改。

## File Structure

- Create `src/editor/block-type-menu.js`: 定義選單項目、點擊門檻判定，以及選單 DOM 的顯示、定位、關閉和銷毀生命週期。
- Create `src/editor/block-transform.js`: 判斷可轉換節點與目前型態，並以 ProseMirror command 原地轉換記錄位置所指向的區塊。
- Modify `src/editor-manager.js`: 移除目前錯誤的 `menuAPICtx` 作法，整合六點把手、選單與型態轉換。
- Modify `src/style/main.css`: 加入區塊型態選單樣式，沿用現有 theme tokens。
- Create `tests/unit/block-type-menu.test.mjs`: 驗證點擊／拖曳門檻的純函式。
- Modify `tests/ui/offline-editor.mjs`: 以 Chrome 147 驗證選單互動、所有型態轉換、內容保留與拖曳不誤觸。
- Modify `README.md`: 記錄六點把手的使用方式。
- Modify `docs/offline-acceptance.md`: 加入手動驗收步驟並移除 Chrome 150 驗收敘述。

---

### Task 1: 建立區塊型態選單與直接文字型態轉換

**Files:**
- Create: `src/editor/block-type-menu.js`
- Create: `src/editor/block-transform.js`
- Modify: `src/editor-manager.js`
- Modify: `src/style/main.css`
- Create: `tests/unit/block-type-menu.test.mjs`
- Modify: `tests/ui/offline-editor.mjs`

**Interfaces:**
- Produces: `isClickGesture(start, end, threshold = 5): boolean`
- Produces: `BlockTypeMenu({ onSelect })` with `show({ anchorRect, currentType })`, `hide()`, `destroy()`
- Produces: `getBlockType(node): string | null`
- Produces: `transformBlockAt(ctx, pos, targetType, expectedNode = null): boolean`
- Consumes: Milkdown `editorViewCtx`; ProseMirror `NodeSelection`, `TextSelection`, and `setBlockType`

- [ ] **Step 1: Write failing unit tests for the click threshold**

Create `tests/unit/block-type-menu.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isClickGesture } from '../../src/editor/block-type-menu.js';

test('a stationary block handle gesture is a click', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 13, y: 14 }), true);
});

test('a block handle gesture over five pixels is a drag', () => {
    assert.equal(isClickGesture({ x: 10, y: 10 }, { x: 16, y: 10 }), false);
});
```

- [ ] **Step 2: Replace the provisional UI assertion with failing block-menu cases**

In `tests/ui/offline-editor.mjs`, replace the current six-dot test that looks for `.milkdown-slash-menu` with:

```js
async function openBlockTypeMenu(page, block) {
    await block.hover();
    const dragHandle = page.locator('.milkdown-block-handle .operation-item').last();
    await dragHandle.waitFor({ state: 'visible' });
    await dragHandle.click();
    const menu = page.locator('.block-type-menu');
    await menu.waitFor({ state: 'visible', timeout: 2_000 });
    return menu;
}

await test('六點區塊把手可將目前 H1 轉換為 H2', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'heading.md', '# 保留的 **標題內容**');
    const menu = await openBlockTypeMenu(page, page.locator('.ProseMirror h1'));
    for (const label of [
        '一般文字', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4',
        'Heading 5', 'Heading 6', '引用', '程式碼區塊',
    ]) {
        assert.equal(await menu.getByRole('menuitem', { name: label, exact: true }).count(), 1);
    }
    await menu.getByRole('menuitem', { name: 'Heading 2' }).click();
    const convertedHeading = page.locator('.ProseMirror h2');
    await convertedHeading.waitFor({ state: 'visible' });
    assert.equal(await convertedHeading.innerText(), '保留的 標題內容');
    assert.equal(await convertedHeading.locator('strong').count(), 1);
    assert.equal(await page.locator('.ProseMirror h1').count(), 0);
    await page.close();
    return { convertedTo: 'h2', contentPreserved: true };
});

await test('六點區塊把手可將目前 H2 轉換為一般文字', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'heading.md', '## 轉為段落');
    const menu = await openBlockTypeMenu(page, page.locator('.ProseMirror h2'));
    await menu.getByRole('menuitem', { name: '一般文字' }).click();
    assert.equal(await page.locator('.ProseMirror p').innerText(), '轉為段落');
    assert.equal(await page.locator('.ProseMirror h2').count(), 0);
    await page.close();
    return { convertedTo: 'paragraph', contentPreserved: true };
});
```

- [ ] **Step 3: Run the narrow tests and verify the red state**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH node --test tests/unit/block-type-menu.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/editor/block-type-menu.js`.

Then build and run the UI suite with Chrome 147:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-red.json" \
npm run test:ui
```

Expected: the new block-menu cases FAIL because `.block-type-menu` does not exist; pre-existing cases remain PASS. Chrome must be launched outside the Ubuntu sandbox if Crashpad reports `Operation not permitted`.

- [ ] **Step 4: Implement the standalone menu**

Create `src/editor/block-type-menu.js`:

```js
export const BLOCK_TYPE_ITEMS = [
    { type: 'paragraph', label: '一般文字' },
    { type: 'heading-1', label: 'Heading 1' },
    { type: 'heading-2', label: 'Heading 2' },
    { type: 'heading-3', label: 'Heading 3' },
    { type: 'heading-4', label: 'Heading 4' },
    { type: 'heading-5', label: 'Heading 5' },
    { type: 'heading-6', label: 'Heading 6' },
    { type: 'blockquote', label: '引用' },
    { type: 'code-block', label: '程式碼區塊' },
];

export function isClickGesture(start, end, threshold = 5) {
    return Math.hypot(end.x - start.x, end.y - start.y) <= threshold;
}

export class BlockTypeMenu {
    constructor({ onSelect }) {
        this.onSelect = onSelect;
        this.element = document.createElement('div');
        this.element.className = 'block-type-menu';
        this.element.dataset.show = 'false';
        this.element.setAttribute('role', 'menu');
        this.element.setAttribute('aria-label', '變更區塊型態');

        for (const item of BLOCK_TYPE_ITEMS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.blockType = item.type;
            button.setAttribute('role', 'menuitem');
            button.textContent = item.label;
            button.addEventListener('pointerdown', (event) => event.preventDefault());
            button.addEventListener('click', () => this.onSelect(item.type));
            this.element.append(button);
        }

        this.onDocumentPointerDown = (event) => {
            if (!this.element.contains(event.target)) this.hide();
        };
        this.onDocumentKeyDown = (event) => {
            if (event.key === 'Escape') this.hide();
        };
        this.onViewportChange = () => this.hide();
        document.body.append(this.element);
        document.addEventListener('pointerdown', this.onDocumentPointerDown);
        document.addEventListener('keydown', this.onDocumentKeyDown);
        window.addEventListener('resize', this.onViewportChange);
        window.addEventListener('scroll', this.onViewportChange, true);
    }

    show({ anchorRect, currentType }) {
        for (const button of this.element.querySelectorAll('[data-block-type]')) {
            const isCurrent = button.dataset.blockType === currentType;
            button.classList.toggle('active', isCurrent);
            button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
        }

        this.element.dataset.show = 'true';
        const menuRect = this.element.getBoundingClientRect();
        const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - menuRect.width - 8));
        const top = Math.max(8, Math.min(anchorRect.bottom + 4, window.innerHeight - menuRect.height - 8));
        Object.assign(this.element.style, { left: `${left}px`, top: `${top}px` });
    }

    hide() {
        this.element.dataset.show = 'false';
    }

    destroy() {
        document.removeEventListener('pointerdown', this.onDocumentPointerDown);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
        window.removeEventListener('resize', this.onViewportChange);
        window.removeEventListener('scroll', this.onViewportChange, true);
        this.element.remove();
    }
}
```

- [ ] **Step 5: Implement direct paragraph and heading transforms**

Create `src/editor/block-transform.js`:

```js
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
```

At this task boundary, `getBlockType` recognizes quote and code nodes so the menu can mark them, but `transformBlockAt` only implements paragraph and heading targets. Task 2 adds quote and code target behavior.

- [ ] **Step 6: Integrate the menu in `EditorManager` and remove the Slash API workaround**

In `src/editor-manager.js`:

1. Keep `NodeSelection` but remove the provisional `TextSelection` use from `setupBlockHandleClick` if no other method needs that import.
2. Add:

```js
import { BlockTypeMenu, isClickGesture } from './editor/block-type-menu.js';
import { getBlockType, transformBlockAt } from './editor/block-transform.js';
```

3. Add `this.blockTypeMenu = null;` in the constructor.
4. After `this.editor = crepe.editor`, create the menu before calling `setupBlockHandleClick()`:

```js
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
```

5. Add `this.selectedBlock = null;` in the constructor and replace the provisional `setupBlockHandleClick()` body with:

```js
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
        pointerStart = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
            handle,
        };
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
```

6. At the start of `destroy()` add:

```js
this.blockTypeMenu?.destroy();
this.blockTypeMenu = null;
this.selectedBlock = null;
```

- [ ] **Step 7: Add theme-compatible menu styles**

Append to `src/style/main.css`:

```css
.block-type-menu {
    position: fixed;
    z-index: 300;
    display: grid;
    min-width: 180px;
    max-height: min(420px, calc(100vh - 16px));
    padding: 6px;
    overflow-y: auto;
    border: 1px solid var(--crepe-color-outline);
    border-radius: 10px;
    background: var(--crepe-color-surface);
    box-shadow: var(--crepe-shadow-2);
}

.block-type-menu[data-show='false'] {
    display: none;
}

.block-type-menu button {
    padding: 8px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--crepe-color-on-surface);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.block-type-menu button:hover,
.block-type-menu button:focus-visible {
    background: var(--crepe-color-hover);
}

.block-type-menu button.active {
    background: var(--crepe-color-selected);
    color: var(--crepe-color-primary);
    font-weight: 600;
}
```

- [ ] **Step 8: Run focused tests and verify green**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH node --test tests/unit/block-type-menu.test.mjs
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-task1.json" \
npm run test:ui
```

Expected: unit tests PASS; H1→H2 and H2→paragraph cases PASS; all pre-existing UI cases PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add src/editor/block-type-menu.js src/editor/block-transform.js src/editor-manager.js src/style/main.css tests/unit/block-type-menu.test.mjs tests/ui/offline-editor.mjs
git commit -m "feat: add block type menu"
```

Before committing, verify `git diff --cached --name-only` lists only those six files.

---

### Task 2: 加入引用與程式碼區塊轉換

**Files:**
- Modify: `src/editor/block-transform.js`
- Modify: `tests/ui/offline-editor.mjs`

**Interfaces:**
- Consumes: `transformBlockAt(ctx, pos, targetType, expectedNode = null): boolean` from Task 1
- Extends accepted `targetType` values with `blockquote` and `code-block`
- Preserves: `getBlockType(node): string | null`

- [ ] **Step 1: Write failing UI tests for quote and code transforms**

Add to `tests/ui/offline-editor.mjs` after the direct type tests:

```js
await test('六點區塊把手可將一般文字轉為引用再轉回一般文字', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'quote.md', '引用內容');
    let menu = await openBlockTypeMenu(page, page.locator('.ProseMirror p'));
    await menu.getByRole('menuitem', { name: '引用' }).click();
    const quote = page.locator('.ProseMirror blockquote');
    await quote.waitFor({ state: 'visible' });
    assert.equal(await quote.innerText(), '引用內容');

    menu = await openBlockTypeMenu(page, quote);
    await menu.getByRole('menuitem', { name: '一般文字' }).click();
    assert.equal(await page.locator('.ProseMirror > p').filter({ hasText: '引用內容' }).innerText(), '引用內容');
    assert.equal(await page.locator('.ProseMirror blockquote').count(), 0);
    await page.close();
    return { quoteRoundTrip: true, contentPreserved: true };
});

await test('六點區塊把手可將含行內格式的文字轉為程式碼區塊', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'code.md', '保留 **粗體文字** 與 [連結](https://example.invalid)');
    const paragraph = page.locator('.ProseMirror p');
    const expectedText = await paragraph.innerText();
    const menu = await openBlockTypeMenu(page, paragraph);
    await menu.getByRole('menuitem', { name: '程式碼區塊' }).click();
    const code = page.locator('.ProseMirror pre');
    await code.waitFor({ state: 'visible' });
    assert.equal(await code.innerText(), expectedText);
    assert.equal(await code.locator('strong, a, em').count(), 0);
    await page.close();
    return { convertedTo: 'code-block', contentPreserved: true, marksRemoved: true };
});
```

- [ ] **Step 2: Run Chrome 147 tests and verify the red state**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-task2-red.json" \
npm run test:ui
```

Expected: quote and code cases FAIL because `transformBlockAt` rejects those targets; Task 1 cases remain PASS.

- [ ] **Step 3: Extend `transformBlockAt` for quote and code**

Change the imports and implementation in `src/editor/block-transform.js` to:

```js
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
```

This intentionally converts a heading or code block to a paragraph before wrapping it as a quote, producing ordinary Markdown `> text` rather than `> # text` or a fenced block nested in a quote.

- [ ] **Step 4: Run Chrome 147 tests and verify green**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-task2.json" \
npm run test:ui
```

Expected: quote round-trip and code-block cases PASS; direct type and all pre-existing cases remain PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/editor/block-transform.js tests/ui/offline-editor.mjs
git commit -m "feat: transform quote and code blocks"
```

---

### Task 3: 完成選單狀態、關閉與拖曳回歸測試

**Files:**
- Modify: `src/editor/block-type-menu.js`
- Modify: `src/editor-manager.js`
- Modify: `tests/ui/offline-editor.mjs`

**Interfaces:**
- Consumes: `BlockTypeMenu.show({ anchorRect, currentType })`
- Consumes: `isClickGesture(start, end, threshold = 5)`
- Produces: `shouldTransformBlock(currentType, targetType): boolean`
- Verifies: active item, no-op selection, Escape/outside close, and drag gesture behavior

- [ ] **Step 1: Add a failing no-op unit test and interaction tests**

Update the import in `tests/unit/block-type-menu.test.mjs` and add the test:

```js
import {
    isClickGesture,
    shouldTransformBlock,
} from '../../src/editor/block-type-menu.js';

test('selecting the active block type is a no-op', () => {
    assert.equal(shouldTransformBlock('heading-1', 'heading-1'), false);
    assert.equal(shouldTransformBlock('heading-1', 'heading-2'), true);
});
```

Add these cases to `tests/ui/offline-editor.mjs`:

```js
await test('區塊型態選單標示目前型態且選擇相同型態不修改文件', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'same-type.md', '# 不應變更');
    const menu = await openBlockTypeMenu(page, page.locator('.ProseMirror h1'));
    const current = menu.getByRole('menuitem', { name: 'Heading 1' });
    assert.equal(await current.getAttribute('aria-current'), 'true');
    await current.click();
    await menu.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.ProseMirror h1').innerText(), '不應變更');
    assert.doesNotMatch(await page.locator('#document-status').innerText(), /未儲存/);
    await page.close();
    return { activeTypeMarked: true, documentUnchanged: true };
});

await test('區塊型態選單可由 Escape 與點擊外部關閉', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'close-menu.md', '關閉選單');
    let menu = await openBlockTypeMenu(page, page.locator('.ProseMirror p'));
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });

    menu = await openBlockTypeMenu(page, page.locator('.ProseMirror p'));
    await page.locator('.toolbar').click();
    await menu.waitFor({ state: 'hidden' });
    await page.close();
    return { escapeCloses: true, outsideClickCloses: true };
});

await test('拖曳距離超過門檻時不開啟區塊型態選單', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'drag.md', '# 拖曳標題');
    await page.locator('.ProseMirror h1').hover();
    const handle = page.locator('.milkdown-block-handle .operation-item').last();
    const box = await handle.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2);
    await page.mouse.up();
    assert.equal(await page.locator('.block-type-menu').isVisible(), false);
    assert.equal(await page.locator('.ProseMirror h1').innerText(), '拖曳標題');
    await page.close();
    return { menuOpened: false, contentPreserved: true };
});

await test('選單開啟後區塊已被換檔取代時不轉換新文件', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'old.md', '# 舊文件');
    const menu = await openBlockTypeMenu(page, page.locator('.ProseMirror h1'));
    await loadVirtualFile(page, 'new.md', '# 新文件');
    await menu.getByRole('menuitem', { name: 'Heading 2' }).click();
    assert.equal(await page.locator('.ProseMirror h1').innerText(), '新文件');
    assert.equal(await page.locator('.ProseMirror h2').count(), 0);
    await page.close();
    return { staleSelectionRejected: true };
});
```

- [ ] **Step 2: Run the focused unit test and verify the red state**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH node --test tests/unit/block-type-menu.test.mjs
```

Expected: FAIL because `src/editor/block-type-menu.js` does not yet export `shouldTransformBlock`.

- [ ] **Step 3: Make no-op and close behavior explicit**

Add this export to `src/editor/block-type-menu.js`:

```js
export function shouldTransformBlock(currentType, targetType) {
    return Boolean(currentType && targetType && currentType !== targetType);
}
```

In `BlockTypeMenu`, store `this.currentType` during `show()` and keep the complete positioning logic:

```js
show({ anchorRect, currentType }) {
    this.currentType = currentType;
    for (const button of this.element.querySelectorAll('[data-block-type]')) {
        const isCurrent = button.dataset.blockType === currentType;
        button.classList.toggle('active', isCurrent);
        button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    }

    this.element.dataset.show = 'true';
    const menuRect = this.element.getBoundingClientRect();
    const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - menuRect.width - 8));
    const top = Math.max(8, Math.min(anchorRect.bottom + 4, window.innerHeight - menuRect.height - 8));
    Object.assign(this.element.style, { left: `${left}px`, top: `${top}px` });
}
```

Replace each button click listener with:

```js
button.addEventListener('click', () => {
    const targetType = button.dataset.blockType;
    this.hide();
    if (!shouldTransformBlock(this.currentType, targetType)) return;
    this.onSelect(targetType);
});
```

In `hide()` clear stale selection state after the current event completes through an optional callback owned by `EditorManager`:

```js
hide() {
    this.element.dataset.show = 'false';
}
```

Keep `EditorManager` responsible for passing the recorded node to `transformBlockAt`, which rejects a stale position when the current node is no longer the same object. Clear the record after selection:

```js
onSelect: (targetType) => {
    const selectedBlock = this.selectedBlock;
    this.selectedBlock = null;
    if (!selectedBlock) return;
    this.editor?.action((ctx) => transformBlockAt(
        ctx,
        selectedBlock.pos,
        targetType,
        selectedBlock.node
    ));
},
```

The document pointer, Escape, scroll, resize and drag-start handlers defined in Task 1 remain unchanged; do not introduce timers or Crepe private APIs.

- [ ] **Step 4: Run the complete interaction gate**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH node --test tests/unit/block-type-menu.test.mjs
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-task3.json" \
npm run test:ui
```

Expected: active item, no-op dirty state, Escape, outside click and drag-threshold cases all PASS; all earlier cases remain PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/editor/block-type-menu.js src/editor-manager.js tests/unit/block-type-menu.test.mjs tests/ui/offline-editor.mjs
git commit -m "test: cover block type menu interactions"
```

---

### Task 4: 更新操作文件並執行完整離線驗收

**Files:**
- Modify: `README.md`
- Modify: `docs/offline-acceptance.md`
- Add: `docs/superpowers/plans/2026-07-13-block-type-menu.md`

**Interfaces:**
- Documents: click six-dot handle → choose current block type
- Verifies: unit suite, release build, offline verifier, Chrome 147 UI suite, clean staged scope

- [ ] **Step 1: Update README usage documentation**

In the feature list in `README.md`, add:

```markdown
- 六點把手區塊型態轉換：一般文字、Heading 1–6、引用、程式碼區塊
```

Add this row to the operation table:

```markdown
| 轉換目前區塊 | 點擊目前資料行左側六點把手後選擇型態 |
```

- [ ] **Step 2: Update offline acceptance**

In `docs/offline-acceptance.md`, insert after the preview check:

```markdown
5. 開啟含 H1 的 Markdown，點擊該行左側六點把手，依序確認可轉為 H2、一般文字、引用及程式碼區塊，且文字內容保持不變。
```

Renumber later steps and replace the final sentence with:

```markdown
本 repo 的 Ubuntu 自動驗收使用 Google Chrome for Testing 147.0.7727.102，直接對 `file://` release 成品執行 UI gate；不要求 Windows 11 實機或 Chrome 150 驗收。
```

- [ ] **Step 3: Run fresh full verification**

Run:

```bash
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run test:unit
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run build:release
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH npm run verify:offline
PATH=/home/ubuntu/.nvm/versions/node/v24.18.0/bin:$PATH \
CHROME_BIN="$PWD/.chrome-ui-test/chrome-147/chrome-linux64/chrome" \
CHROME_LD_LIBRARY_PATH="$PWD/.chrome-ui-test/sysroot/usr/lib/x86_64-linux-gnu" \
FONTCONFIG_FILE="$PWD/.chrome-ui-test/fonts.conf" \
UI_RESULT_FILE="$PWD/.chrome-ui-test/artifacts/results-block-type-menu-final.json" \
npm run test:ui
git diff --check
git status --short
```

Expected:

- all unit tests PASS;
- `build:release` creates one `release/markdown-editor.html`;
- `verify:offline` reports `Verified <bytes> bytes, sha256 <digest>`;
- Chrome reports version `147.0.7727.102`, zero UI FAIL and zero `OBSERVATION_ERROR`;
- startup result contains `externalRequests: []` while HTTP/HTTPS routes are aborted;
- `git diff --check` has no output;
- `git status --short` lists `README.md`, `docs/offline-acceptance.md` and this implementation plan before the documentation commit.

- [ ] **Step 4: Commit documentation**

```bash
git add README.md docs/offline-acceptance.md docs/superpowers/plans/2026-07-13-block-type-menu.md
git commit -m "docs: explain block type conversion"
```

- [ ] **Step 5: Verify final repository state and commit scope**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: no uncommitted files from this feature remain; the latest commits correspond to Tasks 1–4. Do not push—the user will push separately if desired.
