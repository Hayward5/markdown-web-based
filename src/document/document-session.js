export class DocumentSession {
    constructor({ filename = 'document.md', content = '', handle = null } = {}) {
        this.filename = filename;
        this.content = content;
        this.savedContent = content;
        this.handle = handle;
    }

    get isDirty() {
        return this.content !== this.savedContent;
    }

    updateContent(content) {
        this.content = String(content ?? '');
        return this.isDirty;
    }

    load({ filename, content, handle = null }) {
        this.filename = filename || 'document.md';
        this.content = String(content ?? '');
        this.savedContent = this.content;
        this.handle = handle;
    }

    markSaved({ filename = this.filename, handle = this.handle } = {}) {
        this.filename = filename;
        this.handle = handle;
        this.savedContent = this.content;
    }

    newDocument() {
        this.load({ filename: 'document.md', content: '', handle: null });
    }

    snapshot() {
        return {
            filename: this.filename,
            content: this.content,
            savedContent: this.savedContent,
            handle: this.handle,
            isDirty: this.isDirty,
        };
    }
}
