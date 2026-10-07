// back-in-stock.js
// "Email me when it's back": the sheet that opens from the "More coming soon" pill on sold-out product cards and from
// the sold-out product page. It asks Klaviyo's Back in Stock API to email the visitor when the product is available
// again (one request per variant, so any colour of a starter pack will do), remembers the request on this device so the
// pill can say "We'll email you", and saves audiobooks to the visitor's Saved books (see saved-books.js). A checkbox
// (ticked by default, see snippets/back-in-stock.liquid) also signs the visitor up to the Klaviyo marketing list.
// Markup: snippets/back-in-stock.liquid (the sheet) and snippets/coming-soon-pill.liquid (the trigger).

const dialog = document.getElementById('stock-alert-dialog');

const STORAGE_KEY = 'voxblock:stock-alerts'; // { [productId]: ISO date of the request } for this device
const EMAIL_KEY = 'voxblock:stock-alert-email'; // so a returning visitor doesn't retype their email
const API_URL = 'https://a.klaviyo.com/client/back-in-stock-subscriptions/';
const SUBSCRIBE_URL = 'https://a.klaviyo.com/client/subscriptions/';
const API_REVISION = '2025-07-15';

const storage = {
    read(key) {
        try { return window.localStorage.getItem(key); } catch (error) { return null; }
    },
    write(key, value) {
        try { window.localStorage.setItem(key, value); } catch (error) { /* private mode: the alert still goes to Klaviyo */ }
    },
};

const readAlerts = () => {
    try { return JSON.parse(storage.read(STORAGE_KEY) || '{}') || {}; } catch (error) { return {}; }
};

// PostHog, like the saved books events
const capture = (eventName, properties = {}) => {
    if (typeof window.posthog === 'undefined' || typeof window.posthog.capture !== 'function') return;
    window.posthog.capture(eventName, { page_type: window.themeVariables?.settings?.pageType || null, ...properties });
};

