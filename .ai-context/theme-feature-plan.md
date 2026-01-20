# 主題切換功能開發計畫

**專案名稱：** Markdown 編輯器 - 主題系統  
**建立日期：** 2026-01-20  
**狀態：** 規劃階段  

---

## 📋 功能概述

為 Markdown 編輯器新增主題切換功能，提供 10 種精心設計的配色方案（7 種淺色 + 3 種深色），通過專業的設定面板實現無縫切換。

---

## 🎯 已確定的設計決策

### 1. UI/UX 設計方案
- ✅ **面板樣式：** 側邊滑入式設定面板（從右側滑入）
- ✅ **主題佈局：** 每行顯示 2 個主題卡片
- ✅ **色彩預覽：** 簡單色塊（4 個主要顏色）
- ✅ **主題分類：** 分為「淺色主題」和「深色主題」兩個類別
- ✅ **設計指南：** 遵循 UI/UX Pro Max 專業標準

### 2. 技術架構
- ✅ **打包方式：** 方案 A - 三個檔案分離（HTML + JS + CSS）
- ✅ **CSS 變數系統：** 使用 `[data-theme="theme-name"]` 屬性選擇器
- ✅ **主題持久化：** localStorage 儲存用戶選擇
- ✅ **切換方式：** 點擊主題卡片立即套用，無需確認

### 3. 10 種主題配色

#### ☀️ 淺色主題 (7 個)

1. **Arctic Frost（北極寒霜）** - 預設主題
   - 用途：長時間閱讀、護眼
   - 背景：`#f8fafc` | 主色：`#4a6fa5` | 文字：`#2c3e50`

2. **Sunset Glow（日落暖光）**
   - 用途：創意寫作、靈感啟發
   - 背景：`#fff5f0` | 主色：`#ff6b35` | 文字：`#2d1810`

3. **Forest Green（森林綠意）**
   - 用途：自然主題、環保文檔
   - 背景：`#f0f7f4` | 主色：`#2d6a4f` | 文字：`#1b4332`

4. **Mocha Latte（摩卡拿鐵）**
   - 用途：舒適閱讀、咖啡廳氛圍
   - 背景：`#f5f1ed` | 主色：`#8b6f47` | 文字：`#3e2723`

5. **Cherry Blossom（櫻花粉嫩）**
   - 用途：輕鬆筆記、日記
   - 背景：`#fff0f5` | 主色：`#d84a7f` | 文字：`#4a1942`

6. **Golden Sand（金沙暖陽）**
   - 用途：正式文件、商業報告
   - 背景：`#fefcf3` | 主色：`#d4a574` | 文字：`#3e2c1f`

7. **Ice Blue（冰川藍調）**
   - 用途：技術文檔、程式碼筆記
   - 背景：`#f0f9ff` | 主色：`#0284c7` | 文字：`#0c4a6e`

#### 🌙 深色主題 (3 個)

8. **Night Ocean（深夜海洋）**
   - 用途：夜間工作、護眼
   - 背景：`#0f172a` | 主色：`#38bdf8` | 文字：`#e2e8f0`

9. **Midnight Purple（午夜紫羅蘭）**
   - 用途：創意工作、設計文檔
   - 背景：`#1a1625` | 主色：`#a78bfa` | 文字：`#e9d5ff`

10. **Charcoal Dark（炭黑極簡）**
    - 用途：極簡主義、專注寫作
    - 背景：`#18181b` | 主色：`#fbbf24` | 文字：`#fafaf9`

---

## 📁 檔案結構規劃

### 新增檔案

```
src/
├── themes/
│   ├── theme-config.js        # 10 種主題配色定義
│   ├── theme-manager.js       # 主題切換邏輯類別
│   └── themes.css             # 所有主題 CSS 變數定義
├── components/
│   ├── settings-panel.js      # 設定面板 UI 邏輯
│   └── settings-panel.css     # 設定面板樣式
```

### 修改檔案

```
src/
├── main.js                    # 加入設定面板和主題管理器初始化
├── style/
│   └── token.css              # 改為預設主題（Arctic Frost）變數
index.html                     # 加入設定按鈕和面板 DOM 結構
```

### 打包後結構 (npm run build)

```
dist/
├── index.html                 # HTML 入口檔案
└── assets/
    ├── index-[hash].js        # 所有 JS 合併打包
    └── index-[hash].css       # 所有 CSS 合併打包
```

---

## 🎨 UI/UX 設計細節

### 設定面板特性

1. **觸發方式**
   - 工具列右側新增「設定」按鈕（使用 Heroicons SVG icon）
   - 點擊後從右側滑入設定面板

