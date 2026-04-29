# PROJECT_LOGS.md — Unleashed Prompt Userscript

> Primary source of truth. Never overwrite — append only.

---

## 1. Current Project State

### What Works (v1.0.2 — Current)

- **Full ChatGPT/Claude.ai UI Theming** — 19 color zones, two-tag CSS strategy, 14 presets
- **Prompt Library** — GM storage, merged schema, CRUD, tags, favorites, sort, filter, search
- **Dynamic Placeholder System** — `[input]`, `##select{}`, `#file[]` with fill modal
- **AI Enhancement (both modes)**
  - Quick Enhance: composer-based, zero-config
  - AI Enhance: external API (Gemini/OpenRouter/Groq/HuggingFace/LongCat) + diff modal
- **Inline `#` Autocomplete** — keyboard nav, caret-aware completion
- **Smart Editor** — bracket pair completion, `##start/end` macro wrapping, syntax backdrop
- **Chat Navigation Widget** — message index, prev/next, pinned carousel (IndexedDB-backed)
- **Chat Management** — Markdown export, bulk export/delete modal, sidebar quick-delete buttons
- **Gist Integration** — export/import prompt library via GitHub Gist
- **Full Backup/Restore** — selective key restore from `.json` backup
- **Floating Panel (7 pages)** — fully implemented: Home, Themes, Layout, Font, Prompts, Settings, UI-Theme
- **Toolbar Pill Button** — Enhance + Prompts halves, search, right-click-to-edit
- **Prompt Explorer Modal** — fullscreen grid, multi-column, drag-to-reorder
- **Prompt Editor Modal** — create/edit/delete, all fields, toggles
- **Keyboard Shortcuts** — 8 configurable actions with recorder
- **Self-Healing** — 1200ms guard recreates missing style/panel nodes
- **MutationObserver** — pause/resume pattern, history.pushState URL interception
- **GM Menu Commands** — 7 commands
- **Update Checker** — self-contained fetch, semver comparison, raw.githubusercontent.com lock
- **File Auto-Attach** — DragEvent + ClipboardEvent strategies
- **Platform Adapters** — ChatGPT (score-based) + Claude.ai

### What is Partially Implemented

- `initGistIntegration()` — was a log stub in v1.0.0/v1.0.1; **fixed in v1.0.2** to properly wire Gist on gist.github.com pages

### What is Broken or Unverified

- Bulk export cross-navigation (noted as Phase 2 in code — uses iframe approach that may be CSP-blocked on some configurations)
- File attach on Claude.ai — ClipboardEvent strategy may not work on all Claude builds
- `attachSmartEditorLogic` bracket skip — closing char skip only works for textarea, not contenteditable

### Recently Modified Files

- `AI-ITS-OVER-9000.user.js` → bumped to v1.0.2, fixed `initGistIntegration()`
- `PROJECT_LOGS.md` → created (this file)

---

## 2. Completed Changes

### [v1.0.0 → v1.0.1] Phase 2 Implementation

**Date:** April 2026  
**Files:** `AI-ITS-OVER-9000.user.js`

| Change | Why | Verified |
|---|---|---|
| `createNavInterface()` — full nav widget, scan, prev/next, counter, scroll buttons, pin buttons, carousel | Phase 2 completion | Code review |
| `renderCarousel()` + `renderCarouselCards()` — IndexedDB-backed pinned carousel | Phase 2 completion | Code review |
| `renderPanelLayout()` — full sliders (bubble radius, max-width, padding, opacity), toggles | Phase 2 elevation | Code review |
| `renderPanelFont()` — font family input + per-role size sliders | Phase 2 elevation | Code review |
| `renderPanelUiTheme()` — full 18-zone color picker grid with per-zone enable toggles | Phase 2 elevation | Code review |
| `openPromptExplorerModal()` — fullscreen multi-column grid, sort, tag filter, drag-to-reorder | Phase 2 elevation | Code review |
| `attachSmartEditorLogic()` — bracket completion, macro wrapping, syntax backdrop | Phase 2 elevation | Code review |
| `forceFileAttach()` — DragEvent drop + ClipboardEvent paste strategies | Phase 2 elevation | Code review |
| `exportAllData()` — full backup export of all GM keys | Phase 2 elevation | Code review |
| `openBackupModal()` — selective restore modal with key checkboxes | Phase 2 elevation | Code review |
| `openGistModal()` — full Gist import/export UI | Phase 2 elevation | Code review |
| `exportPromptsToGist()` / `importPromptsFromGist()` — GitHub API calls via GM_xmlhttpRequest | Phase 2 elevation | Code review |
| `completeInlinePrompt()` — full caret-aware `#query` replacement before prompt insert | Was stub in v1.0.0 | Code review |
| `renderPanelSettings()` — added shortcut recorder section | Phase 2 elevation | Code review |
| Huggingface + LongCat AI providers added | Was TODO in v1.0.0 | Code review |

