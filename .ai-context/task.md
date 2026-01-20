# Web-Based Markdown Editor 任務清單

## 規劃階段
- [x] 研究 Skills 和設計指南
- [x] 下載離線套件（已移除 PDF 功能）
- [x] 分析 vscode-main 架構 (Milkdown/Crepe)
- [x] 撰寫實作計畫（方案 A：Vite + Milkdown）
- [x] 使用者審核通過

## 實作階段
- [x] 建立專案環境
  - [x] package.json, vite.config.js
  - [x] index.html 主頁面
- [x] 建立核心元件
  - [x] src/main.js - 入口點
  - [x] src/editor-manager.js - 編輯器管理
  - [x] src/file-handler.js - 檔案操作
- [x] 護眼主題
  - [x] src/style/token.css
  - [x] src/style/theme.css
  - [x] src/style/main.css
- [x] 編輯體驗修正
  - [x] 開啟檔案錯誤修正（改用 replaceAll）
  - [x] 預覽模式開檔同步更新
  - [x] 預覽 task list marker 移除
  - [x] Backspace 退出清單並移出段落
  - [x] 無序清單 marker 依層級改為 ●/○/▶/▷ 並統一大小
- [/] 安裝與測試
  - [x] npm install
  - [ ] npm run dev 測試
  - [ ] npm run build:singlefile 測試

## 驗證階段
- [ ] 開發模式測試
- [x] 打包離線版本
- [ ] Chrome 離線測試

## 新功能開發：主題切換系統
- [x] 需求討論與規劃
  - [x] 確定 UI/UX 設計方案（側邊滑入面板）
  - [x] 確定 10 種主題配色（7 淺色 + 3 深色）
  - [x] 確定技術架構（CSS 變數 + localStorage）
  - [x] 撰寫完整規劃文檔（`.ai-context/theme-feature-plan.md`）

### 階段 1：建立主題系統核心
- [ ] 建立 `src/themes/theme-config.js`
  - [ ] 定義 10 個主題的完整配色數據
- [ ] 建立 `src/themes/themes.css`
  - [ ] 為每個主題定義 CSS 變數
- [ ] 建立 `src/themes/theme-manager.js`
  - [ ] 實作 ThemeManager 類別
  - [ ] localStorage 持久化邏輯

### 階段 2：建立設定面板 UI
- [ ] 修改 `index.html`
  - [ ] 工具列新增「設定」按鈕
  - [ ] 新增設定面板 DOM 結構
- [ ] 建立 `src/components/settings-panel.css`
  - [ ] 面板樣式與動畫效果
- [ ] 建立 `src/components/settings-panel.js`
  - [ ] 面板開關邏輯與主題卡片渲染

### 階段 3：整合與測試
- [ ] 修改 `src/main.js` - 整合主題管理器
- [ ] 修改 `src/style/token.css` - 改用 CSS 變數
- [ ] 開發模式測試 (`npm run dev`)
- [ ] 打包測試 (`npm run build`)
- [ ] 響應式設計測試

### 階段 4：優化與文檔
- [ ] 性能優化與可訪問性檢查
- [ ] 更新 handoff.md 和 task.md
- [ ] 建立功能演示文檔