2. **面板佈局**
   - 寬度：400px（手機端：100%）
   - 高度：100vh（全屏）
   - 背景：使用當前主題的 `--crepe-color-surface`
   - 陰影：`-4px 0 24px rgba(0, 0, 0, 0.15)`

3. **主題卡片設計**
   - 每行 2 個卡片（響應式：手機端 1 個）
   - 包含：4 色塊預覽 + 主題名稱（中英文）+ 標籤
   - 選中狀態：邊框高亮 + 右上角打勾圖示
   - Hover 效果：邊框變色 + 陰影（不使用 scale）

4. **動畫效果**
   - 側邊滑入：300ms cubic-bezier(0.4, 0, 0.2, 1)
   - 卡片 hover：200ms 過渡
   - 選中標記：淡入 + 縮放

### UI/UX Pro Max 專業標準

✅ **不使用 emoji 作為 icon** - 使用 Heroicons SVG  
✅ **添加 `cursor-pointer`** - 所有可點擊元素  
✅ **穩定 hover 狀態** - 避免 scale 造成 layout shift  
✅ **充足對比度** - Light mode 文字使用 `#0F172A`  
✅ **可訪問性** - 鍵盤導航支援  
✅ **響應式設計** - 支援 320px、768px、1024px  

---

## 🔧 技術實現規劃

### 1. 主題數據結構 (`src/themes/theme-config.js`)

```javascript
export const themes = {
  light: [
    {
      id: 'arctic-frost',
      name: 'Arctic Frost',
      nameCn: '北極寒霜',
      category: 'light',
      tags: ['護眼', '預設'],
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        surfaceLow: '#f1f5f9',
        onBackground: '#2c3e50',
        onSurface: '#334155',
        primary: '#4a6fa5',
        secondary: '#64748b',
        selected: '#dbeafe',
        hover: '#e2e8f0',
        outline: '#cbd5e1',
        inlineArea: '#f1f5f9',
        inlineCode: '#1e40af',
        error: '#dc2626'
      }
    },
    // ... 其他 6 個淺色主題
  ],
  dark: [
    // ... 3 個深色主題
  ]
};
```

### 2. CSS 變數系統 (`src/themes/themes.css`)

```css
/* 預設主題變數 */
:root {
  --crepe-color-background: #f8fafc;
  /* ... 其他變數 */
}

/* 主題切換 */
[data-theme="arctic-frost"] { /* ... */ }
[data-theme="sunset-glow"] { /* ... */ }
/* ... 其他 8 個主題 */
```

### 3. 主題管理器 (`src/themes/theme-manager.js`)

```javascript
export class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }
  
  loadTheme() {
    return localStorage.getItem('selectedTheme') || 'arctic-frost';
  }
  
  applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    this.currentTheme = themeId;
    localStorage.setItem('selectedTheme', themeId);
  }
  
  switchTheme(themeId) {
    this.applyTheme(themeId);
  }
}
```

### 4. 設定面板邏輯 (`src/components/settings-panel.js`)

主要功能：
- 面板開關動畫
- 渲染主題卡片（根據分類）
- 綁定點擊事件
- 更新選中狀態

### 5. 主入口整合 (`src/main.js`)

```javascript
import { ThemeManager } from './themes/theme-manager.js';
import { SettingsPanel } from './components/settings-panel.js';

// 初始化主題管理器
const themeManager = new ThemeManager();

// 初始化設定面板
const settingsPanel = new SettingsPanel(themeManager);
```

---

## ✅ 下一步實作任務

### 階段 1：建立主題系統核心 (優先)

- [ ] 建立 `src/themes/theme-config.js`
  - [ ] 定義 10 個主題的完整配色數據
  - [ ] 匯出 themes 物件
  
- [ ] 建立 `src/themes/themes.css`
  - [ ] 為每個主題定義 CSS 變數
  - [ ] 使用 `[data-theme="..."]` 選擇器
  
- [ ] 建立 `src/themes/theme-manager.js`
  - [ ] 實作 ThemeManager 類別
  - [ ] 實作 loadTheme、applyTheme、switchTheme 方法
  - [ ] localStorage 持久化邏輯

### 階段 2：建立設定面板 UI

- [ ] 修改 `index.html`
  - [ ] 工具列新增「設定」按鈕
  - [ ] 新增設定面板 DOM 結構
  - [ ] 新增遮罩層 DOM
  
- [ ] 建立 `src/components/settings-panel.css`
  - [ ] 面板樣式（側邊滑入）
  - [ ] 主題卡片樣式
  - [ ] 動畫效果
  - [ ] 響應式設計
  
- [ ] 建立 `src/components/settings-panel.js`
  - [ ] 實作 SettingsPanel 類別
  - [ ] 面板開關邏輯
  - [ ] 動態渲染主題卡片
  - [ ] 綁定事件監聽器

