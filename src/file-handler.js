// 檔案處理模組 - 開啟、儲存 TXT

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
 * 儲存內容為 TXT/MD 檔案（使用檔案選擇器）
 * @param {string} content - 要儲存的內容
 * @param {string} defaultFilename - 預設檔名（含副檔名，建議 .txt）
 * @returns {Promise<FileSystemFileHandle|null>} - 檔案句柄或 null（使用者取消）
 */
export async function saveAsTxtWithPicker(content, defaultFilename = 'document.txt') {
    if (!('showSaveFilePicker' in window)) {
        saveAsTxt(content, defaultFilename);
        return null;
    }

    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
                description: '文字檔案',
                accept: {
                    'text/plain': ['.txt', '.md'],
                },
            }],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return fileHandle;
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('儲存失敗：', error);
            alert('儲存失敗：' + error.message);
        }
        return null;
    }
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
            const result = event?.target?.result;
            if (typeof result !== 'string') {
                reject(new Error('檔案內容無法解析為文字。'));
                return;
            }
            resolve(result);
        };

        reader.onerror = () => {
            const error = reader.error;
            const reason = error?.name ? `讀取檔案失敗：${error.name}` : '讀取檔案失敗。';
            reject(new Error(reason));
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
