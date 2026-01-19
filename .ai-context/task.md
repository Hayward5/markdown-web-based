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

