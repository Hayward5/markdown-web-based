// 主入口點
import { EditorManager } from './editor-manager.js';
import {
    downloadText, isPickerUnavailableError, pickOpenDocument, pickSaveHandle,
    readUtf8File, triggerFileSelect, writeFileHandle,
} from './file-handler.js';
import { DocumentSession } from './document/document-session.js';
import { renderPreview } from './preview/preview-renderer.js';
import { createDraftRecord, createDraftScheduler, DraftStore } from './storage/draft-store.js';

const initialContent = getDefaultContent();
const session = new DocumentSession({ filename: 'document.md', content: initialContent });
let draftStore = null;
let draftScheduler = null;

// 應用程式狀態
const state = {
    mode: 'edit', // 'edit' | 'preview'
    editor: null,
};

// DOM 元素
const elements = {
    editor: null,
    btnEditMode: null,
    btnPreviewMode: null,
    btnOpen: null,
    btnSave: null,
    btnSaveAs: null,
    fileInput: null,
    editorContainer: null,
    previewContainer: null,
    previewContent: null,
    documentStatus: null,
    appMessage: null,
};

/**
 * 初始化應用程式
 */
async function init() {
    // 取得 DOM 元素
    elements.btnEditMode = document.getElementById('btn-edit-mode');
    elements.btnPreviewMode = document.getElementById('btn-preview-mode');
    elements.btnOpen = document.getElementById('btn-open');
    elements.btnSave = document.getElementById('btn-save');
    elements.btnSaveAs = document.getElementById('btn-save-as');
    elements.fileInput = document.getElementById('file-input');
    elements.editorContainer = document.querySelector('.editor-container');
    elements.previewContainer = document.querySelector('.preview-container');
    elements.previewContent = document.getElementById('preview-content');
    elements.documentStatus = document.getElementById('document-status');
    elements.appMessage = document.getElementById('app-message');

    // 建立編輯器
    state.editor = new EditorManager();
    await state.editor.create(initialContent);

    // 監聽編輯器變更
    state.editor.onChange((markdown) => {
        session.updateContent(markdown);
        updateDocumentStatus();
        draftScheduler?.schedule(createDraftRecord({ filename: session.filename, content: session.content }));
    });

    // 綁定事件
    bindEvents();

    // 註冊快捷鍵
    registerKeyboardShortcuts();
    updateDocumentStatus();
    await restoreDraft();

    console.log('Markdown 編輯器已初始化');
}

/**
 * 取得預設內容
 */
function getDefaultContent() {
    return `# 歡迎使用 Markdown 編輯器

這是一個 **WYSIWYG**（所見即所得）的 Markdown 編輯器。

## 功能特色

- 📝 即時編輯與預覽
- 💾 儲存為 TXT 檔案
- 📂 開啟 TXT/MD 檔案
- 📂 開啟 TXT/MD 檔案

## 快捷操作

輸入 \`/\` 開啟命令選單，支援：

- \`/h1\` ~ \`/h3\`：標題
- \`/ul\`：無序清單
- \`/ol\`：有序清單
- \`/task\`：任務清單
- \`/code\`：程式碼區塊
- \`/quote\`：引用

## 範例程式碼

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

## 任務清單

- [ ] 學習 Markdown 語法
- [ ] 編寫文件
- [x] 完成安裝

---

開始編輯吧！刪除此內容並輸入你自己的 Markdown。
`;
}

/**
 * 綁定事件處理器
 */
function bindEvents() {
    // 模式切換
    elements.btnEditMode.addEventListener('click', () => switchMode('edit'));
    elements.btnPreviewMode.addEventListener('click', () => switchMode('preview'));

    // 檔案操作
    elements.btnOpen.addEventListener('click', handleOpen);
    elements.btnSave.addEventListener('click', handleSave);
    elements.btnSaveAs.addEventListener('click', () => handleSave({ saveAs: true }));

    // 檔案選擇
    elements.fileInput.addEventListener('change', handleFileSelect);
}

/**
 * 切換模式
 * @param {'edit' | 'preview'} mode
 */
function switchMode(mode) {
    state.mode = mode;

    if (mode === 'edit') {
        elements.editorContainer.style.display = 'block';
        elements.previewContainer.style.display = 'none';
        elements.btnEditMode.classList.add('active');
        elements.btnPreviewMode.classList.remove('active');
    } else {
        // 更新預覽內容
        updatePreview();
        elements.editorContainer.style.display = 'none';
        elements.previewContainer.style.display = 'block';
        elements.btnEditMode.classList.remove('active');
        elements.btnPreviewMode.classList.add('active');
    }
}

/**
 * 更新預覽內容
 */