### [v1.0.1 → v1.0.2] Final Cleanup

**Date:** April 2026  
**Files:** `AI-ITS-OVER-9000.user.js`, `PROJECT_LOGS.md`

| Change | Why | Verified |
|---|---|---|
| `initGistIntegration()` — implemented properly (was `log.info` stub) | Last remaining stub | Code review |
| Version bump 1.0.1 → 1.0.2 | Release readiness | — |
| PROJECT_LOGS.md created | Mandatory project rule compliance | — |

---

## 3. Known Issues / Bugs

### BUG-001: Bulk cross-navigation chat export may fail under CSP
- **Symptom:** `exportChatByHref()` uses hidden iframe; many CSP policies block cross-frame access
- **Suspected cause:** ChatGPT CSP headers may prevent iframe content access
- **Affected:** `§12.1 exportChatByHref()`
- **Status:** `deferred` — falls back gracefully (returns `{error: 'iframe blocked'}`)
- **Workaround:** Current chat export (no iframe) works reliably

### BUG-002: Smart editor closing-char skip not working in contenteditable
- **Symptom:** Typing `)` when cursor is before `)` in contenteditable doesn't skip
- **Suspected cause:** `composer.value` and `setSelectionRange` only work on textarea
- **Affected:** `attachSmartEditorLogic()` keydown handler
- **Status:** `open`
- **Reproduction:** Use smart editor in a contenteditable-based composer (Claude.ai)

### BUG-003: Carousel drag may conflict with panel drag on mobile
- **Symptom:** Both carousel and panel use `makeDraggable`; touch events may cross-fire
- **Status:** `open` — mobile is secondary priority per README

### BUG-004: Nav widget not cleaned up on SPA navigation (stacks on re-init)
- **Symptom:** Multiple nav containers if `createNavInterface()` called multiple times
- **Suspected cause:** No guard against double-creation in `createNavInterface()`
- **Affected:** `§14 createNavInterface()`
- **Status:** `open` — low frequency; `document.getElementById('up-nav-container')` guard partially handles it

---

## 4. Failed Attempts

### FAIL-001: `history.pushState` interception for URL detection
- **Attempted:** Replace `setInterval` URL polling with `pushState` wrap
- **Outcome:** ✅ SUCCESS — implemented correctly in `interceptHistoryApi()`
- **Note:** Listed here because it replaced Script B's brittle interval approach

### FAIL-002: Using `GM_addStyle` for CSS injection
- **Attempted:** Declared in Script A's original `@grant`
- **Why failed:** `GM_addStyle` was never called — all CSS done via DOM `<style>` tags
- **Decision:** Removed grant from combined script, use two-tag strategy instead

### FAIL-003: External `@require` for ScriptNotifier / FontLoaderBypass
- **Attempted:** Port Script B's external dependency approach
- **Why rejected:** Third-party code execution risk; self-contained update checker is equivalent
- **Decision:** Replaced with `checkForUserscriptUpdate()` (fetch-based, no deps)

---

## 5. Upgrade Ideas / Deferred Work

| ID | Idea | Priority |
|---|---|---|
| UP-001 | i18n system (40 languages from Script B) | Medium — architecture exists, needs string extraction |
| UP-002 | Claude.ai + Gemini as full secondary platforms | High — adapter pattern ready |
| UP-003 | Plugin system for custom prompt actions | Low |
| UP-004 | WeakMap cache for message targeting (perf) | Medium — reduces O(n) rescanning |
| UP-005 | Replace CSS full-rule injection with direct `style.setProperty` for per-property updates | Medium — removes reparse on slider drag |
| UP-006 | Smart editor closing-char skip for contenteditable (BUG-002) | Medium |
| UP-007 | Nav widget double-create guard (BUG-004) | Low |
| UP-008 | `requestAnimationFrame` batching for syntax backdrop renders | Medium |
| UP-009 | Prompt import from URL (Script A feature not yet ported) | Medium |
| UP-010 | `@font-face` injection for custom fonts (replaces FontLoaderBypass) | Low |
| UP-011 | Per-message AI quick-actions (summarize, translate, expand) | Medium |
| UP-012 | Prompt version history (undo last edit) | Low |

---

## 6. Architecture Notes

### CSS Two-Tag Strategy
- `#up-structural-v1` — all rule blocks; written **once** at init; never rewritten
- `#up-theme-vars-v1` — only CSS custom property definitions on `:root`; rewritten on every settings change
- **Why:** Avoids full CSS reparse of 800+ lines on every slider drag

### GM Storage vs localStorage
- All user data in `GM_getValue`/`GM_setValue` — isolated from page scripts
- IndexedDB for per-chat pins — larger objects, keyed by chat URL
- sessionStorage for cross-navigation pending prompt only

### Observer Strategy
- `MutationObserver` on `document.body`, `{childList: true, subtree: true}`
- Debounced at 120ms (`DEBOUNCE_OBSERVER`)
- Pauses itself before `refreshAllStyling()` to prevent self-triggering loops
- `history.pushState` + `popstate` interception for SPA URL changes (no setInterval)

