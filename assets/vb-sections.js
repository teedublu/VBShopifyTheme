/*
 * Help me choose (sections/vb-help-me-choose.liquid), the links that open it, and click tracking for the
 * visitor-targeting sections. Uses window.VBProfile (assets/vb-profile.js) when visitor targeting is on.
 */
(function () {
  'use strict';

  var HASH = 'help-me-choose';

  function vbProfile() {
    return window.VBProfile || null;
  }

  function capture(event, properties) {
    var profile = vbProfile();
    if (profile) profile.capture(event, properties);
  }

  function toBand(value) {
    var profile = vbProfile();
    if (profile) return profile.toBand(value);
    return ['u5', '5-8', '8-10', '10+'].indexOf(value) !== -1 ? value : null;
  }

  class HelpMeChoose extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;

      this.dialog = this.querySelector('dialog');
      this.body = this.querySelector('[data-hmc-body]');
      this.footer = this.querySelector('[data-hmc-footer]');
      this.nextButton = this.querySelector('[data-hmc-next]');
      this.answers = { band: null, choice: null, gift: null };
      this.step = 'age';

      try {
        this.config = JSON.parse(this.querySelector('[data-hmc-config]').textContent);
      } catch (e) {
        this.config = { bands: {}, choices: {}, gifts: {}, text: {} };
      }

      this.addEventListener('change', this.onChange.bind(this));
      this.addEventListener('click', this.onClick.bind(this));
      this.addEventListener('submit', this.onSubmit.bind(this));
      this.addEventListener('variant:add', this.onAdded.bind(this));
      this.addEventListener('cart:error', this.onCartError.bind(this));

      this.dialog.addEventListener('close', this.onClosed.bind(this));
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog) this.close(); // backdrop
      });

      window.addEventListener('popstate', () => {
        if (!this.dialog.open) return;
        this.poppedState = true;
        this.dialog.close();
      });
      window.addEventListener('hashchange', () => this.openFromHash());

      if (window.Shopify && window.Shopify.designMode) {
        document.addEventListener('shopify:section:select', (event) => {
          if (event.detail.sectionId === this.dataset.sectionId) this.open({ source: 'editor' });
        });
        document.addEventListener('shopify:section:deselect', (event) => {
          if (event.detail.sectionId === this.dataset.sectionId) this.close();
        });
        this.addEventListener('shopify:block:select', (event) => this.showBlock(event.target));
      }

      this.openFromHash();
    }

    get text() {
      return this.config.text || {};
    }

    /* Opening and closing ------------------------------------------------------------------------------------------ */

    openFromHash() {
      var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
      if (hash.split('=')[0] !== HASH) return;

      // Drop the hash so closing and sharing the page behave normally
      history.replaceState(history.state, '', location.pathname + location.search);
      this.open({ source: 'link', band: hash.split('=')[1] || null });
    }

    isHidden() {
      for (var element = this; element; element = element.parentElement) {
        if (getComputedStyle(element).display === 'none') return true;
      }
      return false;
    }

    open(options) {
      options = options || {};
      // A modal inside a hidden section (e.g. the experiment control group) would trap focus with nothing on screen
      if (this.dialog.open || this.isHidden()) return;

      var band = toBand(options.band);
      this.reset(band);
      this.dialog.showModal();
      document.documentElement.classList.add('vb-hmc-lock');

      if (!(window.Shopify && window.Shopify.designMode)) {
        history.pushState({ vbHmc: true }, '');
        this.pushedState = true;
      }

      capture('help_me_choose_opened', { source: options.source || 'button', band: band });
      var profile = vbProfile();
      if (profile) {
        profile.prospectSignal('quiz');
        if (band && options.source === 'link') profile.declareAge(band, 'link');
      }
    }

    close() {
      if (this.dialog.open) this.dialog.close();
    }

    onClosed() {
      document.documentElement.classList.remove('vb-hmc-lock');

      if (this.pushedState && !this.poppedState && history.state && history.state.vbHmc) history.back();
      this.pushedState = false;
      this.poppedState = false;

      capture('help_me_choose_closed', { step: this.step });

      if (this.scrollTarget) {
        var target = this.scrollTarget;
        this.scrollTarget = null;
        setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
      }
    }

    reset(band) {
      this.answers = { band: null, choice: null, gift: null };
      this.clearResult();

      this.querySelectorAll('input[type="radio"]').forEach(function (input) { input.checked = false; });
      this.querySelectorAll('.is-selected').forEach(function (label) { label.classList.remove('is-selected'); });

      // Pre-select the age we already know, but still ask
      var profile = vbProfile();
      var known = band || (profile && profile.state().bands[0]) || null;
      if (known) this.check('age', known);

      if (band) {
        this.answers.band = band;
        this.go(this.hasFavourites(band) ? 'favourite' : 'gift');
      } else {
        this.go('age');
      }
    }

    /* Steps -------------------------------------------------------------------------------------------------------- */

    hasFavourites(band) {
      var choices = this.config.choices || {};
      return Object.keys(choices).some(function (id) {
        return choices[id].band === band && choices[id].kind === 'favourite';
      });
    }

    questions() {
      var steps = ['age'];
      if (!this.answers.band || this.hasFavourites(this.answers.band)) steps.push('favourite');
      steps.push('gift');
      return steps;
    }

    group(step) {
      if (step === 'favourite') return this.querySelector('.vb-hmc__tiles[data-band="' + this.answers.band + '"]');
      return this.querySelector('[data-step="' + step + '"] fieldset');
    }

    check(step, value) {
      var group = this.group(step);
      if (!group) return;
      group.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.checked = input.value === value;
      });
      this.syncSelection(group);
    }

    checkedValue(step) {
      var group = this.group(step);
      var input = group && group.querySelector('input[type="radio"]:checked');
      return input ? input.value : null;
    }

    syncSelection(group) {
      group.querySelectorAll('input[type="radio"]').forEach(function (input) {
        var label = input.closest('label');
        if (label) label.classList.toggle('is-selected', input.checked);
      });
    }

    go(step) {
      var questions = this.questions();
      var index = questions.indexOf(step);
      var isResult = step === 'result';
      var text = this.text;

      this.step = step;
      this.querySelectorAll('[data-step]').forEach(function (section) {
        section.hidden = section.getAttribute('data-step') !== step;
      });

      if (step === 'favourite') {
        var band = this.answers.band;
        var audience = (this.config.bands[band] || {}).audience || '';
        this.querySelectorAll('.vb-hmc__tiles').forEach(function (tiles) {
          tiles.hidden = tiles.getAttribute('data-band') !== band;
        });
        this.querySelector('[data-hmc-favourite-text]').textContent = (text.favourite || '').replace('[audience]', audience);
      }

      this.querySelector('[data-hmc-close]').hidden = step !== 'age';
      this.querySelector('[data-hmc-back]').hidden = step === 'age';
      this.querySelector('[data-hmc-close-end]').hidden = !isResult;
      this.querySelector('[data-hmc-title]').textContent = isResult ? text.result_title : text.title;

      var count = this.querySelector('[data-hmc-count]');
      count.hidden = isResult;
      count.textContent = isResult ? '' : (text.count || '').replace('[step]', index + 1).replace('[total]', questions.length);

      var progress = this.querySelector('[data-hmc-progress]');
      progress.hidden = isResult;
      progress.style.gridTemplateColumns = 'repeat(' + questions.length + ', 1fr)';
      Array.prototype.forEach.call(progress.children, function (bar, position) {
        bar.hidden = position >= questions.length;
        bar.classList.toggle('is-done', position <= index);
      });

      this.footer.hidden = isResult;
      this.nextButton.textContent = step === 'gift' ? text.finish : text.continue;
      this.updateNext();

      this.body.scrollTop = 0;
      var current = this.querySelector('[data-step="' + step + '"]');
      if (current && this.dialog.open) current.focus({ preventScroll: true });
    }

    updateNext() {
      this.nextButton.disabled = this.step === 'result' || !this.checkedValue(this.step);
    }

    next() {
      if (this.step === 'age') {
        var band = this.checkedValue('age');
        if (!band) return;
        if (band !== this.answers.band) this.answers.choice = null;
        this.answers.band = band;

        var profile = vbProfile();
        if (profile) profile.declareAge(band, 'help_me_choose');
        capture('help_me_choose_step', { step: 'age', value: band });

        this.go(this.hasFavourites(band) ? 'favourite' : 'gift');
      } else if (this.step === 'favourite') {
        var choice = this.checkedValue('favourite');
        if (!choice) return;
        this.answers.choice = choice;

        var picked = (this.config.choices || {})[choice];
        capture('help_me_choose_step', { step: 'favourite', value: choice === 'mix' ? 'mix' : (picked ? picked.product : choice) });
        this.go('gift');
      } else if (this.step === 'gift') {
        var gift = this.checkedValue('gift');
        if (!gift) return;
        this.answers.gift = gift;

        capture('help_me_choose_step', { step: 'gift', value: gift });
        this.showResult();
      }
    }

    back() {
      if (this.step === 'result') this.go('gift');
      else if (this.step === 'gift') this.go(this.hasFavourites(this.answers.band) ? 'favourite' : 'age');
      else if (this.step === 'favourite') this.go('age');
    }

    /* Result ------------------------------------------------------------------------------------------------------- */

    resolveChoice() {
      var choices = this.config.choices || {};
      var band = this.answers.band;

      if (this.answers.choice && this.answers.choice !== 'mix' && choices[this.answers.choice]) return this.answers.choice;

      var ids = Object.keys(choices).filter(function (id) { return choices[id].band === band; });
      return ids.filter(function (id) { return choices[id].kind === 'mix'; })[0]
        || ids.filter(function (id) { return choices[id].kind === 'favourite'; })[0]
        || null;
    }

    giftFor(band) {
      var gifts = this.config.gifts || {};
      return Object.keys(gifts).filter(function (id) { return gifts[id].band === band; })[0] || null;
    }

    clone(selector) {
      var template = this.querySelector('template' + selector);
      return template ? document.importNode(template.content, true) : null;
    }

    slot(name) {
      return this.querySelector('[data-hmc-slot="' + name + '"]');
    }

    boxed(title, content, titleOutside) {
      var wrapper = document.createElement('div');
      var box = document.createElement('div');
      var heading = document.createElement('p');

      box.className = 'vb-hmc-box';
      heading.className = titleOutside ? 'vb-hmc__also-title' : 'vb-hmc-box__title';
      heading.textContent = title;

      if (titleOutside) wrapper.appendChild(heading);
      else box.appendChild(heading);
      box.appendChild(content);
      wrapper.appendChild(box);
      return wrapper;
    }

    clearResult() {
      ['match', 'gift', 'smaller', 'also'].forEach((name) => {
        var slot = this.slot(name);
        if (slot) slot.replaceChildren();
      });
      var result = this.querySelector('[data-step="result"]');
      if (result) result.classList.remove('vb-hmc__result--gift');
    }

    showResult() {
      var text = this.text;
      var band = this.answers.band;
      var choiceId = this.resolveChoice();
      var choice = choiceId ? this.config.choices[choiceId] : null;
      var isGift = this.answers.gift === 'gift';
      var isMix = !this.answers.choice || this.answers.choice === 'mix';
      var result = this.querySelector('[data-step="result"]');
      var giftProduct = null;

      this.clearResult();

      var chip = [
        (this.config.bands[band] || {}).title,
        isMix ? text.chip_mix : (choice && choice.chip),
        isGift ? text.chip_gift : text.chip_family
      ].filter(Boolean).join(' · ');

      this.querySelector('[data-hmc-chip]').textContent = chip;
      this.querySelector('[data-hmc-headline]').textContent = (choice && choice.headline) || (isGift ? text.headline_gift : text.headline_family);
      this.slot('fallback').hidden = !!choice;

      if (choice) {
        var card = this.clone('[data-hmc-card="' + choiceId + '"]');
        if (card) this.slot('match').appendChild(card);

        var giftId = isGift ? this.giftFor(band) : null;
        if (giftId && this.config.gifts[giftId].product !== choice.product) {
          var gift = this.clone('[data-hmc-gift="' + giftId + '"]');
          if (gift) {
            this.slot('gift').appendChild(gift);
            result.classList.add('vb-hmc__result--gift');
            giftProduct = this.config.gifts[giftId].product;
          }
        }

        var smaller = choice.smaller && this.clone('[data-hmc-row="' + CSS.escape(choice.smaller) + '"]');
        if (smaller) this.slot('smaller').appendChild(this.boxed(text.smaller_title, smaller, false));

        var also = choice.also && this.clone('[data-hmc-row="' + CSS.escape(choice.also) + '"]');
        if (also) this.slot('also').appendChild(this.boxed(text.also_title, also, true));
      }

      this.go('result');

      capture('help_me_choose_result', {
        band: band,
        favourite: isMix ? 'mix' : (choice ? choice.product : null),
        gift: isGift,
        product: choice ? choice.product : null,
        smaller: choice ? choice.smaller : null,
        also: choice ? choice.also : null,
        gift_upsell: giftProduct
      });
    }

    /* Events ------------------------------------------------------------------------------------------------------- */

    onChange(event) {
      var input = event.target;

      if (input.closest('.vb-hmc-swatch')) {
        this.onColour(input);
        return;
      }

      if (input.type !== 'radio') return;
      var group = input.closest('fieldset');
      if (group) this.syncSelection(group);
      this.updateNext();
    }

    onColour(input) {
      var card = input.closest('.vb-hmc-card');
      if (!card) return;

      var idInput = card.querySelector('form input[name="id"]');
      if (idInput) idInput.value = input.value;

      var name = card.querySelector('[data-hmc-colour-name]');
      if (name) name.textContent = input.getAttribute('data-colour-name');

      var image = input.getAttribute('data-image');
      var img = card.querySelector('.vb-hmc-card__image');
      if (image && img) {
        img.removeAttribute('srcset');
        img.src = image;
      }
    }

    onClick(event) {
      var target = event.target.closest('[data-hmc-next], [data-hmc-back], [data-hmc-close], [data-hmc-close-end], [data-hmc-all], [data-hmc-product]');
      if (!target) return;

      if (target.hasAttribute('data-hmc-next')) {
        this.next();
      } else if (target.hasAttribute('data-hmc-back')) {
        this.back();
      } else if (target.hasAttribute('data-hmc-close') || target.hasAttribute('data-hmc-close-end')) {
        this.close();
      } else if (target.hasAttribute('data-hmc-all')) {
        this.showAll(event, target);
      } else {
        var slot = target.closest('[data-hmc-slot]');
        capture('help_me_choose_product_click', {
          product: target.getAttribute('data-hmc-product'),
          role: target.getAttribute('data-hmc-role') || (slot ? slot.getAttribute('data-hmc-slot') : null)
        });
      }
    }

    showAll(event, link) {
      capture('help_me_choose_all_packs', { step: this.step, band: this.answers.band });

      var url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname) return;

      // Already on the packs page: close and scroll to the grid
      event.preventDefault();
      this.scrollTarget = document.querySelector('.collection') || document.querySelector('product-list');
      this.close();
    }

    onSubmit(event) {
      var form = event.target;
      if (!form.matches('form[data-hmc-role]')) return;

      var owner = form.closest('[data-hmc-card-product]');
      var error = form.parentElement.querySelector('.vb-hmc-card__error');
      if (error) error.hidden = true;

      capture('help_me_choose_add_to_basket', {
        role: form.getAttribute('data-hmc-role'),
        product: owner ? owner.getAttribute('data-hmc-card-product') : null,
        variant: form.querySelector('input[name="id"]') ? Number(form.querySelector('input[name="id"]').value) : null,
        band: this.answers.band,
        gift: this.answers.gift === 'gift'
      });
    }

    onAdded() {
      // Close first so the cart drawer, which opens on the same event, isn't stuck behind the dialog
      this.close();
    }

    onCartError(event) {
      var form = event.target.closest ? event.target.closest('form') : null;
      var error = form && form.parentElement.querySelector('.vb-hmc-card__error');
      if (!error) return;
      error.textContent = (event.detail && event.detail.error) || '';
      error.hidden = !error.textContent;
    }

    showBlock(element) {
      var input = element.querySelector && element.querySelector('input[type="radio"]');
      var tiles = element.closest && element.closest('.vb-hmc__tiles');
      if (!input || !tiles) return;

      var band = tiles.getAttribute('data-band');
      if (!this.dialog.open) this.open({ source: 'editor', band: band });
      else {
        this.answers.band = band;
        this.go('favourite');
      }
      this.check('favourite', input.value);
      this.updateNext();
    }
  }

  if (!window.customElements.get('vb-help-me-choose')) {
    window.customElements.define('vb-help-me-choose', HelpMeChoose);
  }

  // Grid card, strip and any other [data-vb-hmc-open] link. Without Help me choose on the page, the link is followed.
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-vb-hmc-open]');
    if (!trigger) return;

    var quiz = document.querySelector('vb-help-me-choose');
    if (!quiz || typeof quiz.open !== 'function' || quiz.isHidden()) return;

    event.preventDefault();
    quiz.open({ source: trigger.getAttribute('data-vb-hmc-open') || 'button', band: trigger.getAttribute('data-band') });
  });

  // Clicks on links in the visitor-targeting sections
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-vb-track]');
    if (!link) return;
    capture(link.getAttribute('data-vb-track'), {
      href: link.getAttribute('href'),
      label: link.getAttribute('data-vb-track-label') || null
    });
  });
})();
