// saved-books.js
// "Save a book": heart buttons on audiobooks, the header count and the Saved books page.
// Saved books are product IDs kept in localStorage, so the list lasts between visits on the same device. For a
// signed-in customer the list also lives on their Shopify account (customer metafield custom.saved_books), which the
// Voxblock Account app updates through the /apps/voxblock app proxy.
// A list can be shared as a link to the Saved books page: ?shared=<IDs>&from=<first name> (see SharedLink below).

const STORAGE_KEY = 'voxblock:saved-books';
const OWNER_KEY = 'voxblock:saved-books-owner'; // customer ID whose account list this browser mirrors
const CHANGE_EVENT = 'saved-books:change';
const SEARCH_BATCH_SIZE = 10; // storefront search returns at most 10 products per request, so larger batches drop books

const savedBooksUrl = window.themeVariables?.settings?.savedBooksUrl || '/pages/saved-books';

// Shared lists: each product ID is written in base36, padded to a fixed 9 characters so the IDs need no separator.
// 9 base36 characters hold IDs up to about 1e14; audiobook IDs are around 1.6e13 today.
const SharedLink = {
    ID_WIDTH: 9,
    MAX_BOOKS: 50,

    url(ids, from) {
        const url = new URL(savedBooksUrl, window.location.origin);
        if (from) url.searchParams.set('from', from);
        url.searchParams.set('shared', ids.slice(0, this.MAX_BOOKS).map((id) => id.toString(36).padStart(this.ID_WIDTH, '0')).join(''));
        return url.toString();
    },

    // The shared IDs when this page is a shared list, otherwise null
    read() {
        if (window.location.pathname !== savedBooksUrl) return null;

        const params = new URLSearchParams(window.location.search);
        if (!params.has('shared')) return null;

        const encoded = params.get('shared').toLowerCase().replace(/[^0-9a-z]/g, '');
        const ids = [];

        for (let i = 0; i + this.ID_WIDTH <= encoded.length && ids.length < this.MAX_BOOKS; i += this.ID_WIDTH) {
            const id = parseInt(encoded.slice(i, i + this.ID_WIDTH), 36);
            if (id > 0 && !ids.includes(id)) ids.push(id);
        }

        // "from" is typed into a link anyone can edit, so it is only ever shown as text, and kept short
        return { ids, from: (params.get('from') || '').trim().slice(0, 30) };
    },
};

const sharedList = SharedLink.read();

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

// Signed-in customer: { customerId, firstName, ids, url }, from snippets/saved-books-head.liquid
const account = window.themeVariables?.settings?.savedBooksAccount || null;

const readOwner = () => {
    try {
        return localStorage.getItem(OWNER_KEY);
    } catch (e) {
        return null;
    }
};

const writeOwner = (customerId) => {
    try {
        if (customerId) {
            localStorage.setItem(OWNER_KEY, customerId);
        } else {
            localStorage.removeItem(OWNER_KEY);
        }
    } catch (e) {
        // Storage unavailable: the account list still loads from the page on every visit
    }
};

// Changes go to the account one at a time, in order, so a quick save-then-unsave can't arrive reversed
let accountQueue = Promise.resolve();

const syncToAccount = (change) => {
    if (!account) return;

    accountQueue = accountQueue
        .then(() => fetch(account.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change),
        }))
        .then((response) => {
            if (!response.ok) throw new Error(`Saved books sync failed: ${response.status}`);
        })
        .catch((error) => console.warn(error));
};

if (account) {
    const customerId = String(account.customerId);
    const accountIds = account.ids.map(Number);

    if (readOwner() === customerId) {
        // This browser already mirrors the account, which is the source of truth (it may have changed on another device)
        savedIds = accountIds;
    } else {
        // First visit signed in on this browser: books saved here before signing in join the account list
        const savedHereOnly = savedIds.filter((id) => !accountIds.includes(id));
        savedIds = [...savedHereOnly, ...accountIds];
        writeOwner(customerId);

        if (savedHereOnly.length > 0) {
            syncToAccount({ add: savedHereOnly });
        }
    }

    writeIds();
} else if (readOwner()) {
    // Signed out on a browser that showed someone's account list: don't leave it for the next person
    savedIds = [];
    writeIds();
    writeOwner(null);
}

