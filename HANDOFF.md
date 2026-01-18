# 專案交接與開發指南

本文件旨在協助您將專案遷移至新環境並順利恢復開發。人工智慧助手（AI）已將目前的開發進度與脈絡整理於 `.ai-context/` 資料夾中（包含近期清單行為與 marker 樣式調整）。

## 📁 專案結構

- `src/` - 原始碼目錄 (main.js, style.css 等)
- `index.html` - 應用程式入口
- `vite.config.js` - 建構設定
- `.ai-context/` - **AI 交接資料 (核心)**
  - `task.md`: 任務追蹤清單，記錄了所有已完成與未完成的項目。
  - `handoff.md`: 專案交接摘要（含近期修正）。
  - `implementation_plan.md`: 實施計畫文件。

## 🚀 如何上傳至 GitHub

建議在專案根目錄建立 `.gitignore` 檔案，以避免上傳過大的依賴套件或暫存檔。

### 1. 建立/檢查 .gitignore
(已為您建立，包含 node_modules, dist, etc.)

### 2. Git 初始化與推送
在終端機執行：

```bash
git init
git add .
git commit -m "Initial commit: Project handover with AI context"
# git remote add origin <您的 GitHub repo URL>
# git push -u origin main
```

## 💻 在新電腦恢復開發

1. **Clone 專案**：
   ```bash
   git clone <您的 GitHub repo URL>
   cd markdown-web-based
   ```

2. **安裝依賴**：
   ```bash
   npm install
   ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```

4. **打包與本地測試**：
   ```bash
   npm run build
   npm run build:singlefile
   ```
   - `dist/index.html` 為多檔版本（需搭配 `assets/`）
   - `dist/testing_index.html` 為單檔版本（可直接雙擊測試）

5. **讓 AI 接手**：
   當您在新環境使用 AI 助手時，請告知它：「請查看 `.ai-context/handoff.md` 和 `.ai-context/task.md` 來了解專案進度。」
   這樣 AI 就能完全掌握之前的開發脈絡（包含清單修復細節）。

## 🧹 清理項目

- `vscode-main/` 資料夾為 Milkdown 參考原始碼，可保留作為查閱。
- `dist/` 資料夾是建構產物，不需要上傳。

## 📌 本地開啟注意事項

多檔版本在 `file://` 會被瀏覽器 CORS 限制阻擋，因此請使用 `dist/testing_index.html` 進行本地雙擊測試，避免手動貼回 JS/CSS。
