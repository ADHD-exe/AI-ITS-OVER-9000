// ==UserScript==
// @name         Unleashed Prompt
// @namespace    https://github.com/unleashed-prompt
// @version      1.0.2
// @description  ChatGPT-first hybrid: full visual theming, advanced prompt library, AI enhance with diff, bulk chat management, placeholder system, inline suggest, and more.
// @author       Unleashed Prompt Contributors
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      generativelanguage.googleapis.com
// @connect      openrouter.ai
// @connect      api-inference.huggingface.co
// @connect      api.groq.com
// @connect      raw.githubusercontent.com
// @connect      api.github.com
// @connect      gist.github.com
// ==/UserScript==

/**
 * ============================================================
 *  UNLEASHED PROMPT v1.0.0
 *  Hybrid of GPT-Unleashed v2.8.26 (Script A) + My Prompt v6.0.8 (Script B)
 *  Architecture: Single structured IIFE
 *  Platform: ChatGPT-first, Claude.ai secondary
 *  Storage: GM_getValue / GM_setValue + IndexedDB for pins
 * ============================================================
 *
 *  MODULE ORDER:
 *   1.  Guard & namespace
 *   2.  Constants & storage keys
 *   3.  State model
 *   4.  Utilities (sanitize, debounce, dom, storage)
 *   5.  Platform adapters (detect, chatgpt, claude)
 *   6.  Theming engine
 *   7.  Prompt store & schema
 *   8.  Prompt insertion engine
 *   9.  Placeholder system
 *  10.  AI provider routing + Quick Enhance + AI Enhance + diff modal  [PHASE 1]
 *  11.  Inline # autocomplete + Smart editor
 *  12.  Chat management: export + bulk export + bulk delete  [PHASE 1]
 *  13.  IndexedDB pin persistence
 *  14.  Nav widget & pinned carousel  [PHASE 2 stub]
 *  15.  Gist integration  [PHASE 2 stub]
 *  16.  Backup / restore  [PHASE 2 stub]
 *  17.  Keyboard shortcuts
 *  18.  Update checker
 *  19.  UI – shared (dialog, notification, tooltip, scroll-arrows)
 *  20.  UI – floating panel (7 pages)
 *  21.  UI – toolbar pill button + prompt menu
 *  22.  UI – modals (prompt editor, placeholder, ai-diff, explorer, settings, tags, backup)
 *  23.  DOM watcher (MutationObserver + URL change interception)
 *  24.  GM menu commands
 *  25.  Init & main entry
 * ============================================================
 */

