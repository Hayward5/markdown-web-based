const DB_NAME = 'offline-markdown-editor';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const LATEST_ID = 'latest';

export function createDraftRecord({ filename, content, now = Date.now() }) {
    return {
        id: LATEST_ID,
        filename: filename || 'document.md',
        markdown: String(content ?? ''),
        updatedAt: now,
    };
}

function openDatabase(indexedDb) {
    return new Promise((resolve, reject) => {
        const request = indexedDb.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('無法開啟草稿資料庫。'));
    });
}

function runTransaction(db, mode, operation) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => resolve(request?.result ?? null);
        transaction.onerror = () => reject(transaction.error ?? new Error('草稿交易失敗。'));
        transaction.onabort = () => reject(transaction.error ?? new Error('草稿交易已中止。'));
    });
}

export class DraftStore {
    constructor(indexedDb = globalThis.indexedDB) {
        this.database = openDatabase(indexedDb);
    }

    async loadLatest() { return runTransaction(await this.database, 'readonly', (store) => store.get(LATEST_ID)); }
    async saveLatest(record) { return runTransaction(await this.database, 'readwrite', (store) => store.put({ ...record, id: LATEST_ID })); }
    async clearLatest() { return runTransaction(await this.database, 'readwrite', (store) => store.delete(LATEST_ID)); }
}

export function createDraftScheduler({ store, delay = 500 }) {
    let timer = null;
    let latest = null;
    const write = async () => {
        if (!latest) return;
        const record = latest;
        latest = null;
        await store.saveLatest(record);
    };
    return {
        schedule(record) {
            latest = record;
            clearTimeout(timer);
            timer = setTimeout(() => { write().catch(() => {}); }, delay);
        },
        async flush() { clearTimeout(timer); timer = null; await write(); },
        cancel() { clearTimeout(timer); timer = null; latest = null; },
    };
}