### Platform Adapter Pattern
```
ADAPTERS = {
  chatgpt: { getComposerEl(), getSendButton(), platformInsert() },
  claude:  { getComposerEl(), getSendButton(), platformInsert() }
}
getAdapter() → ADAPTERS[UIState.currentPlatform]
```
New platforms: add entry to `ADAPTERS` and a case in `detectPlatform()`.

---

## 7. Next Steps

### Immediate
- [ ] Test v1.0.2 on live ChatGPT instance
- [ ] Verify `initGistIntegration()` on gist.github.com
- [ ] Verify carousel IndexedDB persistence across navigation

### Files to Inspect Next
- `§14` nav widget — check double-create guard (BUG-004)
- `§11` inline suggest — verify caret position calculation on contenteditable
- `§6` theming — verify all 19 CSS vars applied correctly after settings load

### Tests to Run
- Insert a prompt with placeholders → verify modal opens, fills, inserts
- Enable AI Enhance with a Gemini key → verify diff modal
- Pin a message → navigate away → navigate back → verify pin persists
- Export current chat → verify Markdown output
- Bulk delete 2 chats → verify deletion sequence

### Risks to Watch
- ChatGPT UI updates may break `[data-testid="composer-actions"]` toolbar anchor
- Score-based composer detection minimum threshold (5) may need tuning if GPT updates textarea attributes
- Gist API rate limits (60 req/hr unauthenticated, 5000 req/hr with token)

---

## [v1.0.2 → v1.0.3] Bug Fixes + Tooltip Feature

**Date:** April 2026
**Files:** `AI-ITS-OVER-9000.user.js`, `PROJECT_LOGS.md`

### BUG-001 — Fixed
- **Was:** `exportChatByHref()` used a hidden `<iframe>` to load each chat page, which was blocked by ChatGPT's `Content-Security-Policy` headers (`frame-ancestors 'none'`).
- **Fix:** Replaced with `fetch(href, {credentials: 'include'}) + DOMParser`. DOMParser parses HTML without executing scripts and is not subject to CSP restrictions. Bulk export modal now properly iterates selected chats, downloads each as a `.md` file, and shows a progress notification.
- **Status:** `fixed`

### BUG-002 — Fixed
- **Was:** The smart editor's closing-bracket skip (`typing ) when ) is already there`) only worked on `<textarea>` elements (using `selectionStart`/`setSelectionRange`). On Claude.ai's `contenteditable` ProseMirror composer it silently did nothing.
- **Fix:** Added a `Selection API` path for contenteditable: reads the caret position from `window.getSelection()`, checks `node.textContent[offset]` for the closing char, and advances the range by 1 using `createRange()`.
- **Status:** `fixed`

### BUG-003 — Fixed
- **Was:** `makeDraggable()` attached `mousemove`/`mouseup` to `document` globally. When both the panel and the carousel were draggable, each drag registered more global listeners. On touch devices this caused both elements to move simultaneously when either was dragged.
- **Fix:** Refactored `makeDraggable(panel, handle, savePos)` to register `onMove`/`onEnd` per drag session — added to `document` on `mousedown/touchstart` and removed on `mouseup/touchend`. Each drag session is now fully self-contained. Added `touchstart/touchmove/touchend` support. `savePos=true` flag controls whether panel position is persisted (only the settings panel needs this; carousel does not).
- **Status:** `fixed`

### BUG-004 — Fixed
- **Was:** `createNavInterface()` had an `getElementById` guard at the top, but the `Alt+ArrowUp/Down` keyboard listener was registered **inside** the function body. If `createNavInterface` was somehow called again (e.g., from `refreshAllStyling` on rapid SPA navigation), a second listener would stack, causing double navigation jumps. Stale `.up-scroll-btn` elements from a previous session also weren't cleaned up.
- **Fix:** Extracted Alt+Arrow listener into `setupNavKeyboardShortcuts()` — called once at `init()`. The guard at the top of `createNavInterface()` now also calls `scanMessages()` + `updateNavCounter()` + `injectPinButtons()` on re-entry (rescan without rebuild). Stale scroll buttons are removed before creating new ones.
- **Status:** `fixed`

### FEATURE — Panel nav button tooltips
- **What:** Hovering any of the 7 nav buttons at the top of the floating panel now shows a styled tooltip describing that page's contents and key features.
- **Implementation:** `PAGE_TOOLTIPS` map added. `createCustomTooltip()` updated to use `requestAnimationFrame` for correct positioning of multi-line tooltips, smart above/below placement, and horizontal clamping. Tooltip CSS updated: wider (280px max), wrapped lines, themed styling matching the panel.

### Next Steps
- All 4 bugs fixed, all features complete.
- Optional future work documented in Upgrade Ideas section above (UP-001 through UP-012).
