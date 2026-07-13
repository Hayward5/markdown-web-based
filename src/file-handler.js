export const MAX_WARNING_BYTES = 5 * 1024 * 1024;

function defaultConfirmLarge(message) {
    return typeof window === 'undefined' ? true : window.confirm(message);
}

export function isPickerUnavailableError(error) {
    return error?.name === 'SecurityError' || error?.name === 'NotAllowedError';
}

export function normalizeFilename(name = 'document.md') {
    const value = String(name || 'document.md');
    return /\.(?:md|markdown|txt)$/i.test(value) ? value : `${value}.md`;
}

export async function readUtf8File(file, { confirmLarge = defaultConfirmLarge } = {}) {
    if (file.size > MAX_WARNING_BYTES && !confirmLarge('檔案超過 5 MiB，開啟可能需要較長時間。是否繼續？')) {
        throw new Error('已取消開啟大型檔案。');
    }
    const bytes = await file.arrayBuffer();
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        throw new Error('檔案不是有效的 UTF-8 文字，目前只支援 UTF-8。');
    }
}

export async function pickOpenDocument() {
    try {
        const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{ description: 'Markdown／文字檔', accept: { 'text/plain': ['.md', '.markdown', '.txt'] } }],
        });
        const file = await handle.getFile();
        return { handle, filename: file.name, content: await readUtf8File(file) };
    } catch (error) {
        if (error?.name === 'AbortError') return null;
        throw error;
    }
}

export async function pickSaveHandle(suggestedName) {
    try {
        return await window.showSaveFilePicker({
            suggestedName: normalizeFilename(suggestedName),
            types: [{ description: 'Markdown／文字檔', accept: { 'text/plain': ['.md', '.txt'] } }],
        });
    } catch (error) {
        if (error?.name === 'AbortError') return null;
        throw error;
    }
}

export async function writeFileHandle(handle, content) {
    const writable = await handle.createWritable();
    await writable.write(String(content ?? ''));
    await writable.close();
}

export function downloadText(content, filename = 'document.md') {
    const blob = new Blob([String(content ?? '')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = normalizeFilename(filename);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function triggerFileSelect(fileInput) {
    fileInput.click();
}
