# 建置與測試 Walkthrough

## 執行日期
2026-01-19

## 建置步驟記錄

### ✅ 步驟 1: 安裝依賴套件
```bash
npm install
```
- **結果**: ✅ 成功
- **安裝套件數**: 219 packages
- **安全提示**: 2 個中等嚴重性漏洞（可選修復，不影響建置）

### ✅ 步驟 2: 生產建置（多檔版本）
```bash
npm run build
```
- **結果**: ✅ 成功
- **建置時間**: 6.17s
- **產出檔案**:
  - `dist/index.html` (1.85 kB)
  - `dist/assets/index-WwOKnIWk.js` (2,690.66 kB)
  - `dist/assets/style-DZ8uq9hb.css` (46.13 kB)

### ✅ 步驟 3: 單檔建置
```bash
npm run build:singlefile
```
- **結果**: ✅ 成功
- **建置時間**: 6.13s
- **產出檔案**: `dist/testing_index.html` (2,738.61 kB)
- **注意事項**: JS 和 CSS 已內聯至 HTML 中

### ✅ 步驟 4: 修改儲存功能
**需求**: 將儲存功能從直接下載改為使用檔案選擇器，讓使用者選擇儲存位置與檔名。

**修改內容**:
1. **src/file-handler.js**: 新增 `saveAsTxtWithPicker()` 函數
   - 使用 Chrome File System Access API (`window.showSaveFilePicker`)
   - 支援 .txt 和 .md 副檔名選擇
   - 降級處理：API 不支援時使用原本的 `saveAsTxt()`

2. **src/main.js**: 更新 `handleSave()` 函數
   - 改為 async 函數
   - 使用 `saveAsTxtWithPicker()` 替代 `saveAsTxt()`
   - 儲存成功後更新 `state.currentFilename` 為使用者選擇的檔名

**建置驗證**:
```bash
npm run build
```
- **結果**: ✅ 成功
- **建置時間**: 5.72s
- **產出檔案**:
  - `dist/index.html` (1.85 kB)
  - `dist/assets/index-BL3ve9oO.js` (2,691.15 kB)
  - `dist/assets/style-DZ8uq9hb.css` (46.13 kB)

```bash
npm run build:singlefile
```
- **結果**: ✅ 成功
- **建置時間**: 6.00s
- **產出檔案**: `dist/testing_index.html` (2,739.10 kB)

## 最終產出結構

```
dist/
├── index.html                  # 多檔版本主頁面 (2.0K)
├── testing_index.html          # 單檔版本 (2.7M) - 可直接雙擊
└── assets/
    ├── index-BL3ve9oO.js       # 打包後的 JS (2.6M)
    └── style-DZ8uq9hb.css      # 打包後的 CSS (46K)
```

## 建置資訊

- **打包工具**: Vite v5.4.21
- **總模組數**: 1,096 modules
- **壓縮後大小**: 
  - 多檔版本 JS: ~897 KB (gzip)
  - 單檔版本: ~905 KB (gzip)

## 待測試項目

由於無法在終端機環境直接測試 GUI 應用，以下項目需使用者手動驗證：

### 🧪 多檔版本測試
```bash
# 啟動本地 HTTP 伺服器
cd dist
python3 -m http.server 8080
# 或使用其他 HTTP 伺服器
```

**測試清單**:
- [ ] 瀏覽器開啟 `http://localhost:8080` 確認頁面載入正常
- [ ] WYSIWYG 編輯器正常初始化
- [ ] 編輯模式與預覽模式切換正常
- [ ] 檔案開啟功能（開啟 .txt/.md 檔案）
- [ ] **檔案儲存功能**：
  - [ ] 點擊 [儲存] 按鈕開啟檔案選擇器
  - [ ] 可選擇儲存位置（非固定 Downloads 資料夾）
  - [ ] 可自訂檔名
  - [ ] 可選擇副檔名（.txt 或 .md）
  - [ ] 儲存成功後下次儲存記住上次檔名
  - [ ] 取消儲存不顯示錯誤
- [ ] 快捷鍵：Ctrl+S 儲存、Ctrl+O 開啟
- [ ] 無序清單階層 marker 顯示（●/○/▶/▷）
- [ ] 任務清單預覽（無 checkbox marker）
- [ ] Backspace 退出清單行為
- [ ] 巢狀清單支援（Enter 續行、Tab 縮排）
- [ ] 斷網測試（關閉網路後仍可運作）

### 🧪 單檔版本測試
```bash
# 直接雙擊開啟 testing_index.html
```

**測試清單**:
- [ ] 直接雙擊 `dist/testing_index.html` 開啟
- [ ] 確認無 CORS 錯誤
- [ ] 功能與多檔版本一致
- [ ] 離線測試

## 已知問題

1. **Chunk size 警告**: 打包後 JS 檔案超過 500 KB
   - 影響：無功能影響，僅建議考慮 code-splitting 優化
   - 優化建議：使用動態 import 或 manual chunks

2. **安全漏洞**: npm audit 報告 2 個中等嚴重性漏洞
   - 影響：目前不影響建置與運作
   - 修復建議：執行 `npm audit fix --force`（需測試相容性）

## 部署建議

### 內網部署（推薦多檔版本）
1. 將 `dist/` 資料夾複製到內網伺服器
2. 配置 Web 伺服器（nginx/Apache）指向 `dist/` 目錄
3. 確保 MIME 類型正確設定

### 本地測試（使用單檔版本）
1. 直接雙擊 `dist/testing_index.html`
2. 無需 HTTP 伺服器
3. 適合離線環境快速測試

## 後續優化建議

1. **性能優化**:
   - 考慮使用動態 import 分割程式碼
   - 壓縮圖片資源（若有）

2. **安全性**:
   - 修復 npm audit 報告的安全漏洞
   - 考慮加入 Content-Security-Policy 標頭

3. **功能增強**:
   - 新增自動儲存功能
   - 支援更多檔案格式（.md 副名）
   - 新增匯出 PDF 功能（如有需求）

## 總結

✅ **建置成功**：dist 資料夾與所有檔案已正確產出  
⏳ **待測試**：需在瀏覽器中進行功能與離線測試  
📋 **準備部署**：可直接部署 `dist/` 資料夾至內網環境

---

**測試完成後請更新此文檔，記錄測試結果與發現的問題。**