document.documentElement.classList.toggle('has-saved-books', savedIds.length > 0);

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
        syncToAccount({ add: [id] });
        emitChange({ id, saved: true });
    },

    // Saves several books at once (a shared list) in the given order, above the ones already saved. Returns the number added.
    addAll(ids) {
        const newIds = ids.map(Number).filter((id) => id && !savedIds.includes(id));
        if (newIds.length === 0) return 0;

        savedIds = [...newIds, ...savedIds];
        writeIds();
        syncToAccount({ add: newIds });
        emitChange({ saved: true, added: newIds });
        return newIds.length;
    },

    // Returns the book's position so it can be restored
    remove(id) {
        id = Number(id);
        const index = savedIds.indexOf(id);
        savedIds = savedIds.filter((savedId) => savedId !== id);
        writeIds();
        syncToAccount({ remove: [id] });
        emitChange({ id, saved: false });
        return index;
    },
};

// Bump the header heart each time a book is saved, so people see where their list went
document.addEventListener(CHANGE_EVENT, (event) => {
    if (event.detail.saved !== true) return;

    document.querySelectorAll('.header__saved-books').forEach((link) => {
        link.classList.remove('is-bumping');
        void link.offsetWidth; // restarts the animation when saves come in quick succession
        link.classList.add('is-bumping');
    });
});

// Keep other open tabs in step
window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    savedIds = readIds();
    emitChange();
});

// PostHog: one event per save / unsave, like sample_played in voxblock.js, plus events for sharing a list
const capture = (eventName, properties = {}) => {
    if (typeof window.posthog === 'undefined' || typeof window.posthog.capture !== 'function') return;
    window.posthog.capture(eventName, {
        page_type: window.themeVariables?.settings?.pageType || null,
        ...properties,
    });
};

const track = (eventName, button, extraProperties = {}) => capture(eventName, {
    title: button.productTitle || null,
    product_id: button.productId,
    ...(sharedList ? { via: 'shared_list' } : {}),
    ...extraProperties,
});

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
    if (window.location.pathname === savedBooksUrl && !sharedList) return null;
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
// the same way the theme's "Recently viewed products" section works. Opened from a shared link, it shows the shared
// books instead, with a button to save them all; the hearts still show the visitor's own saved books.
class SavedBooksList extends HTMLElement {
    constructor() {
        super();
        this.onChange = this.onChange.bind(this);
        this.onShare = this.onShare.bind(this);
        this.onShareChannel = this.onShareChannel.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onDocumentKeydown = this.onDocumentKeydown.bind(this);
        this.onSaveAll = this.onSaveAll.bind(this);
        this.renderCount = 0;
    }

    connectedCallback() {
        this.grid = this.querySelector('[data-saved-books-grid]');
        this.loadingState = this.querySelector('[data-saved-books-loading]');
        this.emptyState = this.querySelector(sharedList ? '[data-saved-books-shared-empty]' : '[data-saved-books-empty]');
        this.errorState = this.querySelector('[data-saved-books-error]');
        this.actions = this.querySelector('[data-saved-books-actions]');
        this.share = this.querySelector('[data-saved-books-share]');
        this.shareButton = this.share?.querySelector('[data-saved-books-share-trigger] button');
        this.shareMenu = this.share?.querySelector('[data-saved-books-share-menu]');
        this.saveAllButton = this.querySelector('[data-saved-books-save-all] button');
        this.sharedHeading = this.querySelector('[data-saved-books-shared-heading]');

        if (sharedList) {
            this.querySelector('[data-saved-books-own]').hidden = true;
            this.querySelector('[data-saved-books-shared]').hidden = false;
            this.updateSharedHeading(sharedList.ids.length);
            this.saveAllButton?.addEventListener('click', this.onSaveAll);
        } else {
            this.shareButton?.addEventListener('click', this.onShare);
            this.shareMenu?.addEventListener('click', this.onShareChannel);
        }

        document.addEventListener(CHANGE_EVENT, this.onChange);
        this.render();
    }

    disconnectedCallback() {
        document.removeEventListener(CHANGE_EVENT, this.onChange);
        this.shareButton?.removeEventListener('click', this.onShare);
        this.shareMenu?.removeEventListener('click', this.onShareChannel);
        this.closeShareMenu();
        this.saveAllButton?.removeEventListener('click', this.onSaveAll);
    }

    ids() {
        return sharedList ? sharedList.ids : SavedBooks.ids();
    }

    // The books on the page, in order (a shared book that has since been unpublished has no card)
    renderedIds() {
        return [...this.grid.querySelectorAll('save-book-button[product-id]')].map((button) => Number(button.getAttribute('product-id')));
    }

