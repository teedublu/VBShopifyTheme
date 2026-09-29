// saved-books.js
// "Save a book": heart buttons on audiobooks, the header count and the Saved books page.
// Saved books are product IDs kept in localStorage, so the list lasts between visits on the same device.

const STORAGE_KEY = 'voxblock:saved-books';
const CHANGE_EVENT = 'saved-books:change';
const SEARCH_BATCH_SIZE = 10; // storefront search returns at most 10 products per request, so larger batches drop books

const savedBooksUrl = window.themeVariables?.settings?.savedBooksUrl || '/pages/saved-books';

const readIds = () => {
    try {
        const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
    } catch (e) {
        return [];
    }
};

let savedIds = readIds();

const writeIds = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch (e) {
        // Storage can be unavailable (private browsing, full quota): the list still works for this page view
    }
};

const emitChange = (detail = {}) => {
    document.documentElement.classList.toggle('has-saved-books', savedIds.length > 0);
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { ...detail, ids: [...savedIds] } }));
};

export const SavedBooks = {
    ids: () => [...savedIds],

    has: (id) => savedIds.includes(Number(id)),

    // Newest first by default; index lets "Undo" put a book back where it was
    add(id, index = 0) {
        id = Number(id);
        savedIds = savedIds.filter((savedId) => savedId !== id);
        savedIds.splice(index, 0, id);
        writeIds();
        emitChange({ id, saved: true });
    },

    // Returns the book's position so it can be restored
    remove(id) {
        id = Number(id);
        const index = savedIds.indexOf(id);
        savedIds = savedIds.filter((savedId) => savedId !== id);
        writeIds();
        emitChange({ id, saved: false });
        return index;
    },
};

// Keep other open tabs in step
window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    savedIds = readIds();
    emitChange();
});

// PostHog: one event per save / unsave, like sample_played in voxblock.js
const track = (eventName, button, extraProperties = {}) => {
    if (typeof window.posthog === 'undefined' || typeof window.posthog.capture !== 'function') return;
    window.posthog.capture(eventName, {
        title: button.productTitle || null,
        product_id: button.productId,
        page_type: window.themeVariables?.settings?.pageType || null,
        ...extraProperties,
    });
};

// Short confirmation just below the header (the bottom of the screen is taken by the cookie banner and, on phones, the
// sticky add-to-cart bar). The live region exists from page load so screen readers announce it.
const Toast = (() => {
    const element = document.createElement('div');
    element.className = 'saved-books-toast';
    element.setAttribute('role', 'status');
    document.body.append(element);

    let hideTimer;
    let clearTimer;

    const hide = () => {
        element.classList.remove('is-visible');
        clearTimer = setTimeout(() => element.replaceChildren(), 300);
    };

    const startTimer = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, 5000);
    };

    // Give people time to reach the action
    element.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    element.addEventListener('mouseleave', startTimer);
    element.addEventListener('focusin', () => clearTimeout(hideTimer));
    element.addEventListener('focusout', startTimer);

    const show = (message, action) => {
        clearTimeout(clearTimer);

        // Sit under the header wherever it is right now (the announcement bar pushes it down at the top of the page)
        const headerBottom = document.querySelector('.shopify-section--header')?.getBoundingClientRect().bottom || 0;
        element.style.top = `${Math.max(headerBottom, 0) + 16}px`;

        const text = document.createElement('span');
        text.textContent = message;
        element.replaceChildren(text, ...(action ? [action] : []));
        element.classList.add('is-visible');
        startTimer();
    };

    return { show, hide };
})();

const viewSavedBooksLink = () => {
    if (window.location.pathname === savedBooksUrl) return null;
    const link = document.createElement('a');
    link.href = savedBooksUrl;
    link.textContent = 'View saved books';
    return link;
};

// Undo re-saves the book, and counts as a save so PostHog's saved/unsaved totals stay in step
const undoButton = (saveBookButton, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Undo';
    button.addEventListener('click', () => {
        SavedBooks.add(saveBookButton.productId, Math.max(index, 0));
        track('book_saved', saveBookButton, { via: 'undo' });
        Toast.hide();
    });
    return button;
};

