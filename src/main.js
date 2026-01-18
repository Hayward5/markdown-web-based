// 主入口點
import { EditorManager } from './editor-manager.js';
import { saveAsTxt, openFile, triggerFileSelect } from './file-handler.js';

// 動態載入 marked.js 用於預覽渲染
let marked = null;
async function loadMarked() {
    if (!marked) {
        const module = await import('../lib/marked.min.js');
        marked = module.marked || module.default || window.marked;
    }
    return marked;
}

// 應用程式狀態
const state = {
    mode: 'edit', // 'edit' | 'preview'
    currentFilename: 'document.txt',
    editor: null,
    markdown: ''
};

// DOM 元素
const elements = {
    editor: null,
    btnEditMode: null,
    btnPreviewMode: null,
    btnOpen: null,
    btnSave: null,
    fileInput: null,
    editorContainer: null,
    previewContainer: null,
    previewContent: null
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
    elements.fileInput = document.getElementById('file-input');
    elements.editorContainer = document.querySelector('.editor-container');
    elements.previewContainer = document.querySelector('.preview-container');
    elements.previewContent = document.getElementById('preview-content');

    // 建立編輯器
    state.editor = new EditorManager();
    await state.editor.create(getDefaultContent());

    // 監聽編輯器變更
    state.editor.onChange((markdown) => {
        state.markdown = markdown;
    });

    // 綁定事件
    bindEvents();

    // 註冊快捷鍵
    registerKeyboardShortcuts();

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
    elements.btnOpen.addEventListener('click', () => triggerFileSelect(elements.fileInput));
    elements.btnSave.addEventListener('click', handleSave);

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

    // 使用 marked 渲染 Markdown 為 HTML
    const markedLib = await loadMarked();
    if (markedLib && markedLib.parse) {
        const html = markedLib.parse(markdown);
        elements.previewContent.innerHTML = html;
    } else {
        // 備用方案：直接顯示 Markdown 文字
        elements.previewContent.textContent = markdown;
    }
}

/**
 * 處理檔案選擇
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const content = await openFile(file);
        state.editor.setContent(content);
        state.currentFilename = file.name;
        state.markdown = content;
        console.log(`已開啟檔案：${file.name}`);
    } catch (error) {
        console.error('開啟檔案失敗：', error);
        alert('開啟檔案失敗，請確認檔案格式正確。');
    }

    // 重置 input 以便重複選擇同一檔案
    event.target.value = '';
}

/**
 * 處理儲存
 */
function handleSave() {
    const content = state.editor.getContent();
    const filename = state.currentFilename.replace(/\.[^/.]+$/, '') + '.txt';
    saveAsTxt(content, filename);
    console.log(`已儲存檔案：${filename}`);
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
document.addEventListener('DOMContentLoaded', init);