if (dialog) {
    const form = dialog.querySelector('[data-bis-form]');
    const emailInput = form.querySelector('input[type="email"]');
    const honeypot = form.querySelector('[data-bis-hp]');
    const errorMessage = dialog.querySelector('[data-bis-error]');
    const marketingInput = form.querySelector('input[type="checkbox"]');
    const marketingDefault = dialog.dataset.marketingDefault === 'true';
    const submitButton = form.querySelector('button[type="submit"]');
    const formState = dialog.querySelector('[data-bis-state="form"]');
    const doneState = dialog.querySelector('[data-bis-state="done"]');
    const imageSlot = dialog.querySelector('[data-bis-image-slot]');
    const titleElement = dialog.querySelector('[data-bis-title]');
    const doneTitle = dialog.querySelector('[data-bis-done-title]');
    const doneBody = dialog.querySelector('[data-bis-done-body]');

    let current = null; // the product the sheet is open for

    // --- the pills -----------------------------------------------------------------------------------------------

    // Pills whose product already has an alert on this device say so. Only writes when something changes, so the
    // MutationObserver below can't loop.
    const markPills = () => {
        const alerts = readAlerts();

        document.querySelectorAll('[data-bis-trigger]').forEach((button) => {
            const isSet = Boolean(alerts[button.dataset.productId]);
            const label = button.querySelector('[data-bis-label]');
            const wanted = isSet ? button.dataset.labelSet : button.dataset.label;

            if (button.classList.contains('is-set') !== isSet) button.classList.toggle('is-set', isSet);
            if (button.getAttribute('aria-pressed') !== String(isSet)) button.setAttribute('aria-pressed', String(isSet));
            if (label && label.textContent !== wanted) label.textContent = wanted;
        });
    };

    let markTimer;
    const scheduleMark = () => {
        window.clearTimeout(markTimer);
        markTimer = window.setTimeout(markPills, 80);
    };

    markPills();
    // Cards arrive later too (filters, "load more", the Saved books page), so look again whenever the page changes
    new MutationObserver(scheduleMark).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) markPills(); });

    // --- the sheet -----------------------------------------------------------------------------------------------

    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.hidden = false;
    };

    const clearError = () => {
        errorMessage.textContent = '';
        errorMessage.hidden = true;
    };

    // The theme's button (custom-button) shows its loader while aria-busy is "true" and sets it itself on click, so every
    // way out of the submit handler has to put it back
    const setBusy = (busy) => {
        submitButton.setAttribute('aria-busy', String(busy));
        submitButton.disabled = busy;
    };

    const showDone = (email) => {
        formState.hidden = true;
        doneState.hidden = false;
        doneBody.textContent = dialog.dataset.textSuccessBody.replace('[email]', email || 'you');
        doneTitle.focus();
    };

    const open = (button) => {
        current = {
            productId: button.dataset.productId,
            title: button.dataset.productTitle || '',
            variantIds: (button.dataset.variants || '').split(',').filter(Boolean),
            saveable: button.dataset.saveable === 'true',
        };

        titleElement.textContent = current.title;
        imageSlot.replaceChildren();
        if (button.dataset.image) {
            const picture = document.createElement('img');
            picture.className = 'stock-alert__image';
            picture.src = button.dataset.image;
            picture.alt = '';
            picture.width = 56;
            picture.height = 56;
            imageSlot.append(picture);
        }

        const rememberedEmail = dialog.dataset.customerEmail || storage.read(EMAIL_KEY) || '';

        clearError();
        setBusy(false);
        formState.hidden = false;
        doneState.hidden = true;
        emailInput.value = rememberedEmail;
        marketingInput.checked = marketingDefault;

        dialog.showModal();

        if (readAlerts()[current.productId]) {
            showDone(rememberedEmail);
        } else if (rememberedEmail) {
            submitButton.focus();
        } else {
            emailInput.focus();
        }
    };

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-bis-trigger]');
        if (!button) return;

        event.preventDefault();
        open(button);
    });

    // Tap outside the sheet to close it
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) dialog.close();
    });

    doneState.querySelector('button').addEventListener('click', () => dialog.close());

    // --- sending the request -------------------------------------------------------------------------------------

    // Klaviyo's client endpoint: one request per variant. 202 means accepted.
    const subscribe = async (email, variantId) => {
        const response = await fetch(`${API_URL}?company_id=${encodeURIComponent(dialog.dataset.companyId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', revision: API_REVISION },
            body: JSON.stringify({
                data: {
                    type: 'back-in-stock-subscription',
                    attributes: {
                        profile: { data: { type: 'profile', attributes: { email } } },
                        channels: ['EMAIL'],
                    },
                    relationships: {
                        variant: { data: { type: 'catalog-variant', id: `$shopify:::$default:::${variantId}` } },
                    },
                },
            }),
        });

        if (response.status !== 202) throw new Error(`Klaviyo answered ${response.status}`);
    };

    // The marketing opt-in: subscribes the email to the Klaviyo list. Best effort, so the back in stock alert never
    // fails because of it.
    const subscribeToMarketing = async (email) => {
        const listId = dialog.dataset.marketingListId;
        if (!listId) return false;

        try {
            const response = await fetch(`${SUBSCRIBE_URL}?company_id=${encodeURIComponent(dialog.dataset.companyId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', revision: API_REVISION },
                body: JSON.stringify({
                    data: {
                        type: 'subscription',
                        attributes: {
                            custom_source: 'Back in stock alert',
                            profile: { data: { type: 'profile', attributes: { email } } },
                        },
                        relationships: { list: { data: { type: 'list', id: listId } } },
                    },
                }),
            });
            return response.status === 202;
        } catch (error) {
            return false;
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!current) return;

        // Bots fill in the hidden field; pretend it worked and send nothing
        if (honeypot.value) {
            setBusy(false);
            showDone(emailInput.value);
            return;
        }

        const email = emailInput.value.trim();
        if (!email || !emailInput.checkValidity()) {
            setBusy(false);
            showError(dialog.dataset.textInvalid);
            emailInput.focus();
            return;
        }

        clearError();
        setBusy(true);

        const wantsMarketing = marketingInput.checked;
        const results = await Promise.allSettled(current.variantIds.map((variantId) => subscribe(email, variantId)));
        const succeeded = results.filter((result) => result.status === 'fulfilled').length;

        setBusy(false);

        // If at least one colour was accepted the visitor is on the list; only a total failure is an error
        if (succeeded === 0) {
            showError(dialog.dataset.textError);
            return;
        }

        const alerts = readAlerts();
        alerts[current.productId] = new Date().toISOString();
        storage.write(STORAGE_KEY, JSON.stringify(alerts));
        storage.write(EMAIL_KEY, email);
        markPills();

        // Only once the alert has gone through, so a failed alert doesn't leave a half-finished sign-up behind
        if (wantsMarketing) subscribeToMarketing(email);

        // Waiting for a book is a kind of saving it: it joins the Saved books list too (saved-books.js listens for this)
        if (current.saveable) {
            document.dispatchEvent(new CustomEvent('voxblock:save-book', { detail: { id: current.productId } }));
        }

        capture('stock_alert_requested', {
            product_id: current.productId,
            title: current.title,
            variants: current.variantIds.length,
            signed_in: Boolean(dialog.dataset.customerEmail),
            saved_book: current.saveable,
            marketing_opt_in: wantsMarketing,
        });

        showDone(email);
    });
}
