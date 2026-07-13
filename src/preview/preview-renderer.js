import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function normalizePreviewUrl(raw, kind) {
    const value = String(raw ?? '').trim();
    if (!value || /^(?:javascript|vbscript):/i.test(value)) return null;
    if (/^data:/i.test(value)) {
        return kind === 'image' && /^data:image\/(?:png|gif|jpeg|webp);base64,/i.test(value)
            ? value
            : null;
    }
    if (kind === 'image' && /^https?:/i.test(value)) return null;
    return value;
}

const renderer = new marked.Renderer();
renderer.html = ({ text }) => escapeHtml(text);
renderer.image = ({ href, title, text }) => {
    const src = normalizePreviewUrl(href, 'image');
    if (!src) return `<span class="blocked-image">[已封鎖遠端圖片：${escapeHtml(text || href)}]</span>`;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(text)}"${titleAttr}>`;
};
renderer.link = ({ href, title, text, tokens }) => {
    const target = normalizePreviewUrl(href, 'link');
    const label = tokens ? marked.Parser.parseInline(tokens) : escapeHtml(text);
    if (!target) return label;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(target)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${label}</a>`;
};

export function renderPreview(markdown) {
    const parsed = marked.parse(String(markdown ?? ''), { gfm: true, renderer });
    return DOMPurify.sanitize(parsed, {
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'meta', 'base'],
        FORBID_ATTR: ['style', 'srcdoc'],
        ALLOW_DATA_ATTR: false,
    });
}