### 階段 3：整合與測試

- [ ] 修改 `src/main.js`
  - [ ] 引入 ThemeManager 和 SettingsPanel
  - [ ] 初始化邏輯
  
- [ ] 修改 `src/style/token.css`
  - [ ] 將當前硬編碼的顏色改為使用 CSS 變數
  
- [ ] 測試功能
  - [ ] 開發模式測試 (`npm run dev`)
  - [ ] 主題切換是否正常
  - [ ] localStorage 持久化是否有效
  - [ ] 面板動畫是否流暢
  - [ ] 響應式設計測試（手機端）
  
- [ ] 打包測試
  - [ ] `npm run build` 測試
  - [ ] 檢查 `dist/` 結構是否正確
  - [ ] 離線功能測試

### 階段 4：優化與文檔

- [ ] 性能優化
  - [ ] 確保主題切換無延遲
  - [ ] CSS 變數繼承優化
  
- [ ] 可訪問性檢查
  - [ ] 鍵盤導航（Tab、Enter、Esc）
  - [ ] ARIA 屬性
  - [ ] 對比度檢查
  
- [ ] 更新文檔
  - [ ] 更新 `.ai-context/handoff.md`
  - [ ] 更新 `.ai-context/task.md`
  - [ ] 建立 `walkthrough.md`（功能演示）

---

## 📝 注意事項

### 開發建議

1. **先測試核心功能**
   - 先完成階段 1，確保主題切換邏輯正確
   - 可在瀏覽器 Console 手動測試

2. **漸進式開發**
   - 階段 2 先完成基本 UI，再加入動畫效果
   - 避免一次性寫太多未測試的程式碼

3. **遵循現有程式碼風格**
   - 參考 `editor-manager.js` 和 `file-handler.js` 的程式碼風格
   - 使用 ES6+ 語法

### 潛在問題

1. **CSS 變數繼承**
   - 確保所有現有樣式都使用 CSS 變數
   - 檢查 `theme.css` 和 `main.css` 是否有硬編碼顏色

2. **深色主題對比度**
   - 深色主題需要特別注意文字對比度
   - 使用對比度檢查工具驗證（最低 4.5:1）

3. **預覽模式同步**
   - 確保預覽模式也能正確套用主題
   - 測試 `#preview-content` 的樣式

---

## 🎯 成功標準

完成後應達到以下標準：

✅ 10 個主題可正常切換，無視覺錯誤  
✅ 主題選擇可持久化（重新開啟應用保持選擇）  
✅ 設定面板動畫流暢（無卡頓）  
✅ 響應式設計正常（手機端可用）  
✅ 可訪問性達標（鍵盤操作、對比度）  
✅ 打包後三個檔案（HTML + JS + CSS）正常運作  
✅ 離線功能不受影響  

---

## 📅 預估時間

- 階段 1：1-2 小時
- 階段 2：2-3 小時
- 階段 3：1-2 小時
- 階段 4：1 小時

**總計：5-8 小時**

---

## 🔗 相關參考資料

### UI/UX 設計指南
- UI/UX Pro Max Skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- 專業標準：不使用 emoji icon、cursor-pointer、穩定 hover、充足對比度

### 現有專案文檔
- `.ai-context/handoff.md` - 專案交接文件
- `.ai-context/task.md` - 任務清單
- `.ai-context/implementation_plan.md` - 原始實施計畫

### 技術文檔
- Vite 官方文檔：https://vitejs.dev/
- CSS 變數指南：https://developer.mozilla.org/zh-TW/docs/Web/CSS/Using_CSS_custom_properties
- localStorage API：https://developer.mozilla.org/zh-TW/docs/Web/API/Window/localStorage

---

**文檔版本：** 1.0  
**最後更新：** 2026-01-20  
**下次更新：** 實作完成後

---

## 💬 給下一位 AI 助手的訊息

嗨！這是主題切換功能的完整規劃文檔。

**已確定的事項：**
- 10 種主題配色已定義（7 淺色 + 3 深色）
- UI/UX 設計已確認（側邊滑入、每行 2 卡片、4 色塊預覽）
- 技術架構已規劃（CSS 變數 + localStorage + 模組化）

**請按照「下一步實作任務」的階段順序執行：**
1. 先建立主題系統核心（階段 1）
2. 再建立設定面板 UI（階段 2）
3. 整合測試（階段 3）
4. 優化與文檔（階段 4）

**重要提醒：**
- 遵循 UI/UX Pro Max 專業標準
- 使用 SVG icons，不要用 emoji
- 確保深色主題對比度達標
- 測試響應式設計（特別是手機端）

祝開發順利！ 🚀
