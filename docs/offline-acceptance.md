# Offline acceptance

1. 在無網路的電腦複製整個 `release/` 目錄。
2. 以 Chrome 147.0.7727.102 開啟 `release/markdown-editor.html`（`file://`）。
3. 開啟 UTF-8 `.md` 與空白 `.md`，修改後儲存或另存新檔。
4. 切換預覽，確認表格、task list 與繁中內容可讀。
5. 輸入 `<img src=x onerror=alert(1)>` 與遠端 Markdown 圖片，確認未執行且沒有載入遠端資源。
6. 以 `SHA256SUMS.txt` 驗證 `markdown-editor.html` 未被修改。

本 repo 的 Ubuntu 自動驗收使用 Google Chrome for Testing 147.0.7727.102 及 150.0.7871.115，直接對 `file://` release 成品執行 UI gate。
