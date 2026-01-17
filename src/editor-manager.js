// 編輯器管理模組 - 參考 vscode-main 的 EditorManager
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, serializerCtx } from '@milkdown/core';

// 引入 Crepe 預設樣式（排除 latex.css 以減少字體檔案）
import '@milkdown/crepe/theme/common/prosemirror.css';
import '@milkdown/crepe/theme/common/reset.css';
import '@milkdown/crepe/theme/common/block-edit.css';
import '@milkdown/crepe/theme/common/code-mirror.css';
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
    }

    /**
     * 建立 Milkdown 編輯器
     * @param {string} defaultValue - 初始內容
     */
    async create(defaultValue = '') {
        const crepe = new Crepe({
            root: '#editor',
            defaultValue: defaultValue,
            // 功能設定
            features: {
                [Crepe.Feature.ListItem]: true,
                [Crepe.Feature.TaskList]: true,
                [Crepe.Feature.CodeMirror]: false, // 關閉語法高亮以減少 JS 檔案數量
                [Crepe.Feature.Latex]: false, // 關閉數學公式以減少字體檔案數量
                [Crepe.Feature.BlockEdit]: true,
                [Crepe.Feature.Toolbar]: true,
                [Crepe.Feature.Slash]: true,
                [Crepe.Feature.Placeholder]: true,
            },
            featureConfigs: {
                [Crepe.Feature.Placeholder]: {
                    text: '輸入 / 開啟命令選單，或開始編寫 Markdown...',
                },
            },
        });

        // 設定事件監聽
        this.setupListeners(crepe);

        // 建立編輯器
        await crepe.create();

        this.crepe = crepe;
        this.editor = crepe.editor;

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
        if (!this.crepe) return;
        this.crepe.setMarkdown(markdown);
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
        if (this.crepe) {
            this.crepe.destroy();
            this.crepe = null;
            this.editor = null;
        }
    }
}
