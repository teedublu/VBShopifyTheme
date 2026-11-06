// custom-starter-pack.js (sections/custom-starter-pack.liquid)
// Custom Starter Pack: choose a bumper colour (pack variant) and N audiobooks, then add ONE basket line:
// the pack variant with `_pack_books` (book variant IDs) and "Books" (titles). The Mix and Match Packs app splits it at
// checkout into the player and the books. The pure helpers in PackLogic are tested with node (no DOM needed).

const SAVED_KEY = 'voxblock:saved-books'; // product IDs saved with the heart button (assets/saved-books.js)

export const PackLogic = {
    // "Under 5 = under 5, 3-5\n5 to 8 = 5-8" -> [{ label, tags: ['under 5', '3-5'] }, ...]
    parseAgeFilters(text) {
        return String(text || '')
            .split(/\n/)
            .map((line) => line.split('='))
            .filter((parts) => parts.length === 2 && parts[0].trim() && parts[1].trim())
            .map(([label, tags]) => ({
                label: label.trim(),
                tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
            }));
    },

    // A product from products.json -> the book the builder needs (first variant; audiobooks have one)
    toBook(product) {
        const variant = (product.variants || [])[0];
        if (!variant) return null;
        const image = (product.images || [])[0]?.src || null;
        return {
            productId: Number(product.id),
            variantId: Number(variant.id),
            title: product.title,
            handle: product.handle,
            price: Math.round(Number(variant.price) * 100),
            available: variant.available !== false,
            image,
            tags: (product.tags || []).map((t) => String(t).toLowerCase()),
        };
    },

    normalise(text) {
        return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    },

    // query: free text; ageTags: tags of the chosen age chip (or null); savedIds: product IDs (or null = any)
    filterBooks(books, { query = '', ageTags = null, savedIds = null } = {}) {
        const q = this.normalise(query);
        return books.filter((book) => {
            if (savedIds && !savedIds.includes(book.productId)) return false;
            if (ageTags && !ageTags.some((tag) => book.tags.includes(tag))) return false;
            if (!q) return true;
            // Author tags are written without spaces ("RoaldDahl"), so compare without spaces on both sides
            return this.normalise(book.title).includes(q) || book.tags.some((tag) => this.normalise(tag).includes(q));
        });
    },

    // What the pack would cost bought separately (pence), and the saving against the pack price
    worth(playerPrice, chosen, packPrice) {
        const worth = (playerPrice || 0) + chosen.reduce((sum, book) => sum + book.price, 0);
        return { worth, save: Math.max(0, worth - packPrice) };
    },

    lineItem(packVariantId, chosen) {
        return {
            id: Number(packVariantId),
            quantity: 1,
            properties: {
                _pack_books: chosen.map((book) => book.variantId).join(','),
                Books: chosen.map((book) => book.title).join(' · '),
            },
        };
    },

    // ?books=a,b,c or ?book=a -> handles, in order, no repeats
    preselectHandles(search) {
        const params = new URLSearchParams(search || '');
        const raw = [params.get('books'), params.get('book')].filter(Boolean).join(',');
        return [...new Set(raw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean))];
    },

    fill(template, values) {
        return String(template || '').replace(/\[(\w+)\]/g, (match, key) => (key in values ? values[key] : match));
    },
};

function track(event, props) {
    try {
        if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(event, props);
    } catch (e) { /* analytics must never block the builder */ }
}

function readSavedIds() {
    try {
        const ids = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
        return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
    } catch (e) {
        return [];
    }
}

function imageUrl(src, width) {
    if (!src) return '';
    try {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('width', width);
        return url.toString();
    } catch (e) {
        return src;
    }
}

// (A plain class outside the browser, so node can import PackLogic for tests)
const ElementBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