async function updatePreview() {
    const markdown = state.editor.getContent();

    try {
        elements.previewContent.innerHTML = renderPreview(markdown);
    } catch (error) {
        console.error('預覽失敗：', error);
        elements.previewContent.textContent = markdown;
    }
}

async function restoreDraft() {
    try {
        draftStore = new DraftStore();
        draftScheduler = createDraftScheduler({ store: draftStore });
        const draft = await draftStore.loadLatest();
        if (!draft) return;
        if (window.confirm('找到未儲存草稿，是否復原？')) {
            applyOpenedDocument({ filename: draft.filename, content: draft.markdown });
        } else {
            await draftStore.clearLatest();
        }
    } catch (error) {
        console.error('草稿不可用：', error);
        showStatus('自動草稿不可用，請使用手動儲存。', 'warning');
    }
}

function updateDocumentStatus() {
    const dirty = session.isDirty ? ' • 未儲存' : '';
    elements.documentStatus.textContent = `${session.filename}${dirty}`;
    document.title = `${session.isDirty ? '* ' : ''}${session.filename} — Markdown 編輯器`;
}

function showStatus(message, kind = 'info') {
    elements.appMessage.textContent = message;
    elements.appMessage.dataset.kind = kind;
    elements.appMessage.hidden = !message;
}

function showError(message) {
    showStatus(message, 'error');
}

function confirmDiscardChanges() {
    return !session.isDirty || window.confirm('目前文件尚未儲存，確定要捨棄變更嗎？');
}

/**
 * 處理檔案選擇
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirmDiscardChanges()) {
        event.target.value = '';
        return;
    }

    try {
        const content = await readUtf8File(file);
        applyOpenedDocument({ filename: file.name, content });
        console.log(`已開啟檔案：${file.name}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : '開啟檔案失敗，請確認檔案格式正確。';
        console.error('開啟檔案失敗：', error);
        showError(message);
    }


    // 重置 input 以便重複選擇同一檔案
    event.target.value = '';
}

function applyOpenedDocument({ filename, content, handle = null }) {
    draftScheduler?.cancel();
    state.editor.setContent(content);
    session.load({ filename, content: state.editor.getContent(), handle });
    updateDocumentStatus();
    if (state.mode === 'preview') updatePreview();
}

async function handleOpen() {
    if (!confirmDiscardChanges()) return;
    if (typeof window.showOpenFilePicker !== 'function') {
        triggerFileSelect(elements.fileInput);
        return;
    }
    try {
        const documentData = await pickOpenDocument();
        if (documentData) applyOpenedDocument(documentData);
    } catch (error) {
        if (isPickerUnavailableError(error)) {
            triggerFileSelect(elements.fileInput);
            return;
        }
        showError(`開啟檔案失敗：${error.message}`);
    }
}

/**
 * 處理儲存
 */
async function handleSave({ saveAs = false } = {}) {
    const content = state.editor.getContent();
    session.updateContent(content);
    try {
        let handle = saveAs ? null : session.handle;
        if (!handle && typeof window.showSaveFilePicker === 'function') {
            handle = await pickSaveHandle(session.filename);
            if (!handle) return;
        }
        if (!handle) {
            downloadText(content, session.filename);
            showStatus('已下載副本，但原始文件尚未覆寫。');
            updateDocumentStatus();
            return;
        }
        await writeFileHandle(handle, content);
        session.markSaved({ handle, filename: handle.name });
        draftScheduler?.cancel();
        await draftStore?.clearLatest();
        updateDocumentStatus();
    } catch (error) {
        if (isPickerUnavailableError(error)
            && window.confirm('無法使用原檔覆寫，是否改為下載副本？')) {
            downloadText(content, session.filename);
            updateDocumentStatus();
            return;
        }
        showError(`儲存失敗：${error.message}`);
    }
}

/**
 * 註冊鍵盤快捷鍵
 */
function registerKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl + S：儲存
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleSave();
        }

        // Ctrl + O：開啟
        if (event.ctrlKey && event.key === 'o') {
            event.preventDefault();
            triggerFileSelect(elements.fileInput);
        }

        // Ctrl + Shift + 7：有序清單（Milkdown 內建支援）
        // Ctrl + Shift + 9：無序清單（Milkdown 內建支援）
        // 這些已由 Milkdown 處理
    });
}

// 啟動應用程式
window.addEventListener('beforeunload', (event) => {
    if (!session.isDirty) return;
    event.preventDefault();
    event.returnValue = '';
});

document.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => {
        console.error('Markdown 編輯器初始化失敗：', error);
        showError(`編輯器初始化失敗：${error.message}`);
    });
});
