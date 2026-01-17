# Web-Based Markdown 編輯器實作計畫

## 架構選擇

> [!IMPORTANT]
> **Milkdown 限制**：Milkdown 沒有 standalone UMD bundle，必須使用打包工具。
> 
> **但最終產出仍可是純 HTML/JS/CSS**！打包後產生的 `dist/` 資料夾只包含靜態檔案。

---

## 方案比較

| | 方案 A：Vite + Milkdown | 方案 B：純手寫 + marked.js |
|---|---|---|
| **開發時** | 需 npm + Vite | 純 HTML/JS/CSS |
| **最終產出** | ✅ 純 HTML/JS/CSS | ✅ 純 HTML/JS/CSS |
| **WYSIWYG** | ✅ 完整支援 | ⚠️ 需手寫（複雜） |
| **Slash 命令** | ✅ 內建 | ⚠️ 需手寫 |
| **清單行為** | ✅ 內建 | ⚠️ 需手寫 |
| **程式碼高亮** | ✅ CodeMirror | ❌ 無 |
| **複雜度** | 中 | 高 |
| **檔案大小** | ~500KB | ~50KB |

---

## 推薦：方案 A

使用 Vite 打包，**最終產出仍是純靜態檔案**：

```
dist/
├── index.html      # 主頁面
├── assets/
│   ├── index-xxx.js    # 打包後的 JS
│   └── index-xxx.css   # 打包後的 CSS
```

### 開發流程
```bash
# 1. 安裝（僅開發時需要）
npm install

# 2. 開發
npm run dev

# 3. 打包 → 產生 dist/
npm run build

# 4. 部署 dist/ 到內網（純靜態檔案）
```

---

## 最終部署結構

```
markdown-editor/           # 部署到內網伺服器
├── index.html
└── assets/
    ├── index-abc123.js    # ~500KB (含 Milkdown)
    └── index-abc123.css   # 樣式
```

**不需要 node_modules、不需要 npm，僅需複製 `dist/` 資料夾即可運作。**

---

## 功能規格（確認後）

- ✅ **WYSIWYG 編輯**（無分割視窗）
- ✅ **純預覽模式**
- ✅ **Slash 命令** (`/h1`, `/ul`, `/code` 等)
- ✅ **清單自動行為**（Enter 續行、Tab 縮排）
- ✅ **快捷鍵** Ctrl+Shift+7/9
- ✅ **檔案操作**（開啟/儲存 TXT、匯出 PDF）
- ✅ **護眼主題**
- ✅ **繁中+英文支援**
