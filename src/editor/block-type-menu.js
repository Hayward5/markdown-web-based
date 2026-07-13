export const BLOCK_TYPE_ITEMS = [
    { type: 'paragraph', label: '一般文字' },
    { type: 'heading-1', label: 'Heading 1' },
    { type: 'heading-2', label: 'Heading 2' },
    { type: 'heading-3', label: 'Heading 3' },
    { type: 'heading-4', label: 'Heading 4' },
    { type: 'heading-5', label: 'Heading 5' },
    { type: 'heading-6', label: 'Heading 6' },
    { type: 'blockquote', label: '引用' },
    { type: 'code-block', label: '程式碼區塊' },
];

export function isClickGesture(start, end, threshold = 5) {
    return Math.hypot(end.x - start.x, end.y - start.y) <= threshold;
}

export class BlockTypeMenu {
    constructor({ onSelect }) {
        this.onSelect = onSelect;
        this.element = document.createElement('div');
        this.element.className = 'block-type-menu';
        this.element.dataset.show = 'false';
        this.element.setAttribute('role', 'menu');
        this.element.setAttribute('aria-label', '變更區塊型態');

        for (const item of BLOCK_TYPE_ITEMS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.blockType = item.type;
            button.setAttribute('role', 'menuitem');
            button.textContent = item.label;
            button.addEventListener('pointerdown', (event) => event.preventDefault());
            button.addEventListener('click', () => this.onSelect(item.type));
            this.element.append(button);
        }

        this.onDocumentPointerDown = (event) => {
            if (!this.element.contains(event.target)) this.hide();
        };
        this.onDocumentKeyDown = (event) => {
            if (event.key === 'Escape') this.hide();
        };
        this.onViewportChange = () => this.hide();
        document.body.append(this.element);
        document.addEventListener('pointerdown', this.onDocumentPointerDown);
        document.addEventListener('keydown', this.onDocumentKeyDown);
        window.addEventListener('resize', this.onViewportChange);
        window.addEventListener('scroll', this.onViewportChange, true);
    }

    show({ anchorRect, currentType }) {
        for (const button of this.element.querySelectorAll('[data-block-type]')) {
            const isCurrent = button.dataset.blockType === currentType;
            button.classList.toggle('active', isCurrent);
            button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
        }

        this.element.dataset.show = 'true';
        const menuRect = this.element.getBoundingClientRect();
        const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - menuRect.width - 8));
        const top = Math.max(8, Math.min(anchorRect.bottom + 4, window.innerHeight - menuRect.height - 8));
        Object.assign(this.element.style, { left: `${left}px`, top: `${top}px` });
    }

    hide() {
        this.element.dataset.show = 'false';
    }

    destroy() {
        document.removeEventListener('pointerdown', this.onDocumentPointerDown);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
        window.removeEventListener('resize', this.onViewportChange);
        window.removeEventListener('scroll', this.onViewportChange, true);
        this.element.remove();
    }
}
