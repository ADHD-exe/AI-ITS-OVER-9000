# My Prompt — Advanced Technical Blueprint & Replication Dossier

**Script:** My Prompt  
**Version:** 6.0.8  
**Author:** OHAS (`https://github.com/0H4S`)  
**License:** CC-BY-NC-ND-4.0  
**Namespace:** `https://github.com/0H4S`  
**Dossier prepared:** April 2026

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Feature Inventory](#2-feature-inventory)
3. [Architecture and Structure](#3-architecture-and-structure)
4. [DOM and UI Integration](#4-dom-and-ui-integration)
5. [Data and Persistence](#5-data-and-persistence)
6. [Permissions and Dependencies](#6-permissions-and-dependencies)
7. [Execution Flow](#7-execution-flow)
8. [Replication Blueprint](#8-replication-blueprint)
9. [Refactoring and Improvement Opportunities](#9-refactoring-and-improvement-opportunities)

---

## 1. Purpose and Scope

### What the Script Does

My Prompt is a feature-rich productivity userscript that overlays a **personal prompt library manager** on top of multiple AI chat platforms. It enables users to save, organise, search, and insert reusable prompts directly into any supported LLM interface without leaving the page. Beyond simple storage it provides:

- A **Dynamic Prompt Mode** (called "placeholders") that lets prompts contain interactive inline widgets — text inputs, dropdown selectors, and file attachments — rendered in a modal before the text is inserted.
- **AI Enhance**, an optional feature that sends the current prompt text to a separately-configured AI API and shows a diff-view comparison before committing the improved version.
- A **Pinned Message Navigator (Nav)** — a draggable floating carousel that indexes and lets users jump between conversation turns in the host chat UI, with per-chat pin persistence via IndexedDB.
- An **Inline Suggestion** engine: typing `#` into a composer textarea triggers an autocomplete overlay listing saved prompts by title.
- A **Smart Editor** inside the prompt-save modal with bracket pair completion, macro wrapping (`##start`/`##end`), variable auto-complete, and a syntax-highlight backdrop.
- A **Global File Library** for attaching recurring files to prompts.
- **Theming** (five built-in themes with light/dark variants, plus importable custom `.mp.theme.json` files).
- **Backup / Restore** of all settings as a single `.mp.backup.json` file.
- **GitHub Gist Integration** for sharing and importing prompts via Gist.

### Targeted Pages and UI States

The script is active on every page listed in its `@match` directives. Internally it calls `detectPlatform()` and sets `currentPlatform` to one of ~35 platform keys. The prompt-button injection and prompt-insert logic is then platform-specific. For ChatGPT, the primary target, the script locates the composer toolbar (the row of buttons beside the text input), injects the prompt button there, and uses platform-specific DOM techniques to insert text into the ProseMirror editor.

The script is also active on `gist.github.com` solely for Gist-import/export integration, and on `ko-fi.com` to inject a Patreon shortcut button on shop pages.

### Problem Solved

AI platforms do not offer native prompt libraries or reusable template systems. Users who work with recurring prompts must retype or paste them manually on every session. My Prompt eliminates that friction by:

- persisting prompts in GM storage across sessions and across page reloads,
- injecting a button directly into the composer toolbar so prompts are one click away,
- automating file attachment and optional auto-send so a single click can start a fully-formed conversation.

### Before / After Installation

| Aspect | Before | After |
|---|---|---|
| Prompt reuse | Manual copy-paste | One-click from in-page library |
| Composer toolbar | Platform default | + "My Prompt" pill button (magic wand + code icon) |
| Prompt templates | None | Dynamic placeholders with selectors, inputs, file zones |
| AI-enhanced drafting | Requires leaving the page | Inline via AI Enhance with diff modal |
| Conversation navigation | Browser scroll only | Floating nav widget with message index and pin carousel |
| File attachment | Manual per conversation | Recurring global file library, auto-attached per prompt |

---

## 2. Feature Inventory

### 2.1 User-Facing Features

#### Prompt Library (Menu)

- **Trigger:** Clicking the main pill button injected into the composer toolbar.
- **What it does:** Opens a floating dropdown (`#prompt-menu-container`) listing all saved prompts. The menu includes a search bar, filter/sort dropdown, expand-to-fullscreen icon, and footer buttons for New, Export, Import.
- **DOM interaction:** Positioned via `positionMenu()` which reads `getBoundingClientRect()` on the trigger button and calculates viewport-safe `top`/`left` coordinates.
- **Inserting a prompt:** Clicking a list item calls `insertPrompt()` or `openPlaceholderModal()` (if `usePlaceholders` is `true`).

#### Expanded Prompt Menu (Fullscreen Grid)

- **Trigger:** The expand icon inside the compact menu, or keyboard shortcut.
- **What it does:** Opens a fullscreen overlay with prompts rendered in a 1–3 column adjustable grid. Supports multi-select-and-delete, drag-to-reorder within the overlay, and shift-click range selection.
- **Column preference** is persisted via `GM_setValue('Columns', n)`.

#### New / Edit Prompt Modal

- **Trigger:** "New Prompt" button in menu footer, or "Edit" action on an existing prompt item. Keyboard shortcut `Alt+N` (configurable).
- **What it does:** A full-featured editor with:
  - Title input
  - Prompt textarea with syntax highlighting (see Smart Editor)
  - AI Enhance button (magic wand, calls `triggerAIEnhancement`)
  - Paste button
  - Expand button (toggles `.mp-expanded` class for larger editing area)
  - Files accordion (attach global recurring files)
  - Tags accordion (assign tags)
  - "Enable Placeholders" toggle
  - "Auto Execute" toggle (auto-submits prompt after insertion)
  - Save button

#### Dynamic Prompt Mode / Placeholder Modal

- **Trigger:** Clicking a prompt whose `usePlaceholders === true`.
- **What it does:** The script calls `parsePromptInternal(e.text)` to tokenise the prompt text into placeholder tokens:
  - `__INPUT_N__` — a labelled `<textarea>` with optional variable binding (`$var`), silent mode, default value, and contextual help bubble.
  - `__SELECT_N__` — a group of checkboxes rendered from `#start…#end` blocks, with `+` (multi-select), `-` (sovereign/exclusive), integer ID (grouped exclusive), and `[#]` (free-text "other") option types.
  - `__FILE_N__` — a file dropzone for attaching dynamic files per-insertion.
  - `__IGNORE_N__` — blocks wrapped in `##ignore…##end` that are stripped from the final output.
  - `__QUOTE_N__` — `''text''` blocks preserved verbatim.
- After the user fills all widgets the "Insert" button assembles the final string, substitutes tokens, and calls `insertPrompt()`.

#### AI Enhance

- **Trigger:** The magic wand button in the prompt editor, or on any host platform's composer (the AI-button half of the pill), or keyboard shortcut `Alt+E`.
- **What it does:** Reads the current text, calls `callAI_API(text, systemPrompt)` via `GM_xmlhttpRequest`, then shows `showAIDiffModal()` with the original and AI-improved text side by side. The user can accept or discard.
- **Provider routing:** The configured model string (`currentAIConfig.model`) is parsed by `getProvider()` which returns `gemini | openrouter | huggingface | longcat | groq`. Each provider has a different endpoint and auth header scheme. API keys can be comma-separated for round-robin rotation.
- **System prompt multi-selection:** If `currentAIConfig.systemPrompt` contains multiple `Title {{ … }}` blocks, a selection modal is shown before the API call.

#### Inline Suggestion (`#`-triggered)

- **Trigger:** User types `#` at the start of a word in any monitored textarea/contenteditable.
- **What it does:** A `debounce`d `input` handler calls `getAll()`, filters titles by the typed substring, and renders up to 8 matches in a floating `.mp-inline-menu` positioned above the composer. Arrow keys navigate; Enter/Tab inserts; Escape dismisses.
- **Completion:** `completeInlinePrompt()` deletes the `#query` text from the editor and then calls `insertPrompt()` or `openPlaceholderModal()`.

#### Smart Editor

- **Trigger:** Automatically attached to the prompt textarea via `attachSmartEditorLogic()`.
- **Features:**
  - **Bracket pair completion** for `(`, `[`, `{`, `"`, `'`, `` ` ``, `<`.
  - **Closing-character skip** when the cursor is right before an existing closing bracket.
  - **Pair deletion** (Backspace deletes both brackets if they are adjacent).
  - **Selection wrapping** with a bracket character wraps selected text.
  - **`##` macro wrapping:** Selecting text then pressing `#` starts a macro-wrap sequence; subsequent `#` or `s/i` keys wrap selection in `#start…#end` or `#ignore…#end` blocks.
  - **Variable auto-complete:** Typing `$` inside `[label = $…]` or `{label = $…]` activates `varMemory` and suggests previously-used variable names.
  - **`#` tag auto-complete:** Typing `#d/t/f/s` at the start of a token activates `TAG_MEMORY` and suggests `#date`, `#time`, `#file`, `#start` macro variants. Arrow keys cycle, Enter/Tab accepts.

#### Navigation Widget (Nav)

- **Trigger:** Automatically created via `createNavInterface()` on startup (if enabled, if not a `NO_NAV_PLATFORMS` platform).
- **What it does:** A floating `#mp-nav-container` with three buttons: scroll to previous message, toggle a list popup, scroll to next message.
- The list popup shows all conversation messages (user + AI) indexed, with headings as expandable sub-items. Filter tabs: All / User / AI.
- A draggable **Pinned Carousel** (`#mp-pinned-carousel-wrapper`) floats over the page. Users can pin any message or heading. Pins are stored in IndexedDB per `chatId`. The carousel is draggable with snap-to-center, orientation flip (horizontal/vertical), and actions-panel side switching.

#### Tags Manager

- **Trigger:** "Manage Tags" button inside the prompt editor's tags accordion, or from within the filter dropdown in the menu.
- **What it does:** A modal for creating, editing, and deleting tags. Tags have a name, background colour, text colour, and optional comment. Tag names are stored normalised to lowercase. Deleting a tag removes it from all prompts.

#### Settings Modal

- **Trigger:** `GM_registerMenuCommand` item ("⚙️ Settings") in the userscript manager menu, or programmatically.
- **What it does:** Two-tab ("Basic" / "Advanced") settings panel:
  - Basic: language picker, backup/restore manager, colour mode (Auto/Light/Dark), theme selector.
  - Advanced: Smart Predict toggle, Nav toggle, Syntax Highlight toggle, AI Enhance configuration (API key per provider, model select, system prompt), keyboard shortcut recorder.

#### Backup / Restore

- **Trigger:** Settings modal → Basic → "Export / Import" button.
- **What it does:** Lists all GM storage keys with checkboxes. Export downloads selected keys as a dated `.mp.backup.json`. Import reads a backup file and calls `GM_setValue` for each included key then reloads the page.

#### Theme System

- **Built-in themes:** `default`, `dracula`, `coffee`, `cyberpunk`, `full-dark` — each with `light` and `dark` variants defined as CSS custom property maps.
- **Imported themes:** Users can import `.mp.theme.json` files. Themes can define `@import` arrays for web fonts loaded via `FontLoaderBypass`.
- **Application:** `applyTheme()` injects a `<style id="mp-theme-override">` tag that overrides CSS variables at `:root` with `!important`.

#### Gist Integration

- **Trigger:** Auto-runs on `gist.github.com` via `initGistIntegration()`.
- **What it does:** Injects "Import" buttons on any Gist file whose name matches `*.mp.prompt.json|txt|md`, and "Export" buttons on the file editor. Gist files are read via `extractContentFromGistFile()` which handles both rendered markdown and raw code views.

---

### 2.2 Background / Helper Features

| Feature | Description | Trigger |
|---|---|---|
| `detectPlatform()` | Reads `window.location.hostname` and path to return a platform key | Called at init and in `tryInit` |
| `determineLanguage()` | Reads `GM_getValue('UserScriptLang')`, then `navigator.language`, falls back to `en` | `start()` async |
| `ScriptNotifier` | External class (required script) that polls a Gist for update notifications | `new ScriptNotifier(SCRIPT_CONFIG).run()` |
| `FontLoaderBypass` | External class (required script) for loading web fonts via `GM_xmlhttpRequest` bypass | On `window.load` and theme apply |
| `setupEnhancedScroll` | Wraps a scrollable element in a `.mp-scroll-wrapper` and injects up/down arrow overlays | On any scrollable container creation |
| `createCustomTooltip` | Appends a positioned `div.mp-tooltip` to `document.body` on mouseenter | Attached to many interactive elements |
| `pageObserver` (MutationObserver) | Re-runs `tryInit` when the DOM changes (e.g., SPA navigation) | Observes `document.body` after first `initUI` |
| `startGlobalDomWatcher` | `setInterval` 1500 ms polling to detect DOM growth (new messages) and rebuild Nav | `loadNavConfig()` |
| `startChatChangeWatcher` | `setInterval` 500 ms polling to detect URL changes (new chat) | `loadNavConfig()` |
| `debounce` | Standard debounce utility | Used in inline suggestion, window resize |
| `waitFor` | `MutationObserver`-based DOM element awaiter with timeout | Utility, used in some platform init paths |
| `generatePromptId` | Timestamp + `performance.now` + random suffix → 19-char unique string | Every new prompt |
| `normalizePositions` | Reassigns sequential `position` integers to all prompts | After any CRUD operation |
| `getRotatingApiKey` | Splits comma-separated API key string, returns current key, advances index | Before every AI API call |
| `robustClearEditor` | Platform-specific editor clear: `execCommand("selectAll")` + delete, with fallbacks | Before replacing editor content |

---

## 3. Architecture and Structure

### 3.1 File Structure

The script is a **single-file IIFE** (`(function() { 'use strict'; … })()`), 1 735 lines in its source form (partially minified sections within readable outer structure). There is no bundler; the file is deployed directly to Greasyfork.

External assets:
- **CSS** — `https://cdn.jsdelivr.net/gh/0H4S/My-Prompt@6.0.8/Files/style.min.css` (loaded as a `@resource` and injected via `GM_getResourceText`)
- **Language JSON** — `https://cdn.jsdelivr.net/gh/0H4S/My-Prompt@6.0.8/Files/languages.min.json`
- **Two required scripts** via `@require` (Greasyfork IDs 564164 and 549920) — these provide `ScriptNotifier` and `FontLoaderBypass`.

### 3.2 Metadata Block Summary

```
@name              My Prompt          (+ 39 locale variants)
@version           6.0.8
@namespace         https://github.com/0H4S
@license           CC-BY-NC-ND-4.0
@match             ~35 LLM platform URLs
@exclude           ko-fi.com/summary/*
@require           (2 external scripts)
@resource          CSS / IDIOMAS
@connect           10+ domains (AI APIs, CDNs, fonts)
@grant             GM_getValue, GM_setValue, GM_listValues,
                   GM_deleteValue, GM_xmlhttpRequest,
                   GM_getResourceText, GM_registerMenuCommand
@run-at            document-end
@noframes
@compatible        chrome, firefox, edge, brave, opera
```

### 3.3 Key State Variables

```js
// Lifecycle
let isInitialized      // bool – initUI has completed successfully
let isInitializing     // bool – initUI is in progress (mutex flag)
let currentPlatform    // string – platform key from detectPlatform()
let pageObserver       // MutationObserver – SPA navigation detector

// UI element handles
let settingsModal, currentPlaceholderModal, infoModal
let currentModal       // the prompt create/edit modal
let currentMenu        // the prompt list dropdown
let currentButton      // the injected pill button (wrapper div)

// Data caches
let translations       // object – all locale strings from IDIOMAS resource
let currentLang        // string – active locale code
let currentTagsConfig  // object – tags + active filters + sortMode
let currentThemeConfig // object – themeId + mode
let importedThemes     // object – user-imported theme definitions
let currentShortcuts   // object – user keyboard shortcuts
let currentAIConfig    // object – API keys, model, system prompt
let currentSyntaxConfig, currentPredictionConfig, currentNavConfig

// File library
let currentActiveFileIds  // Set<id> – active file selections for current modal

// Nav/pins
let cachedMessages     // array – scanned conversation messages
let savedPins          // array – persisted pin objects for current chat
let activePins         // array – pins with resolved DOM references
let currentChatId      // string – URL-based chat identifier
let navContainer, navListPopup, pinnedCarouselContainer
let currentNavIndex, currentPinnedCenterIdx

// Inline suggestion
let inlineMenu         // div – floating autocomplete
let inlineMenuCurrentItems, inlineMenuIndex

// Smart editor memory
let macroMemory, varMemory, TAG_MEMORY

// Trusted types
let scriptPolicy       // TrustedTypePolicy for setSafeInnerHTML
```

### 3.4 Constants

```js
const platformSelectors  // Record<platformKey, CSS selector for composer textarea>
const SCRIPT_CONFIG      // { scriptVersion, notificationsUrl, runtimePolicy }
const DEFAULT_TAGS_CONFIG, DEFAULT_AI_CONFIG, DEFAULT_NAV_CONFIG, DEFAULT_SYNTAX_CONFIG
const DEFAULT_PREDICTION_CONFIG, DEFAULT_SHORTCUTS, DEFAULT_THEME_CONFIG
const themeDefinitions   // 5 built-in themes with light/dark CSS var maps
const ICONS              // Record<name, SVG string> – ~50 inline SVG icons
const DEFAULT_ICONS      // clone of ICONS before theme overrides
const mpColorPalette     // 9 CSS var strings for ID-based option colouring
// Storage keys (all string constants):
// 'Prompts', 'GlobalFiles', 'PromptTags', 'Theme', 'ImportedThemes',
// 'AISettings', 'UserScriptLang', 'DontShowAgain', 'ShortcutsConfig',
// 'NavConfig', 'NavState', 'Prediction', 'SyntaxHighlight', 'Columns'
```

### 3.5 Main Function Groups

| Group | Functions |
|---|---|
| **Lifecycle** | `start()`, `tryInit()`, `initUI()`, `cleanup()`, `detectPlatform()` |
| **Prompt CRUD** | `getAll()`, `addItem()`, `updateById()`, `removeById()`, `getRawPrompts()`, `saveRawPrompts()`, `generatePromptId()`, `normalizePositions()` |
| **Tags** | `loadTagsConfig()`, `saveTagsConfig()`, `createOrUpdateTag()`, `deleteTag()`, `getTag()`, `getAllTags()`, `toggleTagFilter()`, `clearTagFilters()`, `promptMatchesFilter()` |
| **Themes** | `loadThemeConfig()`, `saveThemeConfig()`, `applyTheme()`, `importThemesFromFile()`, `deleteImportedTheme()`, `loadImportedThemes()` |
| **AI Enhance** | `triggerAIEnhancement()`, `callAI_API()`, `processAIEnhancementFlow()`, `handleInstantPageEnhancement()`, `handleTextareaEnhancement()`, `getProvider()`, `getRotatingApiKey()`, `parseSystemPrompts()`, `hasApiKeyForProvider()` |
| **Import/Export** | `exportPrompts()`, `importPrompts()`, `exportJsonAsSingleFile()`, `exportJsonAsMultipleFiles()`, `processAndSavePrompts()`, `parseTextPrompt()`, `openExportMenu()`, `openBackupManager()` |
| **UI Construction** | `createPromptButton()`, `createPromptMenu()`, `createPromptModal()`, `createPlaceholderModal()`, `createSettingsModal()`, `createLanguageModal()`, `createTagsManagerModal()`, `createInfoModal()`, `showAIDiffModal()` |
| **UI Helpers** | `showModal()`, `hideModal()`, `closeModal()`, `showNotification()`, `createDialogo()`, `createCustomTooltip()`, `setupEnhancedScroll()` |
| **Menu Logic** | `refreshMenu()`, `openExpandedPromptMenu()`, `closeMenu()`, `applyGlobalSortMode()`, `buildSharedFilterDropdown()` |
| **Placeholder Parsing** | `parsePromptInternal()`, `openPlaceholderModal()`, `getColorForId()` |
| **Smart Editor** | `attachSmartEditorLogic()`, `SyntaxHighlighter` (object with `attach/detach/refresh`) |
| **Inline Suggestion** | `setupInlineSuggestion()`, `createInlineMenu()`, `closeInlineMenu()`, `renderInlineList()`, `completeInlinePrompt()`, `getTextBeforeCaret()` |
| **Insertion** | `insertPrompt()`, `robustClearEditor()`, `getSendButton()`, `waitForUploadAndClick()`, `forceUpload()`, `moveCursorToEnd()`, `isEditorEmpty()` |
| **Nav / Pins** | `createNavInterface()`, `loadNavConfig()`, `scanMessages()`, `scrollToMessage()`, `navigateToMessage()`, `updateActivePins()`, `renderPinnedCarousel()`, `renderNavListItems()`, `loadPinsFromDB()`, `savePinsToDB()`, `startChatChangeWatcher()`, `startGlobalDomWatcher()` |
| **Shortcuts** | `loadShortcuts()`, `saveShortcutsConfig()`, `isShortcutPressed()` |
| **Gist** | `initGistIntegration()`, `injectGistButtons()`, `injectGistExportEditorButtons()`, `handleGistImportClick()`, `insertIntoGistEditor()`, `extractContentFromGistFile()` |
| **Global files** | `getGlobalFiles()`, `saveGlobalFile()`, `deleteGlobalFile()`, `dataURLtoFile()` |

### 3.6 Initialization Flow

```
document-end fires
  └─ start()
       ├─ determineLanguage()        [async – GM_getValue]
       ├─ loadSyntaxConfig()         [sync – GM_getValue]
       ├─ loadShortcuts()            [sync – GM_getValue]
       ├─ loadPredictionConfig()     [sync – GM_getValue]
       ├─ loadNavConfig()            [async – GM_getValue + IndexedDB]
       │     └─ (after 1500ms) restoreNavState(), scanMessages(),
       │        updateActivePins(), startChatChangeWatcher(), startGlobalDomWatcher()
       ├─ loadTagsConfig()           [async – GM_getValue]
       ├─ GM_registerMenuCommand("⚙️ Settings", ...)
       ├─ loadAIConfig()             [async – GM_getValue]
       ├─ loadImportedThemes()       [async – GM_getValue]
       ├─ loadThemeConfig()          [async – GM_getValue → applyTheme()]
       ├─ injectGlobalStyles()       [injects CSS resource into <head>]
       ├─ setupGlobalEventListeners()
       └─ tryInit()
             └─ initUI()             [async – platform detection + button injection]
                  ├─ detectPlatform()
                  ├─ createNavInterface()
                  ├─ (platform-specific anchor search with up to 2 retries)
                  ├─ createPromptButton() → insertBefore()
                  ├─ waitFor(platformSelectors[currentPlatform])
                  ├─ createPromptMenu() → document.body.appendChild
                  ├─ createPromptModal() → document.body.appendChild
                  ├─ createPlaceholderModal() → document.body.appendChild
                  ├─ createInfoModal() → document.body.appendChild
                  ├─ wireup: button click → positionMenu() + refreshMenu()
                  ├─ wireup: modal save → addItem/updateById
                  ├─ wireup: placeholder insert → insertPrompt()
                  ├─ wireup: Gist platform init
                  ├─ setupInlineSuggestion(textarea)
                  ├─ applyGrokCustomStyles() / applyChatGLMCustomStyles() if needed
                  ├─ pageObserver = new MutationObserver → tryInit() on DOM change
                  └─ isInitialized = true
```

### 3.7 Event Listener Flow

```
document – click  → closes menu if outside #prompt-menu-container
document – keydown:
  Escape           → closes menu / modal / language modal / placeholder modal
  isShortcutPressed('newPrompt')     → openPromptModal()
  isShortcutPressed('listPrompts')   → toggle menu
  isShortcutPressed('enhancePrompt') → handleInstantPageEnhancement()
window – resize (debounced 100ms) → repositions open menu
```

Inside individual UI components, all handlers use `.addEventListener()` with explicit `stopPropagation()` calls to avoid event bubbling conflicts with the host platform.

### 3.8 MutationObserver Usage

```
pageObserver         – observes document.body {childList, subtree}
                       triggers tryInit() on every DOM mutation (SPA navigation guard)

SyntaxHighlighter    – internal MutationObserver on the prompt textarea
                       to detect programmatic value changes (e.g., from paste button)
                       triggers syntax re-render

createLanguageModal  – MutationObserver on language modal element
                       to focus the search input when modal becomes .visible

setupEnhancedScroll  – MutationObserver on scroll container
                       to update arrow visibility when children are added/removed

startGlobalDomWatcher (setInterval 1500ms, not MutationObserver)
                       – counts message elements, calls scanMessages on change

startChatChangeWatcher (setInterval 500ms)
                       – detects URL change → reloads pins from IndexedDB
```

### 3.9 Timing and Async Behaviour

- **`@run-at document-end`** — runs after `DOMContentLoaded` but the host SPA may not have rendered the composer yet.
- Each platform's anchor-finding code retries once after a `setTimeout(r, 1000–2000)` if the first attempt returns null.
- `waitFor(selector, timeout=8000)` provides a `MutationObserver` based poll with an 8-second hard timeout.
- Nav initialisation is delayed 1 500 ms after `loadNavConfig` to give the SPA time to render conversation turns.
- `debounce(fn, 100ms)` wraps the inline suggestion `input` handler.
- File attachment uses a `waitForUploadAndClick` polling loop (800 ms interval, max 120 s) that waits for the editor to be non-empty before clicking the send button.

---

## 4. DOM and UI Integration

### 4.1 Composer Button Injection

The script uses a **SVG-path fingerprint strategy** to locate the send/submit button on each platform, rather than brittle class-name selectors. For example:

```js
// ChatGPT
document.getElementById('composer-plus-btn')
// DeepSeek
document.querySelector('div[role="button"]') // whose path.d starts with "M8.3125 0.981587"
// Gemini
document.querySelector('mat-icon[data-mat-icon-name="mic"]').closest(…)
// Claude
// walks up from SVG path "M208.49,120.49…" to .shrink-0 wrapper
```

Once the anchor is found the script either reuses an existing `[data-testid="composer-button-prompts"]` element or creates a new one with `createPromptButton()` and calls `container.insertBefore(btn, anchor)`.

### 4.2 Created Elements

| Element | ID / Class | Location |
|---|---|---|
| Pill button wrapper | `.mp-prompt-wrapper` | Inside composer toolbar |
| Sliding pill container | `.mp-sliding-pill-container` | Inside pill wrapper |
| AI Enhance sub-button | `[data-testid="composer-button-ai-enhance"]` | Inside pill |
| Prompt list sub-button | `[data-testid="composer-button-prompts"]` | Inside pill |
| Prompt list menu | `#prompt-menu-container.prompt-menu` | `document.body` |
| Prompt create/edit modal | `#__ap_modal_overlay` | `document.body` |
| Placeholder modal | `#__ap_placeholder_modal_overlay` | `document.body` |
| Settings modal | `#__ap_settings_overlay` | `document.body` |
| Tags manager modal | `#__mp_tags_overlay` | `document.body` |
| Language modal | `#__ap_lang_modal_overlay` | `document.body` |
| Backup modal | `#__ap_backup_overlay` | `document.body` |
| Info modal | `#__ap_info_modal_overlay` | `document.body` |
| AI Diff modal | `#__ap_diff_overlay` | `document.body` |
| AI Enhance loading overlay | `#__ap_enhance_loading` | `document.body` |
| Prompt selection modal | `#__ap_prompt_modal_overlay` | `document.body` |
| Export menu | `#__ap_export_overlay` | `document.body` |
| Nav container | `#mp-nav-container.mp-nav-switch` | `document.body` |
| Nav list popup | `.mp-nav-list-popup` | Inside `#mp-nav-container` |
| Pinned carousel | `#mp-pinned-carousel-wrapper` | `document.body` |
| Inline suggestion | `.mp-inline-menu` | `document.body` |
| Notification container | `#mp-notification-container` | `document.body` |
| Tooltip | `.mp-tooltip` | `document.body` (transient) |
| Rulers (drag mode) | `#mp-rulers-container` | `document.body` (transient) |
| Global style | `<style id="my-prompt-styles">` | `<head>` |
| Theme override | `<style id="mp-theme-override">` | `<head>` |
| Platform fix styles | `<style id="mp-chatglm-left-align">` / `my-prompt-grok-padding` | `<head>` |
| Syntax highlight backdrop | `.mp-syntax-backdrop` inside `.mp-syntax-container` | Wraps prompt textarea |

### 4.3 Keyboard Shortcuts

All shortcuts are user-configurable. Defaults:

| Action | Default |
|---|---|
| New Prompt | `Alt+N` |
| List Prompts | `Alt+P` |
| Save/Send (placeholder modal) | `Ctrl+Enter` |
| Save Editor (prompt modal) | `Ctrl+S` |
| Line Break (in textarea) | `Shift+Enter` |
| AI Enhance | `Alt+E` |

Shortcut detection uses `isShortcutPressed(event, key)` which parses the stored string (e.g., `"Alt+N"`) and checks `e.ctrlKey`, `e.altKey`, `e.shiftKey`, `e.key.toUpperCase()`, and `e.code`.

### 4.4 CSS Injection Strategy

1. **Global styles** are loaded from the `@resource CSS` (a CDN-hosted minified stylesheet) and injected as `<style id="my-prompt-styles">` by `injectGlobalStyles()`. This runs once.
2. **Theme overrides** are injected as `<style id="mp-theme-override">` by `applyTheme()`. This element is removed and recreated each time the theme changes. CSS variables are written with `!important` to override host platform styles.
3. **Platform-specific fixes** are injected as named `<style>` elements only when that platform is detected.
4. The script defines all its own CSS through variables prefixed `--mp-*`, making theming clean and host-style-independent.

### 4.5 Adapting to UI Changes

The fingerprint strategy (SVG path data, specific element IDs, custom `data-*` attributes) is more resilient than class names, but still brittle. The `pageObserver` MutationObserver re-runs `tryInit()` on every DOM change. `tryInit()` checks if `currentButton` is still in `document.body` and if the platform is unchanged before skipping re-initialisation, so the observer triggers a full re-init after SPA navigation or layout rebuilds.

---

## 5. Data and Persistence

### 5.1 Storage Mechanisms

| Mechanism | Usage |
|---|---|
| `GM_getValue` / `GM_setValue` | Primary — all user data except nav pins |
| `sessionStorage` | Nav scroll position restoration (`NavState`) |
| `IndexedDB` (database: `MyPrompt`, store: `chatPins`) | Per-chat pinned messages |

### 5.2 Data Schemas

#### Prompts (`GM_getValue('Prompts')`)

Stored as a plain object (not array) keyed by prompt ID. The `id` is not stored inside the value:

```js
{
  [promptId: string]: {
    title: string,
    text: string,
    usePlaceholders: boolean,
    autoExecute: boolean,
    isFixed: boolean,        // pinned to top of list
    activeFileIds: string[], // IDs from GlobalFiles
    tags: string[],          // lowercase tag names
    usageCount: number,
    position: number
  }
}
```

Legacy: the value may be an **array** (pre-6.x format). `getAll()` detects this and migrates on first read.

#### Global Files (`GM_getValue('GlobalFiles')`)

Array of file objects:

```js
[{
  id: string,          // timestamp + random
  name: string,
  type: string,        // MIME type
  size: number,        // bytes
  data: string         // base64 data URL
}]
```

#### Tags (`GM_getValue('PromptTags')`)

```js
{
  tags: {
    [normalizedName: string]: {
      name: string,       // display name (original case)
      bgColor: string,    // hex color
      textColor: string,
      comment: string
    }
  },
  activeFilters: string[],  // currently active filter names
  sortMode: string          // 'manual'|'az'|'za'|'most_used'|'least_used'|'newest'|'oldest'|'tags'
}
```

#### AI Settings (`GM_getValue('AISettings')`)

```js
{
  apiKeyGemini: string,      // comma-separated keys for rotation
  apiKeyLongcat: string,
  apiKeyGroq: string,
  apiKeyOpenRouter: string,
  apiKeyHuggingFace: string,
  keyIndexGemini: number,    // current rotation index
  keyIndexLongcat: number,
  keyIndexGroq: number,
  keyIndexOpenRouter: number,
  keyIndexHuggingFace: number,
  model: string,             // model identifier string
  systemPrompt: string
}
```

#### Nav Config (`GM_getValue('NavConfig')`)

```js
{
  enabled: boolean,
  settings: {
    filterMode: 'all'|'user'|'ai',
    showCarousel: boolean,
    carouselPosition: { cx: number|null, ty: number } | { left: null, top: number },
    carouselOrientation: 'horizontal'|'vertical',
    carouselActionsSide: 'top'|'bottom'|'left'|'right'
  }
}
```

#### Chat Pins (IndexedDB `chatPins` store)

Keyed by `chatId` (URL path + query + hash):

```js
{
  chatId: string,
  pins: [{
    isHeading: boolean,
    text: string,            // preview text of pinned element
    parentPreview: string,   // preview of containing message (for headings)
    timestamp: number
  }]
}
```

#### Shortcuts (`GM_getValue('ShortcutsConfig')`)

```js
{
  [actionKey: string]: {
    keys: string,      // e.g. "Alt+N"
    descKey: string    // translation key for description
  }
}
```

### 5.3 Import / Export

- **Prompt export:** JSON array of `{title, text, usePlaceholders, autoExecute}` objects, saved as `.mp.prompt.json`. Multi-file mode creates one file per prompt with up to 200 ms delay between downloads.
- **Prompt import:** Accepts `.mp.prompt.json`, `.mp.prompt.txt`, `.mp.prompt.md`. Text/Markdown files support a `{{title: …; useplaceholders: …}}` header format for multi-prompt files.
- **Theme export/import:** `.mp.theme.json` — a JSON object mapping theme IDs to theme definition objects.
- **Full backup:** `.mp.backup.json` with a `meta` block and `data` object keyed by GM storage key.

---

## 6. Permissions and Dependencies

### 6.1 Userscript Manager Requirements

- **Requires Tampermonkey or Violentmonkey.** Both support all `GM_*` APIs used.
- Greasemonkey 4+ is incompatible (dropped synchronous `GM_getValue`; the script calls sync `GM_getValue` in `loadShortcuts`, `loadSyntaxConfig`, `loadPredictionConfig`).
- `@noframes` ensures the script does not run in iframes.

### 6.2 `@grant` Permissions

| Grant | Usage |
|---|---|
| `GM_getValue` | Read all stored data |
| `GM_setValue` | Write all stored data |
| `GM_listValues` | (declared but not called in reviewed code — likely legacy) |
| `GM_deleteValue` | (declared but not called in reviewed code — likely legacy) |
| `GM_xmlhttpRequest` | AI API calls, font loading bypass |
| `GM_getResourceText` | Load CSS and language JSON from CDN |
| `GM_registerMenuCommand` | "⚙️ Settings" in script manager UI |

### 6.3 `@connect` Domains

| Domain | Purpose |
|---|---|
| `generativelanguage.googleapis.com` | Google Gemini API |
| `translate.googleapis.com` | (inferred — possibly used by FontLoaderBypass or future feature) |
| `router.huggingface.co` | HuggingFace Inference API |
| `openrouter.ai` | OpenRouter unified AI gateway |
| `api.groq.com` | Groq API |
| `api.longcat.chat` | LongCat API |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Web font metadata and files |
| `cdn.jsdelivr.net` | Script icon, CSS resource, language JSON, fonts |
| `cdn.streamain.com` | Unknown — not referenced directly in reviewed code |
| `files.catbox.moe` | Unknown — not referenced directly in reviewed code |
| `gist.github.com` | Gist integration |
| `i.ibb.co` | Unknown — possibly theme image hosting |

### 6.4 External Libraries and APIs

| Library/Service | How Loaded | Purpose |
|---|---|---|
| `ScriptNotifier` | `@require` (Greasyfork 564164) | In-UI update notifications |
| `FontLoaderBypass` | `@require` (Greasyfork 549920) | CORS-bypass web font loading |
| CSS stylesheet | `@resource CSS` (jsdelivr) | All My Prompt UI styles |
| Language strings | `@resource IDIOMAS` (jsdelivr) | 40-language translations |

### 6.5 Browser Compatibility

`@compatible` declares Chrome, Firefox, Edge, Brave, Opera. The script uses `document.execCommand` (deprecated but still functional in all), `Clipboard API` (`navigator.clipboard.readText`), `IndexedDB`, `MutationObserver`, `ResizeObserver`, `window.trustedTypes` (guarded — only used if available), `requestAnimationFrame`. No Web Components or ES modules. Compatible with ES2020+.

---

## 7. Execution Flow

### 7.1 Step-by-Step from Page Load to Active State

```
1. Browser loads page (e.g., chatgpt.com/c/…)
2. document-end fires; IIFE executes
3. Trusted Types policy created (if window.trustedTypes exists)
4. SCRIPT_CONFIG constructed; ScriptNotifier.run() (async, non-blocking)
5. FontLoaderBypass.load(…) scheduled on window.load
6. platformSelectors constant defined (all 35+ platform CSS selectors)
7. translations = JSON.parse(GM_getResourceText("IDIOMAS"))
8. start() called:
   a. determineLanguage() → currentLang set
   b. loadSyntaxConfig() / loadShortcuts() / loadPredictionConfig() → sync GM_getValue
   c. loadNavConfig() → async, loads IndexedDB pins, schedules nav watchers at +1500ms
   d. loadTagsConfig() → async
   e. GM_registerMenuCommand("⚙️ Settings", …)
   f. loadAIConfig() → async
   g. loadImportedThemes() → async
   h. loadThemeConfig() → async → applyTheme() injects <style id="mp-theme-override">
   i. injectGlobalStyles() → <style id="my-prompt-styles"> injected into <head>
   j. setupGlobalEventListeners() → document click/keydown, window resize
   k. tryInit() called
9. tryInit() → initUI():
   a. pageObserver.disconnect() if exists; cleanup() (removes old UI elements)
   b. currentPlatform = detectPlatform()
   c. createNavInterface() → appends nav widget to body if enabled
   d. Platform-specific anchor search (with optional 1–2s await retry)
   e. createPromptButton() → inserted into composer toolbar
   f. waitFor(platformSelectors[currentPlatform]) → waits for textarea to exist
   g. createPromptMenu() → appended to body (hidden)
   h. createPromptModal() → appended to body (hidden)
      └─ attachSmartEditorLogic(textarea)
      └─ SyntaxHighlighter.attach(textarea) (async, after 10ms)
   i. createPlaceholderModal() → appended to body (hidden)
   j. createInfoModal() → appended to body (hidden)
   k. Wire up button click → refreshMenu() + positionMenu() + toggle .visible
   l. Wire up modal save button → addItem/updateById
   m. Wire up placeholder "Insert" → assemble final text → insertPrompt()
   n. Wire up Ctrl+S in modal → save
   o. initGistIntegration() (only if platform === 'gist')
   p. setupInlineSuggestion(textarea)
   q. applyGrokCustomStyles / applyChatGLMCustomStyles if needed
   r. pageObserver = new MutationObserver(tryInit) → observe document.body
   s. isInitialized = true; isInitializing = false
10. User interacts with pill button → menu opens
11. User selects a prompt:
    - If usePlaceholders: openPlaceholderModal() → user fills widgets → Insert
    - Else: insertPrompt() directly
12. insertPrompt():
    a. Locates composer element via platformSelectors
    b. If prompt has activeFileIds: loads files from GM storage, creates File objects
    c. File injection: DragEvent drop or ClipboardEvent paste (platform-specific)
    d. Text injection: platform-specific approach (execCommand, React synthetic events,
       native value setter, innerHTML, etc.)
    e. moveCursorToEnd()
    f. If autoExecute: clicks send button or forceUpload()
    g. If not isFixed: moves prompt to top of unfixed list (usage-based reordering)
```

### 7.2 Key Decision Points

1. **`detectPlatform()` returns null** → `initUI()` returns immediately; no UI injected.
2. **Anchor not found after retry** → `initUI()` returns; `pageObserver` will retry on next DOM mutation.
3. **Existing `[data-testid="composer-button-prompts"]` found** → reuses it instead of creating a new one (idempotent injection).
4. **`usePlaceholders === true`** → route through `parsePromptInternal()` and placeholder modal instead of direct insertion.
5. **AI Enhance with no API key** → shows a `createDialogo()` offering to open Settings rather than attempting the API call.
6. **System prompt contains `Title {{ … }}` multi-block** → shows prompt selection modal before the AI call.
7. **`isFixed === true` on a prompt** → it stays at the top of the list; usage-based reordering skips it.

### 7.3 Error Handling

- **GM API errors** are caught in `try/catch` blocks in most load functions; fallback to defaults.
- **AI API errors** surface via `createDialogo({type:'alert', message: e.message})`.
- **DOM insertion failures** are handled silently — the `initUI` function guards with `if (!anchorData) return`.
- **`waitFor` timeout** rejects the Promise silently (the `initUI` just stops; `pageObserver` will retry).
- **IndexedDB errors** are caught and logged to `console.error`; pins simply return `[]`.
- **JSON parse errors** in backup import show an alert dialog with the error message.
- **Large file attachment** (> 5 MB) shows a confirmation dialog before proceeding.

### 7.4 Edge Cases

- **SPA navigation** (ChatGPT opens a new chat): `pageObserver` fires, `tryInit` detects `currentButton` is no longer in DOM, calls `initUI` to re-inject.
- **Platform changes mid-session** (e.g., user navigates from ChatGPT to a different `@match`ed host, though unlikely without a reload): `tryInit` checks `currentPlatform === detectPlatform()`.
- **Legacy array-format prompt storage**: `getAll()` detects `Array.isArray(rawData)` and migrates to object format in-place.
- **Multiple API keys** in comma-separated string: `getRotatingApiKey()` handles round-robin and resets index on overflow.
- **Firefox and `document.execCommand`**: Several insertion paths have `if (a)` (Firefox) branches that fall back from synthetic events to `execCommand`.

---

## 8. Replication Blueprint

### 8.1 Recommended Architecture

Organise the new script into logical modules (as separate files if using a bundler like esbuild or rollup, or as clearly delineated IIFE sections):

```
src/
├─ core/
│   ├─ platform.js        detectPlatform(), platformSelectors
│   ├─ storage.js         GM wrappers, prompt CRUD, file CRUD
│   ├─ state.js           all let/const state variables
│   └─ lifecycle.js       start(), tryInit(), initUI(), cleanup()
├─ ui/
│   ├─ button.js          createPromptButton()
│   ├─ menu.js            createPromptMenu(), refreshMenu(), closeMenu()
│   ├─ modal-prompt.js    createPromptModal(), openPromptModal()
│   ├─ modal-placeholder.js createPlaceholderModal(), openPlaceholderModal()
│   ├─ modal-settings.js  createSettingsModal()
│   ├─ modal-tags.js      createTagsManagerModal(), openTagsManager()
│   ├─ modal-backup.js    openBackupManager()
│   ├─ modal-diff.js      showAIDiffModal()
│   ├─ dialogo.js         createDialogo(), showNotification()
│   ├─ tooltip.js         createCustomTooltip()
│   └─ scroll.js          setupEnhancedScroll()
├─ features/
│   ├─ ai-enhance.js      callAI_API(), triggerAIEnhancement()
│   ├─ inline-suggest.js  setupInlineSuggestion(), inlineMenu logic
│   ├─ smart-editor.js    attachSmartEditorLogic()
│   ├─ syntax.js          SyntaxHighlighter object
│   ├─ nav.js             createNavInterface(), scanMessages(), Nav pins
│   └─ gist.js            initGistIntegration()
├─ data/
│   ├─ tags.js            tag CRUD
│   ├─ themes.js          theme definitions, applyTheme()
│   ├─ shortcuts.js       loadShortcuts(), isShortcutPressed()
│   └─ import-export.js   exportPrompts(), importPrompts(), backup
└─ i18n/
    └─ i18n.js            determineLanguage(), getTranslation()
```

### 8.2 Reusable Modules

#### Storage Wrapper

```js
const Store = {
  async get(key, def = null) {
    try { return await GM_getValue(key, def); }
    catch { return def; }
  },
  async set(key, val) {
    await GM_setValue(key, val);
  }
};
```

#### Debounce

```js
const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
```

#### waitFor

```js
function waitFor(selector, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const t = setTimeout(() => { obs.disconnect(); reject(); }, timeout);
    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { clearTimeout(t); obs.disconnect(); resolve(found); }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  });
}
```

#### setSafeInnerHTML (Trusted Types compatible)

```js
function setSafeInnerHTML(el, html) {
  if (!el) return;
  el.innerHTML = window.__mpPolicy ? window.__mpPolicy.createHTML(html) : html;
}
// Create policy once at init:
if (window.trustedTypes?.createPolicy) {
  try { window.__mpPolicy = window.trustedTypes.createPolicy('mp', { createHTML: s => s }); }
  catch {}
}
```

#### SVG Fingerprint Anchor Search

```js
function findByPathFingerprint(fingerprint, context = document) {
  return Array.from(context.querySelectorAll('button, [role="button"]'))
    .find(el => el.querySelector('path')?.getAttribute('d')?.includes(fingerprint)) || null;
}
```

#### Prompt CRUD (simplified)

```js
const PROMPTS_KEY = 'Prompts';

async function getAllPrompts() {
  let raw = await Store.get(PROMPTS_KEY, {});
  if (Array.isArray(raw)) raw = migrateArrayToObject(raw); // handle legacy
  return Object.entries(raw)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

async function savePrompts(prompts) {
  const obj = {};
  prompts.forEach(p => { const { id, ...rest } = p; obj[id] = rest; });
  await Store.set(PROMPTS_KEY, obj);
}
```

#### isShortcutPressed

```js
function isShortcutPressed(event, shortcutStr) {
  const parts = shortcutStr.toUpperCase().split('+');
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes('CTRL');
  const needAlt = parts.includes('ALT');
  const needShift = parts.includes('SHIFT');
  if (event.ctrlKey !== needCtrl) return false;
  if (event.altKey !== needAlt) return false;
  if (event.shiftKey !== needShift) return false;
  return event.key.toUpperCase() === key || event.code.toUpperCase() === `KEY${key}`;
}
```

### 8.3 Pseudocode for Complex Behaviour

#### `parsePromptInternal(text)` — Placeholder Tokenisation

```
function parsePromptInternal(text):
  ignoreMap = Map()     # token → original content (to restore on output)
  selectMap = Map()     # token → {title, options[], isInline, indent}
  inputMap  = Map()     # token → {label, varName, defaultValue, context, silent}
  fileMap   = Map()     # token → {title}
  counter = 0

  # 1. Extract ##ignore…##end blocks → replace with __IGNORE_N__ token
  # 2. Escape \[, \], \{, \}, \#, \: → replace with __ESC_CHAR_N__ token
  # 3. Extract ''quoted'' blocks → replace with __QUOTE_N__ token
  # 4. Expand #date/#time macros to current date/time strings
  # 5. Extract #file(Title) → __FILE_N__ token, record in fileMap
  # 6. Extract ##start…##end blocks → parse option lines → __SELECT_N__ token
  # 7. Extract [label = $var :: default](context) → __INPUT_N__ (non-silent)
  # 8. Extract {label = $var :: default}(context) → __INPUT_N__ (silent)
  # 9. Extract [label :: default](context) → __INPUT_N__ (free label, no var)

  return { processedText, ignoreMap, selectMap, inputMap, fileMap }
```

#### `insertPrompt(promptObj)` — Cross-Platform Text Insertion

```
function insertPrompt(promptObj):
  el = document.querySelector(platformSelectors[currentPlatform])
  el.focus()
  
  if promptObj.activeFileIds.length > 0:
    files = load files from GlobalFiles matching activeFileIds
    inject via DragEvent drop or ClipboardEvent paste (platform-specific)
  
  switch currentPlatform:
    case 'claude' | 'grok' | 'dreamina':
      if el is TEXTAREA:
        use native value setter + React synthetic Event
      else (contenteditable):
        split text by \n → create <p> elements → execCommand('insertHTML')
    
    case 'chatgpt' | 'longcat' | 'mistral' | 'yuanbao' | 'manus':
      // Firefox path: insertText on contenteditable paragraphs
      // Chrome path: ClipboardEvent paste with text/plain
    
    case 'gemini':
      Firefox: mutate DOM text nodes directly
      Chrome: execCommand('insertText') or ClipboardEvent paste
    
    case default (textarea-based):
      ClipboardEvent paste → if value not updated, use native value setter
  
  moveCursorToEnd(el)
  
  if promptObj.autoExecute:
    if has files: waitForUploadAndClick(el)
    else: click getSendButton() or dispatch Enter KeyboardEvent
  
  if not promptObj.isFixed:
    move prompt to top of unfixed list (update positions)
```

#### `callAI_API(text, systemPrompt)` — Provider-Agnostic API Call

```
function callAI_API(text, systemPrompt):
  model = currentAIConfig.model
  provider = getProvider(model)   # gemini | openrouter | huggingface | longcat | groq
  apiKey = getRotatingApiKey(provider)
  
  if provider === 'gemini':
    GM_xmlhttpRequest POST to generativelanguage.googleapis.com
    body: { contents: [{parts:[{text}]}], systemInstruction: {parts:[{text: systemPrompt}]} }
    parse response.candidates[0].content.parts[0].text
  
  else:
    endpoint = getOpenAIEndpoint(provider)  # each provider has an OpenAI-compatible endpoint
    modelId = strip provider prefix from model string
    GM_xmlhttpRequest POST to endpoint
    headers: Authorization: Bearer <apiKey>
             (openrouter also sends HTTP-Referer: window.location.origin)
    body: { model: modelId, messages: [{role:'system',…},{role:'user',…}], temperature: 0.7 }
    parse response.choices[0].message.content
```

### 8.4 Cleaner Implementation Alternatives

**Platform detection** — instead of a single god-function, use a registry pattern:

```js
const PLATFORMS = [
  { key: 'chatgpt', test: h => h === 'chatgpt.com' },
  { key: 'claude',  test: h => h === 'claude.ai' },
  // …
];
function detectPlatform() {
  const h = location.hostname;
  return PLATFORMS.find(p => p.test(h))?.key ?? null;
}
```

**Button injection** — use a small async retry helper instead of inline `await new Promise(r => setTimeout(r, 1500))`:

```js
async function retryUntil(fn, { attempts = 2, delay = 1200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const result = fn();
    if (result) return result;
    if (i < attempts - 1) await sleep(delay);
  }
  return null;
}
```

**Storage** — wrap all GM calls with an async cache layer to avoid repeated reads for the same key within a single page lifetime:

```js
const cache = new Map();
async function cachedGet(key, def) {
  if (cache.has(key)) return cache.get(key);
  const val = await GM_getValue(key, def);
  cache.set(key, val);
  return val;
}
async function cachedSet(key, val) {
  cache.set(key, val);
  await GM_setValue(key, val);
}
```

---

## 9. Refactoring and Improvement Opportunities

### 9.1 Fragile Selectors

| Location | Issue |
|---|---|
| ChatGPT anchor: `document.getElementById('composer-plus-btn')` | Stable ID but OpenAI has renamed it before. |
| ChatGPT anchor: SVG `<use href>` containing partial hash `"6be74c"` | Any icon sprite change breaks this. |
| Claude injection: traversal up to `.shrink-0` with nested `while` loop | Brittle to Tailwind class changes. |
| Gemini: `mat-icon[data-mat-icon-name="mic"]` | Angular Material components tend to be stable, but attribute names can change. |
| DeepSeek: path `d` attribute starting with `"M8.3125 0.981587"` | Float precision in SVG paths is renderer-dependent. |
| `pageObserver` on `document.body {childList, subtree}` | Fires on every DOM mutation across the entire page; very high frequency. |

**Recommendation:** Prefer `data-testid` or `aria-label` attributes where available. For platforms using React, hook into the React DevTools fiber if accessible, or use stable accessibility roles.

### 9.2 Race Conditions

- `tryInit()` has a boolean mutex (`isInitializing`) but `pageObserver` fires synchronously on every DOM mutation. If two mutations fire simultaneously, the second call to `tryInit()` is blocked by the mutex but no retry is scheduled. If the first init attempt fails silently (e.g., anchor not found even after retry), the system waits for the next DOM mutation to try again — this is usually fine but can delay injection by seconds on slow pages.
- `startGlobalDomWatcher` and `startChatChangeWatcher` are both `setInterval` loops with no cleanup path unless `currentNavConfig.enabled` is false. If `initUI` runs multiple times (SPA navigation), new intervals may stack.
- The `SyntaxHighlighter` MutationObserver observing the prompt textarea does not have a cleanup path tied to the `d.detach()` call — verified: `detach()` only disconnects via the `r` closure variable captured at attach time, which is correct, but if `attach()` is called twice the first observer leaks.

### 9.3 Performance Risks

- `pageObserver` observing `{childList: true, subtree: true}` on `document.body` is extremely broad and fires thousands of times during an AI response streaming. Each call goes through `tryInit()` which checks two booleans and one `document.body.contains()` call — cheap, but still runs on every tick.
- `startGlobalDomWatcher` scans the entire DOM for message selectors every 1 500 ms. On very long conversations with dozens of messages, `scanMessages()` calls `querySelectorAll` twice and iterates all results to sort and deduplicate.
- `createCustomTooltip` appends to `document.body` and reads `getBoundingClientRect()` on show, causing layout reflow on every tooltip display. Multiple simultaneous tooltip requests are not batched.
- The `SyntaxHighlighter` runs on every `input` and `keydown` event, re-rendering the entire backdrop HTML on each keystroke via `setSafeInnerHTML`. For very long prompts this creates measurable jank.

### 9.4 Maintainability Issues

- The `initUI()` function is one monolithic async function with 30+ platform branches, each between 20–60 lines. It should be split into a registry of platform adapters.
- `createSettingsModal()` and `refreshMenu()` build large HTML strings via template literals and `setSafeInnerHTML`. This makes the HTML hard to review and test. A minimal virtual DOM or template function pattern would help.
- `closeMenu()` is **defined four times** in sequence (lines ~1612–1622 in the source). Only the last definition survives due to function hoisting. This is dead code that may confuse contributors.
- `insertPrompt()` is the longest single function (>200 lines) and contains nested switch/if logic for 35+ platforms. Each insertion approach is slightly different and not well documented.
- Synchronous `GM_getValue` calls in `loadShortcuts`, `loadSyntaxConfig`, `loadPredictionConfig` work in Tampermonkey but are incorrect API usage (GM_getValue returns a Promise in the GM4 spec). This should be `await GM_getValue(…)` throughout.

### 9.5 Security and Privacy Concerns

- **API keys stored in GM storage** (`AISettings`): exposed to any script with read access to the userscript manager's storage, which is typically accessible from the extension DevTools console. Keys should ideally be stored in the extension's encrypted storage if Tampermonkey ever exposes it.
- **`setSafeInnerHTML` with Trusted Types**: The TrustedTypePolicy is a passthrough (`createHTML: s => s`), meaning no sanitisation is performed. Prompt text inserted into HTML contexts should go through DOMPurify or use `textContent` assignment instead. An untrusted prompt title rendered via `setSafeInnerHTML` could execute XSS in a self-XSS context (the user's own data attacks the user's own page).
- **`GM_xmlhttpRequest` to user-configured endpoints**: If a user misconfigures `currentAIConfig.model` to an attacker-controlled string that maps to an `openrouter|` prefix, the script would send the user's prompt text and API key to an arbitrary endpoint. Input validation on the model string is absent.
- **File data stored as base64 in GM storage**: Global files (including potentially sensitive documents) are stored indefinitely in userscript manager storage with no size cap beyond the 5 MB per-file confirmation dialog.

### 9.6 Suggested Upgrades

| Issue | Suggestion |
|---|---|
| Monolithic `initUI` | Extract to a `PlatformAdapter` class per platform |
| `closeMenu` redefinition | Remove the first three dead definitions |
| Synchronous `GM_getValue` | Always use `await GM_getValue` |
| `pageObserver` performance | Throttle `tryInit` calls with a 100 ms debounce inside the observer callback |
| `SyntaxHighlighter` performance | Use `requestAnimationFrame` batching already present, but add a minimum 50 ms cooldown |
| XSS risk in `setSafeInnerHTML` | Replace innerHTML for user-provided content with `textContent` + DOM construction |
| `stacked intervals` | Store interval IDs globally; `clearInterval` on `cleanup()` |
| `getAll()` migration | Move legacy array migration to a one-time install check |
| Nav + Carousel on every platform | Separate feature flags per platform to reduce unnecessary DOM work |
| Circular `@connect` (unused domains) | Audit and remove `cdn.streamain.com`, `files.catbox.moe`, `i.ibb.co` if unused |

---

*End of Dossier*