    async render() {
        const ids = this.ids();
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

            if (sharedList) {
                this.updateSharedHeading(cards.length);
                this.updateSaveAll();
                capture('shared_list_viewed', { count: cards.length, has_sender_name: Boolean(sharedList.from) });
            }
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
        if (sharedList) {
            // The shared books stay put; their hearts update themselves
            this.updateSaveAll();
            return;
        }

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

    // "Sarah shared 6 books with you", from the section's text settings
    updateSharedHeading(count) {
        if (!this.sharedHeading) return;

        const template = sharedList.from ? this.sharedHeading.dataset.headingNamed : this.sharedHeading.dataset.headingAnonymous;
        const books = count === 1 ? '1 book' : `${count} books`;
        this.sharedHeading.textContent = template.replace('[name]', sharedList.from).replace('[books]', books);
    }

    updateSaveAll() {
        if (!this.saveAllButton) return;

        const ids = this.renderedIds();
        const allSaved = ids.every((id) => SavedBooks.has(id));
        const wrapper = this.saveAllButton.closest('[data-saved-books-save-all]');
        wrapper.hidden = ids.length === 0;
        this.saveAllButton.disabled = allSaved;
        // The theme's custom-button keeps its label in a wrapper div, next to the loading dots
        const label = this.saveAllButton.getAttribute('is') === 'custom-button' ? this.saveAllButton.firstElementChild : this.saveAllButton;
        label.textContent = allSaved ? wrapper.dataset.labelDone : wrapper.dataset.label;
    }

    onSaveAll() {
        const added = SavedBooks.addAll(this.renderedIds());
        if (added === 0) return;

        capture('shared_list_saved_all', { count: added });
        Toast.show(added === 1 ? 'Saved 1 book' : `Saved ${added} books`, viewSavedBooksLink());
    }

    // "Send my wish list": the phone's share sheet where there is one (it lists WhatsApp, Messages, Mail...), otherwise a
    // short menu of ways to send the link
    async onShare() {
        const ids = this.renderedIds();
        if (ids.length === 0) return;

        if (navigator.share) {
            try {
                await navigator.share({ text: this.share.dataset.shareText || '', url: SharedLink.url(ids, account?.firstName) });
                capture('saved_books_shared', { count: ids.length, method: 'share_sheet' });
            } catch (error) {
                // AbortError: they closed the share sheet without choosing anything
                if (error.name !== 'AbortError') console.warn(error);
            }
            return;
        }

        if (this.shareMenu.hidden) {
            this.openShareMenu(ids);
        } else {
            this.closeShareMenu();
        }
    }

    openShareMenu(ids) {
        const url = SharedLink.url(ids, account?.firstName);
        const text = this.share.dataset.shareText || '';
        const subject = this.share.dataset.shareSubject || '';

        this.shareMenu.querySelector('[data-share-channel="whatsapp"]').href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`.trim())}`;
        this.shareMenu.querySelector('[data-share-channel="email"]').href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n${url}`.trim())}`;
        this.shareMenu.dataset.shareUrl = url;
        this.shareMenu.dataset.shareCount = ids.length;

        this.shareMenu.hidden = false;
        this.shareButton.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onDocumentKeydown);
    }

    closeShareMenu() {
        if (!this.shareMenu || this.shareMenu.hidden) return;

        this.shareMenu.hidden = true;
        this.shareButton?.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onDocumentKeydown);
    }

    onDocumentClick(event) {
        if (!this.share.contains(event.target)) this.closeShareMenu();
    }

    onDocumentKeydown(event) {
        if (event.key !== 'Escape') return;

        this.closeShareMenu();
        this.shareButton.focus();
    }

    async onShareChannel(event) {
        const channel = event.target.closest('[data-share-channel]');
        if (!channel) return;

        const method = channel.dataset.shareChannel;
        const { shareUrl, shareCount } = this.shareMenu.dataset;

        capture('saved_books_shared', { count: Number(shareCount), method });
        this.closeShareMenu();

        // WhatsApp and Email are links that open on their own
        if (method !== 'copy_link') return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            Toast.show('Link copied. Paste it into a message to send your wish list');
        } catch (error) {
            window.prompt('Copy this link to send your wish list', shareUrl);
        }
    }

    showState(state) {
        this.loadingState.hidden = state !== 'loading';
        this.emptyState.hidden = state !== 'empty';
        this.errorState.hidden = state !== 'error';
        this.grid.hidden = state !== 'grid';

        if (this.actions) {
            this.actions.hidden = state !== 'grid';
        }

        if (this.share) {
            this.share.hidden = state !== 'grid'; // nothing to share until the list has books
            if (state !== 'grid') this.closeShareMenu();
        }
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
