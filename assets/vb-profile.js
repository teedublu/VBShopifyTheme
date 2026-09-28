/*
 * Voxblock visitor profile ("vb_profile")
 * ----------------------------------------------------------------------------------------------------------------------
 * Works out, from signals the site already has, whether a visitor is a player prospect, a player owner or unknown,
 * and which age band they shop for. Then:
 *   - sets <html data-vb-mode / data-vb-arm / data-vb-age>, which personalised sections read (see vb-targeting.css)
 *   - records vb_* person properties in PostHog
 *   - opens the Klaviyo exit form for prospects, and the 15% welcome pop-ups for the experiment control group
 *   - forwards Klaviyo form events to PostHog
 *
 * Spec: "Player prospects — find them, answer their objection, convert or capture" (28 Sep 2026).
 * Page context and settings come from snippets/vb-targeting.liquid. Weights are provisional: tune WEIGHTS below.
 * Other scripts use window.VBProfile and the "vb:profile" event on document.
 */
(function () {
  'use strict';

  if (window.VBProfile) return;

  var KEY = 'vb_profile';
  var DAY = 864e5;
  var VISIT_GAP = 30 * 60 * 1000;   // a visit ends after 30 minutes without a page view
  var DECAY_DAYS = 30;              // scores halve after 30 days without new evidence
  var AGE_REASK_DAYS = 548;         // a declared age is trusted for 18 months
  var ARM_TIMEOUT = 2500;           // ms to wait for PostHog flags before falling back to the new behaviour
  var OWNER_AT = 5;
  var PROSPECT_AT = 3;
  var BAND_AT = 3;
  var BANDS = ['u5', '5-8', '8-10', '10+'];

  var WEIGHTS = {
    // towards prospect
    player_ad: 3,
    keyword: 2,
    how_it_works: 3,
    compare: 3,
    player_page: 2,
    pack_page: 2,
    basket_pack: 4,
    quiz: 3,
    // towards owner
    email: 4,
    account: 3,
    basket_books: 2,
    // towards an age band
    age_filter: 3,
    age_tab: 3,
    age_view: 1
  };

  // Mirrors the Klaviyo targeting of the welcome pop-ups as of 28 Sep 2026. Only used when the forms are set to
  // "Only show on custom trigger" and the theme setting "15% welcome pop-ups" is "Experiment control group only".
  var WELCOME_RULES = {
    desktop: {
      delay: 20, scroll: 0.6, exitIntent: true, cooldownDays: 5, countries: ['GB'],
      deny: ['schools', 'world-book-day', 'page']
    },
    mobile: {
      delay: 40, scroll: 0.6, exitIntent: false, cooldownDays: 2, countries: null,
      deny: ['schools', 'competition', 'world-book-day', '/pages/character/the-gruffalo',
        '/pages/overview/a-bear-called-paddington', '/pages/character/paddington-bear',
        '/products/horrid-henry-and-friends', '/pages/character/horrid-henry']
    }
  };

  var PAID_MEDIUM = /^(cpc|ppc|paid|paid[-_ ]?search|paid[-_ ]?social|social[-_ ]?paid|paidsocial|paidsearch|cpm|display|shopping)$/;
  var META_SOURCE = /^(facebook|fb|instagram|ig|meta|an|messenger)(\.com)?$/;
  var SEARCH_ENGINE = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex|startpage|qwant)\./;

  var ctx = readContext();
  var cfg = ctx.settings || {};
  var designMode = !!(ctx.design_mode || (window.Shopify && window.Shopify.designMode));
  var now = Date.now();
  var params = new URLSearchParams(location.search);
  var basket = { players: (ctx.cart && ctx.cart.players) || 0, books: (ctx.cart && ctx.cart.books) || 0 };

  // "always" persists, "visit" never does, "consent" waits for the Shopify customer privacy API (null = not known yet)
  var persist = cfg.storage === 'always' ? true : (cfg.storage === 'visit' ? false : null);

  var profile = load();
  var lastState = '';

  startVisit();
  decay();
  collectSignals();
  update();
  resolveConsent();
  watchFlags();
  watchPage();
  watchKlaviyo();

  window.VBProfile = {
    get: function () { return JSON.parse(JSON.stringify(profile)); },
    state: state,
    declarePlayer: declarePlayer,
    declareAge: declareAge,
    prospectSignal: function (key, points) {
      if (evidence('prospect', points || WEIGHTS.quiz, key)) update();
    },
    ageInterest: function (band, points, key) {
      band = toBand(band);
      if (band && ageEvidence(band, points || WEIGHTS.age_tab, (key || 'age_interest') + ':' + band)) update();
    },
    toBand: toBand,
    capture: capture,
    onChange: function (callback) {
      document.addEventListener('vb:profile', function (event) { callback(event.detail); });
    }
  };

  /* ------------------------------------------------------------------------------------------------------------------
   * Storage
   * ---------------------------------------------------------------------------------------------------------------- */

  function readContext() {
    try { return JSON.parse(document.getElementById('vb-context').textContent); } catch (e) { return {}; }
  }

  function blank() {
    return {
      v: 1,
      visits: 0,
      first_seen: now,
      last_seen: 0,
      visit: null,
      mode: 'unknown',
      mode_basis: 'inferred',
      prospect_score: 0,
      owner_score: 0,
      score_ts: now,
      player_declared: null,
      player_declared_at: null,
      purchase: null,
      age_declared: null,
      age_declared_at: null,
      age_scores: { 'u5': 0, '5-8': 0, '8-10': 0, '10+': 0 },
      age_ts: {},
      age_bands: [],
      source_first: null,
      source_last: null,
      paid_visit_until: 0,
      exp: null,
      exit_form: { shown_at: null, answer: null },
      welcome: {},
      quiz: null
    };
  }

  function load() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!stored || stored.v !== 1) return blank();
    var merged = Object.assign(blank(), stored);
    merged.age_scores = Object.assign(blank().age_scores, stored.age_scores);
    merged.age_ts = Object.assign({}, stored.age_ts);
    merged.exit_form = Object.assign({ shown_at: null, answer: null }, stored.exit_form);
    merged.welcome = Object.assign({}, stored.welcome);
    return merged;
  }

  function save() {
    var raw = JSON.stringify(profile);
    try { sessionStorage.setItem(KEY, raw); } catch (e) {}
    try {
      if (persist === true) localStorage.setItem(KEY, raw);
      else if (persist === false) localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function resolveConsent() {
    if (cfg.storage !== 'consent') {
      save();
      return;
    }

    var check = function () {
      var privacy = window.Shopify && window.Shopify.customerPrivacy;
      if (!privacy || typeof privacy.analyticsProcessingAllowed !== 'function') return false;
      try {
        persist = !!(privacy.preferencesProcessingAllowed() || privacy.analyticsProcessingAllowed());
      } catch (e) {
        return false;
      }
      save();
      return true;
    };

    document.addEventListener('visitorConsentCollected', check);

    if (!check() && window.Shopify && typeof window.Shopify.loadFeatures === 'function') {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (error) {
        if (!error) check();
      });
    }
  }

  /* ------------------------------------------------------------------------------------------------------------------
   * Evidence
   * ---------------------------------------------------------------------------------------------------------------- */

  function startVisit() {
    if (!profile.visit || now - (profile.last_seen || 0) > VISIT_GAP) {
      profile.visits += 1;
      profile.visit = { id: now.toString(36), started: now, seen: {} };
    }
    profile.last_seen = now;

    // A paid arrival suppresses pop-ups for the whole visit, so keep extending it while the visit lasts
    if (profile.paid_visit_until > now) profile.paid_visit_until = now + VISIT_GAP;
  }

  function decay() {
    var periods = Math.floor((Date.now() - (profile.score_ts || now)) / (DECAY_DAYS * DAY));
    if (periods < 1) return;

    var factor = Math.pow(0.5, periods);
    profile.prospect_score = round(profile.prospect_score * factor);
    profile.owner_score = round(profile.owner_score * factor);
    BANDS.forEach(function (band) { profile.age_scores[band] = round(profile.age_scores[band] * factor); });
    profile.score_ts += periods * DECAY_DAYS * DAY;
  }

  // Each signal counts once per visit
  function once(key) {
    if (!key) return true;
    if (profile.visit.seen[key]) return false;
    profile.visit.seen[key] = 1;
    return true;
  }

  function evidence(side, points, key) {
    if (!once(key)) return false;
    decay();
    profile[side + '_score'] = round(profile[side + '_score'] + points);
    profile.score_ts = Date.now();
    return true;
  }

  function ageEvidence(band, points, key) {
    if (BANDS.indexOf(band) === -1 || !once(key)) return false;
    decay();
    profile.age_scores[band] = round(profile.age_scores[band] + points);
    profile.age_ts[band] = profile.score_ts = Date.now();
    return true;
  }

  // Maps metafield codes ("35", "58", "810", "12"), filter labels ("5 to 8 years") and band keys to a band key
  function toBand(value) {
    var text = String(value || '').toLowerCase().trim();
    if (!text) return null;
    if (BANDS.indexOf(text) !== -1) return text;
    if (text === '35' || /under\s*5|^0\s*[-–]\s*4/.test(text)) return 'u5';
    if (text === '58' || /^5\s*(to|[-–])\s*8/.test(text)) return '5-8';
    if (text === '810' || /^8\s*(to|[-–])\s*10/.test(text)) return '8-10';
    if (text === '12' || /^10\s*(to|and|\+|[-–])|teen/.test(text)) return '10+';
    return null;
  }

  function list(value) {
    return String(value || '').split(/[\n,]+/).map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function collectSignals() {
    var source = detectSource();

    if (source) {
      if (!profile.source_first) profile.source_first = source.record;
      profile.source_last = source.record;
      if (source.paid) profile.paid_visit_until = now + VISIT_GAP;
      if (source.playerAd) evidence('prospect', WEIGHTS.player_ad, 'player_ad');
      if (source.email) evidence('owner', WEIGHTS.email, 'email');
    } else if (!profile.source_first) {
      profile.source_first = { medium: '(none)', platform: 'direct', campaign: null, ts: now };
    }

    // Search terms: the ad keyword, an on-site search or a search engine that still passes the query
    var terms = [params.get('utm_term'), params.get('keyword')];
    if (ctx.page_type === 'search') terms.push(params.get('q'));
    var referrer = externalReferrer();
    if (referrer) terms.push(referrer.searchParams.get('q'));
    if (matchesTerms(terms.join(' '))) evidence('prospect', WEIGHTS.keyword, 'keyword');

    // Pages
    var path = location.pathname.replace(/\/+$/, '') || '/';
    var template = String(ctx.template || '').toLowerCase();
    var type = String((ctx.product && ctx.product.type) || '').toLowerCase();
    var onPath = function (paths) {
      return list(paths).some(function (item) { return path === item.replace(/\/+$/, ''); });
    };

    if (template === 'page.how-it-works' || onPath(cfg.how_it_works_paths)) evidence('prospect', WEIGHTS.how_it_works, 'how_it_works');
    if (/compare|-vs-/.test(template) || /-vs-/.test(path) || onPath(cfg.compare_paths)) evidence('prospect', WEIGHTS.compare, 'compare');
    if (type === 'player') evidence('prospect', WEIGHTS.player_page, 'player_page');
    if (type === 'starter pack') evidence('prospect', WEIGHTS.pack_page, 'pack_page');
    if (/^customers\/(account|order|addresses|login)$/.test(ctx.page_type || '')) evidence('owner', WEIGHTS.account, 'account');

    // Age: a book or pack view counts once per product, a filter once per band
    if (ctx.product) {
      (ctx.product.age_groups || []).forEach(function (value) {
        var band = toBand(value);
        if (band) ageEvidence(band, WEIGHTS.age_view, 'age_view:' + ctx.product.handle + ':' + band);
      });
    }
    params.getAll('filter.p.m.book.age_groups').forEach(function (value) {
      var band = toBand(value);
      if (band) ageEvidence(band, WEIGHTS.age_filter, 'age_filter:' + band);
    });

    basketSignals();

    if (ctx.customer && ctx.customer.player_order && !profile.purchase) {
      profile.purchase = 'account';
      profile.purchase_at = now;
    }

    // Links from the Klaviyo exit form carry the answer (?vb_exit=how) and, for the age buttons, the band (?vb_age=5-8)
    var exitAnswer = params.get('vb_exit');
    if (exitAnswer) setExitAnswer(exitAnswer.slice(0, 40));
    var linkBand = toBand(params.get('vb_age'));
    if (linkBand) setAgeDeclared(linkBand);
  }

  function basketSignals() {
    if (basket.players > 0) return evidence('prospect', WEIGHTS.basket_pack, 'basket_pack');
    if (basket.books >= 2) return evidence('owner', WEIGHTS.basket_books, 'basket_books');
    return false;
  }

  function matchesTerms(text) {
    text = String(text || '').toLowerCase();
    if (!text.trim()) return false;
    return list(cfg.prospect_terms).some(function (term) { return text.indexOf(term.toLowerCase()) !== -1; });
  }

  function externalReferrer() {
    if (!document.referrer) return null;
    try {
      var url = new URL(document.referrer);
      if (url.hostname === location.hostname || /(^|\.)(shopify\.com|myshopify\.com|shop\.app)$/.test(url.hostname)) return null;
      return url;
    } catch (e) {
      return null;
    }
  }

  function findCmpn() {
    var found = null;
    params.forEach(function (value, key) {
      if (found) return;
      if (/^cmpn_/i.test(value)) found = value;
      else if (/^cmpn_/i.test(key)) found = key;
    });
    return found;
  }

  function detectSource() {
    var get = function (key) { return (params.get(key) || '').trim(); };
    var medium = get('utm_medium').toLowerCase();
    var source = get('utm_source').toLowerCase();
    var campaign = get('utm_campaign');
    var googleClick = get('gclid') || get('gbraid') || get('wbraid') || get('gad_campaignid') || get('gad_source');
    var microsoftClick = get('msclkid');
    var metaClick = get('fbclid');
    var cmpn = findCmpn();
    var email = !!(get('_kx') || medium === 'email' || source === 'klaviyo');
    var referrer = externalReferrer();
    var referrerHost = referrer ? referrer.hostname.replace(/^www\./, '') : '';

    if (!medium && !source && !googleClick && !microsoftClick && !metaClick && !cmpn && !email && !referrer) return null;

    var platform;
    var paid = PAID_MEDIUM.test(medium);

    if (email) {
      platform = 'klaviyo';
    } else if (cmpn || /chatgpt|openai/.test(source) || /(^|\.)(chatgpt|openai)\.com$/.test(referrerHost)) {
      platform = 'chatgpt';
      paid = paid || !!cmpn;
    } else if (googleClick) {
      platform = 'google';
      paid = true;
    } else if (microsoftClick) {
      platform = 'microsoft';
      paid = true;
    } else if (metaClick || META_SOURCE.test(source) || /(^|\.)(facebook|instagram)\.com$/.test(referrerHost)) {
      platform = 'meta';
    } else {
      platform = source || referrerHost || 'direct';
    }

    var campaignIds = [get('gad_campaignid'), get('utm_id'), campaign, get('campaignid'), get('campaign_id')]
      .join(' ').toLowerCase();
    var playerCampaign = list(cfg.player_campaigns).some(function (item) {
      return campaignIds.indexOf(item.toLowerCase()) !== -1;
    });

    return {
      paid: paid,
      email: email,
      playerAd: paid && (playerCampaign || platform === 'meta' || platform === 'chatgpt'),
      record: {
        medium: medium || (email ? 'email' : paid ? 'cpc' : referrer ? (SEARCH_ENGINE.test(referrer.hostname) ? 'organic' : 'referral') : '(none)'),
        platform: platform,
        campaign: campaign || get('gad_campaignid') || cmpn || null,
        ts: now
      }
    };
  }

  /* ------------------------------------------------------------------------------------------------------------------
   * Mode, age bands and state
   * ---------------------------------------------------------------------------------------------------------------- */

  function computeMode() {
    if (profile.purchase) return ['owner', 'purchase'];
    if (profile.player_declared === 'yes') return ['owner', 'declared'];
    if (profile.player_declared === 'no') return ['prospect', 'declared'];
    if (profile.owner_score >= OWNER_AT) return ['owner', 'inferred'];   // owner wins ties
    if (profile.prospect_score >= PROSPECT_AT) return ['prospect', 'inferred'];
    return ['unknown', 'inferred'];
  }

  function computeBands() {
    if (profile.age_declared && profile.age_declared.length && Date.now() - profile.age_declared_at < AGE_REASK_DAYS * DAY) {
      return profile.age_declared.slice();
    }

    var scores = profile.age_scores;
    var recent = profile.age_ts || {};
    var top = Math.max.apply(null, BANDS.map(function (band) { return scores[band]; }));

    // Highest score first; on a tie, the band with the most recent evidence
    return BANDS
      .filter(function (band) { return scores[band] >= BAND_AT && scores[band] >= top / 2; })
      .sort(function (a, b) { return (scores[b] - scores[a]) || ((recent[b] || 0) - (recent[a] || 0)); });
  }

  function currentArm() {
    if (profile.mode === 'owner') return 'owner';
    if (!cfg.experiment_flag) return 'test';
    return (profile.exp && profile.exp.key === cfg.experiment_flag && profile.exp.arm) || 'pending';
  }

  function isPaidVisit() {
    return profile.paid_visit_until > Date.now();
  }

  function state() {
    return {
      mode: profile.mode,
      basis: profile.mode_basis,
      bands: profile.age_bands.slice(),
      arm: currentArm(),
      paid_visit: isPaidVisit(),
      basket: { players: basket.players, books: basket.books }
    };
  }

  // Components rendered before this script ran used window.vbBoot, so the first update always announces the state
  function update() {
    var mode = computeMode();
    profile.mode = mode[0];
    profile.mode_basis = mode[1];
    profile.age_bands = computeBands();
    save();

    var current = state();
    var root = document.documentElement;
    root.setAttribute('data-vb-mode', current.mode);
    root.setAttribute('data-vb-arm', current.arm);
    if (current.bands[0]) root.setAttribute('data-vb-age', current.bands[0]);
    else root.removeAttribute('data-vb-age');
    window.vbBoot = { mode: current.mode, bands: current.bands, arm: current.arm };

    syncPosthog();

    var signature = JSON.stringify([current.mode, current.basis, current.bands, current.arm, current.paid_visit]);
    if (signature !== lastState) {
      lastState = signature;
      document.dispatchEvent(new CustomEvent('vb:profile', { detail: current }));
    }
  }

  function declarePlayer(answer, source) {
    if (answer !== 'yes' && answer !== 'no') return;
    profile.player_declared = answer;
    profile.player_declared_at = Date.now();
    capture('player_declared', { answer: answer, source: source || null });
    update();
  }

  function setAgeDeclared(band) {
    profile.age_declared = [band];
    profile.age_declared_at = Date.now();
  }

  function declareAge(band, source) {
    band = toBand(band);
    if (!band) return;
    setAgeDeclared(band);
    capture('age_declared', { band: band, source: source || null });
    update();
  }

  function setExitAnswer(answer) {
    profile.exit_form = Object.assign({}, profile.exit_form, { answer: answer, answered_at: Date.now() });
    capture('exit_form_answer', { answer: answer });
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  /* ------------------------------------------------------------------------------------------------------------------
   * PostHog
   * ---------------------------------------------------------------------------------------------------------------- */

  function posthog() {
    var ph = window.posthog;
    return !designMode && ph && typeof ph.capture === 'function' ? ph : null;
  }

  function capture(event, properties) {
    var ph = posthog();
    if (!ph) return;
    try {
      ph.capture(event, Object.assign({
        vb_mode: profile.mode,
        vb_arm: currentArm(),
        vb_age_band: profile.age_bands[0] || null
      }, properties || {}));
    } catch (e) {}
  }

  function syncPosthog() {
    var ph = posthog();
    if (!ph) return;

    try { ph.register({ vb_mode: profile.mode, vb_arm: currentArm() }); } catch (e) {}

    var properties = {
      vb_mode: profile.mode,
      vb_mode_basis: profile.mode_basis,
      vb_age_bands: profile.age_bands,
      vb_prospect_score: Math.round(profile.prospect_score * 10) / 10,
      vb_owner_score: Math.round(profile.owner_score * 10) / 10
    };
    var signature = JSON.stringify(properties);
    if (signature === profile.ph_sent || typeof ph.setPersonProperties !== 'function') return;

    try {
      ph.setPersonProperties(properties);
      profile.ph_sent = signature;
      save();
    } catch (e) {}
  }

  function setArm(arm, basis) {
    var previous = profile.exp && profile.exp.arm;
    profile.exp = { key: cfg.experiment_flag, arm: arm, basis: basis, ts: Date.now() };
    if (previous !== arm) update();
    else save();
  }

  function watchFlags() {
    var settled = false;

    if (currentArm() === 'pending') {
      setTimeout(function () {
        if (!settled && currentArm() === 'pending') setArm('test', 'timeout');
      }, ARM_TIMEOUT);
    }

    var ph = posthog();
    if (!ph || typeof ph.onFeatureFlags !== 'function') return;

    ph.onFeatureFlags(function () {
      settled = true;

      try {
        if (cfg.owner_flag && ph.isFeatureEnabled(cfg.owner_flag) && !profile.purchase) {
          profile.purchase = 'posthog';
          profile.purchase_at = Date.now();
          update();
        }
      } catch (e) {}

      // Owners are outside the experiment, so their flag is never read (no exposure is recorded for them)
      if (profile.mode === 'owner' || !cfg.experiment_flag) return;

      var variant;
      try { variant = ph.getFeatureFlag(cfg.experiment_flag); } catch (e) {}

      if (variant === undefined || variant === null || variant === false) {
        setArm('test', 'not_enrolled');
      } else {
        setArm(String(variant) === String(cfg.experiment_control) ? 'control' : 'test', 'flag');
      }
    });
  }

  /* ------------------------------------------------------------------------------------------------------------------
   * Live page signals
   * ---------------------------------------------------------------------------------------------------------------- */

  function watchPage() {
    document.addEventListener('cart:change', function (event) {
      var cart = event.detail && event.detail.cart;
      if (!cart || !cart.items) return;

      var players = 0;
      var books = 0;
      cart.items.forEach(function (item) {
        var type = String(item.product_type || '').toLowerCase();
        if (type === 'player' || type === 'starter pack') players += item.quantity;
        else if (type.indexOf('audiobook') !== -1) books += item.quantity;
      });

      basket = { players: players, books: books };
      basketSignals();
      update();
    });

    // Age filters on collection pages update without a page load
    document.addEventListener('change', function (event) {
      var input = event.target;
      if (!input || input.name !== 'filter.p.m.book.age_groups' || !input.checked) return;
      var band = toBand(input.value);
      if (band && ageEvidence(band, WEIGHTS.age_filter, 'age_filter:' + band)) update();
    });
  }

  /* ------------------------------------------------------------------------------------------------------------------
   * Klaviyo
   * ---------------------------------------------------------------------------------------------------------------- */

  function openKlaviyoForm(formId) {
    window._klOnsite = window._klOnsite || [];
    window._klOnsite.push(['openForm', formId]);
  }

  function overlayOpen() {
    return document.documentElement.classList.contains('lock') || !!document.querySelector('dialog[open]');
  }

  function isMobile() {
    return window.matchMedia('(max-width: 767px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  }

  // Desktop: the pointer leaves through the top of the window. Touch: a fast scroll back up after reading down the page.
  // The handler returns false to keep listening.
  function watchExitIntent(handler) {
    var armedAt = Date.now() + 5000;
    var done = false;

    var fire = function (reason) {
      if (done || Date.now() < armedAt || overlayOpen()) return;
      if (handler(reason) !== false) done = true;
    };

    document.addEventListener('mouseout', function (event) {
      if (!event.relatedTarget && event.clientY <= 0) fire('mouse_leave');
    });

    if (window.matchMedia('(pointer: coarse)').matches) {
      var lastY = window.scrollY;
      var lastTime = performance.now();
      var deepest = window.scrollY;

      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        var time = performance.now();
        var speed = (lastY - y) / Math.max(time - lastTime, 1);

        deepest = Math.max(deepest, y);
        if (speed > 1.5 && deepest > window.innerHeight && deepest - y > window.innerHeight * 0.6) fire('scroll_up');

        lastY = y;
        lastTime = time;
      }, { passive: true });
    }
  }

  function exitFormEligible() {
    var exitForm = profile.exit_form || {};
    var cooldown = (cfg.exit_form_cooldown || 14) * DAY;

    if (currentArm() !== 'test' || profile.mode === 'owner' || isPaidVisit()) return false;
    if (profile.mode === 'unknown' && basket.players < 1) return false;
    if (exitForm.answer === 'email') return false;
    if (exitForm.shown_at && Date.now() - exitForm.shown_at < cooldown) return false;
    return true;
  }

  function setupExitForm() {
    if (!cfg.exit_form_id) return;

    watchExitIntent(function (reason) {
      if (!exitFormEligible()) return false;

      openKlaviyoForm(cfg.exit_form_id);
      profile.exit_form = Object.assign({}, profile.exit_form, { shown_at: Date.now() });
      save();
      capture('exit_form_triggered', { trigger: reason, basket_players: basket.players });
      return true;
    });
  }

  function klaviyoIdentified() {
    var klaviyo = window.klaviyo;
    if (klaviyo && typeof klaviyo.isIdentified === 'function') {
      try { return Promise.resolve(klaviyo.isIdentified()).catch(function () { return false; }); } catch (e) {}
    }
    return Promise.resolve(false);
  }

  function setupWelcome() {
    if (cfg.welcome_mode !== 'theme') return;

    var device = isMobile() ? 'mobile' : 'desktop';
    var formId = cfg['welcome_form_' + device];
    var rules = WELCOME_RULES[device];
    var fired = false;
    if (!formId) return;

    var eligible = function () {
      var welcome = profile.welcome || {};
      var href = location.href.toLowerCase();

      if (currentArm() !== 'control' || profile.mode === 'owner') return false;
      if (welcome.submitted_at) return false;
      if (welcome.closed_at && Date.now() - welcome.closed_at < rules.cooldownDays * DAY) return false;
      if (rules.countries && ctx.country && rules.countries.indexOf(ctx.country) === -1) return false;
      return !rules.deny.some(function (pattern) { return href.indexOf(pattern) !== -1; });
    };

    var trigger = function (reason) {
      if (fired || overlayOpen() || !eligible()) return false;
      fired = true;

      klaviyoIdentified().then(function (identified) {
        if (identified) return;
        openKlaviyoForm(formId);
        profile.welcome = Object.assign({}, profile.welcome, { shown_at: Date.now() });
        save();
        capture('welcome_popup_triggered', { trigger: reason, device: device });
      });
      return true;
    };

    setTimeout(function () { trigger('delay'); }, rules.delay * 1000);

    var onScroll = function () {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0 && window.scrollY / height >= rules.scroll && trigger('scroll') !== false) {
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    if (rules.exitIntent) watchExitIntent(trigger);
  }

  function cleanFormMeta(meta) {
    var out = {};
    if (!meta || typeof meta !== 'object') return out;

    Object.keys(meta).forEach(function (key) {
      var value = meta[key];
      if (/e-?mail|phone|sms|first_?name|last_?name|full_?name|address|zip|post_?code|birth/i.test(key)) return;
      if (value === null || ['string', 'number', 'boolean'].indexOf(typeof value) === -1) return;
      out['kl_' + key.replace(/^\$/, '')] = value;
    });

    return out;
  }

  function watchKlaviyo() {
    var events = {
      open: 'klaviyo_form_open',
      embedOpen: 'klaviyo_form_open',
      close: 'klaviyo_form_close',
      submit: 'klaviyo_form_submit',
      stepSubmit: 'klaviyo_form_step',
      redirectedToUrl: 'klaviyo_form_redirect'
    };

    window.addEventListener('klaviyoForms', function (event) {
      var detail = event.detail || {};
      var formId = detail.formId || null;
      var role = 'other';

      if (formId && formId === cfg.exit_form_id) role = 'exit';
      else if (formId && (formId === cfg.welcome_form_desktop || formId === cfg.welcome_form_mobile)) role = 'welcome';

      if (events[detail.type]) {
        capture(events[detail.type], Object.assign({ form_id: formId, form_role: role, form_type: detail.type }, cleanFormMeta(detail.metaData)));
      }

      if (role === 'welcome' && (detail.type === 'close' || detail.type === 'submit')) {
        profile.welcome = Object.assign({}, profile.welcome);
        profile.welcome[detail.type === 'close' ? 'closed_at' : 'submitted_at'] = Date.now();
        save();
      }

      if (role === 'exit' && detail.type === 'submit') {
        setExitAnswer('email');
        save();
      }
    });

    if (designMode) return;

    setupExitForm();

    // The welcome pop-ups depend on the experiment arm, so wait until it is known
    if (currentArm() !== 'pending') {
      setupWelcome();
    } else {
      var onResolved = function () {
        if (currentArm() === 'pending') return;
        document.removeEventListener('vb:profile', onResolved);
        setupWelcome();
      };
      document.addEventListener('vb:profile', onResolved);
    }
  }
})();