class CustomStarterPack extends ElementBase {
    connectedCallback() {
        if (this._started) return;
        this._started = true;

        this.required = Number(this.dataset.required) || 3;
        this.variants = JSON.parse(this.dataset.variants || '[]');
        this.messages = JSON.parse(this.dataset.messages || '{}');
        this.ageFilters = PackLogic.parseAgeFilters(this.dataset.ageFilters);
        this.money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: this.dataset.currency || 'GBP' });

        this.books = [];
        this.chosen = [];
        this.filter = { query: '', age: null, saved: false };

        this.grid = this.querySelector('[data-pack-grid]');
        this.empty = this.querySelector('[data-pack-empty]');
        this.chips = this.querySelector('[data-pack-chips]');
        this.slots = this.querySelector('[data-pack-slots]');
        this.priceEl = this.querySelector('[data-pack-price]');
        this.worthEl = this.querySelector('[data-pack-worth]');
        this.addButton = this.querySelector('[data-pack-add]');
        this.status = this.querySelector('[data-pack-status]');
        this.announcer = this.querySelector('[data-pack-announce]');

        this.querySelectorAll('[data-pack-colour]').forEach((input) => input.addEventListener('change', () => this.render()));

        let searchTimer;
        this.querySelector('[data-pack-search]')?.addEventListener('input', (event) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                this.filter.query = event.target.value;
                this.renderGrid();
            }, 150);
        });

        this.grid.addEventListener('click', (event) => {
            const button = event.target.closest('[data-book]');
            if (button) this.toggle(Number(button.dataset.book));
        });
        this.slots.addEventListener('click', (event) => {
            const button = event.target.closest('[data-remove]');
            if (button) this.toggle(Number(button.dataset.remove));
            else if (event.target.closest('[data-pick]')) this.goToBooks();
        });
        this.chips.addEventListener('click', (event) => {
            const chip = event.target.closest('[data-chip]');
            if (!chip) return;
            const value = chip.dataset.chip;
            if (value === 'saved') {
                this.filter.saved = !this.filter.saved;
            } else if (value === 'all') {
                this.filter.age = null;
                this.filter.saved = false;
            } else {
                this.filter.age = this.filter.age === value ? null : value;
            }
            this.renderChips();
            this.renderGrid();
        });
        this.addButton.addEventListener('click', () => this.addToCart());

        // A heart tapped here or in another tab: update the Liked count, and the list when it's showing liked books
        const onLikesChanged = () => {
            if (!this.books.length) return;
            this.renderChips();
            if (this.filter.saved) this.renderGrid();
        };
        document.addEventListener('saved-books:change', onLikesChanged);
        window.addEventListener('storage', (event) => { if (event.key === SAVED_KEY) onLikesChanged(); });

        this.load();
    }

    get variant() {
        const checked = this.querySelector('[data-pack-colour]:checked');
        return this.variants.find((v) => String(v.id) === checked?.value) || this.variants[0];
    }

    async load() {
        const root = window.Shopify?.routes?.root || '/';
        try {
            for (let page = 1; page <= 10; page += 1) {
                const response = await fetch(`${root}collections/${encodeURIComponent(this.dataset.collection)}/products.json?limit=250&page=${page}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const { products } = await response.json();
                this.books.push(...products.map((p) => PackLogic.toBook(p)).filter(Boolean));
                if (products.length < 250) break;
            }
        } catch (e) {
            this.grid.innerHTML = '';
            this.grid.removeAttribute('aria-busy');
            this.empty.textContent = this.messages.loadError;
            this.empty.hidden = false;
            track('custom_starter_pack_error', { reason: 'load' });
            return;
        }

        for (const handle of PackLogic.preselectHandles(window.location.search)) {
            const book = this.books.find((b) => b.handle === handle && b.available);
            if (book && this.chosen.length < this.required) this.chosen.push(book);
        }

        this.grid.removeAttribute('aria-busy');
        this.renderChips();
        this.render();
    }

    toggle(variantId) {
        const index = this.chosen.findIndex((b) => b.variantId === variantId);
        const values = { total: this.required };
        if (index >= 0) {
            const [book] = this.chosen.splice(index, 1);
            this.say(PackLogic.fill(this.messages.removed, { ...values, book: book.title, count: this.chosen.length }));
            track('custom_starter_pack_book', { action: 'remove', book: book.handle, count: this.chosen.length });
        } else {
            const book = this.books.find((b) => b.variantId === variantId);
            if (!book || !book.available) return;
            if (this.chosen.length >= this.required) {
                this.say(this.messages.full);
                this.slots.classList.remove('is-nudged');
                void this.slots.offsetWidth; // restart the nudge animation
                this.slots.classList.add('is-nudged');
                return;
            }
            this.chosen.push(book);
            this.say(PackLogic.fill(this.messages.added, { ...values, book: book.title, count: this.chosen.length }));
            track('custom_starter_pack_book', { action: 'add', book: book.handle, count: this.chosen.length });
        }
        this.render();
    }

    // Book added/removed and "pack full": for screen readers only, so the summary never changes height.
    // Choosing again also clears a basket error.
    say(text) {
        if (this.announcer) this.announcer.textContent = text || '';
        this.showError('');
    }

    // Shown on screen: only when the pack couldn't go in the basket.
    showError(text) {
        this.status.textContent = text || '';
    }

    render() {
        this.renderGrid();
        this.renderSlots();
        this.renderSummary();
    }

    renderChips() {
        const saved = readSavedIds();
        const savedEligible = this.books.filter((b) => saved.includes(b.productId)).length;
        const chips = [{ value: 'all', label: 'All', pressed: !this.filter.age && !this.filter.saved }];
        // Liked = books hearted with the site's save button. Always offered, so people learn they can like books and
        // find them here; the count is how many liked books can go in the pack.
        chips.push({ value: 'saved', label: `${this.messages.liked || 'Liked'}${savedEligible ? ` (${savedEligible})` : ''}`, pressed: this.filter.saved, liked: true });
        for (const age of this.ageFilters) chips.push({ value: age.label, label: age.label, pressed: this.filter.age === age.label });

        this.chips.replaceChildren(...chips.map((chip) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `custom-starter-pack__chip${chip.liked ? ' custom-starter-pack__chip--liked' : ''}`;
            button.dataset.chip = chip.value;
            button.setAttribute('aria-pressed', String(chip.pressed));
            if (chip.liked) button.append(this.heartIcon());
            button.append(document.createTextNode(chip.label));
            return button;
        }));
    }

    heartIcon() {
        const template = this.querySelector('[data-pack-heart]');
        const svg = template?.content.firstElementChild?.cloneNode(true);
        if (svg) {
            svg.setAttribute('aria-hidden', 'true');
            return svg;
        }
        const span = document.createElement('span');
        span.textContent = '♥';
        span.setAttribute('aria-hidden', 'true');
        return span;
    }

    // The site's own heart (assets/saved-books.js defines <save-book-button>), so liking here is the same as anywhere
    heartButton(book) {
        const wrapper = document.createElement('save-book-button');
        wrapper.className = 'save-book save-book--overlay custom-starter-pack__heart';
        wrapper.setAttribute('product-id', String(book.productId));
        wrapper.setAttribute('product-title', book.title);
        wrapper.setAttribute('product-type', 'Audiobooks');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'save-book__button tap-area';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', PackLogic.fill(this.messages.save, { book: book.title }));
        button.append(this.heartIcon());
        wrapper.append(button);
        return wrapper;
    }

    renderGrid() {
        if (!this.books.length) return;
        const age = this.ageFilters.find((a) => a.label === this.filter.age);
        const visible = PackLogic.filterBooks(this.books, {
            query: this.filter.query,
            ageTags: age ? age.tags : null,
            savedIds: this.filter.saved ? readSavedIds() : null,
        });
        const chosenIds = this.chosen.map((b) => b.variantId);
        const full = this.chosen.length >= this.required;
        const root = window.Shopify?.routes?.root || '/';

        this.grid.replaceChildren(...visible.map((book) => {
            const picked = chosenIds.includes(book.variantId);
            const li = document.createElement('li');
            li.className = `custom-starter-pack__book${picked ? ' is-chosen' : ''}${!book.available ? ' is-sold-out' : ''}${full && !picked ? ' is-dimmed' : ''}`;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'custom-starter-pack__book-button';
            button.dataset.book = book.variantId;
            button.setAttribute('aria-pressed', String(picked));
            button.disabled = !book.available;

            if (book.image) {
                const img = document.createElement('img');
                img.src = imageUrl(book.image, 300);
                img.alt = '';
                img.loading = 'lazy';
                img.width = 300;
                img.height = 300;
                img.className = 'custom-starter-pack__cover';
                button.append(img);
            }
            const title = document.createElement('span');
            title.className = 'custom-starter-pack__book-title';
            title.textContent = book.title;
            const action = document.createElement('span');
            action.className = 'custom-starter-pack__book-action';
            action.textContent = !book.available ? this.messages.soldOut : picked ? this.messages.addedBook : this.messages.addBook;
            button.append(title, action);

            const link = document.createElement('a');
            link.className = 'custom-starter-pack__book-link';
            link.href = `${root}products/${book.handle}`;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = this.messages.details;
            link.setAttribute('aria-label', `${this.messages.details}: ${book.title} (opens in a new tab)`);

            li.append(button, this.heartButton(book), link);
            return li;
        }));

        const nothingLiked = this.filter.saved && !this.books.some((b) => readSavedIds().includes(b.productId));
        this.empty.textContent = nothingLiked ? this.messages.likedEmpty : this.messages.noResults;
        this.empty.hidden = visible.length > 0;
    }

    // The pack as pictures: the player in the chosen colour, then one cover per book. Titles show on hover (title)
    // and are the covers' alt text; an empty slot is a "+ Book 2" tile that takes you to the book list.
    renderSlots() {
        const cover = (src, alt, width) => {
            const img = document.createElement('img');
            img.src = imageUrl(src, width);
            img.alt = alt;
            img.className = 'custom-starter-pack__slot-cover';
            return img;
        };
        const items = [];

        const variant = this.variant;
        const player = document.createElement('li');
        player.className = 'custom-starter-pack__slot custom-starter-pack__slot--player';
        if (variant) {
            const label = PackLogic.fill(this.messages.player, { colour: variant.title });
            player.title = label;
            if (variant.playerImage) player.append(cover(variant.playerImage, label, 240));
        }
        items.push(player);

        for (let i = 0; i < this.required; i += 1) {
            const li = document.createElement('li');
            li.className = 'custom-starter-pack__slot';
            const book = this.chosen[i];
            if (book) {
                li.classList.add('is-filled');
                li.title = book.title;
                if (book.image) {
                    li.append(cover(book.image, book.title, 240));
                } else {
                    const name = document.createElement('span');
                    name.className = 'custom-starter-pack__slot-name';
                    name.textContent = book.title;
                    li.append(name);
                }
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'custom-starter-pack__slot-remove';
                remove.dataset.remove = book.variantId;
                remove.setAttribute('aria-label', PackLogic.fill(this.messages.remove, { book: book.title }));
                remove.innerHTML = '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                li.append(remove);
            } else {
                li.classList.add('is-empty');
                const pick = document.createElement('button');
                pick.type = 'button';
                pick.className = 'custom-starter-pack__slot-pick';
                pick.dataset.pick = '';
                pick.setAttribute('aria-label', PackLogic.fill(this.messages.pickSlot, { n: i + 1 }));
                pick.innerHTML = '<span class="custom-starter-pack__slot-plus" aria-hidden="true">+</span>';
                pick.append(PackLogic.fill(this.messages.slot, { n: i + 1 }));
                li.append(pick);
            }
            items.push(li);
        }
        this.slots.replaceChildren(...items);
    }

    // An empty slot takes you to the books (and the search box, so typing starts a search)
    goToBooks() {
        const books = this.querySelector('.custom-starter-pack__books');
        books?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        this.querySelector('[data-pack-search]')?.focus({ preventScroll: true });
    }

    renderSummary() {
        const variant = this.variant;
        if (!variant) return;
        this.priceEl.textContent = this.money.format(variant.price / 100);

        const { worth, save } = PackLogic.worth(variant.playerPrice, this.chosen, variant.price);
        const complete = this.chosen.length === this.required;
        this.worthEl.hidden = !(complete && save > 0);
        this.worthEl.textContent = PackLogic.fill(this.messages.worth, {
            worth: this.money.format(worth / 100),
            save: this.money.format(save / 100),
        });

        const left = this.required - this.chosen.length;
        this.addButton.disabled = !complete || !variant.available || this._adding;
        this.addButton.textContent = this._adding
            ? this.messages.adding
            : complete
                ? this.messages.add
                : left === 1 ? this.messages.chooseOneMore : PackLogic.fill(this.messages.chooseMore, { n: left });
    }

    async addToCart() {
        const variant = this.variant;
        if (this._adding || !variant || this.chosen.length !== this.required) return;
        this._adding = true;
        this.renderSummary();

        const root = window.Shopify?.routes?.root || '/';
        // Ask the cart drawer (and anything else listening) which sections to send back, as the theme's own form does
        const sections = [];
        document.documentElement.dispatchEvent(new CustomEvent('cart:prepare-bundled-sections', { bubbles: true, detail: { sections } }));

        try {
            const response = await fetch(`${root}cart/add.js`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({
                    items: [PackLogic.lineItem(variant.id, this.chosen)],
                    sections: sections.join(','),
                    sections_url: window.location.pathname,
                }),
            });
            const body = await response.json();
            if (!response.ok) throw Object.assign(new Error(body.description || 'add failed'), { status: response.status });

            const { worth } = PackLogic.worth(variant.playerPrice, this.chosen, variant.price);
            track('custom_starter_pack_add', { colour: variant.title, books: this.chosen.map((b) => b.handle), worth: worth / 100, price: variant.price / 100 });

            if (window.themeVariables?.settings?.cartType === 'page') {
                window.location.href = `${root}cart`;
                return;
            }
            const cart = await (await fetch(`${root}cart.js`)).json();
            cart.sections = body.sections;
            this.dispatchEvent(new CustomEvent('variant:add', { bubbles: true, detail: { items: body.items || [body], cart } }));
            document.documentElement.dispatchEvent(new CustomEvent('cart:change', { bubbles: true, detail: { baseEvent: 'variant:add', cart } }));
            this.showError('');
        } catch (e) {
            this.showError(this.messages.cartError);
            track('custom_starter_pack_error', { reason: 'add', status: e.status || null, message: String(e.message || '').slice(0, 120) });
            document.dispatchEvent(new CustomEvent('cart:refresh'));
        } finally {
            this._adding = false;
            this.renderSummary();
        }
    }
}

if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('custom-starter-pack')) {
    window.customElements.define('custom-starter-pack', CustomStarterPack);
}
