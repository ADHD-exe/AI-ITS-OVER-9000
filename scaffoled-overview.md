## Scaffold Overview

### Phase 1 — Fully implemented (working code)

| Section | Contents |
|---:|---|
| §1 Guard | window.__unleashedPromptV1 double-load prevention |
| §2 Constants | KEY definitions, PENDING_PROMPT_KEY, IndexedDB names, timing constants |
| §3 State | Namespaced states: UIState, PromptState, ThemeState, NavState, AIState |
| §4 Utilities | sanitizeHexColor, clampNumber, sanitizeFontFamily, escapeHtml, el() DOM builder, waitFor, robustClick, makeDebounce, sleep, Store (GM async cache wrapper) |
| §5 Platform adapters | detectPlatform(), ADAPTERS.chatgpt (score-based composer detection + multi-strategy React insertion), ADAPTERS.claude |
| §6 Theming | Two-tag CSS strategy (structural CSS once, theme-vars rewritten), 14 preset themes, normalizeSettings(), applyBodyClasses(), applyPreset() |
| §7 Prompt store | Full merged schema and operations: normalizePrompt, loadPrompts, savePrompts, add/update/removePrompt, recordPromptUse, getFilteredPrompts (all sort modes) |
| §8 Insertion engine | robustClearEditor, moveCursorToEnd, full insertPromptIntoComposer pipeline |
| §9 Placeholder system | hasPlaceholders, parsePlaceholders, fillPlaceholders, openPlaceholderModal — supports [input], ##select{}, #file[] |
| §10 AI Enhancement | Provider routing (Gemini/OpenRouter/Groq), model validation, callAI_API, Quick Enhance (composer-based), AI Enhance with full diff modal |
| §11 Inline suggest | Full “#” autocomplete: input handler, keyboard nav (arrows/enter/tab/esc), menu render, highlighting |
| §12 Chat management | Current chat Markdown export, bulk export/delete modal, sidebar discovery, bulkDeleteChats, deleteChatFromSidebarItem, quick-delete buttons, startNewChatWithPrompt (pending prompt via sessionStorage) |
| §13 IndexedDB | openPinDB, loadPinsFromDB, savePinsToDB |
| §17 Shortcuts | loadShortcuts, isShortcutPressed, 8 default actions |
| §18 Update checker | fetch()-based checker, semverGt, raw.githubusercontent.com domain lock |
| §19 Shared UI | showNotification (toast), createDialogo (alert/confirm), createCustomTooltip, downloadTextFile |
| §20 Floating panel | 7-page panel: drag, launcher, page renderers (Home, Themes, Layout stub, Font stub, Prompts, Settings with AI config + import/export, UI-Theme stub) |
| §21 Toolbar pill | Two-half pill (Enhance + Prompts), refreshPromptMenu, search, sort, right-click-to-edit, settings link |
| §22 Modals | Full prompt editor modal (create/edit/delete, all fields + toggles) |
| §23 DOM watcher | observeDom (pause/resume), refreshAllStyling, score-based bubble class injection, checkComposerPresence, history.pushState interception |
| §24–28 Misc | GM menu commands (7), debounced settings load/save, global keyboard handler, self-heal timer (1200ms), init() with parallel Promise.all loads |

---

### Phase 2 — Stubs (wired, safe no-ops)

- createNavInterface()
- initGistIntegration()
- exportAllData()
- Layout / Font / UI-Theme panel pages
- openPromptExplorerModal()
- Smart editor brackets / macros

---

### TODO markers (22 total)

- All TODOs are tagged with // TODO(§N): and point to the exact section where the work belongs, with a short description.

---

If you want, I can:
- produce a printable checklist grouped by section, or
- generate a condensed CHANGELOG-like summary for release notes. Which would you prefer?
