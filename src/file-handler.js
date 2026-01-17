// 檔案處理模組 - 開啟、儲存 TXT、匯出 PDF

/**
 * 儲存內容為 TXT 檔案
 * @param {string} content - 要儲存的內容
 * @param {string} filename - 檔案名稱
 */
export function saveAsTxt(content, filename = 'document.txt') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * 開啟 TXT/MD 檔案
 * @param {File} file - 檔案物件
 * @returns {Promise<string>} - 檔案內容
 */
export function openFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            resolve(event.target.result);
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsText(file, 'UTF-8');
    });
}



/**
 * 觸發檔案選擇對話框
 * @param {HTMLInputElement} fileInput - 檔案輸入元素
 */
export function triggerFileSelect(fileInput) {
    fileInput.click();
}