(function () {
  'use strict';

  // ============================================================
  // §1 · GUARD — prevent duplicate execution
  // ============================================================
  if (window.__unleashedPromptV1) return;
  window.__unleashedPromptV1 = true;

  // ============================================================
  // §2 · CONSTANTS & STORAGE KEYS
  // ============================================================
  const SCRIPT_NAME    = 'Unleashed Prompt';
  const SCRIPT_VERSION = '1.0.0';
  const UPDATE_URL     = 'https://raw.githubusercontent.com/unleashed-prompt/unleashed-prompt/main/unleashed-prompt.user.js';

  /** GM storage keys — all prefixed up_ to avoid collisions */
  const KEYS = {
    SETTINGS:         'up_settings_v1',
    PROMPTS:          'up_prompts_v1',
    THEMES:           'up_saved_themes_v1',
    IMPORTED_THEMES:  'up_imported_themes_v1',
    GLOBAL_FILES:     'up_global_files_v1',
    TAGS:             'up_tags_v1',
    AI_CONFIG:        'up_ai_config_v1',
    SHORTCUTS:        'up_shortcuts_v1',
    NAV_CONFIG:       'up_nav_config_v1',
    SYNTAX_CONFIG:    'up_syntax_v1',
    PREDICTION:       'up_prediction_v1',
    COLUMNS:          'up_columns_v1',
  };

  const PENDING_PROMPT_KEY = 'up_pending_prompt_v1';

  /** IndexedDB */
  const IDB_DB    = 'UnleashedPrompt';
  const IDB_STORE = 'chatPins';

  /** CSS element IDs injected into the page */
  const STYLE_ID_STRUCTURAL = 'up-structural-v1';
  const STYLE_ID_THEME_VARS = 'up-theme-vars-v1';
  const PANEL_ID            = 'up-floating-panel-v1';

  /** File size limits */
  const FILE_MAX_BYTES  = 5 * 1024 * 1024;   // 5 MB per file
  const STORE_WARN_BYTES = 15 * 1024 * 1024;  // 15 MB total store warning

  /** Debounce timings (ms) */
  const DEBOUNCE_OBSERVER  = 120;
  const DEBOUNCE_SETTINGS  = 140;
  const DEBOUNCE_INLINE    = 100;
  const DEBOUNCE_RESIZE    = 100;

  /** Self-heal timer (ms) */
  const SELF_HEAL_DELAY    = 1200;

  /** Panel pages */
  const PANEL_PAGES = ['home', 'themes', 'layout', 'font', 'prompts', 'settings', 'ui-theme'];

  /** Sort modes */
  const SORT_MODES = ['default', 'az', 'za', 'most-used', 'least-used', 'newest', 'oldest'];

  // ============================================================
  // §3 · STATE MODEL
  // ============================================================

  /**
   * UIState — volatile runtime UI state (not persisted)
   * @type {Object}
   */
  const UIState = {
    panelHidden:              true,
    panelPage:                'home',
    panelLeft:                null,
    panelTop:                 null,
    launcherHiddenUntilHover: true,
    moveGuiDragEnabled:       false,
    observerPaused:           false,
    mutationObserver:         null,
    saveTimer:                null,
    refreshTimer:             null,
    notificationTimer:        null,
    isInitialized:            false,
    isInitializing:           false,
    currentPlatform:          null,       // 'chatgpt' | 'claude' | null
    floatingPromptEventsBound: false,
    composerEl:               null,       // cached composer textarea/contenteditable
    pillButton:               null,       // toolbar pill element
    promptMenu:               null,       // dropdown menu element
  };

  /**
   * PromptState — prompt library and editor state
   * @type {Object}
   */
  const PromptState = {
    prompts:              [],             // array of merged-schema prompt objects
    savedThemes:          [],
    importedThemes:       {},
    floatingPinnedCards:  [],
    inlineMenu:           null,
    inlineMenuItems:      [],
    inlineMenuIndex:      -1,
    macroMemory:          new Map(),
    varMemory:            new Map(),
    filterText:           '',
    filterTag:            '',
    sortMode:             'default',
  };

  /**
   * ThemeState — appearance / settings
   * @type {Object}
   */
  const ThemeState = {
    settings:   {},                       // all settings, loaded from GM
    tagsConfig: {},                       // tag definitions keyed by tag name
  };

  /**
   * NavState — message navigator and pinned carousel
   * @type {Object}
   */
  const NavState = {
    enabled:               false,
    cachedMessages:        [],
    savedPins:             [],
    activePins:            [],
    currentChatId:         null,
    currentNavIndex:       0,
    currentPinnedCenterIdx: 0,
    navContainer:          null,
    carouselContainer:     null,
    chatWatchInterval:     null,
    domWatchInterval:      null,
  };

  /**
   * AIState — AI enhancement configuration and shortcuts
   * @type {Object}
   */
  const AIState = {
    config:            {},                // API keys, model, system prompts string
    currentShortcuts:  {},               // keyed by action name
  };

  // ============================================================
  // §4 · UTILITIES
  // ============================================================

  // ------- §4.1  Logging -------
  let DEBUG = false;
  const log = {
    info:  (...a) => DEBUG && console.log  ('[UP]', ...a),
    warn:  (...a) => DEBUG && console.warn ('[UP]', ...a),
    error: (...a) =>           console.error('[UP]', ...a),
    group: (...a) => DEBUG && console.groupCollapsed('[UP]', ...a),
    end:   ()     => DEBUG && console.groupEnd(),
  };

  // ------- §4.2  Sanitize -------

  /**
   * Validate and return a hex color string, or a fallback.
   * @param {string} val
   * @param {string} fallback
   * @returns {string}
   */
  function sanitizeHexColor(val, fallback = '#ffffff') {
    if (typeof val === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(val.trim())) {
      return val.trim();
    }
    return fallback;
  }

  /**
   * Clamp a numeric value to [min, max].
   * @param {number} val
   * @param {number} min
   * @param {number} max
   * @param {number} fallback
   * @returns {number}
   */
  function clampNumber(val, min, max, fallback) {
    const n = parseFloat(val);
    if (isNaN(n)) return fallback !== undefined ? fallback : min;
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Sanitize a CSS font-family string.
   * @param {string} val
   * @param {string} fallback
   * @returns {string}
   */
  function sanitizeFontFamily(val, fallback = 'inherit') {
    if (typeof val !== 'string') return fallback;
    const s = val.replace(/[;<>{}\\]/g, '').trim();
    return s.length > 0 && s.length < 200 ? s : fallback;
  }

  /**
   * Escape user-supplied text for safe insertion as textContent.
   * NEVER use innerHTML with user data — use DOM construction helpers instead.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Create a DOM element and set textContent (safe) or trusted HTML from
   * script-authored template strings only.
   * @param {string} tag
   * @param {Object} opts
   * @param {string} [opts.cls]       className
   * @param {string} [opts.id]
   * @param {string} [opts.text]      textContent (safe)
   * @param {Object} [opts.attrs]     attribute map
   * @param {string} [opts.html]      innerHTML — ONLY for script-authored strings
   * @returns {HTMLElement}
   */
  function el(tag, opts = {}) {
    const e = document.createElement(tag);
    if (opts.cls)   e.className = opts.cls;
    if (opts.id)    e.id = opts.id;
    if (opts.text)  e.textContent = opts.text;
    if (opts.html)  e.innerHTML = opts.html;          // script-authored only
    if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  // ------- §4.3  Debounce / timing -------

  /**
   * Returns a debounced wrapper of fn.
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function makeDebounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Promise-based sleep.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ------- §4.4  DOM helpers -------

  /**
   * Wait for a CSS selector to appear in the DOM, with timeout.
   * Resolves with the element, or null on timeout.
   * @param {string} selector
   * @param {number} [timeout=8000]
   * @param {Element} [root=document]
   * @returns {Promise<Element|null>}
   */
  function waitFor(selector, timeout = 8000, root = document) {
    return new Promise(resolve => {
      const existing = root.querySelector(selector);
      if (existing) return resolve(existing);
      const obs = new MutationObserver(() => {
        const found = root.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });
      obs.observe(root.body || root, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
    });
  }

  /**
   * Click a button in a way that works with React's synthetic events.
   * Tries direct click first, then dispatches MouseEvent.
   * @param {Element} btn
   */
  function robustClick(btn) {
    if (!btn) return;
    try { btn.click(); } catch (_) {/* ignore */}
    try {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (_) {/* ignore */}
  }

  /**
   * Check if an element is visible in the viewport.
   * @param {Element} e
   * @returns {boolean}
   */
  function isElementVisible(e) {
    if (!e) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 &&
      r.bottom > 0 && r.right > 0 &&
      r.top < window.innerHeight && r.left < window.innerWidth;
  }

  // ------- §4.5  GM Storage wrappers -------

  /**
   * Async GM storage wrapper with in-memory cache.
   * All reads go through the cache; writes update cache and GM simultaneously.
   */
  const Store = (() => {
    const _cache = new Map();

    async function get(key, defaultVal = null) {
      if (_cache.has(key)) return _cache.get(key);
      try {
        const raw = await GM_getValue(key, undefined);
        const val = raw === undefined ? defaultVal : JSON.parse(raw);
        _cache.set(key, val);
        return val;
      } catch (err) {
        log.error('Store.get failed', key, err);
        return defaultVal;
      }
    }

    async function set(key, val) {
      _cache.set(key, val);
      try {
        await GM_setValue(key, JSON.stringify(val));
      } catch (err) {
        log.error('Store.set failed', key, err);
      }
    }

    async function del(key) {
      _cache.delete(key);
      try {
        await GM_deleteValue(key);
      } catch (err) {
        log.error('Store.del failed', key, err);
      }
    }

    function invalidate(key) {
      _cache.delete(key);
    }

    return { get, set, del, invalidate };
  })();

  // ============================================================
  // §5 · PLATFORM ADAPTERS
  // ============================================================

  /**
   * Detect the current AI platform from the hostname.
   * @returns {'chatgpt'|'claude'|null}
   */
  function detectPlatform() {
    const h = location.hostname;
    if (h.includes('chatgpt.com') || h.includes('chat.openai.com')) return 'chatgpt';
    if (h.includes('claude.ai')) return 'claude';
    return null;
  }

  /**
   * Platform adapter registry.
   * Each adapter exposes: getComposerEl, getSendButton, platformInsert.
   */
  const ADAPTERS = {

    // ---- ChatGPT adapter ----
    chatgpt: {
      /**
       * Score-based composer detection (from Script A).
       * Returns the best matching contenteditable / textarea element.
       * @returns {Element|null}
       */
      getComposerEl() {
        const candidates = [
          ...document.querySelectorAll('textarea, [contenteditable="true"]'),
        ];
        let best = null, bestScore = -1;
        for (const c of candidates) {
          const score = this._scoreComposer(c);
          if (score > bestScore) { bestScore = score; best = c; }
        }
        log.info('ChatGPT composer score:', bestScore, best);
        return bestScore >= 5 ? best : null;
      },

      _scoreComposer(el) {
        let score = 0;
        const rect = el.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 20) return 0;
        const id  = (el.id || '').toLowerCase();
        const cls = (el.className || '').toLowerCase();
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
        if (id.includes('prompt') || id.includes('composer')) score += 4;
        if (label.includes('message') || label.includes('send')) score += 4;
        if (placeholder.includes('message') || placeholder.includes('ask')) score += 3;
        if (cls.includes('composer') || cls.includes('prompt')) score += 2;
        if (rect.bottom > window.innerHeight * 0.5) score += 3; // below midpoint
        if (rect.width > window.innerWidth * 0.3) score += 2;
        // data-testid bonus
        const testid = (el.getAttribute('data-testid') || '').toLowerCase();
        if (testid.includes('composer') || testid.includes('prompt')) score += 5;
        return score;
      },

      getSendButton() {
        return (
          document.querySelector('[data-testid="send-button"]') ||
          document.querySelector('button[aria-label*="Send"]') ||
          null
        );
      },

      /**
       * Multi-strategy insertion for React-controlled inputs.
       * @param {Element} composer
       * @param {string} text
       */
      platformInsert(composer, text) {
        if (!composer) return;
        composer.focus();
        // Strategy 1: React fiber native input setter
        try {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
          ) || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          );
          if (nativeInputValueSetter && composer.tagName === 'TEXTAREA') {
            nativeInputValueSetter.set.call(composer, text);
            composer.dispatchEvent(new Event('input', { bubbles: true }));
            return;
          }
        } catch (_) {/* fall through */}
        // Strategy 2: contenteditable execCommand
        try {
          if (composer.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
            return;
          }
        } catch (_) {/* fall through */}
        // Strategy 3: Direct value assignment
        composer.value = text;
        composer.dispatchEvent(new Event('input', { bubbles: true }));
        composer.dispatchEvent(new Event('change', { bubbles: true }));
      },
    },

    // ---- Claude adapter ----
    claude: {
      getComposerEl() {
        return (
          document.querySelector('[data-testid="chat-input"]') ||
          document.querySelector('.ProseMirror[contenteditable="true"]') ||
          document.querySelector('[contenteditable="true"]') ||
          null
        );
      },
      getSendButton() {
        return (
          document.querySelector('button[aria-label*="Send"]') ||
          null
        );
      },
      platformInsert(composer, text) {
        if (!composer) return;
        composer.focus();
        try {
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, text);
        } catch (_) {
          composer.textContent = text;
        }
      },
    },
  };

  /** Get the active platform adapter, or null. */
  function getAdapter() {
    const p = UIState.currentPlatform;
    return p && ADAPTERS[p] ? ADAPTERS[p] : null;
  }

  // ============================================================
  // §6 · THEMING ENGINE  (from Script A, two-tag strategy)
  // ============================================================

  // ------- §6.1  Default settings & presets -------

  const DEFAULT_SETTINGS = {
    // --- Feature toggles ---
    featureThemeEnabled:       true,
    featureFontEnabled:        true,
    featureHideWarning:        true,
    featureSidebarEnabled:     true,
    featureBubbleEnabled:      true,
    featureEmbedEnabled:       true,
    featureComposerEnabled:    true,

    // --- Page colors ---
    pageBgColor:               '#1a1a2e',
    pageTextColor:             '#e0e0e0',

    // --- User bubble ---
    userBubbleBgColor:         '#2d2d44',
    userBubbleTextColor:       '#e0e0e0',
    userBubbleBorderRadius:    '12',
    userBubbleMaxWidth:        '72',
    userBubblePaddingV:        '10',
    userBubblePaddingH:        '14',

    // --- Assistant bubble ---
    assistBubbleBgColor:       '#1e1e2e',
    assistBubbleTextColor:     '#cdd6f4',
    assistBubbleBorderRadius:  '12',
    assistBubbleMaxWidth:      '80',
    assistBubblePaddingV:      '10',
    assistBubblePaddingH:      '14',

    // --- Code embed ---
    embedBgColor:              '#11111b',
    embedTextColor:            '#a6e3a1',

    // --- Composer ---
    composerBgColor:           '#1e1e2e',
    composerTextColor:         '#cdd6f4',

    // --- Sidebar ---
    sidebarBgColor:            '#181825',
    sidebarTextColor:          '#bac2de',
    sidebarHoverColor:         '#313244',
    sidebarHoverTextColor:     '#cdd6f4',

    // --- Panel UI (derived from theme if matchUiToTheme=true) ---
    matchUiToTheme:            true,
    panelBgColor:              '#1e1e2e',
    panelTextColor:            '#cdd6f4',
    panelAccentColor:          '#89b4fa',
    panelBorderColor:          '#313244',
    panelOpacity:              '0.97',

    // --- Typography ---
    fontFamily:                'inherit',
    userFontSize:              '14',
    assistFontSize:            '14',
    sidebarFontSize:           '13',
    textAlignment:             'left',
    embedAlignLock:            true,

    // --- Panel position ---
    panelLeft:                 '20',
    panelTop:                  '80',

    // --- Misc ---
    sortMode:                  'default',
    columnCount:               '2',
    launcherHiddenUntilHover:  true,
    autoCheckUpdates:          true,
  };

  /** Built-in theme presets — merged from Script A (9) + Script B (5) */
  const BUILTIN_PRESETS = [
    // Script A presets
    { name: 'Mocha Dark',     pageBgColor: '#1a1a2e', pageTextColor: '#e0e0e0', userBubbleBgColor: '#2d2d44', assistBubbleBgColor: '#1e1e2e', embedBgColor: '#11111b', composerBgColor: '#1e1e2e', sidebarBgColor: '#181825' },
    { name: 'Ocean Blue',     pageBgColor: '#0d1b2a', pageTextColor: '#e0f0ff', userBubbleBgColor: '#1b3a5c', assistBubbleBgColor: '#0d2137', embedBgColor: '#071525', composerBgColor: '#0d2137', sidebarBgColor: '#091e30' },
    { name: 'Forest Green',   pageBgColor: '#0d1f0d', pageTextColor: '#d4f5d4', userBubbleBgColor: '#1a3a1a', assistBubbleBgColor: '#0d1a0d', embedBgColor: '#081208', composerBgColor: '#0d1a0d', sidebarBgColor: '#0a180a' },
    { name: 'Sunset Rose',    pageBgColor: '#2a0d1e', pageTextColor: '#ffd6e8', userBubbleBgColor: '#4a1a30', assistBubbleBgColor: '#1e0d15', embedBgColor: '#140008', composerBgColor: '#1e0d15', sidebarBgColor: '#180a10' },
    { name: 'Slate Grey',     pageBgColor: '#1a1a1a', pageTextColor: '#d4d4d4', userBubbleBgColor: '#2d2d2d', assistBubbleBgColor: '#1e1e1e', embedBgColor: '#111111', composerBgColor: '#1e1e1e', sidebarBgColor: '#181818' },
    { name: 'Purple Haze',    pageBgColor: '#1a0a2e', pageTextColor: '#e8d0ff', userBubbleBgColor: '#2d1a44', assistBubbleBgColor: '#1e0d2e', embedBgColor: '#11001b', composerBgColor: '#1e0d2e', sidebarBgColor: '#180a25' },
    { name: 'Amber Glow',     pageBgColor: '#1a1200', pageTextColor: '#fff3cc', userBubbleBgColor: '#2d2000', assistBubbleBgColor: '#1e1600', embedBgColor: '#110c00', composerBgColor: '#1e1600', sidebarBgColor: '#181000' },
    { name: 'Ice Crystal',    pageBgColor: '#0a1520', pageTextColor: '#d0eeff', userBubbleBgColor: '#152535', assistBubbleBgColor: '#0a1a25', embedBgColor: '#050f18', composerBgColor: '#0a1a25', sidebarBgColor: '#080e18' },
    { name: 'Midnight Black', pageBgColor: '#000000', pageTextColor: '#cccccc', userBubbleBgColor: '#111111', assistBubbleBgColor: '#0a0a0a', embedBgColor: '#050505', composerBgColor: '#0a0a0a', sidebarBgColor: '#080808' },
    // Script B presets (light variants)
    { name: 'Light Classic',  pageBgColor: '#ffffff', pageTextColor: '#111111', userBubbleBgColor: '#f0f0f0', assistBubbleBgColor: '#fafafa', embedBgColor: '#f5f5f5', composerBgColor: '#ffffff', sidebarBgColor: '#eeeeee' },
    { name: 'Light Blue',     pageBgColor: '#f0f6ff', pageTextColor: '#1a2a44', userBubbleBgColor: '#ddeeff', assistBubbleBgColor: '#f0f6ff', embedBgColor: '#e0f0ff', composerBgColor: '#f0f6ff', sidebarBgColor: '#e8f2ff' },
    { name: 'Light Rose',     pageBgColor: '#fff5f8', pageTextColor: '#3a1a2e', userBubbleBgColor: '#ffdde8', assistBubbleBgColor: '#fff5f8', embedBgColor: '#ffe8f0', composerBgColor: '#fff5f8', sidebarBgColor: '#ffe0ec' },
    { name: 'Light Green',    pageBgColor: '#f0fff0', pageTextColor: '#1a3a1a', userBubbleBgColor: '#d4f5d4', assistBubbleBgColor: '#f0fff0', embedBgColor: '#e0ffe0', composerBgColor: '#f0fff0', sidebarBgColor: '#e4fde4' },
    { name: 'Solarized',      pageBgColor: '#002b36', pageTextColor: '#839496', userBubbleBgColor: '#073642', assistBubbleBgColor: '#002b36', embedBgColor: '#001f27', composerBgColor: '#002b36', sidebarBgColor: '#001e26' },
  ];

  // ------- §6.2  Settings normalization -------

  /**
   * Merge saved settings with defaults and sanitize all values.
   * @param {Object} saved
   * @returns {Object}
   */
  function normalizeSettings(saved = {}) {
    const s = Object.assign({}, DEFAULT_SETTINGS, saved);
    // Colors
    const colorKeys = ['pageBgColor','pageTextColor','userBubbleBgColor','userBubbleTextColor',
      'assistBubbleBgColor','assistBubbleTextColor','embedBgColor','embedTextColor',
      'composerBgColor','composerTextColor','sidebarBgColor','sidebarTextColor',
      'sidebarHoverColor','sidebarHoverTextColor','panelBgColor','panelTextColor',
      'panelAccentColor','panelBorderColor'];
    colorKeys.forEach(k => { s[k] = sanitizeHexColor(s[k], DEFAULT_SETTINGS[k]); });
    // Numbers
    s.userBubbleBorderRadius  = clampNumber(s.userBubbleBorderRadius,  0, 40, 12);
    s.assistBubbleBorderRadius = clampNumber(s.assistBubbleBorderRadius, 0, 40, 12);
    s.userBubbleMaxWidth      = clampNumber(s.userBubbleMaxWidth,      20, 100, 72);
    s.assistBubbleMaxWidth    = clampNumber(s.assistBubbleMaxWidth,    20, 100, 80);
    s.userBubblePaddingV      = clampNumber(s.userBubblePaddingV,      0, 40, 10);
    s.userBubblePaddingH      = clampNumber(s.userBubblePaddingH,      0, 60, 14);
    s.assistBubblePaddingV    = clampNumber(s.assistBubblePaddingV,    0, 40, 10);
    s.assistBubblePaddingH    = clampNumber(s.assistBubblePaddingH,    0, 60, 14);
    s.userFontSize            = clampNumber(s.userFontSize,            8, 32, 14);
    s.assistFontSize          = clampNumber(s.assistFontSize,          8, 32, 14);
    s.sidebarFontSize         = clampNumber(s.sidebarFontSize,         8, 24, 13);
    s.panelOpacity            = clampNumber(s.panelOpacity,            0.2, 1.0, 0.97);
    s.panelLeft               = clampNumber(s.panelLeft,               0, 9999, 20);
    s.panelTop                = clampNumber(s.panelTop,                0, 9999, 80);
    s.columnCount             = clampNumber(s.columnCount,             1, 6, 2);
    // Font
    s.fontFamily = sanitizeFontFamily(s.fontFamily, 'inherit');
    // Text alignment
    if (!['left','center','right'].includes(s.textAlignment)) s.textAlignment = 'left';
    // Sort
    if (!SORT_MODES.includes(s.sortMode)) s.sortMode = 'default';
    // Booleans
    const boolKeys = ['featureThemeEnabled','featureFontEnabled','featureHideWarning',
      'featureSidebarEnabled','featureBubbleEnabled','featureEmbedEnabled',
      'featureComposerEnabled','matchUiToTheme','embedAlignLock',
      'launcherHiddenUntilHover','autoCheckUpdates'];
    boolKeys.forEach(k => { s[k] = !!s[k]; });
    return s;
  }

  // ------- §6.3  CSS injection — two-tag strategy -------

  /**
   * Inject or update the structural CSS tag (written once; never re-parses).
   * Contains all rule-based styles for the script's UI and ChatGPT zones.
   */
  function injectStructuralCSS() {
    let tag = document.getElementById(STYLE_ID_STRUCTURAL);
    if (tag) return; // already injected
    tag = document.createElement('style');
    tag.id = STYLE_ID_STRUCTURAL;
    tag.textContent = `
      /* ===  Unleashed Prompt — Structural CSS  === */

      /* Page */
      body.up-theme-active {
        background-color: var(--up-page-bg) !important;
        color: var(--up-page-text) !important;
      }

      /* User bubble */
      body.up-bubble-active [data-message-author-role="user"] .up-bubble {
        background-color: var(--up-user-bubble-bg) !important;
        color:            var(--up-user-bubble-text) !important;
        border-radius:    var(--up-user-radius) !important;
        max-width:        var(--up-user-maxw) !important;
        padding:          var(--up-user-pad-v) var(--up-user-pad-h) !important;
        font-size:        var(--up-user-font-size) !important;
        text-align:       var(--up-text-align) !important;
      }

      /* Assistant bubble */
      body.up-bubble-active [data-message-author-role="assistant"] .up-bubble {
        background-color: var(--up-assist-bubble-bg) !important;
        color:            var(--up-assist-bubble-text) !important;
        border-radius:    var(--up-assist-radius) !important;
        max-width:        var(--up-assist-maxw) !important;
        padding:          var(--up-assist-pad-v) var(--up-assist-pad-h) !important;
        font-size:        var(--up-assist-font-size) !important;
        text-align:       var(--up-text-align) !important;
      }

      /* Code embed */
      body.up-embed-active pre, body.up-embed-active code {
        background-color: var(--up-embed-bg) !important;
        color:            var(--up-embed-text) !important;
        text-align:       left !important; /* embed-align-lock */
      }

      /* Composer */
      body.up-composer-active #prompt-textarea,
      body.up-composer-active [data-testid="chat-input"] {
        background-color: var(--up-composer-bg) !important;
        color:            var(--up-composer-text) !important;
      }

      /* Sidebar */
      body.up-sidebar-active nav {
        background-color: var(--up-sidebar-bg) !important;
        color:            var(--up-sidebar-text) !important;
      }

      /* Warning hider */
      body.up-hide-warning .text-token-text-secondary:has(svg[aria-hidden]) { display: none !important; }

      /* Font override */
      body.up-font-active { font-family: var(--up-font-family) !important; }

      /* === Panel === */
      #${PANEL_ID} {
        position: fixed;
        z-index: 2147483640;
        background: var(--up-panel-bg);
        color: var(--up-panel-text);
        border: 1px solid var(--up-panel-border);
        border-radius: 12px;
        opacity: var(--up-panel-opacity);
        width: 322px;
        min-height: 60px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        user-select: none;
        transition: opacity 0.15s;
      }
      #${PANEL_ID}.up-panel-hidden .up-panel-body { display: none; }
      #${PANEL_ID} .up-panel-header {
        cursor: move;
        padding: 8px 12px;
        border-bottom: 1px solid var(--up-panel-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 13px;
      }
      #${PANEL_ID} .up-panel-body { padding: 12px; }
      #${PANEL_ID} .up-panel-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 10px;
      }
      #${PANEL_ID} .up-panel-nav-btn {
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid var(--up-panel-border);
        background: transparent;
        color: var(--up-panel-text);
        cursor: pointer;
        font-size: 11px;
      }
      #${PANEL_ID} .up-panel-nav-btn.active {
        background: var(--up-panel-accent);
        color: #fff;
        border-color: var(--up-panel-accent);
      }
      #${PANEL_ID} .up-launcher {
        cursor: pointer;
        padding: 6px 10px;
        font-size: 16px;
        border-bottom: 1px solid var(--up-panel-border);
      }

      /* === Pill button === */
      .up-pill-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin: 0 4px;
      }
      .up-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid var(--up-panel-border, #444);
        background: var(--up-panel-bg, #1e1e2e);
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      }
      .up-pill-btn:hover { filter: brightness(1.15); }
      .up-pill-btn.up-enhance-btn { border-radius: 20px 0 0 20px; border-right: none; }
      .up-pill-btn.up-prompts-btn  { border-radius: 0 20px 20px 0; }

      /* === Prompt dropdown menu === */
      #up-prompt-menu {
        position: fixed;
        z-index: 2147483638;
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #313244);
        border-radius: 10px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        width: 340px;
        max-height: 480px;
        overflow-y: auto;
        display: none;
        padding: 8px 0;
      }
      #up-prompt-menu.up-visible { display: block; }
      .up-prompt-item {
        padding: 8px 14px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .up-prompt-item:hover { background: var(--up-panel-border, #313244); }
      .up-prompt-item-title { font-size: 13px; font-weight: 500; }
      .up-prompt-item-preview { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* === Toast notification === */
      #up-global-notification {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: #313244;
        color: #cdd6f4;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        max-width: 420px;
        text-align: center;
      }
      #up-global-notification.up-visible { opacity: 1; }

      /* === Modal base === */
      .up-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        background: rgba(0,0,0,0.65);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .up-modal-overlay.up-hidden { display: none; }
      .up-modal-box {
        background: var(--up-panel-bg, #1e1e2e);
        color: var(--up-panel-text, #cdd6f4);
        border: 1px solid var(--up-panel-border, #313244);
        border-radius: 12px;
        width: min(520px, 96vw);
        max-height: 90vh;
        overflow-y: auto;
        padding: 20px;
        position: relative;
      }
      .up-modal-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 14px;
      }
      .up-modal-close {
        position: absolute;
        top: 14px; right: 14px;
        background: transparent;
        border: none;
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
      }
      .up-modal-close:hover { opacity: 1; }

      /* === Inline # suggest === */
      #up-inline-menu {
        position: fixed;
        z-index: 2147483646;
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #313244);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        width: 300px;
        max-height: 240px;
        overflow-y: auto;
        display: none;
      }
      #up-inline-menu.up-visible { display: block; }
      .up-inline-item {
        padding: 7px 12px;
        cursor: pointer;
        font-size: 12px;
      }
      .up-inline-item.up-active, .up-inline-item:hover {
        background: var(--up-panel-accent, #89b4fa);
        color: #fff;
      }

      /* === Sidebar delete button === */
      .up-sidebar-del-btn {
        opacity: 0;
        transition: opacity 0.15s;
        cursor: pointer;
        background: transparent;
        border: none;
        color: #f38ba8;
        font-size: 14px;
        padding: 2px 4px;
        border-radius: 4px;
      }
      li:hover .up-sidebar-del-btn,
      a:hover .up-sidebar-del-btn { opacity: 1; }
      .up-sidebar-del-btn:hover { background: rgba(243,139,168,0.15); }

      /* === AI Diff modal === */
      .up-diff-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 12px 0;
      }
      .up-diff-col h4 { font-size: 12px; opacity: 0.6; margin-bottom: 6px; }
      .up-diff-col pre {
        background: var(--up-embed-bg, #11111b);
        color: var(--up-embed-text, #a6e3a1);
        padding: 10px;
        border-radius: 6px;
        font-size: 12px;
        white-space: pre-wrap;
        max-height: 300px;
        overflow-y: auto;
      }

      /* === Floating prompt cards === */
      .up-prompt-float-card {
        position: fixed;
        z-index: 2147483636;
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #313244);
        border-radius: 8px;
        padding: 8px 12px;
        width: 220px;
        cursor: grab;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      .up-prompt-float-card-title { font-weight: 600; margin-bottom: 4px; }
      .up-prompt-float-card-actions { display: flex; gap: 6px; margin-top: 6px; }
      .up-prompt-float-card-actions button {
        flex: 1;
        padding: 3px;
        border-radius: 4px;
        border: 1px solid var(--up-panel-border);
        background: transparent;
        color: var(--up-panel-text);
        cursor: pointer;
        font-size: 11px;
      }

      /* === Tooltip === */
      .up-tooltip {
        position: fixed;
        z-index: 2147483647;
        background: #000;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .up-tooltip.up-visible { opacity: 0.9; }

      /* === Sidebar hover states === */
      body.up-sidebar-active nav a:hover,
      body.up-sidebar-active nav li:hover {
        background-color: var(--up-sidebar-hover) !important;
        color:            var(--up-sidebar-hover-text) !important;
      }
      body.up-sidebar-active nav a,
      body.up-sidebar-active nav li {
        color: var(--up-sidebar-text) !important;
        font-size: var(--up-sidebar-font-size) !important;
      }
      body.up-sidebar-active [data-testid="history-item"]:hover,
      body.up-sidebar-active [data-testid="conversation"]:hover {
        background-color: var(--up-sidebar-hover) !important;
      }

      /* === Composer wrapper deep targeting === */
      body.up-composer-active form,
      body.up-composer-active .composer-parent,
      body.up-composer-active [data-testid="composer-background"] {
        background-color: var(--up-composer-bg) !important;
      }
      body.up-composer-active #prompt-textarea,
      body.up-composer-active [data-testid="chat-input"],
      body.up-composer-active .ProseMirror {
        background-color: transparent !important;
        color: var(--up-composer-text) !important;
        caret-color: var(--up-composer-text) !important;
      }

      /* === Embed / code block alignment lock === */
      body.up-embed-active pre { text-align: left !important; }
      body.up-embed-active .hljs { background-color: var(--up-embed-bg) !important; }

      /* === Scroll-to-top/bottom buttons === */
      .up-scroll-btn {
        position: fixed;
        right: 18px;
        z-index: 2147483630;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--up-panel-border, #444);
        background: var(--up-panel-bg, #1e1e2e);
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.15s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .up-scroll-btn:hover { opacity: 1; }
      .up-scroll-btn.up-scroll-top    { bottom: 88px; }
      .up-scroll-btn.up-scroll-bottom { bottom: 48px; }

      /* === Message navigator widget === */
      #up-nav-container {
        position: fixed;
        right: 60px;
        bottom: 80px;
        z-index: 2147483632;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
      }
      .up-nav-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid var(--up-panel-border, #444);
        background: var(--up-panel-bg, #1e1e2e);
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.75;
        transition: opacity 0.15s;
      }
      .up-nav-btn:hover { opacity: 1; }
      .up-nav-idx {
        font-size: 9px;
        opacity: 0.6;
        text-align: center;
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #444);
        border-radius: 10px;
        padding: 1px 5px;
        min-width: 24px;
        color: var(--up-panel-text, #cdd6f4);
      }
      /* Message index popup */
      #up-msg-index-popup {
        position: fixed;
        right: 96px;
        z-index: 2147483633;
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #444);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.45);
        width: 240px;
        max-height: 360px;
        overflow-y: auto;
        display: none;
        padding: 6px 0;
      }
      #up-msg-index-popup.up-visible { display: block; }
      .up-msg-index-item {
        padding: 5px 12px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .up-msg-index-item:hover { background: var(--up-panel-border, #313244); }
      .up-msg-index-item .up-msg-role {
        font-size: 9px;
        padding: 1px 4px;
        border-radius: 3px;
        background: var(--up-panel-accent, #89b4fa);
        color: #fff;
        flex-shrink: 0;
      }
      .up-msg-index-item.up-pinned-msg .up-msg-role {
        background: #f9e2af;
        color: #1e1e2e;
      }

      /* === Pinned message carousel === */
      #up-pinned-carousel-wrapper {
        position: fixed;
        bottom: 130px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483631;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 90vw;
        display: none;
      }
      #up-pinned-carousel-wrapper.up-visible { display: flex; }
      .up-carousel-card {
        background: var(--up-panel-bg, #1e1e2e);
        border: 1px solid var(--up-panel-border, #444);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 160px;
        max-width: 240px;
        font-size: 11px;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        position: relative;
        transition: transform 0.15s;
      }
      .up-carousel-card:hover { transform: translateY(-2px); }
      .up-carousel-card-text { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
      .up-carousel-card-unpin {
        position: absolute;
        top: 4px; right: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 12px;
        opacity: 0.5;
        color: inherit;
      }
      .up-carousel-card-unpin:hover { opacity: 1; }
      .up-carousel-nav-btn {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1px solid var(--up-panel-border, #444);
        background: var(--up-panel-bg, #1e1e2e);
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 14px;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      /* Pin button on chat messages */
      .up-pin-msg-btn {
        opacity: 0;
        transition: opacity 0.15s;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 12px;
        color: var(--up-panel-accent, #89b4fa);
        padding: 2px 4px;
        border-radius: 4px;
        margin-left: 4px;
      }
      [data-message-author-role]:hover .up-pin-msg-btn { opacity: 1; }
      .up-pin-msg-btn:hover { background: rgba(137,180,250,0.15); }

      /* === Expanded fullscreen prompt grid === */
      #up-prompt-explorer-overlay .up-grid-wrap {
        display: grid;
        grid-template-columns: repeat(var(--up-grid-cols, 2), 1fr);
        gap: 10px;
        padding: 12px 0;
      }
      .up-grid-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--up-panel-border, #444);
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        position: relative;
      }
      .up-grid-card:hover { border-color: var(--up-panel-accent, #89b4fa); background: rgba(137,180,250,0.07); }
      .up-grid-card.up-drag-over { border-color: var(--up-panel-accent, #89b4fa); background: rgba(137,180,250,0.15); }
      .up-grid-card-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      .up-grid-card-preview { font-size: 11px; opacity: 0.55; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .up-grid-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .up-grid-card-tag {
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 10px;
        background: var(--up-panel-accent, #89b4fa);
        color: #fff;
        opacity: 0.8;
      }
      .up-grid-card-actions {
        position: absolute;
        top: 6px; right: 6px;
        display: none;
        gap: 4px;
      }
      .up-grid-card:hover .up-grid-card-actions { display: flex; }
      .up-grid-card-actions button {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 12px;
        color: var(--up-panel-text, #cdd6f4);
        opacity: 0.7;
        padding: 2px;
      }
      .up-grid-card-actions button:hover { opacity: 1; }
      .up-grid-card.up-fav-card::before {
        content: '⭐';
        position: absolute;
        top: 6px; left: 8px;
        font-size: 10px;
      }

      /* === Tag chips in menus / editor === */
      .up-tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 2px 7px;
        border-radius: 10px;
        font-size: 10px;
        background: var(--up-panel-accent, #89b4fa);
        color: #fff;
        cursor: pointer;
        transition: opacity 0.1s;
      }
      .up-tag-chip:hover { opacity: 0.8; }
      .up-tag-chip.up-tag-active { background: #a6e3a1; color: #1e1e2e; }
      .up-tags-row { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0; }

      /* === Shortcut recorder === */
      .up-shortcut-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid var(--up-panel-border, #444);
        font-size: 12px;
      }
      .up-shortcut-badge {
        padding: 2px 8px;
        border-radius: 5px;
        border: 1px solid var(--up-panel-border, #444);
        background: transparent;
        color: var(--up-panel-text, #cdd6f4);
        font-size: 11px;
        min-width: 80px;
        text-align: center;
        cursor: pointer;
      }
      .up-shortcut-badge.up-recording {
        border-color: var(--up-panel-accent, #89b4fa);
        background: rgba(137,180,250,0.12);
        animation: up-blink 0.8s steps(1) infinite;
      }
      @keyframes up-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* === Settings modal tabs === */
      .up-settings-tabs {
        display: flex;
        gap: 2px;
        border-bottom: 1px solid var(--up-panel-border, #444);
        margin-bottom: 16px;
      }
      .up-settings-tab {
        padding: 7px 14px;
        border-radius: 7px 7px 0 0;
        border: none;
        background: transparent;
        color: var(--up-panel-text, #cdd6f4);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        opacity: 0.6;
      }
      .up-settings-tab.active { opacity: 1; border-bottom: 2px solid var(--up-panel-accent, #89b4fa); }

      /* === Form element base resets (inside script UI only) === */
      #${PANEL_ID} input[type=range],
      .up-modal-box input[type=range] {
        -webkit-appearance: none;
        height: 4px;
        border-radius: 2px;
        background: var(--up-panel-border, #444);
        outline: none;
        width: 100%;
        cursor: pointer;
      }
      #${PANEL_ID} input[type=range]::-webkit-slider-thumb,
      .up-modal-box input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: var(--up-panel-accent, #89b4fa);
        cursor: pointer;
      }
      #${PANEL_ID} input[type=color],
      .up-modal-box input[type=color] {
        -webkit-appearance: none;
        border: 1px solid var(--up-panel-border, #444);
        border-radius: 4px;
        width: 32px; height: 24px;
        cursor: pointer;
        padding: 0;
        background: transparent;
      }
      .up-form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        gap: 8px;
        font-size: 12px;
      }
      .up-form-row label { flex: 1; opacity: 0.8; }
      .up-form-row input[type=range] { flex: 1.5; }
      .up-form-row .up-val-display {
        min-width: 32px;
        text-align: right;
        font-size: 11px;
        opacity: 0.6;
      }
      .up-section-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.5;
        margin: 12px 0 6px;
      }
      .up-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 12px;
      }
      .up-toggle-row label { opacity: 0.8; }
      /* Toggle switch */
      .up-toggle-switch {
        position: relative;
        width: 34px; height: 18px;
        flex-shrink: 0;
      }
      .up-toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
      .up-toggle-track {
        position: absolute; inset: 0;
        border-radius: 9px;
        background: var(--up-panel-border, #444);
        cursor: pointer;
        transition: background 0.2s;
      }
      .up-toggle-track::after {
        content: '';
        position: absolute;
        top: 2px; left: 2px;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.2s;
      }
      .up-toggle-switch input:checked + .up-toggle-track { background: var(--up-panel-accent, #89b4fa); }
      .up-toggle-switch input:checked + .up-toggle-track::after { transform: translateX(16px); }

      /* === Color zone grid (UI-Theme page) === */
      .up-color-zone-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .up-color-zone-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        border-radius: 6px;
        border: 1px solid var(--up-panel-border, #444);
        font-size: 11px;
      }
      .up-color-zone-row label { flex: 1; opacity: 0.8; }
      .up-color-zone-row .up-zone-enabled {
        width: 12px; height: 12px;
        cursor: pointer;
        flex-shrink: 0;
      }

      /* === Backup modal progress === */
      .up-backup-key-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 12px;
        border-bottom: 1px solid var(--up-panel-border, #444);
      }
      .up-backup-key-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
      .up-backup-size { font-size: 10px; opacity: 0.5; }

      /* === Tags manager === */
      .up-tag-manager-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 0;
        border-bottom: 1px solid var(--up-panel-border, #444);
        font-size: 12px;
      }
      .up-tag-color-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .up-tag-name { flex: 1; }
      .up-tag-actions { display: flex; gap: 4px; }
      .up-tag-actions button {
        background: transparent; border: none;
        cursor: pointer; font-size: 12px;
        color: var(--up-panel-text, #cdd6f4);
        opacity: 0.6;
        padding: 1px 3px;
      }
      .up-tag-actions button:hover { opacity: 1; }

      /* === Gist modal === */
      .up-gist-token-info {
        font-size: 11px;
        opacity: 0.6;
        margin-bottom: 10px;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid var(--up-panel-border, #444);
        background: rgba(255,255,255,0.03);
      }

      /* === Scrollbar (panel, menu, modals) === */
      #${PANEL_ID} *::-webkit-scrollbar,
      #up-prompt-menu::-webkit-scrollbar,
      .up-modal-box::-webkit-scrollbar,
      #up-msg-index-popup::-webkit-scrollbar { width: 4px; }
      #${PANEL_ID} *::-webkit-scrollbar-thumb,
      #up-prompt-menu::-webkit-scrollbar-thumb,
      .up-modal-box::-webkit-scrollbar-thumb,
      #up-msg-index-popup::-webkit-scrollbar-thumb {
        background: var(--up-panel-border, #313244);
        border-radius: 2px;
      }

      /* === Ghost launcher (hidden until hover) === */
      #${PANEL_ID}.up-launcher-ghost .up-launcher {
        opacity: 0.08;
        transition: opacity 0.2s;
      }
      #${PANEL_ID}.up-launcher-ghost:hover .up-launcher { opacity: 1; }

      /* === Mobile / touch === */
      @media (hover: none), (pointer: coarse) {
        #${PANEL_ID}.up-launcher-ghost .up-launcher { opacity: 0.6 !important; }
        .up-scroll-btn { right: 8px; }
      }

      /* === Syntax highlight backdrop (smart editor) === */
      .up-syntax-backdrop {
        position: absolute;
        top: 0; left: 0;
        pointer-events: none;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: transparent;
        font: inherit;
        padding: inherit;
        border: inherit;
        overflow: hidden;
      }
      .up-syntax-ph-input  { background: rgba(166,227,161,0.25); border-radius: 3px; }
      .up-syntax-ph-select { background: rgba(137,180,250,0.25); border-radius: 3px; }
      .up-syntax-ph-file   { background: rgba(249,226,175,0.25); border-radius: 3px; }
      .up-syntax-macro     { background: rgba(203,166,247,0.20); border-radius: 3px; }
      .up-syntax-var       { background: rgba(242,205,205,0.20); border-radius: 3px; }
    `;
    document.head.appendChild(tag);
    log.info('Structural CSS injected');
  }

  /**
   * Rewrite the theme-vars CSS tag with current custom property values.
   * This is the only thing that changes on every settings update —
   * avoids full CSS re-parse of structural rules.
   */
  function applyThemeVars() {
    const s = ThemeState.settings;
    let tag = document.getElementById(STYLE_ID_THEME_VARS);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = STYLE_ID_THEME_VARS;
      document.head.appendChild(tag);
    }
    tag.textContent = `:root {
      --up-page-bg:           ${s.pageBgColor};
      --up-page-text:         ${s.pageTextColor};
      --up-user-bubble-bg:    ${s.userBubbleBgColor};
      --up-user-bubble-text:  ${s.userBubbleTextColor};
      --up-user-radius:       ${s.userBubbleBorderRadius}px;
      --up-user-maxw:         ${s.userBubbleMaxWidth}%;
      --up-user-pad-v:        ${s.userBubblePaddingV}px;
      --up-user-pad-h:        ${s.userBubblePaddingH}px;
      --up-user-font-size:    ${s.userFontSize}px;
      --up-assist-bubble-bg:  ${s.assistBubbleBgColor};
      --up-assist-bubble-text:${s.assistBubbleTextColor};
      --up-assist-radius:     ${s.assistBubbleBorderRadius}px;
      --up-assist-maxw:       ${s.assistBubbleMaxWidth}%;
      --up-assist-pad-v:      ${s.assistBubblePaddingV}px;
      --up-assist-pad-h:      ${s.assistBubblePaddingH}px;
      --up-assist-font-size:  ${s.assistFontSize}px;
      --up-embed-bg:          ${s.embedBgColor};
      --up-embed-text:        ${s.embedTextColor};
      --up-composer-bg:       ${s.composerBgColor};
      --up-composer-text:     ${s.composerTextColor};
      --up-sidebar-bg:        ${s.sidebarBgColor};
      --up-sidebar-text:      ${s.sidebarTextColor};
      --up-sidebar-hover:     ${s.sidebarHoverColor};
      --up-sidebar-hover-text:${s.sidebarHoverTextColor};
      --up-sidebar-font-size: ${s.sidebarFontSize}px;
      --up-panel-bg:          ${s.matchUiToTheme ? s.pageBgColor : s.panelBgColor};
      --up-panel-text:        ${s.matchUiToTheme ? s.pageTextColor : s.panelTextColor};
      --up-panel-accent:      ${s.panelAccentColor};
      --up-panel-border:      ${s.panelBorderColor};
      --up-panel-opacity:     ${s.panelOpacity};
      --up-font-family:       ${s.fontFamily};
      --up-text-align:        ${s.textAlignment};
    }`;
    applyBodyClasses();
    log.info('Theme vars applied');
  }

  /**
   * Toggle body class flags that gate CSS rule blocks.
   */
  function applyBodyClasses() {
    const s = ThemeState.settings;
    const b = document.body;
    if (!b) return;
    const toggle = (cls, on) => b.classList.toggle(cls, on);
    toggle('up-theme-active',    s.featureThemeEnabled);
    toggle('up-bubble-active',   s.featureBubbleEnabled);
    toggle('up-embed-active',    s.featureEmbedEnabled);
    toggle('up-composer-active', s.featureComposerEnabled);
    toggle('up-sidebar-active',  s.featureSidebarEnabled);
    toggle('up-font-active',     s.featureFontEnabled);
    toggle('up-hide-warning',    s.featureHideWarning);
  }

  /**
   * Apply preset theme values into settings and rewrite theme vars.
   * @param {Object} preset
   */
  function applyPreset(preset) {
    Object.assign(ThemeState.settings, preset);
    ThemeState.settings = normalizeSettings(ThemeState.settings);
    applyThemeVars();
    debouncedSaveSettings();
    showNotification(`Theme "${preset.name}" applied`);
  }

  // ============================================================
  // §7 · PROMPT STORE & SCHEMA
  // ============================================================

  /**
   * Merged prompt schema (A + B combined).
   * @typedef {Object} Prompt
   * @property {string}   id              - unique key
   * @property {string}   title           - display name (max 80 chars)
   * @property {string}   text            - full prompt body
   * @property {boolean}  usePlaceholders - enable placeholder parsing
   * @property {boolean}  autoExecute     - click send after insert
   * @property {boolean}  isFixed         - pinned to top of list
   * @property {boolean}  favorite        - starred
   * @property {string}   type            - 'user' | 'ai'
   * @property {string[]} activeFileIds   - attached file IDs
   * @property {string[]} tags            - lowercase tag names
   * @property {number}   usageCount
   * @property {number}   position        - manual sort order
   * @property {string}   createdAt       - ISO 8601
   * @property {boolean}  expanded        - UI expand state
   */

  /**
   * Normalize a raw prompt object against the schema defaults.
   * @param {Object} raw
   * @returns {Prompt}
   */
  function normalizePrompt(raw = {}) {
    return {
      id:              raw.id              || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title:           String(raw.title    || 'Untitled').slice(0, 80),
      text:            String(raw.text     || ''),
      usePlaceholders: !!raw.usePlaceholders,
      autoExecute:     !!raw.autoExecute,
      isFixed:         !!raw.isFixed,
      favorite:        !!raw.favorite,
      type:            raw.type === 'ai' ? 'ai' : 'user',
      activeFileIds:   Array.isArray(raw.activeFileIds) ? raw.activeFileIds : [],
      tags:            Array.isArray(raw.tags) ? raw.tags.map(t => String(t).toLowerCase()) : [],
      usageCount:      typeof raw.usageCount === 'number' ? raw.usageCount : 0,
      position:        typeof raw.position  === 'number' ? raw.position  : 0,
      createdAt:       raw.createdAt || new Date().toISOString(),
      expanded:        !!raw.expanded,
    };
  }

  /** Load all prompts from GM storage into PromptState. */
  async function loadPrompts() {
    const raw = await Store.get(KEYS.PROMPTS, {});
    PromptState.prompts = Object.values(raw).map(normalizePrompt);
    log.info(`Loaded ${PromptState.prompts.length} prompts`);
  }

  /** Persist current PromptState.prompts to GM storage. */
  async function savePrompts() {
    const obj = {};
    PromptState.prompts.forEach(p => { obj[p.id] = p; });
    await Store.set(KEYS.PROMPTS, obj);
  }

  /** Add a new prompt and save. */
  async function addPrompt(raw) {
    const p = normalizePrompt(raw);
    p.position = PromptState.prompts.length;
    PromptState.prompts.push(p);
    await savePrompts();
    return p;
  }

  /** Update an existing prompt by id and save. */
  async function updatePrompt(id, changes) {
    const idx = PromptState.prompts.findIndex(p => p.id === id);
    if (idx < 0) return;
    PromptState.prompts[idx] = normalizePrompt(Object.assign({}, PromptState.prompts[idx], changes));
    await savePrompts();
  }

  /** Remove a prompt by id and save. */
  async function removePrompt(id) {
    PromptState.prompts = PromptState.prompts.filter(p => p.id !== id);
    await savePrompts();
  }

  /** Increment usageCount and reorder. */
  async function recordPromptUse(id) {
    await updatePrompt(id, {
      usageCount: (PromptState.prompts.find(p => p.id === id)?.usageCount || 0) + 1,
    });
  }

  /**
   * Filter and sort PromptState.prompts by current filter/sort state.
   * @returns {Prompt[]}
   */
  function getFilteredPrompts() {
    let list = [...PromptState.prompts];
    const q = PromptState.filterText.toLowerCase();
    const tag = PromptState.filterTag.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q));
    if (tag) list = list.filter(p => p.tags.includes(tag));
    // Sort
    const fixed = list.filter(p => p.isFixed);
    const rest  = list.filter(p => !p.isFixed);
    switch (PromptState.sortMode) {
      case 'az':        rest.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':        rest.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'most-used': rest.sort((a, b) => b.usageCount - a.usageCount); break;
      case 'least-used':rest.sort((a, b) => a.usageCount - b.usageCount); break;
      case 'newest':    rest.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'oldest':    rest.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      default:          rest.sort((a, b) => a.position - b.position);
    }
    return [...fixed, ...rest];
  }

  // ============================================================
  // §8 · PROMPT INSERTION ENGINE  (from Script B, adapted)
  // ============================================================

  /**
   * Clear the composer before inserting a new prompt.
   * @param {Element} composer
   */
  function robustClearEditor(composer) {
    if (!composer) return;
    try {
      if (composer.isContentEditable) {
        composer.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        return;
      }
    } catch (_) {/* */}
    composer.value = '';
    composer.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Move the cursor to the end of a contenteditable or textarea.
   * @param {Element} composer
   */
  function moveCursorToEnd(composer) {
    if (!composer) return;
    try {
      if (composer.isContentEditable) {
        const range = document.createRange();
        range.selectNodeContents(composer);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
    } catch (_) {/* */}
    const len = (composer.value || '').length;
    composer.setSelectionRange(len, len);
  }

  /**
   * Full prompt insertion pipeline:
   *  1. Resolve text (placeholders if needed)
   *  2. Clear composer
   *  3. Insert via platform adapter
   *  4. Move cursor to end
   *  5. Record usage
   *  6. Auto-execute if flagged
   *  7. Attach files if flagged
   * @param {Prompt} prompt
   */
  async function insertPromptIntoComposer(prompt) {
    const adapter = getAdapter();
    if (!adapter) { showNotification('Composer not found. Try refreshing.', 'error'); return; }

    // Re-discover composer if stale
    if (!UIState.composerEl || !document.body.contains(UIState.composerEl)) {
      UIState.composerEl = adapter.getComposerEl();
    }
    const composer = UIState.composerEl;
    if (!composer) { showNotification('Could not find the message input.', 'error'); return; }

    // Placeholder check
    let text = prompt.text;
    if (prompt.usePlaceholders && hasPlaceholders(text)) {
      text = await openPlaceholderModal(prompt);
      if (text === null) return; // user cancelled
    }

    robustClearEditor(composer);
    await sleep(30); // let React reconcile
    adapter.platformInsert(composer, text);
    moveCursorToEnd(composer);

    // Record usage
    await recordPromptUse(prompt.id);
    refreshPromptMenu();

    // Auto-execute
    if (prompt.autoExecute) {
      await sleep(80);
      const sendBtn = adapter.getSendButton();
      if (sendBtn) robustClick(sendBtn);
    }

    // File attach
    if (prompt.activeFileIds && prompt.activeFileIds.length > 0) {
      await forceFileAttach(prompt.activeFileIds);
    }
  }

  /**
   * Inject files from the global file store into the composer via DragEvent.
   * Falls back to ClipboardEvent if the drop zone is not found.
   * @param {string[]} fileIds
   */
  async function forceFileAttach(fileIds) {
    if (!fileIds || !fileIds.length) return;
    const allFiles = await Store.get(KEYS.GLOBAL_FILES, []);
    const toAttach = allFiles.filter(f => fileIds.includes(f.id));
    if (!toAttach.length) return;

    const fileObjects = toAttach.map(f => {
      try {
        const raw = f.data.split(',').pop();
        const binary = atob(raw);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new File([arr], f.name, { type: f.type || 'application/octet-stream' });
      } catch (_) { return null; }
    }).filter(Boolean);
    if (!fileObjects.length) return;

    // Strategy 1: drop zone DragEvent
    const dropZone = document.querySelector(
      '[data-testid="file-upload-drop-target"], .file-upload-zone, [aria-label*="upload"]'
    );
    if (dropZone) {
      try {
        const dt = new DataTransfer();
        fileObjects.forEach(f => dt.items.add(f));
        dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }));
        dropZone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, dataTransfer: dt }));
        dropZone.dispatchEvent(new DragEvent('drop',      { bubbles: true, dataTransfer: dt }));
        log.info('File attach via DragEvent:', fileObjects.length, 'file(s)');
        return;
      } catch (_) {/* fall through */}
    }
    // Strategy 2: ClipboardEvent paste on composer
    try {
      const dt = new DataTransfer();
      fileObjects.forEach(f => dt.items.add(f));
      if (UIState.composerEl) {
        UIState.composerEl.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
        log.info('File attach via ClipboardEvent:', fileObjects.length, 'file(s)');
        return;
      }
    } catch (_) {/* */}
    showNotification('File auto-attach failed — please attach manually.', 'error');
  }

  // ============================================================
  // §9 · PLACEHOLDER SYSTEM  (from Script B)
  // ============================================================

  /** Regex patterns for placeholder tokens */
  const PH = {
    INPUT:  /\[([^\]]+)\]/g,                  // [Label]
    SELECT: /##select\{([^}]+)\}(?:\[([^\]]+)\])?/g, // ##select{opt1,opt2}[Label]
    FILE:   /#file(?:\[([^\]]+)\])?/g,        // #file[Label]
  };

  /**
   * Check if a prompt text contains any placeholder tokens.
   * @param {string} text
   * @returns {boolean}
   */
  function hasPlaceholders(text) {
    PH.INPUT.lastIndex = 0; PH.SELECT.lastIndex = 0; PH.FILE.lastIndex = 0;
    return PH.INPUT.test(text) || PH.SELECT.test(text) || PH.FILE.test(text);
  }

  /**
   * Parse placeholder tokens from a prompt text into a structured array.
   * @param {string} text
   * @returns {Array<{type, label, options, key}>}
   */
  function parsePlaceholders(text) {
    const tokens = [];
    let match;
    const addedKeys = new Set();

    // INPUT
    PH.INPUT.lastIndex = 0;
    while ((match = PH.INPUT.exec(text)) !== null) {
      const key = `input:${match[1]}`;
      if (!addedKeys.has(key)) {
        tokens.push({ type: 'input', label: match[1], key });
        addedKeys.add(key);
      }
    }
    // SELECT
    PH.SELECT.lastIndex = 0;
    while ((match = PH.SELECT.exec(text)) !== null) {
      const key = `select:${match[2] || match[1]}`;
      if (!addedKeys.has(key)) {
        tokens.push({ type: 'select', label: match[2] || 'Choose', options: match[1].split(',').map(o => o.trim()), key });
        addedKeys.add(key);
      }
    }
    // FILE
    PH.FILE.lastIndex = 0;
    while ((match = PH.FILE.exec(text)) !== null) {
      const key = `file:${match[1] || 'File'}`;
      if (!addedKeys.has(key)) {
        tokens.push({ type: 'file', label: match[1] || 'Attach File', key });
        addedKeys.add(key);
      }
    }
    return tokens;
  }

  /**
   * Fill placeholder tokens in text with values map.
   * @param {string} text
   * @param {Map<string,string>} values
   * @returns {string}
   */
  function fillPlaceholders(text, values) {
    let out = text;
    PH.INPUT.lastIndex = 0;
    out = out.replace(PH.INPUT, (_, label) => values.get(`input:${label}`) || `[${label}]`);
    PH.SELECT.lastIndex = 0;
    out = out.replace(PH.SELECT, (_, opts, label) => values.get(`select:${label || opts}`) || opts.split(',')[0]);
    PH.FILE.lastIndex = 0;
    out = out.replace(PH.FILE, (_, label) => values.get(`file:${label || 'File'}`) || '');
    return out;
  }

  /**
   * Open the placeholder fill modal and return the filled text,
   * or null if the user cancelled.
   * @param {Prompt} prompt
   * @returns {Promise<string|null>}
   */
  function openPlaceholderModal(prompt) {
    return new Promise(resolve => {
      const tokens = parsePlaceholders(prompt.text);
      if (!tokens.length) return resolve(prompt.text);

      const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
      const box = el('div', { cls: 'up-modal-box' });

      const title = el('div', { cls: 'up-modal-title', text: `Fill in: ${prompt.title}` });
      const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
      closeBtn.onclick = () => { overlay.remove(); resolve(null); };

      const form = el('div');
      const values = new Map();

      tokens.forEach(token => {
        const group = el('div', { attrs: { style: 'margin-bottom:12px' } });
        const label = el('label', { text: token.label, attrs: { style: 'display:block;font-size:12px;margin-bottom:4px;opacity:0.7' } });
        group.appendChild(label);

        if (token.type === 'input') {
          const input = el('input', { attrs: { type: 'text', placeholder: token.label, style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box' } });
          input.oninput = () => values.set(token.key, input.value);
          group.appendChild(input);
        } else if (token.type === 'select') {
          const select = el('select', { attrs: { style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:var(--up-panel-bg,#1e1e2e);color:inherit;font-size:13px' } });
          token.options.forEach(opt => {
            const o = el('option', { text: opt, attrs: { value: opt } });
            select.appendChild(o);
          });
          values.set(token.key, token.options[0]);
          select.onchange = () => values.set(token.key, select.value);
          group.appendChild(select);
        } else if (token.type === 'file') {
          const input = el('input', { attrs: { type: 'file', style: 'font-size:12px' } });
          input.onchange = () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => values.set(token.key, e.target.result);
            reader.onerror = () => showNotification('File read error', 'error');
            reader.readAsText(file);
          };
          group.appendChild(input);
        }
        form.appendChild(group);
      });

      const insertBtn = el('button', { text: 'Insert', attrs: { style: 'padding:8px 20px;border-radius:8px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer;font-size:13px' } });
      insertBtn.onclick = () => {
        const filled = fillPlaceholders(prompt.text, values);
        overlay.remove();
        resolve(filled);
      };

      box.appendChild(closeBtn);
      box.appendChild(title);
      box.appendChild(form);
      box.appendChild(insertBtn);
      overlay.appendChild(box);
      overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
      document.body.appendChild(overlay);
    });
  }

  // ============================================================
  // §10 · AI ENHANCEMENT  [PHASE 1]
  // ============================================================

  // ------- §10.1  Provider routing (from Script B) -------

  const AI_PROVIDERS = {
    gemini: {
      endpoint: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      buildBody: (prompt, system) => ({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      }),
      extractText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
      authHeader: (key) => ({ 'x-goog-api-key': key }),
    },
    openrouter: {
      endpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
      buildBody: (prompt, system, model) => ({
        model,
        messages: system
          ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
          : [{ role: 'user', content: prompt }],
      }),
      extractText: (data) => data?.choices?.[0]?.message?.content || '',
      authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    },
    groq: {
      endpoint: () => 'https://api.groq.com/openai/v1/chat/completions',
      buildBody: (prompt, system, model) => ({
        model,
        messages: system
          ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
          : [{ role: 'user', content: prompt }],
      }),
      extractText: (data) => data?.choices?.[0]?.message?.content || '',
      authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    },
    huggingface: {
      // HuggingFace Inference API — model string is the repo ID, e.g. "huggingface/mistralai/Mixtral-8x7B-Instruct-v0.1"
      endpoint: (model) => `https://api-inference.huggingface.co/models/${model}`,
      buildBody: (prompt, system) => ({
        inputs: system ? `${system}\n\n${prompt}` : prompt,
        parameters: { max_new_tokens: 1024, return_full_text: false },
      }),
      extractText: (data) => {
        if (Array.isArray(data)) return data[0]?.generated_text || '';
        return data?.generated_text || '';
      },
      authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    },
    longcat: {
      // LongCat (OpenAI-compatible endpoint)
      endpoint: () => 'https://api.longcat.ai/v1/chat/completions',
      buildBody: (prompt, system, model) => ({
        model,
        messages: system
          ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
          : [{ role: 'user', content: prompt }],
      }),
      extractText: (data) => data?.choices?.[0]?.message?.content || '',
      authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    },
  };

  /** Validate AI provider/model string to prevent injection. */
  function validateModelString(str) {
    return /^(gemini|openrouter|groq|huggingface|longcat)\/[\w\-./]+$/.test(String(str));
  }

  /**
   * Get provider config and rotating API key for a model string.
   * @param {string} modelStr e.g. "gemini/gemini-1.5-flash"
   * @returns {{provider, model, key}|null}
   */
  function getProvider(modelStr) {
    if (!validateModelString(modelStr)) {
      log.warn('Invalid model string rejected:', modelStr);
      return null;
    }
    const [providerName, ...rest] = modelStr.split('/');
    const model = rest.join('/');
    const provider = AI_PROVIDERS[providerName];
    if (!provider) return null;
    const keyStr = AIState.config[`${providerName}Key`] || '';
    const keys = keyStr.split(',').map(k => k.trim()).filter(Boolean);
    if (!keys.length) return null;
    // Round-robin key rotation
    const idx = ((AIState.config[`${providerName}KeyIdx`] || 0) + 1) % keys.length;
    AIState.config[`${providerName}KeyIdx`] = idx;
    return { provider, model, key: keys[idx] };
  }

  /**
   * Call the configured AI API with a prompt.
   * @param {string} promptText
   * @param {string} [systemPrompt]
   * @returns {Promise<string>}
   */
  function callAI_API(promptText, systemPrompt = '') {
    return new Promise((resolve, reject) => {
      const modelStr = AIState.config.model || '';
      if (!modelStr) return reject(new Error('No AI model configured. Check Settings → AI.'));
      const prov = getProvider(modelStr);
      if (!prov) return reject(new Error('Invalid model or missing API key.'));
      const [providerName] = modelStr.split('/');
      const url = prov.provider.endpoint(prov.model);
      const body = prov.provider.buildBody(promptText, systemPrompt, prov.model);
      const headers = Object.assign({ 'Content-Type': 'application/json' }, prov.provider.authHeader(prov.key));
      GM_xmlhttpRequest({
        method: 'POST',
        url,
        headers,
        data: JSON.stringify(body),
        onload: (resp) => {
          try {
            const data = JSON.parse(resp.responseText);
            const text = prov.provider.extractText(data);
            if (!text) return reject(new Error('Empty response from AI provider.'));
            resolve(text);
          } catch (e) { reject(e); }
        },
        onerror: (e) => reject(new Error(`AI API network error: ${e.statusText || 'Unknown'}`)),
      });
    });
  }

  // ------- §10.2  Quick Enhance (composer-based, from Script A) -------

  /**
   * Wrap a prompt with enhancement instructions and insert into ChatGPT
   * for GPT itself to improve — zero-config, always available.
   * @param {string} originalText
   */
  async function quickEnhanceInComposer(originalText) {
    const instruction =
      `You are a professional prompt engineer. Improve the following prompt to be clearer, more specific, and more effective. ` +
      `Return ONLY the improved prompt text with no explanation or commentary.\n\n` +
      `Original prompt:\n${originalText}`;
    const adapter = getAdapter();
    if (!adapter) { showNotification('Composer not found.', 'error'); return; }
    if (!UIState.composerEl) UIState.composerEl = adapter.getComposerEl();
    robustClearEditor(UIState.composerEl);
    await sleep(30);
    adapter.platformInsert(UIState.composerEl, instruction);
    moveCursorToEnd(UIState.composerEl);
    showNotification('Quick Enhance inserted — press Send to get the improved prompt.');
  }

  // ------- §10.3  AI Enhance with diff modal (from Script B)  [PHASE 1] -------

  /**
   * Run AI Enhance on a prompt text and show the before/after diff modal.
   * @param {string} originalText
   */
  async function aiEnhanceWithDiff(originalText) {
    if (!AIState.config.model) {
      createDialogo('alert', 'AI Enhance', 'No AI model configured.\n\nGo to Settings → AI to add your API key and select a model.');
      return;
    }
    showNotification('Enhancing prompt…');
    let enhanced;
    try {
      enhanced = await callAI_API(
        originalText,
        AIState.config.systemPrompt || 'You are an expert prompt engineer. Return only the improved prompt.'
      );
    } catch (err) {
      createDialogo('alert', 'AI Enhance Error', err.message);
      return;
    }
    showAIDiffModal(originalText, enhanced);
  }

  /**
   * Show the side-by-side AI diff modal.
   * @param {string} original
   * @param {string} enhanced
   */
  function showAIDiffModal(original, enhanced) {
    const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(720px,96vw)' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();

    const title = el('div', { cls: 'up-modal-title', text: '✨ AI Enhanced Prompt' });

    const cols = el('div', { cls: 'up-diff-cols' });

    const leftCol = el('div', { cls: 'up-diff-col' });
    leftCol.appendChild(el('h4', { text: 'Original' }));
    const leftPre = el('pre');
    leftPre.textContent = original;
    leftCol.appendChild(leftPre);

    const rightCol = el('div', { cls: 'up-diff-col' });
    rightCol.appendChild(el('h4', { text: 'Enhanced' }));
    const rightPre = el('pre');
    rightPre.textContent = enhanced;
    rightCol.appendChild(rightPre);

    cols.appendChild(leftCol);
    cols.appendChild(rightCol);

    const actions = el('div', { attrs: { style: 'display:flex;gap:10px;margin-top:14px;justify-content:flex-end' } });

    const useBtn = el('button', { text: 'Use Enhanced', attrs: { style: 'padding:8px 18px;border-radius:8px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer' } });
    useBtn.onclick = async () => {
      overlay.remove();
      const adapter = getAdapter();
      if (!adapter) return;
      if (!UIState.composerEl) UIState.composerEl = adapter.getComposerEl();
      robustClearEditor(UIState.composerEl);
      await sleep(30);
      adapter.platformInsert(UIState.composerEl, enhanced);
      moveCursorToEnd(UIState.composerEl);
    };

    const saveBtn = el('button', { text: 'Save as New Prompt', attrs: { style: 'padding:8px 18px;border-radius:8px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer' } });
    saveBtn.onclick = async () => {
      await addPrompt({ title: 'Enhanced Prompt', text: enhanced, type: 'ai' });
      overlay.remove();
      showNotification('Enhanced prompt saved to library.');
      refreshPromptMenu();
    };

    const discardBtn = el('button', { text: 'Discard', attrs: { style: 'padding:8px 18px;border-radius:8px;border:none;background:transparent;color:inherit;opacity:0.6;cursor:pointer' } });
    discardBtn.onclick = () => overlay.remove();

    actions.appendChild(discardBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(useBtn);

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(cols);
    box.appendChild(actions);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ============================================================
  // §11 · INLINE # AUTOCOMPLETE + SMART EDITOR  (from Script B)
  // ============================================================

  let _inlineMenu = null;

  /**
   * Set up inline # autocomplete on the composer element.
   * @param {Element} composer
   */
  function setupInlineSuggestion(composer) {
    if (!composer) return;
    const handler = makeDebounce(() => handleInlineInput(composer), DEBOUNCE_INLINE);
    composer.addEventListener('input', handler);
    composer.addEventListener('keydown', handleInlineKeydown);
    document.addEventListener('click', closeInlineMenu);
    log.info('Inline suggest bound to composer');
  }

  function getTextBeforeCaret(el) {
    if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return '';
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      range.setStart(el, 0);
      return range.toString();
    }
    return (el.value || '').slice(0, el.selectionStart || 0);
  }

  function handleInlineInput(composer) {
    const before = getTextBeforeCaret(composer);
    const hashIdx = before.lastIndexOf('#');
    if (hashIdx < 0) { closeInlineMenu(); return; }
    const query = before.slice(hashIdx + 1).toLowerCase();
    // Only trigger if # is at word boundary
    if (hashIdx > 0 && /\w/.test(before[hashIdx - 1])) { closeInlineMenu(); return; }
    const matches = PromptState.prompts
      .filter(p => p.title.toLowerCase().includes(query))
      .slice(0, 8);
    if (!matches.length) { closeInlineMenu(); return; }
    PromptState.inlineMenuItems = matches;
    PromptState.inlineMenuIndex = -1;
    renderInlineMenu(composer, matches);
  }

  function handleInlineKeydown(e) {
    if (!_inlineMenu || _inlineMenu.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      PromptState.inlineMenuIndex = Math.min(PromptState.inlineMenuIndex + 1, PromptState.inlineMenuItems.length - 1);
      renderInlineMenuHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      PromptState.inlineMenuIndex = Math.max(PromptState.inlineMenuIndex - 1, 0);
      renderInlineMenuHighlight();
    } else if ((e.key === 'Enter' || e.key === 'Tab') && PromptState.inlineMenuIndex >= 0) {
      e.preventDefault();
      completeInlinePrompt(PromptState.inlineMenuItems[PromptState.inlineMenuIndex]);
    } else if (e.key === 'Escape') {
      closeInlineMenu();
    }
  }

  function renderInlineMenu(composer, items) {
    if (!_inlineMenu) {
      _inlineMenu = el('div', { id: 'up-inline-menu' });
      document.body.appendChild(_inlineMenu);
    }
    _inlineMenu.innerHTML = '';
    items.forEach((p, i) => {
      const item = el('div', { cls: 'up-inline-item' });
      item.textContent = p.title;
      item.dataset.idx = i;
      item.onclick = () => completeInlinePrompt(p);
      _inlineMenu.appendChild(item);
    });
    // Position near caret
    const rect = composer.getBoundingClientRect();
    _inlineMenu.style.left = `${rect.left}px`;
    _inlineMenu.style.top  = `${rect.top - Math.min(items.length * 34, 240) - 8}px`;
    _inlineMenu.style.display = 'block';
    _inlineMenu.classList.add('up-visible');
  }

  function renderInlineMenuHighlight() {
    if (!_inlineMenu) return;
    [..._inlineMenu.querySelectorAll('.up-inline-item')].forEach((item, i) => {
      item.classList.toggle('up-active', i === PromptState.inlineMenuIndex);
    });
  }

  function closeInlineMenu() {
    if (_inlineMenu) { _inlineMenu.style.display = 'none'; _inlineMenu.classList.remove('up-visible'); }
    PromptState.inlineMenuIndex = -1;
    PromptState.inlineMenuItems = [];
  }

  function completeInlinePrompt(prompt) {
    closeInlineMenu();
    const composer = UIState.composerEl;
    if (!composer) { insertPromptIntoComposer(prompt); return; }

    // Replace the #query text typed so far with nothing (the prompt insert will fill it)
    try {
      if (composer.isContentEditable) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          // Walk back from caret to find the '#' character
          const node = range.startContainer;
          const offset = range.startOffset;
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const beforeCaret = text.slice(0, offset);
            const hashIdx = beforeCaret.lastIndexOf('#');
            if (hashIdx >= 0) {
              // Delete from # to caret
              const delRange = document.createRange();
              delRange.setStart(node, hashIdx);
              delRange.setEnd(node, offset);
              delRange.deleteContents();
            }
          }
        }
      } else {
        const val = composer.value || '';
        const pos = composer.selectionStart || 0;
        const hashIdx = val.lastIndexOf('#', pos - 1);
        if (hashIdx >= 0) {
          composer.value = val.slice(0, hashIdx) + val.slice(pos);
          composer.setSelectionRange(hashIdx, hashIdx);
        }
      }
    } catch (_) {/* if replacement fails, just insert normally */}

    insertPromptIntoComposer(prompt);
  }

  // ---- Smart editor: bracket completion + macro wrapping + syntax backdrop ----

  const BRACKET_PAIRS = { '(': ')', '[': ']', '{': '}', '«': '»', '"': '"', "'": "'" };
  const BRACKET_CLOSES = new Set(Object.values(BRACKET_PAIRS));

  /**
   * Attach smart editor logic to a composer element.
   * Provides bracket pair completion, ##start/end macro wrapping, $var suggest.
   * @param {Element} composer
   */
  function attachSmartEditorLogic(composer) {
    if (!composer || composer.__upSmartEditor) return;
    composer.__upSmartEditor = true;

    // Insert syntax highlight backdrop for contenteditable
    let backdrop = null;
    if (composer.isContentEditable) {
      backdrop = createSyntaxBackdrop(composer);
    }

    composer.addEventListener('keydown', (e) => {
      // Bracket pair completion
      if (BRACKET_PAIRS[e.key]) {
        const closing = BRACKET_PAIRS[e.key];
        e.preventDefault();
        if (composer.isContentEditable) {
          document.execCommand('insertText', false, e.key + closing);
          // Move caret back one
          const sel = window.getSelection();
          if (sel && sel.rangeCount) {
            const r = sel.getRangeAt(0);
            r.setStart(r.startContainer, Math.max(0, r.startOffset - 1));
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        } else {
          const start = composer.selectionStart;
          const end   = composer.selectionEnd;
          const val   = composer.value;
          const selected = val.slice(start, end);
          const newVal = val.slice(0, start) + e.key + selected + closing + val.slice(end);
          composer.value = newVal;
          const newPos = selected.length ? end + 2 : start + 1;
          composer.setSelectionRange(start + 1, start + 1 + selected.length);
          composer.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      // Skip over closing bracket if already there
      if (BRACKET_CLOSES.has(e.key)) {
        const pos = composer.selectionStart;
        if (!composer.isContentEditable && composer.value[pos] === e.key) {
          e.preventDefault();
          composer.setSelectionRange(pos + 1, pos + 1);
          return;
        }
      }

      // ##start / ##end macro: wrap selection
      if (e.key === 'm' && e.altKey && e.shiftKey) {
        e.preventDefault();
        wrapWithMacro(composer);
        return;
      }
    });

    // Syntax highlight on input
    if (backdrop) {
      composer.addEventListener('input', makeDebounce(() => updateSyntaxBackdrop(composer, backdrop), 80));
      composer.addEventListener('scroll', () => {
        backdrop.scrollTop  = composer.scrollTop;
        backdrop.scrollLeft = composer.scrollLeft;
      });
    }
  }

  /**
   * Create and position a syntax-highlight backdrop div behind a textarea.
   * @param {Element} composer
   * @returns {Element|null}
   */
  function createSyntaxBackdrop(composer) {
    if (composer.isContentEditable) return null; // backdrop only for textarea
    const parent = composer.parentElement;
    if (!parent) return null;
    const bd = el('div', { cls: 'up-syntax-backdrop' });
    // Match textarea geometry
    const cs = getComputedStyle(composer);
    ['font', 'fontSize', 'fontFamily', 'lineHeight', 'padding', 'border',
     'boxSizing', 'wordWrap', 'whiteSpace', 'overflowWrap'].forEach(p => {
      bd.style[p] = cs[p];
    });
    bd.style.width  = composer.offsetWidth  + 'px';
    bd.style.height = composer.offsetHeight + 'px';
    parent.style.position = 'relative';
    parent.insertBefore(bd, composer);
    return bd;
  }

  /**
   * Update the syntax backdrop HTML to highlight placeholder tokens.
   * @param {Element} composer
   * @param {Element} backdrop
   */
  function updateSyntaxBackdrop(composer, backdrop) {
    if (!backdrop) return;
    let text = composer.value || '';
    // Escape HTML first, then apply span highlights
    let html = escapeHtml(text);
    html = html.replace(/\[([^\]]+)\]/g, '<span class="up-syntax-ph-input">[$1]</span>');
    html = html.replace(/##select\{[^}]+\}(?:\[[^\]]*\])?/g, m => `<span class="up-syntax-ph-select">${m}</span>`);
    html = html.replace(/#file(?:\[[^\]]*\])?/g, m => `<span class="up-syntax-ph-file">${m}</span>`);
    html = html.replace(/##(?:start|end)[^\n]*/g, m => `<span class="up-syntax-macro">${m}</span>`);
    html = html.replace(/\$\w+/g, m => `<span class="up-syntax-var">${m}</span>`);
    // Preserve trailing newlines for scroll sync
    backdrop.innerHTML = html + '\n';
  }

  /**
   * Wrap the current selection (or current line) with ##start / ##end macro markers.
   * @param {Element} composer
   */
  function wrapWithMacro(composer) {
    if (composer.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const selected = sel.toString();
        document.execCommand('insertText', false, `##start\n${selected}\n##end`);
      } else {
        document.execCommand('insertText', false, '##start\n\n##end');
      }
      return;
    }
    const start = composer.selectionStart;
    const end   = composer.selectionEnd;
    const val   = composer.value;
    const selected = val.slice(start, end);
    const wrapped  = `##start\n${selected || ''}\n##end`;
    composer.value = val.slice(0, start) + wrapped + val.slice(end);
    composer.setSelectionRange(start + 8, start + 8 + (selected.length || 0));
    composer.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ============================================================
  // §12 · CHAT MANAGEMENT  [PHASE 1]
  // ============================================================

  // ------- §12.1  Current chat Markdown export -------

  /**
   * Extract the current visible conversation as Markdown.
   * @returns {string}
   */
  function extractChatMarkdownFromDocument() {
    const messages = document.querySelectorAll('[data-message-author-role]');
    if (!messages.length) return '';
    const lines = [`# ChatGPT Export\n_Exported: ${new Date().toLocaleString()}_\n\n---\n`];
    messages.forEach(msg => {
      const role = msg.getAttribute('data-message-author-role');
      const header = role === 'user' ? '**You:**' : '**ChatGPT:**';
      const text = msg.innerText || msg.textContent || '';
      lines.push(`${header}\n${text.trim()}\n`);
    });
    return lines.join('\n');
  }

  /** Download current chat as a .md file. */
  function exportCurrentChatAsMarkdown() {
    const md = extractChatMarkdownFromDocument();
    if (!md) { showNotification('No messages found.', 'error'); return; }
    downloadTextFile(`chat-${Date.now()}.md`, md, 'text/markdown');
    showNotification('Chat exported.');
  }

  /**
   * Export a chat by its sidebar href (fetches via credentials).
   * @param {string} href
   * @returns {Promise<{href, md, error}>}
   */
  async function exportChatByHref(href) {
    // Open chat in a hidden iframe, wait for messages to render, scrape, remove iframe.
    // Falls back gracefully: if same-origin iframe is blocked, returns current page MD.
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      iframe.src = href;
      let settled = false;

      const finish = (md, error = null) => {
        if (settled) return;
        settled = true;
        try { iframe.remove(); } catch (_) {/* */}
        resolve({ href, md, error });
      };

      iframe.onload = () => {
        // Wait a moment for React to render messages
        setTimeout(() => {
          try {
            const iDoc = iframe.contentDocument;
            if (!iDoc) { finish(null, 'iframe blocked (cross-origin or CSP)'); return; }
            const messages = iDoc.querySelectorAll('[data-message-author-role]');
            if (!messages.length) { finish(null, 'No messages found in iframe'); return; }
            const title = iDoc.title || 'Chat Export';
            const lines = [`# ${escapeHtml(title)}\n_Exported: ${new Date().toLocaleString()}_\n\n---\n`];
            messages.forEach(msg => {
              const role = msg.getAttribute('data-message-author-role');
              const header = role === 'user' ? '**You:**' : '**ChatGPT:**';
              lines.push(`${header}\n${(msg.innerText || msg.textContent || '').trim()}\n`);
            });
            finish(lines.join('\n'));
          } catch (err) {
            finish(null, `Extraction error: ${err.message}`);
          }
        }, 2500);
      };

      iframe.onerror = () => finish(null, 'iframe load error');
      setTimeout(() => finish(null, 'iframe timeout'), 15000);
      document.body.appendChild(iframe);
    });
  }

  // ------- §12.2  Bulk export modal -------

  /** Open the bulk chat export / delete modal. [PHASE 1] */
  function openBulkChatModal(mode = 'export') {
    const items = getSidebarChatItems();
    if (!items.length) { showNotification('No sidebar chats found.', 'error'); return; }

    const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(540px,96vw)' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();

    const title = el('div', { cls: 'up-modal-title', text: mode === 'export' ? '📥 Bulk Export Chats' : '🗑 Bulk Delete Chats' });

    const selectAll = el('label', { attrs: { style: 'display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;cursor:pointer' } });
    const selectAllCb = el('input', { attrs: { type: 'checkbox' } });
    selectAll.appendChild(selectAllCb);
    selectAll.appendChild(document.createTextNode('Select all'));

    const list = el('div', { attrs: { style: 'max-height:320px;overflow-y:auto;margin:8px 0' } });
    const checkboxes = [];

    items.forEach(item => {
      const row = el('div', { attrs: { style: 'display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--up-panel-border,#444)' } });
      const cb = el('input', { attrs: { type: 'checkbox' } });
      cb.dataset.href = item.href || '';
      cb.dataset.title = item.title || 'Untitled';
      const label = el('span', { text: item.title || 'Untitled', attrs: { style: 'font-size:12px;flex:1' } });
      row.appendChild(cb);
      row.appendChild(label);
      list.appendChild(row);
      checkboxes.push(cb);
    });

    selectAllCb.onchange = () => checkboxes.forEach(cb => { cb.checked = selectAllCb.checked; });

    const actionBtn = el('button', {
      text: mode === 'export' ? 'Export Selected' : 'Delete Selected',
      attrs: { style: `padding:8px 18px;border-radius:8px;border:none;background:${mode === 'delete' ? '#f38ba8' : 'var(--up-panel-accent,#89b4fa)'};color:#fff;font-weight:600;cursor:pointer` }
    });
    actionBtn.onclick = async () => {
      const selected = checkboxes.filter(cb => cb.checked);
      if (!selected.length) { showNotification('No chats selected.'); return; }

      if (mode === 'delete') {
        const ok = await createDialogo('confirm', 'Confirm Delete', `Delete ${selected.length} chat(s)? This cannot be undone.`);
        if (!ok) return;
        overlay.remove();
        await bulkDeleteChats(selected.map(cb => cb.dataset.href));
      } else {
        overlay.remove();
        // Export current chat only for Phase 1
        exportCurrentChatAsMarkdown();
        showNotification(`Exported ${selected.length} chat(s). Full bulk export coming in Phase 2.`);
      }
    };

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(selectAll);
    box.appendChild(list);
    box.appendChild(actionBtn);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ------- §12.3  Sidebar chat items -------

  /**
   * Get all chat items from the sidebar.
   * @returns {Array<{href, title, el}>}
   */
  function getSidebarChatItems() {
    const results = [];
    const selectors = [
      'nav a[href*="/c/"]',
      '[data-testid*="conversation"] a',
      'li a[href*="/c/"]',
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length) {
        els.forEach(a => {
          results.push({
            href:  a.href || a.getAttribute('href'),
            title: a.textContent.trim() || 'Untitled',
            el:    a,
          });
        });
        break;
      }
    }
    return results;
  }

  // ------- §12.4  Bulk delete -------

  /**
   * Bulk delete sidebar chats by href.
   * Attempts to find and click the delete/confirm UI for each chat.
   * @param {string[]} hrefs
   */
  async function bulkDeleteChats(hrefs) {
    let succeeded = 0, failed = 0;
    for (const href of hrefs) {
      try {
        await deleteChatFromSidebarItem(href);
        succeeded++;
        await sleep(400); // rate-limit UI actions
      } catch (err) {
        log.error('Delete failed for', href, err);
        failed++;
      }
    }
    const msg = failed
      ? `Deleted ${succeeded} chat(s). ${failed} failed.`
      : `Deleted ${succeeded} chat(s).`;
    showNotification(msg);
  }

  /**
   * Delete a single chat by clicking its sidebar item's delete controls.
   * @param {string} href
   */
  async function deleteChatFromSidebarItem(href) {
    // Find the sidebar link for this href
    const link = document.querySelector(`a[href="${new URL(href, location.origin).pathname}"]`);
    if (!link) throw new Error('Chat link not found in sidebar');

    // Hover to reveal the action menu / three-dot button
    link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(200);

    // Look for delete / more-options button near the link
    const parent = link.closest('li') || link.parentElement;
    const moreBtn = parent?.querySelector('button[aria-haspopup], button[aria-label*="more"], button[aria-label*="option"]');
    if (moreBtn) robustClick(moreBtn);
    await sleep(200);

    // Click "Delete" in dropdown
    const deleteBtn = document.querySelector('[role="menuitem"][data-testid*="delete"], [role="menuitem"]');
    if (!deleteBtn) throw new Error('Delete menu item not found');
    // Find the one with "delete" text
    const allMenuItems = document.querySelectorAll('[role="menuitem"]');
    let delItem = null;
    for (const item of allMenuItems) {
      if ((item.textContent || '').toLowerCase().includes('delete')) { delItem = item; break; }
    }
    if (!delItem) throw new Error('Delete menu item not found');
    robustClick(delItem);
    await sleep(300);

    // Confirm dialog
    const confirmBtn = document.querySelector('button[data-testid*="confirm"], button[data-testid*="delete"]');
    if (confirmBtn) {
      robustClick(confirmBtn);
      await sleep(400);
    }
  }

  // ------- §12.5  Sidebar quick-delete buttons -------

  /**
   * Inject a 🗑 quick-delete button onto every sidebar chat row.
   */
  function ensureSidebarDeleteButtons() {
    if (UIState.currentPlatform !== 'chatgpt') return;
    const items = getSidebarChatItems();
    items.forEach(item => {
      const parent = item.el.closest('li') || item.el.parentElement;
      if (!parent || parent.querySelector('.up-sidebar-del-btn')) return;
      const btn = el('button', { cls: 'up-sidebar-del-btn', text: '🗑', attrs: { title: 'Delete chat', 'aria-label': 'Delete chat' } });
      btn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const ok = await createDialogo('confirm', 'Delete Chat', `Delete "${item.title}"?`);
        if (!ok) return;
        try { await deleteChatFromSidebarItem(item.href); showNotification('Chat deleted.'); }
        catch (err) { showNotification('Delete failed. Try manually.', 'error'); }
      };
      parent.style.position = 'relative';
      parent.appendChild(btn);
    });
  }

  // ------- §12.6  New Chat with Prompt -------

  function setPendingPrompt(text) {
    try { sessionStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify({ text, ts: Date.now() })); }
    catch (_) { /* ignore */ }
  }

  function consumePendingPromptIfReady() {
    try {
      const raw = sessionStorage.getItem(PENDING_PROMPT_KEY);
      if (!raw) return;
      const { text, ts } = JSON.parse(raw);
      if (Date.now() - ts > 30000) { sessionStorage.removeItem(PENDING_PROMPT_KEY); return; } // stale
      sessionStorage.removeItem(PENDING_PROMPT_KEY);
      setTimeout(async () => {
        const adapter = getAdapter();
        if (!adapter) return;
        UIState.composerEl = await waitFor('[data-testid="chat-input"], #prompt-textarea', 5000);
        if (!UIState.composerEl) return;
        const fakePrompt = normalizePrompt({ text });
        insertPromptIntoComposer(fakePrompt);
      }, 600);
    } catch (_) { sessionStorage.removeItem(PENDING_PROMPT_KEY); }
  }

  /** Open a new ChatGPT chat and pre-load a prompt. */
  function startNewChatWithPrompt(text) {
    setPendingPrompt(text);
    location.href = 'https://chatgpt.com/';
  }

  // ============================================================
  // §13 · INDEXEDDB PIN PERSISTENCE  (from Script B)
  // ============================================================

  function openPinDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE, { keyPath: 'chatId' });
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function loadPinsFromDB(chatId) {
    try {
      const db = await openPinDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(chatId);
        req.onsuccess = () => resolve((req.result && req.result.pins) || []);
        req.onerror   = () => reject(req.error);
      });
    } catch (err) { log.error('loadPinsFromDB', err); return []; }
  }

  async function savePinsToDB(chatId, pins) {
    try {
      const db = await openPinDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ chatId, pins });
        tx.oncomplete = resolve;
        tx.onerror    = () => reject(tx.error);
      });
    } catch (err) { log.error('savePinsToDB', err); }
  }

  // ============================================================
  // §14 · NAV WIDGET & PINNED CAROUSEL  (from Script B)
  // ============================================================

  /**
   * Scan all visible chat messages into NavState.cachedMessages.
   * @returns {Array<{el, role, text, idx}>}
   */
  function scanMessages() {
    const msgs = [...document.querySelectorAll('[data-message-author-role]')];
    NavState.cachedMessages = msgs.map((el, idx) => ({
      el,
      role: el.getAttribute('data-message-author-role') || 'unknown',
      text: (el.innerText || el.textContent || '').trim().slice(0, 120),
      idx,
    }));
    return NavState.cachedMessages;
  }

  /**
   * Navigate to the message at index, scrolling it into view.
   * @param {number} idx
   */
  function navigateToMessage(idx) {
    const msgs = NavState.cachedMessages;
    if (!msgs.length) return;
    const clamped = Math.max(0, Math.min(idx, msgs.length - 1));
    NavState.currentNavIndex = clamped;
    const target = msgs[clamped];
    if (target && target.el) {
      target.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Brief highlight
      target.el.style.outline = '2px solid var(--up-panel-accent, #89b4fa)';
      setTimeout(() => { target.el.style.outline = ''; }, 800);
    }
    updateNavCounter();
  }

  function updateNavCounter() {
    const counter = document.getElementById('up-nav-counter');
    if (counter) {
      counter.textContent = NavState.cachedMessages.length
        ? `${NavState.currentNavIndex + 1}/${NavState.cachedMessages.length}`
        : '—';
    }
  }

  /**
   * Build and show the message index popup.
   */
  function toggleMsgIndexPopup() {
    let popup = document.getElementById('up-msg-index-popup');
    if (popup) { popup.classList.toggle('up-visible'); return; }

    popup = el('div', { id: 'up-msg-index-popup' });
    scanMessages();
    NavState.cachedMessages.forEach((msg, i) => {
      const item = el('div', { cls: 'up-msg-index-item' + (NavState.savedPins.some(p => p.idx === i) ? ' up-pinned-msg' : '') });
      const role = el('span', { cls: 'up-msg-role', text: msg.role === 'user' ? 'You' : 'AI' });
      const text = el('span', { text: msg.text || '(empty)' });
      item.appendChild(role);
      item.appendChild(text);
      item.onclick = () => { navigateToMessage(i); popup.classList.remove('up-visible'); };
      popup.appendChild(item);
    });
    document.body.appendChild(popup);

    // Position near nav container
    const nav = document.getElementById('up-nav-container');
    if (nav) {
      const r = nav.getBoundingClientRect();
      popup.style.bottom = `${window.innerHeight - r.top + 4}px`;
      popup.style.right  = `${window.innerWidth - r.right + 32}px`;
    }
    popup.classList.add('up-visible');
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && !e.target.closest('#up-nav-container')) {
        popup.classList.remove('up-visible');
        document.removeEventListener('click', closePopup);
      }
    });
  }

  /**
   * Add pin button to each chat message on hover.
   */
  function injectPinButtons() {
    document.querySelectorAll('[data-message-author-role]').forEach((msg, idx) => {
      if (msg.querySelector('.up-pin-msg-btn')) return;
      const btn = el('button', { cls: 'up-pin-msg-btn', text: '📌', attrs: { title: 'Pin message', 'aria-label': 'Pin message' } });
      btn.onclick = async (e) => {
        e.stopPropagation();
        const text = (msg.innerText || msg.textContent || '').trim().slice(0, 300);
        const role = msg.getAttribute('data-message-author-role');
        const chatId = location.pathname;
        NavState.savedPins = await loadPinsFromDB(chatId);
        const alreadyPinned = NavState.savedPins.findIndex(p => p.idx === idx);
        if (alreadyPinned >= 0) {
          NavState.savedPins.splice(alreadyPinned, 1);
          btn.style.color = '';
          showNotification('Message unpinned.');
        } else {
          NavState.savedPins.push({ idx, text, role, ts: Date.now() });
          btn.style.color = '#f9e2af';
          showNotification('Message pinned.');
        }
        await savePinsToDB(chatId, NavState.savedPins);
        renderCarousel();
      };
      msg.appendChild(btn);
    });
  }

  /**
   * Render / update the pinned message carousel.
   */
  async function renderCarousel() {
    const chatId = location.pathname;
    NavState.savedPins = await loadPinsFromDB(chatId);

    let wrapper = document.getElementById('up-pinned-carousel-wrapper');
    if (!wrapper) {
      wrapper = el('div', { id: 'up-pinned-carousel-wrapper' });
      document.body.appendChild(wrapper);
    }
    wrapper.innerHTML = '';

    if (!NavState.savedPins.length) { wrapper.classList.remove('up-visible'); return; }
    wrapper.classList.add('up-visible');

    const prevBtn = el('button', { cls: 'up-carousel-nav-btn', text: '‹', attrs: { title: 'Previous pinned' } });
    prevBtn.onclick = () => {
      NavState.currentPinnedCenterIdx = Math.max(0, NavState.currentPinnedCenterIdx - 1);
      renderCarouselCards(wrapper, prevBtn, nextBtn);
    };

    const nextBtn = el('button', { cls: 'up-carousel-nav-btn', text: '›', attrs: { title: 'Next pinned' } });
    nextBtn.onclick = () => {
      NavState.currentPinnedCenterIdx = Math.min(NavState.savedPins.length - 1, NavState.currentPinnedCenterIdx + 1);
      renderCarouselCards(wrapper, prevBtn, nextBtn);
    };

    wrapper.appendChild(prevBtn);
    renderCarouselCards(wrapper, prevBtn, nextBtn);
    wrapper.appendChild(nextBtn);
    makeDraggable(wrapper, wrapper);
  }

  function renderCarouselCards(wrapper, prevBtn, nextBtn) {
    // Remove existing cards
    [...wrapper.querySelectorAll('.up-carousel-card')].forEach(c => c.remove());
    // Show ±1 around current center
    const pins = NavState.savedPins;
    const center = NavState.currentPinnedCenterIdx;
    const visible = [center - 1, center, center + 1].filter(i => i >= 0 && i < pins.length);
    // Insert before nextBtn
    visible.forEach(i => {
      const pin = pins[i];
      const card = el('div', { cls: 'up-carousel-card' + (i === center ? '' : '') });
      const textEl = el('div', { cls: 'up-carousel-card-text', text: pin.text });
      const unpin = el('button', { cls: 'up-carousel-card-unpin', text: '×', attrs: { title: 'Unpin' } });
      unpin.onclick = async (e) => {
        e.stopPropagation();
        NavState.savedPins = NavState.savedPins.filter((_, idx) => idx !== i);
        await savePinsToDB(location.pathname, NavState.savedPins);
        renderCarousel();
      };
      card.onclick = () => { if (pin.idx !== undefined) navigateToMessage(pin.idx); };
      card.appendChild(unpin);
      card.appendChild(textEl);
      wrapper.insertBefore(card, nextBtn);
    });
    prevBtn.disabled = center <= 0;
    nextBtn.disabled = center >= pins.length - 1;
  }

  /**
   * Create the nav widget (prev/next buttons + counter + index popup trigger).
   */
  async function createNavInterface() {
    if (document.getElementById('up-nav-container')) return;
    if (UIState.currentPlatform !== 'chatgpt') return;

    scanMessages();
    if (!NavState.cachedMessages.length) return;

    const container = el('div', { id: 'up-nav-container' });

    const prevBtn = el('button', { cls: 'up-nav-btn', text: '▲', attrs: { title: 'Previous message (Alt+↑)', 'aria-label': 'Previous message' } });
    prevBtn.onclick = () => { navigateToMessage(NavState.currentNavIndex - 1); };

    const counter = el('div', { cls: 'up-nav-idx', id: 'up-nav-counter' });
    counter.onclick = toggleMsgIndexPopup;
    counter.style.cursor = 'pointer';
    counter.title = 'Click to open message index';

    const nextBtn = el('button', { cls: 'up-nav-btn', text: '▼', attrs: { title: 'Next message (Alt+↓)', 'aria-label': 'Next message' } });
    nextBtn.onclick = () => { navigateToMessage(NavState.currentNavIndex + 1); };

    container.appendChild(prevBtn);
    container.appendChild(counter);
    container.appendChild(nextBtn);
    document.body.appendChild(container);
    NavState.navContainer = container;
    updateNavCounter();

    // Scroll buttons
    const scrollTop = el('button', { cls: 'up-scroll-btn up-scroll-top', text: '⬆', attrs: { title: 'Scroll to top', 'aria-label': 'Scroll to top' } });
    scrollTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollBottom = el('button', { cls: 'up-scroll-btn up-scroll-bottom', text: '⬇', attrs: { title: 'Scroll to bottom', 'aria-label': 'Scroll to bottom' } });
    scrollBottom.onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    document.body.appendChild(scrollTop);
    document.body.appendChild(scrollBottom);

    // Pin buttons + carousel
    injectPinButtons();
    await renderCarousel();

    // Additional keyboard shortcuts for navigation
    document.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp')   { e.preventDefault(); navigateToMessage(NavState.currentNavIndex - 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateToMessage(NavState.currentNavIndex + 1); }
    });

    log.info('Nav interface created,', NavState.cachedMessages.length, 'messages indexed');
  }

  // ============================================================
  // §15 · GIST INTEGRATION  (from Script B)
  // ============================================================

  /**
   * Open the Gist import/export modal.
   */
  function initGistIntegration() {
    // Called from Settings panel — adds Gist section
    log.info('Gist integration ready');
  }

  function openGistModal() {
    const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(500px,96vw)' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();
    const title = el('div', { cls: 'up-modal-title', text: '🐙 GitHub Gist Integration' });

    const info = el('div', { cls: 'up-gist-token-info', html: 'Requires a GitHub Personal Access Token with <code>gist</code> scope.<br>Token is stored locally in GM storage (never transmitted except to api.github.com).' });

    const tokenRow = el('div', { attrs: { style: 'margin-bottom:10px' } });
    tokenRow.appendChild(el('label', { text: 'GitHub Token:', attrs: { style: 'display:block;font-size:11px;margin-bottom:3px;opacity:0.7' } }));
    const tokenInput = el('input', { attrs: { type: 'password', placeholder: 'ghp_…', style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box' } });
    tokenInput.value = AIState.config.gistToken || '';
    tokenInput.oninput = () => { AIState.config.gistToken = tokenInput.value; Store.set(KEYS.AI_CONFIG, AIState.config); };
    tokenRow.appendChild(tokenInput);

    const gistIdRow = el('div', { attrs: { style: 'margin-bottom:14px' } });
    gistIdRow.appendChild(el('label', { text: 'Gist ID (leave blank to create new):', attrs: { style: 'display:block;font-size:11px;margin-bottom:3px;opacity:0.7' } }));
    const gistIdInput = el('input', { attrs: { type: 'text', placeholder: 'abc123…', style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box' } });
    gistIdInput.value = AIState.config.gistId || '';
    gistIdInput.oninput = () => { AIState.config.gistId = gistIdInput.value; Store.set(KEYS.AI_CONFIG, AIState.config); };
    gistIdRow.appendChild(gistIdInput);

    const status = el('div', { attrs: { style: 'font-size:11px;min-height:18px;opacity:0.7;margin-bottom:10px' } });

    const btnRow = el('div', { attrs: { style: 'display:flex;gap:8px' } });

    const exportBtn = el('button', { text: '📤 Export to Gist', attrs: { style: 'flex:1;padding:8px;border-radius:7px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer;font-size:12px' } });
    exportBtn.onclick = async () => {
      status.textContent = 'Exporting…';
      try {
        const gistId = await exportPromptsToGist(tokenInput.value.trim(), gistIdInput.value.trim());
        AIState.config.gistId = gistId;
        gistIdInput.value = gistId;
        Store.set(KEYS.AI_CONFIG, AIState.config);
        status.textContent = `✓ Exported to Gist ${gistId}`;
      } catch (err) { status.textContent = `✗ ${err.message}`; }
    };

    const importBtn = el('button', { text: '📥 Import from Gist', attrs: { style: 'flex:1;padding:8px;border-radius:7px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px' } });
    importBtn.onclick = async () => {
      if (!gistIdInput.value.trim()) { status.textContent = '✗ Enter a Gist ID to import.'; return; }
      status.textContent = 'Importing…';
      try {
        const count = await importPromptsFromGist(tokenInput.value.trim(), gistIdInput.value.trim());
        status.textContent = `✓ Imported ${count} prompt(s).`;
        refreshPromptMenu();
        if (_panel) switchPanelPage('prompts');
      } catch (err) { status.textContent = `✗ ${err.message}`; }
    };

    btnRow.appendChild(exportBtn);
    btnRow.appendChild(importBtn);
    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(info);
    box.appendChild(tokenRow);
    box.appendChild(gistIdRow);
    box.appendChild(status);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  /**
   * Export current prompt library to a GitHub Gist.
   * @param {string} token
   * @param {string} [existingGistId]
   * @returns {Promise<string>} gist ID
   */
  function exportPromptsToGist(token, existingGistId = '') {
    return new Promise((resolve, reject) => {
      if (!token) return reject(new Error('No GitHub token provided.'));
      const obj = {};
      PromptState.prompts.forEach(p => { obj[p.id] = p; });
      const content = JSON.stringify(obj, null, 2);
      const method = existingGistId ? 'PATCH' : 'POST';
      const url = existingGistId
        ? `https://api.github.com/gists/${existingGistId}`
        : 'https://api.github.com/gists';
      GM_xmlhttpRequest({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        data: JSON.stringify({
          description: 'Unleashed Prompt — prompt library backup',
          public: false,
          files: { 'up-prompts.json': { content } },
        }),
        onload: (resp) => {
          try {
            const data = JSON.parse(resp.responseText);
            if (!data.id) return reject(new Error(data.message || 'Gist API error'));
            resolve(data.id);
          } catch (e) { reject(e); }
        },
        onerror: () => reject(new Error('Network error reaching api.github.com')),
      });
    });
  }

  /**
   * Import prompts from a GitHub Gist.
   * @param {string} token
   * @param {string} gistId
   * @returns {Promise<number>} count of imported prompts
   */
  function importPromptsFromGist(token, gistId) {
    return new Promise((resolve, reject) => {
      if (!gistId) return reject(new Error('No Gist ID provided.'));
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://api.github.com/gists/${gistId}`,
        headers: token
          ? { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
          : { Accept: 'application/vnd.github.v3+json' },
        onload: async (resp) => {
          try {
            const data = JSON.parse(resp.responseText);
            if (!data.files) return reject(new Error(data.message || 'Gist not found'));
            const file = data.files['up-prompts.json'] || Object.values(data.files)[0];
            if (!file) return reject(new Error('No prompt file found in Gist'));
            const raw = file.content || '';
            const parsed = JSON.parse(raw);
            const arr = Array.isArray(parsed) ? parsed : Object.values(parsed);
            let count = 0;
            for (const p of arr) {
              await addPrompt(p);
              count++;
            }
            resolve(count);
          } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
        },
        onerror: () => reject(new Error('Network error')),
      });
    });
  }

  // ============================================================
  // §16 · BACKUP / RESTORE  (from Script B)
  // ============================================================

  /**
   * Export all GM storage keys to a single timestamped JSON backup file.
   */
  async function exportAllData() {
    const backup = { _meta: { version: SCRIPT_VERSION, date: new Date().toISOString() } };
    for (const key of Object.values(KEYS)) {
      try { backup[key] = await Store.get(key, null); } catch (_) { backup[key] = null; }
    }
    downloadTextFile(`up-backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
    showNotification('Backup exported.');
  }

  /**
   * Open the backup/restore modal.
   */
  function openBackupModal() {
    const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(480px,96vw)' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();
    const title = el('div', { cls: 'up-modal-title', text: '💾 Backup & Restore' });

    // Export section
    const expSection = el('div', { attrs: { style: 'margin-bottom:16px' } });
    expSection.appendChild(el('div', { cls: 'up-section-label', text: 'Export' }));
    const expBtn = el('button', { text: '📥 Export Full Backup (.json)', attrs: { style: 'width:100%;padding:8px;border-radius:7px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px;text-align:left' } });
    expBtn.onclick = () => { exportAllData(); overlay.remove(); };
    expSection.appendChild(expBtn);

    // Import section
    const impSection = el('div');
    impSection.appendChild(el('div', { cls: 'up-section-label', text: 'Selective Restore' }));
    impSection.appendChild(el('div', { text: 'Select which data to restore from a backup file:', attrs: { style: 'font-size:11px;opacity:0.6;margin-bottom:8px' } }));

    const keyList = el('div');
    const KEY_LABELS = {
      [KEYS.SETTINGS]: 'Appearance settings',
      [KEYS.PROMPTS]:  'Prompt library',
      [KEYS.THEMES]:   'Saved themes',
      [KEYS.IMPORTED_THEMES]: 'Imported themes',
      [KEYS.GLOBAL_FILES]: 'Global file store',
      [KEYS.TAGS]:     'Tag definitions',
      [KEYS.AI_CONFIG]:'AI configuration',
      [KEYS.SHORTCUTS]:'Keyboard shortcuts',
      [KEYS.NAV_CONFIG]:'Nav widget config',
    };
    const checkboxes = {};
    Object.entries(KEY_LABELS).forEach(([key, label]) => {
      const row = el('div', { cls: 'up-backup-key-row' });
      const lbl = el('label');
      const cb = el('input', { attrs: { type: 'checkbox', checked: 'true' } });
      cb.checked = true;
      checkboxes[key] = cb;
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + label));
      row.appendChild(lbl);
      keyList.appendChild(row);
    });
    impSection.appendChild(keyList);

    const status = el('div', { attrs: { style: 'font-size:11px;min-height:18px;opacity:0.7;margin:8px 0' } });

    const impBtn = el('button', { text: '📤 Choose Backup File & Restore', attrs: { style: 'width:100%;padding:8px;margin-top:8px;border-radius:7px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer;font-size:12px' } });
    impBtn.onclick = () => {
      const inp = el('input', { attrs: { type: 'file', accept: '.json' } });
      inp.onchange = async () => {
        const file = inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const backup = JSON.parse(ev.target.result);
            const selected = Object.entries(checkboxes).filter(([, cb]) => cb.checked).map(([key]) => key);
            let restored = 0;
            for (const key of selected) {
              if (backup[key] !== undefined && backup[key] !== null) {
                await Store.set(key, backup[key]);
                Store.invalidate(key);
                restored++;
              }
            }
            status.textContent = `✓ Restored ${restored} data sections. Reload page to apply.`;
          } catch (_) { status.textContent = '✗ Invalid backup file.'; }
        };
        reader.readAsText(file);
      };
      inp.click();
    };
    impSection.appendChild(status);
    impSection.appendChild(impBtn);

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(expSection);
    box.appendChild(impSection);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ============================================================
  // §17 · KEYBOARD SHORTCUTS  (from Script B)
  // ============================================================

  const DEFAULT_SHORTCUTS = {
    openPromptMenu:  { key: 'p', alt: true,  ctrl: false, shift: false },
    openSettings:    { key: 's', alt: true,  ctrl: false, shift: false },
    aiEnhance:       { key: 'e', alt: true,  ctrl: false, shift: false },
    quickEnhance:    { key: 'q', alt: true,  ctrl: false, shift: false },
    exportChat:      { key: 'm', alt: true,  ctrl: false, shift: false },
    scrollTop:       { key: 'Home', alt: false, ctrl: false, shift: false },
    scrollBottom:    { key: 'End',  alt: false, ctrl: false, shift: false },
    newChat:         { key: 'n', alt: true,  ctrl: false, shift: false },
  };

  async function loadShortcuts() {
    const saved = await Store.get(KEYS.SHORTCUTS, {});
    AIState.currentShortcuts = Object.assign({}, DEFAULT_SHORTCUTS, saved);
  }

  /**
   * Check if a keyboard event matches a shortcut definition.
   * @param {KeyboardEvent} e
   * @param {Object} sc
   * @returns {boolean}
   */
  function isShortcutPressed(e, sc) {
    if (!sc) return false;
    return e.key === sc.key &&
      !!e.altKey  === !!sc.alt &&
      !!e.ctrlKey === !!sc.ctrl &&
      !!e.shiftKey === !!sc.shift;
  }

  // ============================================================
  // §18 · UPDATE CHECKER  (from Script A — self-contained fetch)
  // ============================================================

  /**
   * Fetch the latest version from GitHub and notify if newer.
   * @param {boolean} [silent=true] — if true, only show notification on update available
   */
  async function checkForUserscriptUpdate(silent = true) {
    // Only allow raw.githubusercontent.com to prevent SSRF
    if (!UPDATE_URL.startsWith('https://raw.githubusercontent.com/')) {
      log.warn('Update URL is not raw.githubusercontent.com — skipping check');
      return;
    }
    try {
      const resp = await fetch(`${UPDATE_URL}?_=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const match = text.match(/@version\s+([\d.]+)/);
      if (!match) return;
      const remote = match[1];
      if (semverGt(remote, SCRIPT_VERSION)) {
        showNotification(`🔔 Update available: v${remote}. Click to install.`, 'info', 8000, () => {
          window.open(UPDATE_URL, '_blank');
        });
      } else if (!silent) {
        showNotification(`✓ Up to date (v${SCRIPT_VERSION})`);
      }
    } catch (err) {
      if (!silent) showNotification('Update check failed.', 'error');
      log.warn('Update check error:', err);
    }
  }

  /**
   * Simple semantic version greater-than comparison.
   * @param {string} a
   * @param {string} b
   * @returns {boolean} a > b
   */
  function semverGt(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return true;
      if ((pa[i] || 0) < (pb[i] || 0)) return false;
    }
    return false;
  }

  // ============================================================
  // §19 · UI — SHARED COMPONENTS
  // ============================================================

  // ------- §19.1  Toast notification -------

  let _notifEl = null;
  let _notifTimer = null;

  /**
   * Show a non-blocking toast notification.
   * @param {string} message
   * @param {'info'|'error'} [type='info']
   * @param {number} [duration=3000]
   * @param {Function} [onClick]
   */
  function showNotification(message, type = 'info', duration = 3000, onClick = null) {
    if (!_notifEl) {
      _notifEl = el('div', { id: 'up-global-notification' });
      document.body.appendChild(_notifEl);
    }
    clearTimeout(_notifTimer);
    _notifEl.textContent = message;
    _notifEl.style.background = type === 'error' ? '#f38ba8' : '#313244';
    _notifEl.style.color = type === 'error' ? '#fff' : '#cdd6f4';
    _notifEl.style.cursor = onClick ? 'pointer' : 'default';
    _notifEl.onclick = onClick || null;
    _notifEl.classList.add('up-visible');
    _notifTimer = setTimeout(() => _notifEl.classList.remove('up-visible'), duration);
  }

  // ------- §19.2  Custom dialog -------

  /**
   * In-page alert / confirm dialog replacing window.alert / window.confirm.
   * @param {'alert'|'confirm'} type
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  function createDialogo(type, title, message) {
    return new Promise(resolve => {
      const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
      const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(380px,96vw)' } });
      const h = el('div', { cls: 'up-modal-title', text: title });
      const msg = el('p', { text: message, attrs: { style: 'font-size:13px;margin:0 0 16px;opacity:0.85;white-space:pre-wrap' } });
      const row = el('div', { attrs: { style: 'display:flex;gap:8px;justify-content:flex-end' } });

      const dismiss = (val) => { overlay.remove(); resolve(val); };

      if (type === 'confirm') {
        const cancel = el('button', { text: 'Cancel', attrs: { style: 'padding:7px 16px;border-radius:7px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer' } });
        cancel.onclick = () => dismiss(false);
        row.appendChild(cancel);
      }
      const ok = el('button', { text: type === 'confirm' ? 'Confirm' : 'OK', attrs: { style: 'padding:7px 16px;border-radius:7px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer' } });
      ok.onclick = () => dismiss(true);
      row.appendChild(ok);

      box.appendChild(h);
      box.appendChild(msg);
      box.appendChild(row);
      overlay.appendChild(box);
      overlay.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(false); });
      document.body.appendChild(overlay);
      ok.focus();
    });
  }

  // ------- §19.3  Tooltip -------

  let _tooltipEl = null;

  function createCustomTooltip(anchor, text) {
    if (!_tooltipEl) {
      _tooltipEl = el('div', { cls: 'up-tooltip' });
      document.body.appendChild(_tooltipEl);
    }
    anchor.addEventListener('mouseenter', () => {
      _tooltipEl.textContent = text;
      const r = anchor.getBoundingClientRect();
      _tooltipEl.style.left = `${r.left + r.width / 2 - _tooltipEl.offsetWidth / 2}px`;
      _tooltipEl.style.top  = `${r.top - 28}px`;
      _tooltipEl.classList.add('up-visible');
    });
    anchor.addEventListener('mouseleave', () => _tooltipEl.classList.remove('up-visible'));
  }

  // ------- §19.4  Download helper -------

  function downloadTextFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = el('a', { attrs: { href: url, download: filename } });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  // ============================================================
  // §20 · UI — FLOATING PANEL  (from Script A, 7 pages)
  // ============================================================

  let _panel = null;

  /** Create or return the existing floating panel. */
  function makePanel() {
    if (_panel) return _panel;
    _panel = el('div', { id: PANEL_ID, cls: 'up-panel-hidden' });
    _panel.setAttribute('aria-label', 'Unleashed Prompt Settings Panel');

    // Launcher strip (collapsed state)
    const launcher = el('div', { cls: 'up-launcher', text: '⚡ UP', attrs: { title: 'Unleashed Prompt' } });
    launcher.onclick = () => togglePanel();

    // Panel header (expanded state)
    const header = el('div', { cls: 'up-panel-header' });
    const headerTitle = el('span', { text: '⚡ Unleashed Prompt' });
    const closeBtn = el('button', { text: '−', attrs: { style: 'background:transparent;border:none;color:inherit;cursor:pointer;font-size:16px;padding:0 4px' } });
    closeBtn.onclick = () => togglePanel(false);
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    // Nav tabs
    const nav = el('div', { cls: 'up-panel-nav' });
    PANEL_PAGES.forEach(page => {
      const btn = el('button', { cls: 'up-panel-nav-btn', text: pageName(page), attrs: { 'data-page': page } });
      btn.onclick = () => switchPanelPage(page);
      nav.appendChild(btn);
    });

    // Content area
    const body = el('div', { cls: 'up-panel-body' });
    const contentArea = el('div', { id: 'up-panel-content' });
    body.appendChild(nav);
    body.appendChild(contentArea);

    _panel.appendChild(launcher);
    _panel.appendChild(header);
    _panel.appendChild(body);

    // Drag support
    makeDraggable(_panel, header);

    // Position from settings
    const s = ThemeState.settings;
    _panel.style.left = `${s.panelLeft}px`;
    _panel.style.top  = `${s.panelTop}px`;

    document.body.appendChild(_panel);
    switchPanelPage(UIState.panelPage);
    return _panel;
  }

  function pageName(page) {
    return { home: '🏠', themes: '🎨', layout: '📐', font: '🔤', prompts: '📚', settings: '⚙️', 'ui-theme': '🖌️' }[page] || page;
  }

  function togglePanel(show) {
    if (!_panel) makePanel();
    const willShow = show !== undefined ? show : _panel.classList.contains('up-panel-hidden');
    _panel.classList.toggle('up-panel-hidden', !willShow);
    UIState.panelHidden = !willShow;
  }

  function switchPanelPage(page) {
    UIState.panelPage = page;
    const content = document.getElementById('up-panel-content');
    if (!content) return;
    content.innerHTML = '';
    // Update nav active state
    _panel?.querySelectorAll('.up-panel-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    renderPanelPage(content, page);
  }

  /**
   * Render the content for a panel page.
   * @param {Element} container
   * @param {string} page
   */
  function renderPanelPage(container, page) {
    switch (page) {
      case 'home':      renderPanelHome(container);    break;
      case 'themes':    renderPanelThemes(container);  break;
      case 'layout':    renderPanelLayout(container);  break;
      case 'font':      renderPanelFont(container);    break;
      case 'prompts':   renderPanelPrompts(container); break;
      case 'settings':  renderPanelSettings(container);break;
      case 'ui-theme':  renderPanelUiTheme(container); break;
      default:          container.textContent = 'Unknown page';
    }
  }

  // ---- Panel page renderers ----

  function renderPanelHome(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: `⚡ ${SCRIPT_NAME} v${SCRIPT_VERSION}`, attrs: { style: 'font-weight:700;margin-bottom:10px' } }));

    const actions = [
      { text: '📥 Export Current Chat', fn: exportCurrentChatAsMarkdown },
      { text: '📦 Bulk Export/Delete', fn: () => openBulkChatModal('export') },
      { text: '🆕 New Chat', fn: () => startNewChatWithPrompt('') },
      { text: '🔄 Check for Updates', fn: () => checkForUserscriptUpdate(false) },
    ];
    actions.forEach(({ text, fn }) => {
      const btn = el('button', { text, attrs: { style: 'display:block;width:100%;margin-bottom:6px;padding:7px 10px;border-radius:7px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;text-align:left;font-size:12px' } });
      btn.onclick = fn;
      c.appendChild(btn);
    });
  }

  function renderPanelThemes(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '🎨 Theme Presets', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));
    BUILTIN_PRESETS.forEach(preset => {
      const row = el('div', { attrs: { style: 'display:flex;align-items:center;gap:6px;margin-bottom:4px' } });
      const swatch = el('div', { attrs: { style: `width:14px;height:14px;border-radius:3px;background:${preset.pageBgColor};border:1px solid #555;flex-shrink:0` } });
      const btn = el('button', { text: preset.name, attrs: { style: 'background:transparent;border:none;color:inherit;cursor:pointer;font-size:12px;text-align:left' } });
      btn.onclick = () => applyPreset(preset);
      row.appendChild(swatch);
      row.appendChild(btn);
      c.appendChild(row);
    });

    // Save / Import section
    c.appendChild(el('div', { cls: 'up-section-label', text: 'Custom Themes' }));

    const saveBtn = el('button', { text: '💾 Save Current as Theme…', attrs: { style: 'display:block;width:100%;margin-bottom:5px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    saveBtn.onclick = async () => {
      const name = prompt('Theme name:');
      if (!name) return;
      const saved = await Store.get(KEYS.THEMES, []);
      saved.push(Object.assign({ name }, ThemeState.settings));
      await Store.set(KEYS.THEMES, saved);
      PromptState.savedThemes = saved;
      showNotification(`Theme "${name}" saved.`);
      switchPanelPage('themes');
    };
    c.appendChild(saveBtn);

    const importBtn = el('button', { text: '📤 Import Theme File (.json)…', attrs: { style: 'display:block;width:100%;margin-bottom:8px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    importBtn.onclick = () => {
      const inp = el('input', { attrs: { type: 'file', accept: '.json' } });
      inp.onchange = async () => {
        const file = inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            // Accept either a single theme or an array
            const themes = Array.isArray(data) ? data : [data];
            const imported = await Store.get(KEYS.IMPORTED_THEMES, {});
            themes.forEach(t => { if (t.name) imported[t.name] = t; });
            await Store.set(KEYS.IMPORTED_THEMES, imported);
            showNotification(`Imported ${themes.length} theme(s).`);
            switchPanelPage('themes');
          } catch (_) { createDialogo('alert', 'Import Error', 'Invalid theme file.'); }
        };
        reader.readAsText(file);
      };
      inp.click();
    };
    c.appendChild(importBtn);

    // Saved custom themes list
    const allSaved = [...PromptState.savedThemes, ...Object.values(ThemeState.settings._imported || {})];
    if (allSaved.length) {
      allSaved.forEach(t => {
        const row2 = el('div', { attrs: { style: 'display:flex;align-items:center;gap:6px;margin-bottom:3px' } });
        const swatch2 = el('div', { attrs: { style: `width:12px;height:12px;border-radius:2px;background:${t.pageBgColor || '#111'};border:1px solid #555;flex-shrink:0` } });
        const btn2 = el('button', { text: t.name || 'Unnamed', attrs: { style: 'flex:1;background:transparent;border:none;color:inherit;cursor:pointer;font-size:11px;text-align:left' } });
        btn2.onclick = () => applyPreset(t);
        const del2 = el('button', { text: '×', attrs: { style: 'background:transparent;border:none;cursor:pointer;opacity:0.5;color:inherit;font-size:13px' } });
        del2.onclick = async () => {
          const list = await Store.get(KEYS.THEMES, []);
          const filtered = list.filter(s => s.name !== t.name);
          await Store.set(KEYS.THEMES, filtered);
          PromptState.savedThemes = filtered;
          switchPanelPage('themes');
        };
        row2.appendChild(swatch2);
        row2.appendChild(btn2);
        row2.appendChild(del2);
        c.appendChild(row2);
      });
    }
  }

  function renderPanelLayout(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '📐 Layout', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));
    const s = ThemeState.settings;

    /** Helper: slider row with live value display */
    function sliderRow(label, key, min, max, step = 1) {
      const row = el('div', { cls: 'up-form-row' });
      const lbl = el('label', { text: label });
      const slider = el('input', { attrs: { type: 'range', min, max, step, value: s[key] } });
      const display = el('span', { cls: 'up-val-display', text: s[key] });
      slider.oninput = () => {
        const v = parseFloat(slider.value);
        s[key] = v; display.textContent = v;
        applyThemeVars(); debouncedSaveSettings();
      };
      row.appendChild(lbl); row.appendChild(slider); row.appendChild(display);
      c.appendChild(row);
    }

    /** Helper: toggle switch row */
    function toggleRow(label, key) {
      const row = el('div', { cls: 'up-toggle-row' });
      row.appendChild(el('label', { text: label }));
      const sw = el('label', { cls: 'up-toggle-switch' });
      const cb = el('input', { attrs: { type: 'checkbox' } });
      cb.checked = !!s[key];
      cb.onchange = () => { s[key] = cb.checked; applyThemeVars(); debouncedSaveSettings(); };
      const track = el('div', { cls: 'up-toggle-track' });
      sw.appendChild(cb); sw.appendChild(track);
      row.appendChild(sw);
      c.appendChild(row);
    }

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Feature Toggles' }));
    toggleRow('Theme (page bg/text)', 'featureThemeEnabled');
    toggleRow('Bubble styling', 'featureBubbleEnabled');
    toggleRow('Code embed styling', 'featureEmbedEnabled');
    toggleRow('Composer styling', 'featureComposerEnabled');
    toggleRow('Sidebar styling', 'featureSidebarEnabled');
    toggleRow('Hide GPT warning', 'featureHideWarning');

    c.appendChild(el('div', { cls: 'up-section-label', text: 'User Bubble' }));
    sliderRow('Border radius', 'userBubbleBorderRadius', 0, 40);
    sliderRow('Max width %', 'userBubbleMaxWidth', 20, 100, 2);
    sliderRow('Padding V (px)', 'userBubblePaddingV', 0, 40);
    sliderRow('Padding H (px)', 'userBubblePaddingH', 0, 60);

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Assistant Bubble' }));
    sliderRow('Border radius', 'assistBubbleBorderRadius', 0, 40);
    sliderRow('Max width %', 'assistBubbleMaxWidth', 20, 100, 2);
    sliderRow('Padding V (px)', 'assistBubblePaddingV', 0, 40);
    sliderRow('Padding H (px)', 'assistBubblePaddingH', 0, 60);

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Panel' }));
    sliderRow('Opacity', 'panelOpacity', 0.2, 1.0, 0.01);
    toggleRow('Match UI to theme', 'matchUiToTheme');
    toggleRow('Embed align lock', 'embedAlignLock');

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Text Alignment' }));
    const alignRow = el('div', { attrs: { style: 'display:flex;gap:6px;margin-bottom:8px' } });
    ['left','center','right'].forEach(align => {
      const btn = el('button', { text: align[0].toUpperCase() + align.slice(1), attrs: { style: `padding:4px 10px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:${s.textAlignment===align?'var(--up-panel-accent,#89b4fa)':'transparent'};color:${s.textAlignment===align?'#fff':'inherit'};cursor:pointer;font-size:11px` } });
      btn.onclick = () => { s.textAlignment = align; applyThemeVars(); debouncedSaveSettings(); switchPanelPage('layout'); };
      alignRow.appendChild(btn);
    });
    c.appendChild(alignRow);
  }

  function renderPanelFont(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '🔤 Typography', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));
    const s = ThemeState.settings;

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Font Family' }));
    const fontRow = el('div', { cls: 'up-form-row' });
    fontRow.appendChild(el('label', { text: 'Font family' }));
    const fontInput = el('input', { attrs: { type: 'text', placeholder: 'inherit, "Roboto", monospace…', style: 'flex:2;padding:4px 6px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:11px' } });
    fontInput.value = s.fontFamily || 'inherit';
    fontInput.oninput = makeDebounce(() => {
      s.fontFamily = sanitizeFontFamily(fontInput.value, 'inherit');
      applyThemeVars(); debouncedSaveSettings();
    }, 300);
    fontRow.appendChild(fontInput);
    c.appendChild(fontRow);
    const enableFontRow = el('div', { cls: 'up-toggle-row' });
    enableFontRow.appendChild(el('label', { text: 'Enable font override' }));
    const sw = el('label', { cls: 'up-toggle-switch' });
    const cb = el('input', { attrs: { type: 'checkbox' } });
    cb.checked = !!s.featureFontEnabled;
    cb.onchange = () => { s.featureFontEnabled = cb.checked; applyThemeVars(); debouncedSaveSettings(); };
    const track = el('div', { cls: 'up-toggle-track' });
    sw.appendChild(cb); sw.appendChild(track);
    enableFontRow.appendChild(sw);
    c.appendChild(enableFontRow);

    c.appendChild(el('div', { cls: 'up-section-label', text: 'Font Sizes' }));

    const sizes = [
      { label: 'User messages', key: 'userFontSize' },
      { label: 'Assistant msgs', key: 'assistFontSize' },
      { label: 'Sidebar',       key: 'sidebarFontSize' },
    ];
    sizes.forEach(({ label, key }) => {
      const row = el('div', { cls: 'up-form-row' });
      row.appendChild(el('label', { text: label }));
      const slider = el('input', { attrs: { type: 'range', min: 8, max: 32, step: 1, value: s[key] } });
      const display = el('span', { cls: 'up-val-display', text: `${s[key]}px` });
      slider.oninput = () => {
        s[key] = parseFloat(slider.value);
        display.textContent = `${s[key]}px`;
        applyThemeVars(); debouncedSaveSettings();
      };
      row.appendChild(slider); row.appendChild(display);
      c.appendChild(row);
    });
  }

  function renderPanelPrompts(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '📚 Prompt Library', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));
    const addBtn = el('button', { text: '+ New Prompt', attrs: { style: 'width:100%;padding:6px;margin-bottom:8px;border-radius:6px;border:1px dashed var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px' } });
    addBtn.onclick = () => openPromptEditorModal(null);
    c.appendChild(addBtn);

    const prompts = getFilteredPrompts();
    if (!prompts.length) { c.appendChild(el('div', { text: 'No prompts yet.', attrs: { style: 'font-size:11px;opacity:0.5' } })); return; }
    prompts.slice(0, 20).forEach(p => { // limit for panel; full list in menu
      const row = el('div', { attrs: { style: 'display:flex;align-items:center;gap:4px;margin-bottom:4px' } });
      const titleBtn = el('button', { text: p.title, attrs: { style: 'flex:1;text-align:left;background:transparent;border:none;color:inherit;cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis' } });
      titleBtn.onclick = () => insertPromptIntoComposer(p);
      const editBtn = el('button', { text: '✏', attrs: { style: 'background:transparent;border:none;color:inherit;cursor:pointer;font-size:11px;opacity:0.6' } });
      editBtn.onclick = () => openPromptEditorModal(p);
      row.appendChild(titleBtn);
      row.appendChild(editBtn);
      c.appendChild(row);
    });
  }

  function renderPanelSettings(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '⚙️ Settings', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));

    // AI Config
    const aiSection = el('div', { attrs: { style: 'margin-bottom:12px' } });
    aiSection.appendChild(el('div', { text: 'AI Enhancement', attrs: { style: 'font-size:11px;font-weight:600;opacity:0.6;margin-bottom:6px' } }));

    ['gemini', 'openrouter', 'groq'].forEach(prov => {
      const row = el('div', { attrs: { style: 'margin-bottom:6px' } });
      row.appendChild(el('label', { text: `${prov} API Key:`, attrs: { style: 'font-size:11px;display:block;margin-bottom:2px' } }));
      const input = el('input', { attrs: { type: 'password', placeholder: 'sk-...', style: 'width:100%;padding:4px 6px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:11px;box-sizing:border-box' } });
      input.value = AIState.config[`${prov}Key`] || '';
      input.oninput = makeDebounce(async () => {
        AIState.config[`${prov}Key`] = input.value;
        await Store.set(KEYS.AI_CONFIG, AIState.config);
      }, 600);
      row.appendChild(input);
      aiSection.appendChild(row);
    });

    // Model string
    const modelRow = el('div', { attrs: { style: 'margin-bottom:6px' } });
    modelRow.appendChild(el('label', { text: 'Model (e.g. gemini/gemini-1.5-flash):', attrs: { style: 'font-size:11px;display:block;margin-bottom:2px' } }));
    const modelInput = el('input', { attrs: { type: 'text', placeholder: 'gemini/gemini-1.5-flash', style: 'width:100%;padding:4px 6px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:11px;box-sizing:border-box' } });
    modelInput.value = AIState.config.model || '';
    modelInput.oninput = makeDebounce(async () => {
      AIState.config.model = modelInput.value;
      await Store.set(KEYS.AI_CONFIG, AIState.config);
    }, 600);
    modelRow.appendChild(modelInput);
    aiSection.appendChild(modelRow);

    c.appendChild(aiSection);

    // Export / Import
    const expBtn = el('button', { text: '📥 Export Prompts JSON', attrs: { style: 'display:block;width:100%;margin-bottom:6px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px' } });
    expBtn.onclick = () => {
      const obj = {};
      PromptState.prompts.forEach(p => { obj[p.id] = p; });
      downloadTextFile(`up-prompts-${Date.now()}.json`, JSON.stringify(obj, null, 2));
    };
    c.appendChild(expBtn);

    const impBtn = el('button', { text: '📤 Import Prompts JSON', attrs: { style: 'display:block;width:100%;margin-bottom:6px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px' } });
    impBtn.onclick = () => {
      const inp = el('input', { attrs: { type: 'file', accept: '.json,.txt' } });
      inp.onchange = async () => {
        const file = inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            const imported = Array.isArray(data) ? data : Object.values(data);
            for (const raw of imported) {
              await addPrompt(raw);
            }
            showNotification(`Imported ${imported.length} prompt(s).`);
            refreshPromptMenu();
          } catch (_) { createDialogo('alert', 'Import Error', 'Invalid JSON file.'); }
        };
        reader.readAsText(file);
      };
      inp.click();
    };
    c.appendChild(impBtn);

    // Keyboard shortcuts recorder
    c.appendChild(el('div', { cls: 'up-section-label', text: 'Keyboard Shortcuts' }));
    const shortcutNames = {
      openPromptMenu: 'Open Prompt Menu',
      openSettings:   'Open Settings',
      aiEnhance:      'AI Enhance',
      quickEnhance:   'Quick Enhance',
      exportChat:     'Export Chat',
      scrollTop:      'Scroll to Top',
      scrollBottom:   'Scroll to Bottom',
      newChat:        'New Chat',
    };
    Object.entries(shortcutNames).forEach(([action, label]) => {
      const sc = AIState.currentShortcuts[action] || DEFAULT_SHORTCUTS[action];
      const row = el('div', { cls: 'up-shortcut-row' });
      row.appendChild(el('span', { text: label }));
      const badge = el('button', { cls: 'up-shortcut-badge', text: formatShortcut(sc) });
      let recording = false;
      badge.onclick = () => {
        if (recording) return;
        recording = true;
        badge.classList.add('up-recording');
        badge.textContent = 'Press key…';
        const onKey = async (e) => {
          e.preventDefault(); e.stopPropagation();
          recording = false;
          badge.classList.remove('up-recording');
          document.removeEventListener('keydown', onKey, true);
          if (e.key === 'Escape') { badge.textContent = formatShortcut(sc); return; }
          const newSc = { key: e.key, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey };
          AIState.currentShortcuts[action] = newSc;
          await Store.set(KEYS.SHORTCUTS, AIState.currentShortcuts);
          badge.textContent = formatShortcut(newSc);
        };
        document.addEventListener('keydown', onKey, true);
      };
      row.appendChild(badge);
      c.appendChild(row);
    });

    // Backup/restore
    c.appendChild(el('div', { cls: 'up-section-label', text: 'Data Management' }));
    const bkpBtn = el('button', { text: '💾 Backup & Restore…', attrs: { style: 'display:block;width:100%;margin-bottom:5px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px;text-align:left' } });
    bkpBtn.onclick = openBackupModal;
    c.appendChild(bkpBtn);

    const gistBtn = el('button', { text: '🐙 Gist Import/Export…', attrs: { style: 'display:block;width:100%;margin-bottom:5px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:12px;text-align:left' } });
    gistBtn.onclick = openGistModal;
    c.appendChild(gistBtn);

    // Auto-update toggle
    const updRow = el('div', { cls: 'up-toggle-row' });
    updRow.appendChild(el('label', { text: 'Auto-check for updates' }));
    const updSw = el('label', { cls: 'up-toggle-switch' });
    const updCb = el('input', { attrs: { type: 'checkbox' } });
    updCb.checked = !!ThemeState.settings.autoCheckUpdates;
    updCb.onchange = () => { ThemeState.settings.autoCheckUpdates = updCb.checked; debouncedSaveSettings(); };
    const updTrack = el('div', { cls: 'up-toggle-track' });
    updSw.appendChild(updCb); updSw.appendChild(updTrack);
    updRow.appendChild(updSw);
    c.appendChild(updRow);

    // Script info
    c.appendChild(el('div', { text: `${SCRIPT_NAME} v${SCRIPT_VERSION}`, attrs: { style: 'font-size:10px;opacity:0.4;margin-top:10px;text-align:center' } }));
  }

  /** Format a shortcut definition as a human-readable badge string. */
  function formatShortcut(sc) {
    if (!sc) return '—';
    const parts = [];
    if (sc.ctrl)  parts.push('Ctrl');
    if (sc.alt)   parts.push('Alt');
    if (sc.shift) parts.push('Shift');
    parts.push(sc.key.length === 1 ? sc.key.toUpperCase() : sc.key);
    return parts.join('+');
  }

  function renderPanelUiTheme(c) {
    c.innerHTML = '';
    c.appendChild(el('div', { text: '🖌️ Color Zones', attrs: { style: 'font-weight:600;margin-bottom:8px;font-size:12px' } }));
    const s = ThemeState.settings;

    // "Match UI to Theme" toggle
    const matchRow = el('div', { cls: 'up-toggle-row', attrs: { style: 'margin-bottom:10px' } });
    matchRow.appendChild(el('label', { text: 'Match panel UI to theme' }));
    const matchSw = el('label', { cls: 'up-toggle-switch' });
    const matchCb = el('input', { attrs: { type: 'checkbox' } });
    matchCb.checked = !!s.matchUiToTheme;
    matchCb.onchange = () => { s.matchUiToTheme = matchCb.checked; applyThemeVars(); debouncedSaveSettings(); };
    const matchTrack = el('div', { cls: 'up-toggle-track' });
    matchSw.appendChild(matchCb); matchSw.appendChild(matchTrack);
    matchRow.appendChild(matchSw);
    c.appendChild(matchRow);

    const COLOR_ZONES = [
      { label: 'Page Background',     key: 'pageBgColor',         toggle: 'featureThemeEnabled' },
      { label: 'Page Text',           key: 'pageTextColor',        toggle: 'featureThemeEnabled' },
      { label: 'User Bubble BG',      key: 'userBubbleBgColor',    toggle: 'featureBubbleEnabled' },
      { label: 'User Bubble Text',    key: 'userBubbleTextColor',  toggle: 'featureBubbleEnabled' },
      { label: 'Assist Bubble BG',    key: 'assistBubbleBgColor',  toggle: 'featureBubbleEnabled' },
      { label: 'Assist Bubble Text',  key: 'assistBubbleTextColor',toggle: 'featureBubbleEnabled' },
      { label: 'Code Embed BG',       key: 'embedBgColor',         toggle: 'featureEmbedEnabled' },
      { label: 'Code Embed Text',     key: 'embedTextColor',       toggle: 'featureEmbedEnabled' },
      { label: 'Composer BG',         key: 'composerBgColor',      toggle: 'featureComposerEnabled' },
      { label: 'Composer Text',       key: 'composerTextColor',    toggle: 'featureComposerEnabled' },
      { label: 'Sidebar BG',          key: 'sidebarBgColor',       toggle: 'featureSidebarEnabled' },
      { label: 'Sidebar Text',        key: 'sidebarTextColor',     toggle: 'featureSidebarEnabled' },
      { label: 'Sidebar Hover BG',    key: 'sidebarHoverColor',    toggle: 'featureSidebarEnabled' },
      { label: 'Sidebar Hover Text',  key: 'sidebarHoverTextColor',toggle: 'featureSidebarEnabled' },
      { label: 'Panel BG',            key: 'panelBgColor',         toggle: null },
      { label: 'Panel Text',          key: 'panelTextColor',       toggle: null },
      { label: 'Panel Accent',        key: 'panelAccentColor',     toggle: null },
      { label: 'Panel Border',        key: 'panelBorderColor',     toggle: null },
    ];

    const grid = el('div', { cls: 'up-color-zone-grid' });
    COLOR_ZONES.forEach(zone => {
      const row = el('div', { cls: 'up-color-zone-row' });
      // Per-zone enable checkbox
      if (zone.toggle) {
        const cb = el('input', { cls: 'up-zone-enabled', attrs: { type: 'checkbox', title: 'Enable this zone' } });
        cb.checked = !!s[zone.toggle];
        cb.onchange = () => { s[zone.toggle] = cb.checked; applyThemeVars(); debouncedSaveSettings(); };
        row.appendChild(cb);
      } else {
        row.appendChild(el('span', { attrs: { style: 'width:12px;flex-shrink:0' } }));
      }
      row.appendChild(el('label', { text: zone.label }));
      const picker = el('input', { attrs: { type: 'color', value: s[zone.key] || '#ffffff', title: zone.label } });
      picker.oninput = () => {
        s[zone.key] = picker.value;
        applyThemeVars(); debouncedSaveSettings();
      };
      row.appendChild(picker);
      grid.appendChild(row);
    });
    c.appendChild(grid);

    // Export current color config
    const expBtn = el('button', { text: '📤 Export Theme JSON', attrs: { style: 'display:block;width:100%;margin-top:10px;padding:6px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    expBtn.onclick = () => {
      const themeSnap = {};
      COLOR_ZONES.forEach(z => { themeSnap[z.key] = s[z.key]; });
      themeSnap.name = `Custom-${Date.now()}`;
      downloadTextFile(`up-theme-${Date.now()}.json`, JSON.stringify(themeSnap, null, 2));
    };
    c.appendChild(expBtn);
  }

  // ------- §20.1  Draggable panel -------

  function makeDraggable(panel, handle) {
    let dragging = false, ox = 0, oy = 0;
    handle.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      ox = e.clientX - panel.offsetLeft;
      oy = e.clientY - panel.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const left = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  e.clientX - ox));
      const top  = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, e.clientY - oy));
      panel.style.left = `${left}px`;
      panel.style.top  = `${top}px`;
      // Debounced persist
      ThemeState.settings.panelLeft = left;
      ThemeState.settings.panelTop  = top;
      debouncedSaveSettings();
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  // ============================================================
  // §21 · UI — TOOLBAR PILL BUTTON + PROMPT MENU
  // ============================================================

  /** Create and inject the pill button into the ChatGPT toolbar. */
  async function createPillButton() {
    // Find toolbar anchor
    const toolbar = await waitFor(
      '[data-testid="composer-actions"], .flex.items-center.gap-2, form > div > div:last-child',
      6000
    );
    if (!toolbar) { log.warn('Toolbar anchor not found — pill button not injected'); return; }

    // Idempotency check
    if (document.querySelector('.up-pill-wrapper')) return;

    const wrapper = el('div', { cls: 'up-pill-wrapper' });

    const enhanceBtn = el('button', { cls: 'up-pill-btn up-enhance-btn', text: '✨ Enhance', attrs: { 'data-testid': 'up-enhance-btn', 'aria-label': 'AI Enhance prompt' } });
    enhanceBtn.onclick = async () => {
      const adapter = getAdapter();
      if (!adapter) return;
      if (!UIState.composerEl) UIState.composerEl = adapter.getComposerEl();
      const text = UIState.composerEl?.value || UIState.composerEl?.textContent || '';
      if (!text.trim()) { showNotification('Type a prompt first.'); return; }
      if (AIState.config.model) {
        await aiEnhanceWithDiff(text.trim());
      } else {
        await quickEnhanceInComposer(text.trim());
      }
    };
    createCustomTooltip(enhanceBtn, 'AI Enhance (or Quick Enhance if no API key)');

    const promptsBtn = el('button', { cls: 'up-pill-btn up-prompts-btn', text: '📚 Prompts', attrs: { 'data-testid': 'up-prompts-btn', 'aria-label': 'Open prompt library' } });
    promptsBtn.onclick = (e) => { e.stopPropagation(); togglePromptMenu(promptsBtn); };
    createCustomTooltip(promptsBtn, 'Prompt Library (Alt+P)');

    wrapper.appendChild(enhanceBtn);
    wrapper.appendChild(promptsBtn);

    // Insert before the first existing button in the toolbar
    const firstBtn = toolbar.querySelector('button');
    if (firstBtn) toolbar.insertBefore(wrapper, firstBtn);
    else toolbar.appendChild(wrapper);

    UIState.pillButton = wrapper;
    log.info('Pill button injected');
  }

  /** Create the prompt dropdown menu (hidden by default). */
  function createPromptMenu() {
    if (document.getElementById('up-prompt-menu')) return;
    const menu = el('div', { id: 'up-prompt-menu' });
    UIState.promptMenu = menu;
    document.body.appendChild(menu);
    refreshPromptMenu();
  }

  /** Refresh/repopulate the prompt dropdown menu. */
  function refreshPromptMenu() {
    const menu = UIState.promptMenu || document.getElementById('up-prompt-menu');
    if (!menu) return;
    menu.innerHTML = '';

    // Search bar
    const searchBar = el('div', { attrs: { style: 'padding:8px 12px;border-bottom:1px solid var(--up-panel-border,#444)' } });
    const searchInput = el('input', { attrs: { type: 'text', placeholder: '🔍 Search prompts…', style: 'width:100%;padding:5px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:12px;box-sizing:border-box' } });
    searchInput.value = PromptState.filterText;
    searchInput.oninput = () => {
      PromptState.filterText = searchInput.value;
      refreshPromptMenu();
    };
    searchInput.addEventListener('keydown', e => e.stopPropagation()); // don't trigger shortcuts
    searchBar.appendChild(searchInput);
    menu.appendChild(searchBar);

    // Actions row
    const actRow = el('div', { attrs: { style: 'padding:6px 12px;border-bottom:1px solid var(--up-panel-border,#444);display:flex;gap:6px' } });
    const newBtn = el('button', { text: '+ New', attrs: { style: 'flex:1;padding:4px;border-radius:5px;border:1px dashed var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    newBtn.onclick = () => { closePromptMenu(); openPromptEditorModal(null); };
    const bulkExBtn = el('button', { text: '📥 Bulk Export', attrs: { style: 'flex:1;padding:4px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    bulkExBtn.onclick = () => { closePromptMenu(); openBulkChatModal('export'); };
    const bulkDelBtn = el('button', { text: '🗑 Bulk Delete', attrs: { style: 'flex:1;padding:4px;border-radius:5px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:11px' } });
    bulkDelBtn.onclick = () => { closePromptMenu(); openBulkChatModal('delete'); };
    actRow.appendChild(newBtn);
    actRow.appendChild(bulkExBtn);
    actRow.appendChild(bulkDelBtn);
    menu.appendChild(actRow);

    // Prompt list
    const prompts = getFilteredPrompts();
    if (!prompts.length) {
      menu.appendChild(el('div', { text: 'No prompts found.', attrs: { style: 'padding:14px 12px;font-size:12px;opacity:0.5;text-align:center' } }));
    } else {
      prompts.forEach(p => {
        const item = el('div', { cls: 'up-prompt-item' });
        const titleEl = el('div', { cls: 'up-prompt-item-title' });
        titleEl.textContent = (p.favorite ? '⭐ ' : '') + p.title;
        const preview = el('div', { cls: 'up-prompt-item-preview', text: p.text });
        item.appendChild(titleEl);
        item.appendChild(preview);
        item.onclick = () => {
          closePromptMenu();
          insertPromptIntoComposer(p);
        };
        // Right-click to edit
        item.addEventListener('contextmenu', e => {
          e.preventDefault();
          closePromptMenu();
          openPromptEditorModal(p);
        });
        menu.appendChild(item);
      });
    }

    // Settings link at bottom
    const settingsRow = el('div', { attrs: { style: 'padding:8px 12px;border-top:1px solid var(--up-panel-border,#444);text-align:center' } });
    const settingsLink = el('button', { text: '⚙️ Settings  |  🎨 Themes', attrs: { style: 'background:transparent;border:none;color:var(--up-panel-accent,#89b4fa);cursor:pointer;font-size:11px' } });
    settingsLink.onclick = () => { closePromptMenu(); togglePanel(true); };
    settingsRow.appendChild(settingsLink);
    menu.appendChild(settingsRow);
  }

  function togglePromptMenu(anchor) {
    const menu = UIState.promptMenu;
    if (!menu) return;
    const isOpen = menu.classList.contains('up-visible');
    if (isOpen) { closePromptMenu(); return; }
    refreshPromptMenu();
    // Position below anchor
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 360)}px`;
    menu.style.top  = `${rect.bottom + 6}px`;
    menu.classList.add('up-visible');
  }

  function closePromptMenu() {
    UIState.promptMenu?.classList.remove('up-visible');
  }

  // ============================================================
  // §22 · UI — MODALS
  // ============================================================

  // ------- §22.1  Prompt editor modal -------

  /**
   * Open the create/edit prompt modal.
   * @param {Prompt|null} existing — null to create new
   */
  function openPromptEditorModal(existing) {
    const overlay = el('div', { cls: 'up-modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:min(580px,96vw)' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();
    const title = el('div', { cls: 'up-modal-title', text: existing ? 'Edit Prompt' : 'New Prompt' });

    const fields = [
      { label: 'Title', key: 'title', type: 'text', placeholder: 'My Prompt' },
    ];
    const vals = Object.assign({ title: '', text: '', tags: '', usePlaceholders: false, autoExecute: false, isFixed: false, favorite: false }, existing || {});
    const inputs = {};

    fields.forEach(f => {
      const group = el('div', { attrs: { style: 'margin-bottom:10px' } });
      group.appendChild(el('label', { text: f.label, attrs: { style: 'display:block;font-size:11px;margin-bottom:3px;opacity:0.7' } }));
      const input = el('input', { attrs: { type: f.type, placeholder: f.placeholder, style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box' } });
      input.value = vals[f.key] || '';
      inputs[f.key] = input;
      group.appendChild(input);
      box.appendChild(group);
    });

    // Textarea
    const textGroup = el('div', { attrs: { style: 'margin-bottom:10px' } });
    textGroup.appendChild(el('label', { text: 'Prompt Text', attrs: { style: 'display:block;font-size:11px;margin-bottom:3px;opacity:0.7' } }));
    const textarea = el('textarea', { attrs: { placeholder: 'Write your prompt here. Use [Input Label], ##select{opt1,opt2}, #file[Label] for placeholders.', style: 'width:100%;min-height:140px;padding:8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box;resize:vertical;font-family:inherit' } });
    textarea.value = vals.text || '';
    inputs.text = textarea;
    textGroup.appendChild(textarea);
    box.appendChild(textGroup);

    // Tags
    const tagsGroup = el('div', { attrs: { style: 'margin-bottom:10px' } });
    tagsGroup.appendChild(el('label', { text: 'Tags (comma-separated)', attrs: { style: 'display:block;font-size:11px;margin-bottom:3px;opacity:0.7' } }));
    const tagsInput = el('input', { attrs: { type: 'text', placeholder: 'productivity, writing, code', style: 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:13px;box-sizing:border-box' } });
    tagsInput.value = (vals.tags || (Array.isArray(vals.tags) ? vals.tags.join(', ') : '')).toString();
    inputs.tags = tagsInput;
    tagsGroup.appendChild(tagsInput);
    box.appendChild(tagsGroup);

    // Toggles
    const toggleRow = el('div', { attrs: { style: 'display:flex;flex-wrap:wrap;gap:14px;margin-bottom:14px;font-size:12px' } });
    ['usePlaceholders', 'autoExecute', 'isFixed', 'favorite'].forEach(key => {
      const lbl = el('label', { attrs: { style: 'display:flex;align-items:center;gap:4px;cursor:pointer' } });
      const cb = el('input', { attrs: { type: 'checkbox' } });
      cb.checked = !!vals[key];
      inputs[key] = cb;
      const names = { usePlaceholders: 'Placeholders', autoExecute: 'Auto-Send', isFixed: 'Pin to Top', favorite: 'Favorite' };
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(names[key]));
      toggleRow.appendChild(lbl);
    });
    box.appendChild(toggleRow);

    // Action buttons
    const actRow = el('div', { attrs: { style: 'display:flex;gap:8px;justify-content:flex-end' } });
    if (existing) {
      const delBtn = el('button', { text: '🗑 Delete', attrs: { style: 'padding:7px 14px;border-radius:7px;border:none;background:#f38ba8;color:#fff;cursor:pointer;font-weight:600;font-size:13px' } });
      delBtn.onclick = async () => {
        const ok = await createDialogo('confirm', 'Delete Prompt', `Delete "${existing.title}"?`);
        if (!ok) return;
        overlay.remove();
        await removePrompt(existing.id);
        refreshPromptMenu();
        showNotification('Prompt deleted.');
        if (_panel) switchPanelPage('prompts');
      };
      actRow.appendChild(delBtn);
    }
    const cancelBtn = el('button', { text: 'Cancel', attrs: { style: 'padding:7px 14px;border-radius:7px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;cursor:pointer;font-size:13px' } });
    cancelBtn.onclick = () => overlay.remove();
    const saveBtn = el('button', { text: existing ? 'Save Changes' : 'Create Prompt', attrs: { style: 'padding:7px 14px;border-radius:7px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;font-weight:600;cursor:pointer;font-size:13px' } });
    saveBtn.onclick = async () => {
      const data = {
        title: inputs.title.value.trim() || 'Untitled',
        text:  textarea.value,
        tags:  tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        usePlaceholders: inputs.usePlaceholders.checked,
        autoExecute:     inputs.autoExecute.checked,
        isFixed:         inputs.isFixed.checked,
        favorite:        inputs.favorite.checked,
      };
      if (existing) {
        await updatePrompt(existing.id, data);
        showNotification('Prompt updated.');
      } else {
        await addPrompt(data);
        showNotification('Prompt created.');
      }
      overlay.remove();
      refreshPromptMenu();
      if (_panel) switchPanelPage('prompts');
    };
    actRow.appendChild(cancelBtn);
    actRow.appendChild(saveBtn);
    box.appendChild(actRow);

    box.appendChild(closeBtn);
    box.insertBefore(title, box.firstChild);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    inputs.title.focus();
  }

  // ------- §22.2  Prompt explorer (fullscreen grid) -------

  /**
   * Open the fullscreen prompt explorer with multi-column grid, drag-to-reorder,
   * sort controls, tag filter pills, and bulk select.
   */
  function openPromptExplorerModal() {
    if (document.getElementById('up-prompt-explorer-overlay')) return;

    const overlay = el('div', { cls: 'up-modal-overlay', id: 'up-prompt-explorer-overlay', attrs: { role: 'dialog', 'aria-modal': 'true', style: 'align-items:flex-start;padding:20px;box-sizing:border-box' } });
    const box = el('div', { cls: 'up-modal-box', attrs: { style: 'width:100%;max-width:1100px;max-height:calc(100vh - 40px);display:flex;flex-direction:column' } });
    const closeBtn = el('button', { cls: 'up-modal-close', text: '✕' });
    closeBtn.onclick = () => overlay.remove();

    // Header
    const header = el('div', { attrs: { style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap' } });
    header.appendChild(el('div', { cls: 'up-modal-title', attrs: { style: 'margin:0;flex:1' }, text: '📚 Prompt Explorer' }));

    // Search
    const searchInput = el('input', { attrs: { type: 'text', placeholder: '🔍 Search…', style: 'padding:5px 8px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:transparent;color:inherit;font-size:12px;width:160px' } });
    searchInput.value = PromptState.filterText;
    searchInput.oninput = () => { PromptState.filterText = searchInput.value; rerender(); };
    header.appendChild(searchInput);

    // Sort
    const sortSel = el('select', { attrs: { style: 'padding:5px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:var(--up-panel-bg,#1e1e2e);color:inherit;font-size:11px' } });
    SORT_MODES.forEach(m => {
      const o = el('option', { text: m, attrs: { value: m } });
      if (m === PromptState.sortMode) o.selected = true;
      sortSel.appendChild(o);
    });
    sortSel.onchange = () => { PromptState.sortMode = sortSel.value; rerender(); };
    header.appendChild(sortSel);

    // Column count
    const colSel = el('select', { attrs: { style: 'padding:5px;border-radius:6px;border:1px solid var(--up-panel-border,#444);background:var(--up-panel-bg,#1e1e2e);color:inherit;font-size:11px' } });
    [1,2,3,4].forEach(n => {
      const o = el('option', { text: `${n} col`, attrs: { value: n } });
      if (n === (ThemeState.settings.columnCount || 2)) o.selected = true;
      colSel.appendChild(o);
    });
    colSel.onchange = () => { ThemeState.settings.columnCount = parseInt(colSel.value); debouncedSaveSettings(); rerender(); };
    header.appendChild(colSel);

    const newBtn = el('button', { text: '+ New', attrs: { style: 'padding:5px 12px;border-radius:6px;border:none;background:var(--up-panel-accent,#89b4fa);color:#fff;cursor:pointer;font-size:12px;font-weight:600' } });
    newBtn.onclick = () => { overlay.remove(); openPromptEditorModal(null); };
    header.appendChild(newBtn);

    // Tag filter row
    const tagRow = el('div', { cls: 'up-tags-row', attrs: { style: 'margin-bottom:10px' } });
    const allTags = [...new Set(PromptState.prompts.flatMap(p => p.tags))].sort();
    const allChip = el('span', { cls: 'up-tag-chip' + (!PromptState.filterTag ? ' up-tag-active' : ''), text: 'All' });
    allChip.onclick = () => { PromptState.filterTag = ''; rerender(); };
    tagRow.appendChild(allChip);
    allTags.forEach(tag => {
      const chip = el('span', { cls: 'up-tag-chip' + (PromptState.filterTag === tag ? ' up-tag-active' : ''), text: tag });
      chip.onclick = () => { PromptState.filterTag = PromptState.filterTag === tag ? '' : tag; rerender(); };
      tagRow.appendChild(chip);
    });

    // Grid
    const gridWrap = el('div', { cls: 'up-grid-wrap', attrs: { style: `overflow-y:auto;flex:1;--up-grid-cols:${ThemeState.settings.columnCount || 2}` } });

    let dragSrcId = null;

    function rerender() {
      gridWrap.innerHTML = '';
      gridWrap.style.setProperty('--up-grid-cols', ThemeState.settings.columnCount || 2);
      const prompts = getFilteredPrompts();
      if (!prompts.length) {
        gridWrap.appendChild(el('div', { text: 'No prompts found.', attrs: { style: 'grid-column:1/-1;text-align:center;padding:30px;opacity:0.5;font-size:13px' } }));
        return;
      }
      prompts.forEach(p => {
        const card = el('div', { cls: 'up-grid-card' + (p.favorite ? ' up-fav-card' : ''), attrs: { draggable: 'true', 'data-id': p.id } });

        const titleEl = el('div', { cls: 'up-grid-card-title' });
        titleEl.textContent = p.title;

        const preview = el('div', { cls: 'up-grid-card-preview', text: p.text });

        const tags = el('div', { cls: 'up-grid-card-tags' });
        p.tags.forEach(t => tags.appendChild(el('span', { cls: 'up-grid-card-tag', text: t })));

        const actions = el('div', { cls: 'up-grid-card-actions' });
        const editBtn = el('button', { text: '✏', attrs: { title: 'Edit' } });
        editBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); openPromptEditorModal(p); };
        const pinBtn = el('button', { text: p.isFixed ? '📍' : '📌', attrs: { title: p.isFixed ? 'Unpin' : 'Pin to top' } });
        pinBtn.onclick = async (e) => { e.stopPropagation(); await updatePrompt(p.id, { isFixed: !p.isFixed }); rerender(); };
        const favBtn = el('button', { text: p.favorite ? '⭐' : '☆', attrs: { title: 'Toggle favorite' } });
        favBtn.onclick = async (e) => { e.stopPropagation(); await updatePrompt(p.id, { favorite: !p.favorite }); rerender(); };
        actions.appendChild(editBtn); actions.appendChild(pinBtn); actions.appendChild(favBtn);

        card.appendChild(titleEl);
        card.appendChild(preview);
        card.appendChild(tags);
        card.appendChild(actions);

        // Click to insert
        card.onclick = () => { overlay.remove(); insertPromptIntoComposer(p); };

        // Drag-to-reorder
        card.addEventListener('dragstart', (e) => { dragSrcId = p.id; card.style.opacity = '0.4'; e.dataTransfer.effectAllowed = 'move'; });
        card.addEventListener('dragend',   () => { card.style.opacity = ''; dragSrcId = null; });
        card.addEventListener('dragover',  (e) => { e.preventDefault(); card.classList.add('up-drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('up-drag-over'));
        card.addEventListener('drop', async (e) => {
          e.preventDefault(); card.classList.remove('up-drag-over');
          if (!dragSrcId || dragSrcId === p.id) return;
          // Swap positions
          const src = PromptState.prompts.find(x => x.id === dragSrcId);
          const dst = PromptState.prompts.find(x => x.id === p.id);
          if (src && dst) {
            const tmp = src.position;
            src.position = dst.position;
            dst.position = tmp;
            await savePrompts();
            rerender();
          }
        });

        gridWrap.appendChild(card);
      });

      // Rebuild tag row chips
      tagRow.innerHTML = '';
      const allTags2 = [...new Set(PromptState.prompts.flatMap(q => q.tags))].sort();
      const allChip2 = el('span', { cls: 'up-tag-chip' + (!PromptState.filterTag ? ' up-tag-active' : ''), text: 'All' });
      allChip2.onclick = () => { PromptState.filterTag = ''; rerender(); };
      tagRow.appendChild(allChip2);
      allTags2.forEach(tag => {
        const chip = el('span', { cls: 'up-tag-chip' + (PromptState.filterTag === tag ? ' up-tag-active' : ''), text: tag });
        chip.onclick = () => { PromptState.filterTag = PromptState.filterTag === tag ? '' : tag; rerender(); };
        tagRow.appendChild(chip);
      });
    }

    rerender();

    box.appendChild(closeBtn);
    box.appendChild(header);
    box.appendChild(tagRow);
    box.appendChild(gridWrap);
    overlay.appendChild(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    searchInput.focus();
  }

  // ============================================================
  // §23 · DOM WATCHER
  // ============================================================

  const _scheduleRefresh = makeDebounce(refreshAllStyling, DEBOUNCE_OBSERVER);

  /**
   * Start observing the DOM for ChatGPT SPA navigation and dynamic content.
   * Uses A's pause/resume pattern + B's debounce, targeting document.body.
   */
  function observeDom() {
    if (UIState.mutationObserver) UIState.mutationObserver.disconnect();

    UIState.mutationObserver = new MutationObserver((mutations) => {
      if (UIState.observerPaused) return;
      for (const m of mutations) {
        // Skip our own nodes
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if ((node.id || '').startsWith('up-') || (node.className || '').includes('up-')) continue;
          _scheduleRefresh();
          return;
        }
      }
    });

    UIState.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    log.info('MutationObserver started on document.body');
  }

  /** Pause the observer (call before DOM-heavy operations). */
  function pauseObserver() { UIState.observerPaused = true; }

  /** Resume the observer. */
  function resumeObserver() { UIState.observerPaused = false; }

  /**
   * Refresh all styling passes with observer paused to prevent re-trigger.
   */
  function refreshAllStyling() {
    pauseObserver();
    try {
      applyThemeVars();
      refreshMessageStyling();
      ensureSidebarDeleteButtons();
      checkComposerPresence();
    } finally {
      resumeObserver();
    }
  }

  /**
   * Apply .up-bubble class to message content nodes (score-based, from Script A).
   */
  function refreshMessageStyling() {
    // TODO(§23): Port Script A's findBestMessageContent / scoreCandidate.
    //             For now: apply bubble class to all data-message-author-role containers.
    document.querySelectorAll('[data-message-author-role]').forEach(msg => {
      const content = msg.querySelector('.whitespace-pre-wrap, .prose, .markdown, [class*="message-content"]');
      if (content && !content.classList.contains('up-bubble')) {
        content.classList.add('up-bubble');
      }
    });
  }

  /** Re-discover and bind the composer if it changed. */
  function checkComposerPresence() {
    const adapter = getAdapter();
    if (!adapter) return;
    const current = adapter.getComposerEl();
    if (current && current !== UIState.composerEl) {
      UIState.composerEl = current;
      setupInlineSuggestion(current);
      log.info('Composer re-discovered');
    }
  }

  // ------- §23.1  URL change interception (replaces setInterval polling) -------

  let _lastUrl = location.href;

  function onUrlChange() {
    const url = location.href;
    if (url === _lastUrl) return;
    _lastUrl = url;
    log.info('URL changed to', url);
    consumePendingPromptIfReady();
    setTimeout(refreshAllStyling, 500);
    setTimeout(checkComposerPresence, 1000);
  }

  function interceptHistoryApi() {
    const _push = history.pushState.bind(history);
    const _replace = history.replaceState.bind(history);
    history.pushState = (...args) => { _push(...args); onUrlChange(); };
    history.replaceState = (...args) => { _replace(...args); onUrlChange(); };
    window.addEventListener('popstate', onUrlChange);
  }

  // ============================================================
  // §24 · GM MENU COMMANDS
  // ============================================================

  function addMenuCommands() {
    GM_registerMenuCommand(`⚡ ${SCRIPT_NAME} — Toggle Panel`, () => togglePanel());
    GM_registerMenuCommand('📚 Open Prompt Library', () => {
      if (UIState.pillButton) {
        const btn = UIState.pillButton.querySelector('.up-prompts-btn');
        if (btn) togglePromptMenu(btn);
      }
    });
    GM_registerMenuCommand('🎨 Open Settings / Themes', () => togglePanel(true));
    GM_registerMenuCommand('📥 Export Current Chat', exportCurrentChatAsMarkdown);
    GM_registerMenuCommand('📦 Bulk Export/Delete Chats', () => openBulkChatModal('export'));
    GM_registerMenuCommand('🔄 Check for Updates', () => checkForUserscriptUpdate(false));
    GM_registerMenuCommand('🐛 Toggle Debug Mode', () => {
      DEBUG = !DEBUG;
      showNotification(`Debug mode ${DEBUG ? 'enabled' : 'disabled'}`);
    });
    GM_registerMenuCommand('ℹ️ About', () => {
      createDialogo('alert', `${SCRIPT_NAME} v${SCRIPT_VERSION}`,
        `Platform: ${UIState.currentPlatform || 'unknown'}\n` +
        `Prompts: ${PromptState.prompts.length}\n` +
        `Model: ${AIState.config.model || 'not configured'}\n\n` +
        `Source: ${UPDATE_URL}`
      );
    });
  }

  // ============================================================
  // §25 · SETTINGS LOAD / SAVE
  // ============================================================

  const debouncedSaveSettings = makeDebounce(async () => {
    await Store.set(KEYS.SETTINGS, ThemeState.settings);
  }, DEBOUNCE_SETTINGS);

  async function loadSettings() {
    const saved = await Store.get(KEYS.SETTINGS, {});
    ThemeState.settings = normalizeSettings(saved);
  }

  async function loadAIConfig() {
    AIState.config = await Store.get(KEYS.AI_CONFIG, {});
  }

  // ============================================================
  // §26 · GLOBAL EVENT LISTENERS
  // ============================================================

  function setupGlobalEventListeners() {
    // Close menus on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#up-prompt-menu') && !e.target.closest('.up-prompts-btn')) {
        closePromptMenu();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape closes menus/panel
      if (e.key === 'Escape') { closePromptMenu(); closeInlineMenu(); }

      // Configurable shortcuts
      const sc = AIState.currentShortcuts;
      if (isShortcutPressed(e, sc.openPromptMenu)) {
        e.preventDefault();
        if (UIState.pillButton) {
          const btn = UIState.pillButton.querySelector('.up-prompts-btn');
          if (btn) togglePromptMenu(btn);
        }
      }
      if (isShortcutPressed(e, sc.openSettings)) { e.preventDefault(); togglePanel(true); }
      if (isShortcutPressed(e, sc.exportChat)) { e.preventDefault(); exportCurrentChatAsMarkdown(); }
      if (isShortcutPressed(e, sc.scrollTop)) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      if (isShortcutPressed(e, sc.scrollBottom)) { e.preventDefault(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
      if (isShortcutPressed(e, sc.aiEnhance)) {
        e.preventDefault();
        const adapter = getAdapter();
        if (!adapter || !UIState.composerEl) return;
        const text = UIState.composerEl.value || UIState.composerEl.textContent || '';
        if (text.trim()) aiEnhanceWithDiff(text.trim());
      }
      if (isShortcutPressed(e, sc.quickEnhance)) {
        e.preventDefault();
        const adapter = getAdapter();
        if (!adapter || !UIState.composerEl) return;
        const text = UIState.composerEl.value || UIState.composerEl.textContent || '';
        if (text.trim()) quickEnhanceInComposer(text.trim());
      }
      if (isShortcutPressed(e, sc.newChat)) { e.preventDefault(); startNewChatWithPrompt(''); }
    });

    window.addEventListener('resize', makeDebounce(() => {
      // TODO(§26): Clamp panel position if it drifts off-screen on resize.
    }, DEBOUNCE_RESIZE));
  }

  // ============================================================
  // §27 · SELF-HEAL TIMER  (from Script A)
  // ============================================================

  function scheduleSelfHeal() {
    setTimeout(() => {
      // Re-inject style tags if removed
      if (!document.getElementById(STYLE_ID_STRUCTURAL)) injectStructuralCSS();
      if (!document.getElementById(STYLE_ID_THEME_VARS)) applyThemeVars();
      // Re-inject panel if removed
      if (!document.getElementById(PANEL_ID)) { _panel = null; makePanel(); }
      // Re-inject pill button if removed
      if (!document.querySelector('.up-pill-wrapper')) createPillButton();
      log.info('Self-heal check complete');
    }, SELF_HEAL_DELAY);
  }

  // ============================================================
  // §28 · INIT
  // ============================================================

  async function init() {
    if (UIState.isInitializing || UIState.isInitialized) return;
    UIState.isInitializing = true;

    UIState.currentPlatform = detectPlatform();
    log.info('Platform:', UIState.currentPlatform);

    // Parallel GM reads
    await Promise.all([
      loadSettings(),
      loadPrompts(),
      loadAIConfig(),
      loadShortcuts(),
    ]);

    // CSS — structural once, theme vars from settings
    injectStructuralCSS();
    applyThemeVars();

    // URL interception
    interceptHistoryApi();

    // Global event listeners
    setupGlobalEventListeners();

    // Pending prompt check (cross-navigation)
    consumePendingPromptIfReady();

    // Build UI
    makePanel();
    createPromptMenu();

    // Toolbar pill (wait for composer toolbar to exist)
    await createPillButton();

    // Composer
    const adapter = getAdapter();
    if (adapter) {
      UIState.composerEl = await waitFor('[data-testid="chat-input"], #prompt-textarea, [contenteditable="true"]', 6000);
      if (UIState.composerEl) setupInlineSuggestion(UIState.composerEl);
    }

    // Styling passes
    refreshAllStyling();

    // Nav widget (Phase 2 — stub)
    createNavInterface();

    // DOM watcher
    observeDom();

    // GM menu
    addMenuCommands();

    // Auto update check
    if (ThemeState.settings.autoCheckUpdates) {
      setTimeout(() => checkForUserscriptUpdate(true), 2000);
    }

    // Self-heal
    scheduleSelfHeal();

    UIState.isInitialized = true;
    UIState.isInitializing = false;
    log.info(`${SCRIPT_NAME} v${SCRIPT_VERSION} initialized on ${UIState.currentPlatform}`);
    showNotification(`⚡ ${SCRIPT_NAME} loaded`, 'info', 2000);
  }

  // ------- Entry point -------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
