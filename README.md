# 離線 Markdown 編輯器

可在完全離線環境使用的單檔 WYSIWYG Markdown 編輯器。

正式成品為 `release/markdown-editor.html`。將此檔案複製到目標電腦後，使用 Google Chrome 147.0.7727.102 直接開啟即可，不需要網路、Node.js、npm、本機伺服器或瀏覽器擴充功能。

## 功能

- WYSIWYG 編輯與 Markdown 預覽切換
- UTF-8 `.md`、`.markdown`、`.txt` 檔案開啟
- 原檔儲存、另存新檔與下載 fallback
- 未儲存內容提示、換檔確認與離開頁面保護
- IndexedDB 本機草稿復原
- 表格、任務清單、Slash 命令與繁體中文顯示
- 行動窄畫面排版
- Markdown 預覽安全防護：
  - 原始 HTML 不會執行
  - `javascript:`／`vbscript:` 連結會被封鎖
  - 文件內 HTTP/HTTPS 圖片不會發出網路請求

## 使用方式

1. 將 `release/markdown-editor.html` 複製到離線電腦。
2. 以 Chrome 直接開啟檔案。
3. 使用工具列或快捷鍵操作：

| 操作 | 快捷鍵 |
| --- | --- |
| 開啟檔案 | `Ctrl+O` |
| 儲存 | `Ctrl+S` |
| 開啟 Slash 命令 | 在空白行輸入 `/` |

瀏覽器支援 File System Access API 時，儲存會寫回原檔；無法使用時會改為下載副本，並保留未儲存狀態提示。

## 建置

開發環境需要 Node.js `20.19+` 或 `22.12+`。

```bash
npm install
npm run test:unit
npm run build:release
npm run verify:offline
```

建置結果：

- `release/markdown-editor.html`：可離線直接開啟的正式成品
- `release/SHA256SUMS.txt`：SHA-256 校驗值
- `release/build-info.json`：檔案大小與建置資訊

驗證成品完整性：

```bash
cd release
sha256sum -c SHA256SUMS.txt
```

## 測試

```bash
npm run test:unit
```

Chrome UI 測試需指定本機 Chrome 執行檔：

```bash
CHROME_BIN=/path/to/chrome \
CHROME_LD_LIBRARY_PATH=/path/to/libraries \
FONTCONFIG_FILE=/path/to/fonts.conf \
npm run test:ui
```

完整離線驗收步驟見 [`docs/offline-acceptance.md`](docs/offline-acceptance.md)。

## 專案結構

```text
src/
  document/  文件狀態與 dirty state
  preview/   安全 Markdown 預覽
  storage/   IndexedDB 草稿
  style/     編輯器與預覽樣式
tests/
  unit/      單元測試
  ui/        Chrome file:// UI 測試
scripts/     建置、離線驗證與 Chrome 測試環境工具
examples/    可供開啟測試的 Markdown 範例
```