class SaveBookButton extends HTMLElement {
    constructor() {
        super();
        this.update = this.update.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    connectedCallback() {
        this.button = this.querySelector('button');
        if (!this.button) return;

        this.button.addEventListener('click', this.onClick);
        document.addEventListener(CHANGE_EVENT, this.update);
        this.update();
    }

    disconnectedCallback() {
        this.button?.removeEventListener('click', this.onClick);
        document.removeEventListener(CHANGE_EVENT, this.update);
    }

    get productId() {
        return Number(this.getAttribute('product-id'));
    }

    get productTitle() {
        return this.getAttribute('product-title') || '';
    }

    update() {
        this.button.setAttribute('aria-pressed', String(SavedBooks.has(this.productId)));
    }

    onClick(event) {
        event.preventDefault();

        if (SavedBooks.has(this.productId)) {
            const index = SavedBooks.remove(this.productId);
            track('book_unsaved', this);
            Toast.show('Removed from saved books', undoButton(this, index));
        } else {
            SavedBooks.add(this.productId);
            track('book_saved', this);
            Toast.show('Saved', viewSavedBooksLink());
        }
    }
}

class SavedBooksCount extends HTMLElement {
    constructor() {
        super();
        this.update = this.update.bind(this);
    }

    connectedCallback() {
        document.addEventListener(CHANGE_EVENT, this.update);
        this.update();
    }

    disconnectedCallback() {
        document.removeEventListener(CHANGE_EVENT, this.update);
    }

    update() {
        const count = SavedBooks.ids().length;
        this.textContent = count > 0 ? count : '';
    }
}

// Saved books page: renders the saved IDs with the theme's product cards through the Section Rendering API,
// the same way the theme's "Recently viewed products" section works.
class SavedBooksList extends HTMLElement {
    constructor() {
        super();
        this.onChange = this.onChange.bind(this);
        this.renderCount = 0;
    }

    connectedCallback() {
        this.grid = this.querySelector('[data-saved-books-grid]');
        this.loadingState = this.querySelector('[data-saved-books-loading]');
        this.emptyState = this.querySelector('[data-saved-books-empty]');
        this.errorState = this.querySelector('[data-saved-books-error]');

        document.addEventListener(CHANGE_EVENT, this.onChange);
        this.render();
    }

    disconnectedCallback() {
        document.removeEventListener(CHANGE_EVENT, this.onChange);
    }

    async render() {
        const ids = SavedBooks.ids();
        const renderId = ++this.renderCount;

        if (ids.length === 0) {
            this.showState('empty');
            return;
        }

        if (this.grid.hidden) {
            this.showState('loading');
        }

        const batches = [];
        for (let i = 0; i < ids.length; i += SEARCH_BATCH_SIZE) {
            batches.push(ids.slice(i, i + SEARCH_BATCH_SIZE));
        }

        try {
            const pages = await Promise.all(batches.map((batch) => fetch(this.searchUrl(batch)).then((response) => {
                if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
                return response.text();
            })));

            if (renderId !== this.renderCount) return; // a newer render has started

            const cards = pages.flatMap((html) => {
                const results = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-saved-books-results]');
                return results ? [...results.children] : [];
            });

            this.grid.replaceChildren(...cards.map((card) => document.importNode(card, true)));
            this.showState(cards.length > 0 ? 'grid' : 'empty');
        } catch (error) {
            if (renderId !== this.renderCount) return;
            console.error(error);
            this.showState('error');
        }
    }

    searchUrl(ids) {
        const params = new URLSearchParams({
            type: 'product',
            q: ids.map((id) => `id:${id}`).join(' OR '),
            section_id: this.getAttribute('section-id'),
        });

        return `${window.Shopify?.routes?.root || '/'}search?${params}`;
    }

    onChange(event) {
        const { id, saved } = event.detail;

        if (saved === false) {
            // Drop the unsaved book's card straight away rather than reloading the list
            this.grid.querySelector(`save-book-button[product-id="${id}"]`)?.closest('product-card')?.remove();

            if (this.grid.children.length === 0) {
                this.showState('empty');
            }
        } else {
            // A book was added (Undo, or another tab): reload so it appears in the right place
            this.render();
        }
    }

    showState(state) {
        this.loadingState.hidden = state !== 'loading';
        this.emptyState.hidden = state !== 'empty';
        this.errorState.hidden = state !== 'error';
        this.grid.hidden = state !== 'grid';
    }
}

if (!window.customElements.get('save-book-button')) {
    window.customElements.define('save-book-button', SaveBookButton);
}

if (!window.customElements.get('saved-books-count')) {
    window.customElements.define('saved-books-count', SavedBooksCount);
}

if (!window.customElements.get('saved-books-list')) {
    window.customElements.define('saved-books-list', SavedBooksList);
}
