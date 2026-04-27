# Comparison, Evaluation & Synthesis Report

## GPT-Unleashed v2.8.26 (Script A) vs. My Prompt v6.0.8 (Script B)

### Combined Userscript Blueprint

**Prepared for:** Advanced Developer  
**Basis:** Two completed technical dossiers, grounded in actual source code analysis.


## 1. Executive Summary

### Script A — GPT-Unleashed v2.8.26

GPT-Unleashed is a **visual theming and utility overlay** for ChatGPT. Its primary identity is a CSS injection engine: it replaces every visible color zone on the ChatGPT interface (page background, message bubbles, code embeds, composer, sidebar) using CSS custom properties written into a single injected `\<style\>` tag. On top of the theme engine it layers a prompt library, bulk chat management (export and delete), a floating panel with 7 pages of controls, and a self-update checker. It targets `chatgpt.com` and `chat.openai.com` exclusively. It has no external library dependencies. Storage is entirely in `localStorage`.

### Script B — My Prompt v6.0.8

My Prompt is a **prompt management and AI productivity platform** for 35+ AI chat websites. Its primary identity is the prompt workflow: a toolbar-injected pill button opens a library of saved prompts, each of which can contain a full interactive template system (placeholders — typed text inputs, dropdown selectors, file zones — rendered in a modal before insertion). On top of the prompt engine it layers AI Enhancement (multi-provider API calls with diff view), a Pinned Message Navigator, inline `\#`-triggered autocomplete, a Smart Editor for prompt authoring, GitHub Gist integration, full i18n (40 languages), and a complete backup/restore system. Storage is in `GM\_getValue`/`GM\_setValue` with IndexedDB for per-chat pin data.

### Shared Goals

Both scripts are fundamentally trying to improve the **prompt authoring and management experience** inside AI chat platforms. Both:

- Inject UI elements into the ChatGPT interface.

- Save prompts that can be inserted into the composer with one action.

- Support AI-assisted prompt enhancement.

- Provide export/import of prompt data.

- Support file attachment to prompts.

- Show toast notifications and custom dialogs.

- Include a custom tooltip system.

- Manage a global file store.

- Perform self-update checking.

- Support theme/appearance customization.

### Major Differences

| Dimension | Script A (GPT-Unleashed) | Script B (My Prompt) |
| - | - | - |
| Primary identity | Visual theming engine | Prompt management platform |
| Platform scope | ChatGPT only | 35+ AI platforms |
| Storage backend | `localStorage` | `GM\_getValue` (GM storage) + IndexedDB |
| External dependencies | None | 2 `@require` scripts + CDN CSS + CDN i18n JSON |
| Prompt templates | Plain text only | Full dynamic placeholder system |
| AI enhancement | Instruction-in-composer (no external API) | Multi-provider external API with diff view |
| i18n / locale | None | 40 languages |
| Conversation navigation | Scroll top/bottom only | Full message index + pinned carousel |
| Theming | Full CSS system for ChatGPT (19 color zones) | 5 built-in themes via CSS vars, importable |
| Keyboard shortcuts | None (GM menu only) | 6 configurable keyboard shortcuts |
| Chat management | Bulk export + bulk delete + Markdown export | None |
| Inline suggestion | None | `\#`-triggered autocomplete |
| Smart editor | None | Bracket completion, macro wrapping, var suggest |
| Gist integration | None | Full import/export via GitHub Gist |
| Storage size risk | Base64 files in localStorage (no size cap) | 5MB per-file confirmation, GM storage |
| Code complexity | ~5,550 lines, single IIFE, all inlined | ~1,735 lines (partially minified), + CDN assets |


### Overall Recommendation

The combined script should use **Script B's architecture (GM storage, platform adapter pattern, modular design, keyboard shortcuts) as its backbone**, and **graft Script A's complete visual theming system, chat export, bulk delete, and CSS variable architecture on top**. Script B's placeholder system, AI Enhance with external API, inline suggestion, smart editor, message navigator, and Gist integration are capabilities that do not exist at all in Script A and should be included wholesale with targeted improvements. Script A's chat export/delete, complete theming engine, and self-healing panel system provide value that Script B entirely lacks.

The result is a ChatGPT-first userscript (not a 35-platform polyglot) that offers the deepest feature set of either parent. The platform abstraction layer should be kept lightweight and designed to accommodate future expansion.


## 2. Full Feature Inventory

| \# | Feature | In A | In B | User-Facing | Description | Include in Final |
| - | - | - | - | - | - | - |
| 1 | CSS theming (full 19-zone) | ✅ | Partial | ✅ | Page bg, bubbles, embed, composer, sidebar all independently colorable | ✅ Yes |
| 2 | Built-in theme presets | ✅ | ✅ | ✅ | Named color palettes (A: 9 presets; B: 5 with light/dark variants) | ✅ Yes — merge both sets |
| 3 | Importable custom themes | ❌ | ✅ | ✅ | User-supplied `.mp.theme.json` theme files | ✅ Yes |
| 4 | "UI Match Theme" auto-derivation | ✅ | ❌ | ✅ | Panel UI colors auto-derived from active theme | ✅ Yes |
| 5 | Panel opacity control | ✅ | ❌ | ✅ | Configurable transparency for the main panel | ✅ Yes |
| 6 | Bubble radius / max-width / padding sliders | ✅ | ❌ | ✅ | Full bubble geometry control | ✅ Yes |
| 7 | Font family override | ✅ | ❌ | ✅ | Custom chat/sidebar font | ✅ Yes |
| 8 | Per-role font size sliders | ✅ | ❌ | ✅ | Separate font size for user, assistant, sidebar | ✅ Yes |
| 9 | Text alignment control | ✅ | ❌ | ✅ | Left/center/right for all chat content | ✅ Yes |
| 10 | Embed alignment lock | ✅ | ❌ | ✅ | Prevents code blocks from following alignment override | ✅ Yes |
| 11 | Message bubble class injection | ✅ | ❌ | Internal | Score-based DOM targeting to apply bubble classes | ✅ Yes |
| 12 | Composer shell detection | ✅ | ✅ | Internal | Score/anchor-based detection of composer wrapper | ✅ Yes — use A's scoring + B's anchor |
| 13 | Sidebar color override | ✅ | ❌ | ✅ | Background, text, and hover colors for sidebar | ✅ Yes |
| 14 | GPT warning hider | ✅ | ❌ | ✅ | Hides "ChatGPT can make mistakes" footer text | ✅ Yes |
| 15 | Prompt library (basic) | ✅ | ✅ | ✅ | Stored prompts, insert into composer | ✅ Yes |
| 16 | Prompt tags | ✅ (basic) | ✅ (full CRUD) | ✅ | Tag-based categorization and filtering | ✅ Yes — use B's full tag manager |
| 17 | Prompt search | ✅ | ✅ | ✅ | Text search across title and body | ✅ Yes |
| 18 | Prompt sort modes | ❌ | ✅ | ✅ | A-Z, Z-A, most used, least used, newest, oldest, tags | ✅ Yes |
| 19 | Prompt favorites | ✅ | ❌ | ✅ | Star/unstar prompts; filter to favorites | ✅ Yes |
| 20 | Prompt pinning (floating cards) | ✅ | ✅ (isFixed) | ✅ | Pin prompts; A shows floating draggable cards; B pins to list top | ✅ Yes — combine both behaviors |
| 21 | Prompt expand/collapse | ✅ | ❌ | ✅ | Expand to show full text in list view | ✅ Yes |
| 22 | Dynamic placeholder system | ❌ | ✅ | ✅ | Inline `\[input\]`, `\#\#select`, `\#file` widgets in prompts | ✅ Yes — highest-value unique feature |
| 23 | AI Enhance (instruction in composer) | ✅ | ❌ | ✅ | Wraps prompt in enhance instruction, inserts into composer | ✅ Yes — keep as quick-enhance fallback |
| 24 | AI Enhance (external API + diff) | ❌ | ✅ | ✅ | Calls external AI provider, shows before/after diff modal | ✅ Yes — premier enhance experience |
| 25 | Multi-provider AI API routing | ❌ | ✅ | Internal | Gemini, OpenRouter, HuggingFace, Groq, LongCat | ✅ Yes |
| 26 | API key rotation (comma-separated) | ❌ | ✅ | Internal | Round-robin across multiple API keys | ✅ Yes |
| 27 | System prompt multi-selection | ❌ | ✅ | ✅ | Choose from multiple named system prompts before API call | ✅ Yes |
| 28 | Inline `\#` autocomplete suggestion | ❌ | ✅ | ✅ | Type `\#` in composer to get live prompt list overlay | ✅ Yes |
| 29 | Smart editor (bracket, macro, var) | ❌ | ✅ | ✅ | Bracket pair completion, `\#\#start/end` macros, `$var` suggest | ✅ Yes |
| 30 | Syntax highlight backdrop | ❌ | ✅ | ✅ | Visual syntax coloring for placeholder syntax | ✅ Yes |
| 31 | Message navigator widget | ❌ | ✅ | ✅ | Floating prev/next buttons + message index popup | ✅ Yes |
| 32 | Pinned message carousel | ❌ | ✅ | ✅ | Draggable floating carousel of user-pinned chat messages | ✅ Yes |
| 33 | Per-chat pin persistence (IndexedDB) | ❌ | ✅ | Internal | Pins stored in IndexedDB keyed by chat URL | ✅ Yes |
| 34 | Auto-execute prompt | ❌ | ✅ | ✅ | Automatically click Send after inserting prompt | ✅ Yes |
| 35 | Usage-based prompt reordering | ❌ | ✅ | Internal | Recently used prompts float to top of list | ✅ Yes |
| 36 | Expanded fullscreen prompt grid | ❌ | ✅ | ✅ | Multi-column fullscreen grid view of all prompts | ✅ Yes |
| 37 | Drag-to-reorder prompts | ❌ | ✅ | ✅ | Manual drag-and-drop reordering in expanded view | ✅ Yes |
| 38 | "New Chat with prompt" | ✅ | ❌ | ✅ | Start new conversation with prompt pre-loaded via sessionStorage | ✅ Yes |
| 39 | Pending prompt (sessionStorage) | ✅ | ❌ | Internal | Cross-navigation prompt injection mechanism | ✅ Yes |
| 40 | Prompt import from file | ✅ | ✅ | ✅ | Load `.json` or `.txt` file of prompts | ✅ Yes |
| 41 | Prompt import from URL | ✅ | ❌ | ✅ | Fetch prompts from a remote URL | ✅ Yes |
| 42 | Prompt export as JSON | ✅ | ✅ | ✅ | Download prompts as JSON | ✅ Yes |
| 43 | Multi-file export (one file per prompt) | ❌ | ✅ | ✅ | Export each prompt as a separate file | ✅ Yes |
| 44 | Gist integration | ❌ | ✅ | ✅ | Import/export prompts via GitHub Gist | ✅ Yes |
| 45 | Current chat export (Markdown) | ✅ | ❌ | ✅ | Export current conversation as `.md` | ✅ Yes |
| 46 | Bulk chat export (sidebar select) | ✅ | ❌ | ✅ | Select multiple sidebar chats, download as `.md` files | ✅ Yes |
| 47 | Bulk chat delete | ✅ | ❌ | ✅ | Select and automatically delete sidebar chats | ✅ Yes |
| 48 | Sidebar quick-delete button | ✅ | ❌ | ✅ | 🗑 button on every sidebar chat row | ✅ Yes |
| 49 | Scroll to top / bottom | ✅ | ❌ | ✅ | One-click scroll to chat start or end | ✅ Yes |
| 50 | Global file store | ✅ | ✅ | ✅ | Persistent file library; attach to prompts | ✅ Yes |
| 51 | File auto-attach on prompt insert | ❌ | ✅ | ✅ | Files attached to a prompt are injected when prompt is used | ✅ Yes |
| 52 | Theme save (user-created themes) | ✅ | ❌ | ✅ | Save current color config as a named theme | ✅ Yes |
| 53 | Theme export / import | ✅ (JSON) | ✅ (.mp.theme.json) | ✅ | Download and load theme definitions | ✅ Yes |
| 54 | Full backup / restore | ❌ | ✅ | ✅ | All settings exported to single `.json` with selective restore | ✅ Yes |
| 55 | Script+settings export | ✅ | ❌ | ✅ | Download script source + settings as JSON | ✅ Yes — merge into backup |
| 56 | Update checker | ✅ | ❌ (ScriptNotifier) | ✅ | Fetch GitHub Raw URL, compare semver, prompt install | ✅ Yes |
| 57 | Keyboard shortcuts | ❌ | ✅ | ✅ | Configurable hotkeys for core actions | ✅ Yes |
| 58 | i18n / locale system | ❌ | ✅ | ✅ | 40-language UI translation | ⚠️ Optional — high value for global audience |
| 59 | Settings modal (tabbed) | ❌ (GM menu only) | ✅ | ✅ | In-page settings UI with Basic/Advanced tabs | ✅ Yes |
| 60 | Feature master toggles | ✅ | ❌ | ✅ | Enable/disable theming, fonts, etc. per zone | ✅ Yes |
| 61 | Draggable floating panel | ✅ | ❌ | ✅ | Full drag repositioning of the settings panel | ✅ Yes |
| 62 | Launcher hidden-until-hover | ✅ | ❌ | ✅ | Ghost launcher appears only on hover | ✅ Yes |
| 63 | Panel hidden-until-hover on mobile | ✅ | ❌ | ✅ | Touch device always shows launcher | ✅ Yes |
| 64 | MutationObserver DOM watch | ✅ | ✅ | Internal | Re-apply styling/re-inject UI after SPA navigation | ✅ Yes |
| 65 | Custom toast notifications | ✅ | ✅ | Internal | Non-blocking status messages | ✅ Yes |
| 66 | Custom dialog (alert/confirm) | ✅ | ✅ | Internal | In-page confirm/alert replacing `window.confirm` | ✅ Yes |
| 67 | Custom tooltip system | ✅ | ✅ | Internal | Positioned tooltips on hover/focus | ✅ Yes |
| 68 | Scroll enhancements | ❌ | ✅ | ✅ | Up/down arrow overlays on scroll containers | ✅ Yes |
| 69 | `waitFor` DOM awaiter | ❌ | ✅ | Internal | MutationObserver-based element poll with timeout | ✅ Yes |
| 70 | Debounce utility | ✅ | ✅ | Internal | Standard debounce | ✅ Yes |
| 71 | GM menu commands | ✅ | ✅ | Internal | Open panel/settings from script manager menu | ✅ Yes |
| 72 | Self-healing style/panel | ✅ | ❌ | Internal | 1200ms setTimeout re-checks and recreates missing nodes | ✅ Yes |
| 73 | Proxy-aware font loading | ❌ | ✅ | Internal | FontLoaderBypass for CSP environments | ⚠️ Consider — requires external dependency |
| 74 | Ko-fi / Patreon injection | ❌ | ✅ | ✅ | Injects shortcut button on Ko-fi shop pages | ❌ No — out of scope |
| 75 | Language selector modal | ❌ | ✅ | ✅ | In-page UI for language selection | ⚠️ Include if i18n included |



## 3. Feature-by-Feature Comparison

### 3.1 Prompt Library (Core)

| Dimension | Script A | Script B |
| - | - | - |
| Storage | `localStorage` JSON array | GM storage JSON object (keyed by ID) |
| Schema | `\{id, title, text, favorite, pinned, type, createdAt, tags\[\], expanded\}` | `\{title, text, usePlaceholders, autoExecute, isFixed, activeFileIds\[\], tags\[\], usageCount, position\}` |
| Max prompt count | Unlimited (array) | Unlimited (object) |
| Ordering | Array order; pinned show first in section | Numeric `position` field; `isFixed` prompts top-pinned |
| Sort options | None | A-Z, Z-A, most used, least used, newest, oldest, tags |
| Usage tracking | None | `usageCount` + reorder on use |


**Winner: Script B.** The object-keyed storage scales better, the `position` field enables manual reordering, and usage tracking enables a genuinely useful "recently used" sort mode. Script A's `type: 'ai'` classification is a nice idea but weakly used. The combined schema should merge both, adding `favorite` and `type` from A into B's schema.

**Recommendation:** Use B's GM storage + position + usageCount, add A's `favorite`, `type`, `createdAt`, `expanded` fields.


### 3.2 Prompt Insertion

| Dimension | Script A | Script B |
| - | - | - |
| Target detection | Score-based `getComposerInputCandidates()` (textarea + contenteditable, scored by position/class/label) | Platform-specific `platformSelectors` constant (one CSS selector per platform) |
| Insertion method | Direct `input.value = text` + `new Event('input')` for textarea; `input.textContent = text` for CE | Per-platform: synthetic events, `execCommand`, React fiber interop, native value setter, clipboard paste |
| Clear before insert | No (replaces all) | Yes — `robustClearEditor()` before re-insertion |
| Cursor positioning | Implicit (focus) | Explicit `moveCursorToEnd()` |
| Auto-execute | No | Yes (`autoExecute` flag) |
| File injection | No (separate file store) | Yes — injects files via DragEvent or ClipboardEvent |


**Winner: Script B** for insertion reliability. Its multi-strategy approach handles React's synthetic event system correctly, which is critical for ChatGPT's ProseMirror/contenteditable composer. Script A's approach of `input.value = text` and a simple `Event('input')` will fail silently on React-controlled inputs. Script B's `robustClearEditor` plus `moveCursorToEnd` is also more reliable for multi-insert scenarios.

**Recommendation:** Use B's insertion engine. Keep A's scoring system as the *discovery* layer (to find the right composer), then route to B's insertion strategies.


### 3.3 Theme System

| Dimension | Script A | Script B |
| - | - | - |
| Color zones | 19 (page bg/text, user/assistant bubble bg/text, embed bg/text, composer bg/text, sidebar bg/text/hover/hoverText, 5 panel UI colors) | ~15 CSS custom properties (defined via `--mp-\*` vars, not per-zone chatGPT styling) |
| Applies to ChatGPT DOM | ✅ Full | ❌ Minimal (just the script's own UI) |
| Preset count | 9 built-in | 5 built-in (with light/dark variants = 10 effective) |
| Custom theme storage | `localStorage` (saved themes) | `GM\_setValue('ImportedThemes')` (imported JSON files) |
| Theme import format | JSON dump of settings keys | `.mp.theme.json` with CSS var maps |
| Per-zone toggles | ✅ (each zone independently on/off) | ❌ |
| "Match UI to theme" | ✅ (panel UI derives from chat theme) | ❌ |


**Winner: Script A** decisively for ChatGPT theming. Script B's theming only skins the script's own UI. Script A's 19-zone color system is the most sophisticated ChatGPT theming in either script by a large margin. Keep it entirely.

**Recommendation:** Use A's complete CSS injection + custom property architecture. Adopt B's `.mp.theme.json` format for file imports so the two ecosystems are compatible.


### 3.4 AI Prompt Enhancement

| Dimension | Script A | Script B |
| - | - | - |
| Method | Wraps prompt in instruction text, inserts into ChatGPT composer for GPT to process | Calls external AI API directly via `GM\_xmlhttpRequest`, shows diff modal |
| External API | No | Yes (Gemini, OpenRouter, HuggingFace, Groq, LongCat) |
| Diff view | No | ✅ Full side-by-side diff modal |
| Provider routing | N/A | `getProvider()` with per-provider endpoint + auth scheme |
| API key rotation | N/A | ✅ Comma-separated multi-key round-robin |
| System prompt selection | N/A | ✅ Multi-block `Title \{\{ \}\}` system prompts |
| Works without API key | ✅ (uses ChatGPT itself) | ❌ (requires configured key) |


**Winner: Script B** for quality of output; **Script A** for accessibility (no API key needed). Both should be kept. Script A's method should be the **Quick Enhance** (zero-config, always available) and Script B's method should be the **AI Enhance** (configurable, superior output, diff view).


### 3.5 DOM Mutation Watching

| Dimension | Script A | Script B |
| - | - | - |
| Observer target | `document.documentElement` (widest possible) | `document.body` |
| Filter | Skips own panel; skips non-HTMLElement nodes | Checks `isInitializing` mutex; checks if button still in DOM |
| On mutation | `scheduleRefresh(140ms)` debounced | `tryInit()` — full re-init check |
| Observer pause/resume | ✅ Explicit pause around `refreshAllStyling` | ❌ No pause |
| Interval polling | None | Two `setInterval` loops (1500ms nav scan, 500ms URL change) |


**Winner: Neither — each has a critical flaw.** Script A's pause/resume prevents self-triggering loops but `document.documentElement` is too broad. Script B's `tryInit()` on every DOM mutation is too expensive on streaming responses.

**Recommendation (combined):** Observer on `document.body`, debounce at 120ms, exclude own elements, skip when streaming (detect via `\[data-is-streaming\]` attribute or animation frame guard), pause/resume around re-classification passes. Replace B's interval polling with a URL-change observer using `history.pushState` interception.


### 3.6 Storage

| Dimension | Script A | Script B |
| - | - | - |
| Backend | `localStorage` | `GM\_getValue` / `GM\_setValue` + IndexedDB |
| Scope | Per-origin (`chatgpt.com` only) | Per-userscript (cross-origin if used on multiple platforms) |
| Cross-origin sharing | ❌ | ✅ Prompt library shared across all matched platforms |
| Sandboxing | ❌ (accessible to all scripts on chatgpt.com) | ✅ (GM storage is isolated to the userscript) |
| Quota | ~5-10MB typical browser limit | Depends on manager (Tampermonkey: effectively unlimited for most use) |
| Base64 file risk | ❌ No size cap on file store | ✅ 5MB per-file confirmation dialog |
| Async correctness | ✅ All synchronous (localStorage) | ⚠️ Some calls incorrectly treat `GM\_getValue` as synchronous |


**Winner: Script B's backend (GM storage)** — isolation from page scripts, cross-platform sharing of prompts, and higher effective quota are significant advantages. However, Script A's synchronous simplicity makes for cleaner code. The combined script should use GM storage with a clean async wrapper and a cached layer to avoid repeated reads.


### 3.7 CSS Injection Strategy

| Dimension | Script A | Script B |
| - | - | - |
| Mechanism | Single `\<style\>` tag, full rewrite on every change | Two `\<style\>` tags: global (from CDN resource), theme override (dynamically replaced) |
| CSS variables | 28 `--rabbit-\*` vars on `:root` | ~20 `--mp-\*` vars on `:root` |
| Performance | Full rewrite on every input event — causes full CSS reparse | Theme override tag replaced only on theme change |
| Specificity strategy | `!important` pervasively | `!important` on theme vars only |
| External CSS | None | CDN stylesheet (`@resource CSS`) |
| Platform scope | ChatGPT DOM fully styled | Script UI only |


**Winner: Mixed.** Script A's scope (styling the full ChatGPT UI) is the right approach for a ChatGPT-first script. Script B's separation of global styles (stable) from theme override (volatile) is the right performance approach.

**Recommendation:** Adopt B's two-tag architecture. Inject stable structural CSS once; maintain a separate `\<style id="theme-vars"\>` for custom properties only (not full rules). This avoids full CSS reparsing on every slider drag.


### 3.8 Floating Panel / Toolbar Button UI

| Dimension | Script A | Script B |
| - | - | - |
| Primary UI | Fixed floating panel (322px, 7 pages) | Pill button injected into ChatGPT toolbar |
| Navigation model | Panel with Home → page grid | Button → dropdown menu → modals |
| Draggable | ✅ Panel header; launcher emblem | ❌ Menu is positioned but not draggable |
| Hidden state | Minimized to launcher icon (ghost until hover) | No minimization — button is always in toolbar |
| Context | Outside the chat flow | Inside the composer toolbar |
| Discoverability | Must know about the launcher icon | Visible in the toolbar as a labeled pill |


**Winner: Script B's toolbar button** for discoverability — it's immediately visible in context. **Script A's floating panel** for richness — it can hold far more controls and is not constrained by toolbar real estate.

**Recommendation:** Keep B's toolbar pill button as the primary entry point for prompts. Keep A's floating panel for settings, themes, and layout configuration. These serve different purposes and should coexist.


### 3.9 Unique Features

#### Script A Unique Features

**Inline `\#`-triggered Autocomplete Suggestion (Feature 28)**  
User types `\#` in the composer and sees a floating list of matching prompts. Extremely high user value — reduces friction for power users who know their library. Arrow keys + Enter/Tab for completion. Include.

**Message Navigator Widget (Feature 31)**  
Floating prev/next widget with full message index popup. High value for long conversations. Include.

**Pinned Carousel (Feature 32)**  
Draggable carousel for user-pinned chat messages. Include — distinct from prompt pinning.

**Auto-Execute (Feature 34)**  
Single click to insert and submit a prompt. Include.

**Placeholder System (Feature 22)**  
`\[input\]`, `\#\#select`, `\#file` placeholders make prompts into interactive forms. The single highest-value unique feature in either script. Include — this transforms prompts from static strings into reusable workflows.

**Full Backup/Restore (Feature 54)**  
Selective key-level backup. Include.

#### Script B Unique Features

**Complete ChatGPT Theming (Feature 1)**  
Full 19-zone color override is unmatched. Include.

**Bulk Chat Export + Delete (Features 46, 47)**  
No equivalent in Script B. Include.

**Markdown Chat Export (Feature 45)**  
Include.

**"New Chat with Prompt" via sessionStorage (Feature 38)**  
Elegant cross-navigation mechanism. Include.

**Sidebar Quick-Delete (Feature 48)**  
Include.

**Score-Based Composer Detection (Feature 12)**  
More robust to ChatGPT UI changes than a fixed CSS selector. Include.


## 4. Technical Architecture Comparison

### 4.1 Userscript Metadata

| Field | Script A | Script B |
| - | - | - |
| `@run-at` | `document-idle` | `document-end` |
| `@noframes` | ❌ | ✅ |
| `@require` | None | 2 external scripts |
| `@resource` | None | CSS + language JSON |
| `@connect` | ❌ (declared but none) | 10+ domains |
| Guard mechanism | `window.\_\_rabbitChatGptThemeV28` | `isInitializing` mutex |
| Platform scope | 2 URLs (chatgpt.com + legacy) | 35+ URLs |


**Recommendation:** Use `document-idle` (Script A) — the SPA is almost certainly ready by then, reducing the need for the 1500ms delays Script B uses. Add `@noframes` from B. Add `@connect` for AI API domains. Add explicit double-load guard (Script A's `window.\_\_guard` pattern is more reliable than B's boolean mutex).

### 4.2 Permissions and Grants

| Grant | A | B | Combined Need |
| - | - | - | - |
| `GM\_addStyle` | ✅ (declared, unused) | ❌ | ❌ Remove |
| `GM\_registerMenuCommand` | ✅ | ✅ | ✅ |
| `GM\_info` | ✅ | ❌ | ✅ |
| `GM\_getValue` | ❌ | ✅ | ✅ |
| `GM\_setValue` | ❌ | ✅ | ✅ |
| `GM\_listValues` | ❌ | ✅ (unused) | ❌ Remove |
| `GM\_deleteValue` | ❌ | ✅ (unused) | ✅ Keep (needed for backup delete) |
| `GM\_xmlhttpRequest` | ❌ | ✅ | ✅ |
| `GM\_getResourceText` | ❌ | ✅ | ✅ if using CDN CSS |


### 4.3 DOM Targeting Strategy

| Strategy | Script A | Script B |
| - | - | - |
| Message content | Scoring algorithm (140 candidates sampled, 10-factor score) | Not applicable (no message theming) |
| Composer | Scoring algorithm (textarea + CE ranked by label/position) | Per-platform CSS selector constant |
| Sidebar | Multiple fallback selector chains | Not applicable |
| Toolbar anchor | N/A | SVG path fingerprint + `data-testid` + `id` fallbacks |
| Re-injection guard | `data-rabbit-warning-hidden` attribute tagging | `data-testid="composer-button-prompts"` idempotency check |


**Assessment:** Script A's scoring for message content is architecturally sound but expensive. Script B's SVG fingerprint approach for toolbar injection is clever but brittle (any icon sprite change breaks it). The combined script should use `data-testid`/`aria-label` as primary selectors and scoring as the fallback — not vice versa.

### 4.4 Event Listener Design

**Script A:** Three delegated listeners on the panel (`input`, `change`, `click`). One delegated listener on `document` for floating cards. `wheel` listener on panel for slider adjustment. All actions routed via `data-action` attributes.

**Script B:** Each modal/component sets its own inline event listeners at creation time. `document` click + keydown for global shortcuts. `window` resize with debounce. Per-component `stopPropagation()` to prevent bubbling conflicts.

**Winner: Script A's delegation pattern** for the panel; **Script B's approach** for modals that are created once and destroyed. The combined script should use delegation for persistent UI (panel, toolbar) and direct binding for transient UI (modals).

### 4.5 State Management

Script A has ~8 module-level `let` variables. Script B has ~30+. Neither uses a reactive store or observable pattern. Both are essentially global mutable state.

**Recommendation:** Group state into namespaced objects (`UIState`, `PromptState`, `ThemeState`, `NavState`, `AIState`) rather than 30+ top-level variables. This makes state readable during debugging without introducing a full reactive framework.

### 4.6 Async Behavior

| Behavior | Script A | Script B |
| - | - | - |
| Storage reads | Synchronous (localStorage) | Mix of correct `await GM\_getValue` and incorrect synchronous calls |
| Init delays | `setTimeout(init, 80)` retry + `setTimeout(1200ms)` self-heal | `await sleep(1000-2000ms)` platform-specific delays + `waitFor(selector, 8000)` |
| File attachment | N/A | `waitForUploadAndClick` — polling loop (800ms, max 120s) |
| Update check | `fetch()` with cache-busting | `ScriptNotifier` (external, Gist-polling) |


**Recommendation:** All storage reads should be `await GM\_getValue`. Use Script B's `waitFor()` pattern for compositor presence instead of fixed delays. Use Script A's `fetch()` for update checking (self-contained, no external dependency).


## 5. UI and UX Comparison

### 5.1 Navigation and Discovery

**Script A:** All features hidden behind the floating launcher icon. Discovery requires knowing it exists. The 7-page panel is powerful but dense. No keyboard shortcuts — only GM menu commands.

**Script B:** Primary entry is a visible pill button in the composer toolbar — highest discoverability. Keyboard shortcuts (Alt+N, Alt+P, Alt+E, Ctrl+Enter, Ctrl+S, Shift+Enter) are configurable and stored. The settings modal is accessible from the GM manager menu.

**Winner: Script B** for discoverability. The pill button is the right UI pattern for a prompt tool. A's approach works for a settings/theme panel but would be poor as the only way to access prompts.

### 5.2 Configuration Depth

**Script A:** Extremely deep configuration via the 7-page panel. Per-zone color toggles, slider skin options, wheel-adjust, track fill — these are power-user settings that most users won't touch but that enthusiasts will love.

**Script B:** Two-tab settings modal (Basic/Advanced). Settings are fewer but well-organized. No per-zone toggle — theming is all-or-nothing per theme.

**Winner: Script A** for configuration depth. Script B's structure is cleaner but the per-zone control is genuinely useful.

### 5.3 Modals and Overlays

**Script A:** `createDialogo()` (alert/confirm), toast notification, prompt review overlay, prompt explorer dialog, theme save modal (inline in panel), chat export/delete modals (inline in panel), custom tooltips.

**Script B:** `createDialogo()` (alert/confirm), toast `showNotification()`, AI diff modal, placeholder modal, prompt editor modal, settings modal, tags manager modal, language modal, backup modal, info modal, custom tooltips.

**Script B has a significantly richer modal ecosystem.** The placeholder modal alone is a unique system. The AI diff modal is excellent UX.

### 5.4 Responsiveness and Mobile

**Script A:** Has explicit `@media (hover: none), (pointer: coarse)` handling for the launcher (always shows on touch devices). Panel uses `min(100vw, ...)` sizing.

**Script B:** No explicit mobile handling mentioned in dossier.

**Winner: Script A** for mobile awareness.

### 5.5 Accessibility

**Script A:** Uses `aria-hidden` on modals. Some `aria-label` attributes. Limited keyboard navigation within panel.

**Script B:** `role="dialog"`, `aria-modal="true"` on modals. `aria-label` on button. Some focus management (`closeModal` focuses last element). Keyboard shortcut system is comprehensive.

**Winner: Script B** for accessibility scaffolding.

### 5.6 Feedback and Error States

**Script A:** Toast notifications for operations. Custom dialogs for confirmations. Panel notifications for update check results.

**Script B:** Toast notifications. Alert dialogs for errors. API error dialogs. "No API key" prompt. File size confirmation dialog.

Both are adequate. Script B has more granular error surfaces due to having more operations that can fail externally.

### 5.7 Recommended UI Patterns for Combined Script

| Pattern | Source | Recommendation |
| - | - | - |
| Toolbar pill button | B | Primary prompt access point — always visible |
| Floating settings panel (draggable) | A | Theme/layout/settings — power user space |
| Panel hidden-until-hover launcher | A | Non-intrusive default |
| 7-page panel navigation | A | Use A's layout with B's content |
| Keyboard shortcuts (configurable) | B | Include all 6 + add new ones |
| Fullscreen prompt grid | B | Include |
| Placeholder modal | B | Include unchanged |
| AI diff modal | B | Include |
| Toast notification | Both | Use B's (more featureful, has notification container) |
| Custom dialog (alert/confirm) | Both | Merge — prefer A's slightly cleaner implementation |
| Custom tooltip | Both | Merge — B's is more complete |
| Scroll arrows on containers | B | Include |
| Inline `\#` autocomplete | B | Include |
| Navigation widget | B | Include |



## 6. Security, Privacy, and Safety Review

### 6.1 Permission Audit

| Risk | A | B | Severity |
| - | - | - | - |
| API keys in GM storage | ❌ (no API keys) | ✅ (5 provider keys) | Medium — GM storage accessible via DevTools |
| `setSafeInnerHTML` is a passthrough | N/A | ✅ No sanitization | High — self-XSS possible with untrusted prompt titles |
| Base64 files in localStorage (no size cap) | ✅ Risk | ✅ (5MB confirm) | Medium |
| `fetch()` with user-configured URL | ✅ (updateRawUrl) | ✅ (AI model string validation absent) | Low-Medium |
| External `@require` scripts | ❌ | ✅ (ScriptNotifier + FontLoaderBypass) | Medium — third-party code runs in page context |
| `GM\_xmlhttpRequest` to arbitrary endpoints | ❌ | ✅ | Medium — if model string manipulated |
| `credentials: include` in fetch | ✅ (chat export) | ❌ | Low (same-origin only) |
| `document.execCommand` (deprecated) | ❌ | ✅ | Low — functional but spec-removed |
| `@connect` to unknown domains | ❌ | ✅ (cdn.streamain.com, files.catbox.moe, i.ibb.co not traced) | Low — unused in reviewed code |


### 6.2 Key Recommendations for Security

1. **Replace `setSafeInnerHTML` with DOM construction** for all user-provided content (prompt titles, text). Use `textContent` assignment + `createElement` instead of `innerHTML` with user data.

2. **Validate the AI model string** before using it in `getProvider()`. Only accept strings that match a known pattern (e.g., `/^(gemini|openrouter|huggingface|groq|longcat)\\/\[\\w\\-\\.\\/\]+$/`).

3. **Remove the three unused `@connect` domains** from Script B (`cdn.streamain.com`, `files.catbox.moe`, `i.ibb.co`).

4. **Remove unused `@grant` declarations** (`GM\_listValues`, `GM\_addStyle`).

5. **Add a file store size cap** — refuse base64 files exceeding 5MB and warn when total store exceeds 15MB.

6. **Validate `updateRawUrl`** — only allow `raw.githubusercontent.com` or other explicitly allowlisted raw-content hosts.

7. **Remove the external `@require` dependencies** (ScriptNotifier, FontLoaderBypass) — replace `ScriptNotifier` with Script A's self-contained `fetch()`-based update checker; replace `FontLoaderBypass` with a `@font-face` injection approach or simply document fonts.


## 7. What Should Be Used, Avoided, or Reworked

### 7.1 Use in Final Script (Take As-Is or Near As-Is)

- **Script A:** Complete CSS theming engine (applyStyles, custom properties, all selectors, featureThemeEnabled per-zone toggles)

- **Script A:** Score-based message content targeting (`findBestMessageContent`, `scoreCandidate`, `looksLikeMessageContent`)

- **Script A:** Score-based composer detection (`getComposerInputCandidates`, `scoreComposerShell`)

- **Script A:** Floating draggable panel with 7-page navigation and all layout/theme controls

- **Script A:** Launcher hidden-until-hover with mobile fallback

- **Script A:** Sidebar delete button injection (`ensureSidebarDeleteButtons`, `deleteChatFromSidebarItem`, `robustClick`)

- **Script A:** Markdown chat export + bulk export (`extractChatMarkdownFromDocument`, `exportChatByHref`)

- **Script A:** "New Chat with Prompt" + pending prompt (`setPendingPrompt`, `consumePendingPromptIfReady`)

- **Script A:** Self-healing style tag + panel (1200ms guard)

- **Script A:** Observer pause/resume pattern around DOM classification

- **Script A:** `createDialogo()` — clean, well-structured

- **Script A:** `sanitizeHexColor`, `clampNumber`, `sanitizeFontFamily` utilities

- **Script A:** `checkForUserscriptUpdate()` — self-contained fetch-based update checker

- **Script B:** Complete placeholder parsing + modal system (`parsePromptInternal`, `openPlaceholderModal`)

- **Script B:** External AI API routing (`callAI\_API`, `getProvider`, `getRotatingApiKey`)

- **Script B:** AI diff modal (`showAIDiffModal`)

- **Script B:** Message navigator widget + pinned carousel (full implementation)

- **Script B:** Inline `\#` autocomplete (`setupInlineSuggestion`, `createInlineMenu`, `renderInlineList`)

- **Script B:** Smart editor (`attachSmartEditorLogic`, bracket completion, macro wrapping)

- **Script B:** Syntax highlight backdrop (`SyntaxHighlighter`)

- **Script B:** Full backup/restore manager

- **Script B:** `waitFor(selector, timeout)` DOM awaiter

- **Script B:** Configurable keyboard shortcuts (`isShortcutPressed`, recording)

- **Script B:** Tags manager (full CRUD with color, comment, filter)

- **Script B:** Expanded fullscreen prompt grid with multi-column + drag reorder

- **Script B:** Auto-execute on insert

- **Script B:** File auto-attach on prompt insert

- **Script B:** `robustClearEditor()` before insertion

- **Script B:** `moveCursorToEnd()` after insertion

- **Script B:** Gist integration

### 7.2 Rework Before Using

| Item | Source | Required Changes |
| - | - | - |
| MutationObserver strategy | Both | Use A's pause/resume + B's debounce. Target `document.body` not `documentElement`. Replace B's `setInterval` loops with `history.pushState` interception for URL changes. |
| `insertPrompt()` | B | Retain all platform insertion strategies but refactor the 200+ line monolith into a dispatch table: `\{chatgpt: insertChatGPT, claude: insertClaude, …\}`. |
| CSS full-rewrite-on-input | A | Split into a static structural `\<style\>` (written once) and a dynamic `\<style id="theme-vars"\>` (writes CSS custom properties only — tiny text, no reparsing of rules). |
| Prompt schema | Both | Merge: `\{id, title, text, usePlaceholders, autoExecute, isFixed, favorite, type, activeFileIds\[\], tags\[\], usageCount, position, createdAt\}` |
| AI model string validation | B | Validate before `getProvider()` to prevent injection of arbitrary endpoints. |
| `setSafeInnerHTML` | B | Replace with DOM-construction helpers for user content; keep innerHTML only for trusted script-authored templates. |
| File store | Both | Move to GM storage. Add 5MB per-file confirmation and 15MB total cap warning. |
| Settings modal | B | Expand to include A's per-zone theme toggles, layout sliders, font settings. Restructure into 3 tabs: Appearance / Prompts / Advanced. |
| Floating panel | A | Add B's keyboard shortcut recording panel and AI settings. Remove the dead `codeSyntaxHighlightEnabled` setting. |
| Update checker | A | Add support for both GitHub Raw URL (A's approach) and a version comparison endpoint. Keep self-contained, remove external `ScriptNotifier` dependency. |
| Init flow | B | Replace `await sleep(1500ms)` fixed delays with `waitFor()` + exponential retry. |
| Stacked intervals | B | Store interval IDs; clear on cleanup. |


### 7.3 Avoid or Leave Out

| Item | Source | Reason |
| - | - | - |
| `GM\_addStyle` grant | A | Declared, never used — remove |
| `GM\_listValues` grant | B | Declared, never used in reviewed code |
| `@connect cdn.streamain.com` | B | Unverified; not referenced in code |
| `@connect files.catbox.moe` | B | Unverified; not referenced in code |
| `@connect i.ibb.co` | B | Unverified; not referenced in code |
| `ScriptNotifier` (`@require`) | B | External dependency, replaces A's self-contained updater, third-party execution risk |
| `FontLoaderBypass` (`@require`) | B | External dependency; only needed for CDN font loading in CSP environments; document fonts instead |
| Ko-fi / Patreon injection | B | Out of scope; entirely unrelated |
| Multi-platform injection (30+ non-ChatGPT platforms) | B | Out of scope for combined ChatGPT-first script; keep architecture extensible |
| Dead `codeSyntaxHighlightEnabled` setting | A | No implementation behind the toggle |
| Dead `closeMenu()` redefinition × 4 | B | Remove three dead definitions |
| Sync `GM\_getValue` calls | B | Replace with `await GM\_getValue` throughout |
| `body \> div nav:first-of-type` structural selector | A | Too fragile; replace with `\[data-testid\*="sidebar"\]` |



## 8. Final Combined Userscript Blueprint

### 8.1 Final Feature Set

The combined script is named **Unleashed Prompt** (working title). It is ChatGPT-first but architecturally extensible.

**Core capabilities:**

1. Full ChatGPT visual theming (19 color zones, 14+ presets, per-zone toggles, importable themes)

2. Prompt library with tags, favorites, sort, search, pinning, expand, usage tracking, type classification

3. Dynamic placeholder system (inputs, selects, file zones)

4. Both Quick Enhance (composer-based) and AI Enhance (external API + diff modal) with multi-provider routing

5. Inline `\#` autocomplete in composer

6. Smart editor with bracket completion, macros, variable suggest

7. Syntax highlight backdrop

8. Message navigator + pinned carousel with IndexedDB per-chat persistence

9. Gist import/export

10. ChatGPT chat export (current + bulk sidebar) and bulk delete

11. Sidebar quick-delete buttons

12. "New Chat with prompt" + sessionStorage pending injection

13. Scroll to top/bottom shortcuts

14. Keyboard shortcuts (configurable, 8+ actions)

15. Full backup/restore

16. Configurable update checker (self-contained)

17. Complete settings panel (3-tab: Appearance / Prompts / Advanced)

18. Floating draggable settings panel + persistent toolbar pill button

19. Toast notifications, custom dialog, custom tooltips

20. Ghost launcher (hidden until hover)

### 8.2 Recommended Module Layout

```
src/  
├── meta.js                  // @userscript header  
├── constants.js             // all storage keys, defaults, NUMERIC\_RANGES, PANEL\_PAGES  
├── guard.js                 // window.\_\_unleashedPromptV1 double-load guard  
├── state.js                 // UIState, PromptState, ThemeState, NavState, AIState namespaced objects  
├── utils/  
│   ├── sanitize.js          // sanitizeHexColor, clampNumber, sanitizeFontFamily, escapeHtml  
│   ├── debounce.js          // makeDebounce, sleep  
│   ├── dom.js               // waitFor, robustClick, escapeHtml, isElementVisible  
│   └── storage.js           // Store.get/set/delete wrappers; cachedGet/set; IndexedDB helpers  
├── platform/  
│   ├── detect.js            // detectPlatform() registry  
│   └── adapters/  
│       ├── chatgpt.js       // anchor search, insertion, clear, sendButton  
│       └── index.js         // adapter registry  
├── theming/  
│   ├── defaults.js          // default settings, BUILTIN\_THEME\_PRESETS (A's 9 + B's 5)  
│   ├── presets.js           // getThemePresets, normalizeThemeSnapshot, derivePanelUiColors  
│   ├── apply.js             // applyStyles() — two-tag strategy  
│   └── custom-themes.js     // loadSavedThemes, importThemeFromFile  
├── prompts/  
│   ├── store.js             // getAllPrompts, savePrompts, addPrompt, updatePrompt, removePrompt  
│   ├── normalize.js         // normalizePrompt (merged A+B schema)  
│   ├── filter.js            // filterPrompts, sortPrompts  
│   ├── placeholder.js       // parsePromptInternal, token types  
│   └── pending.js           // setPendingPrompt, getPendingPromptText, consumePendingPromptIfReady  
├── insertion/  
│   ├── detect.js            // getComposerInputCandidates, findComposerShellForInput  
│   ├── insert.js            // insertPromptIntoComposer, robustClearEditor, moveCursorToEnd  
│   ├── new-chat.js          // startNewChatWithPrompt, findNewChatTrigger  
│   └── files.js             // forceFileAttach per platform  
├── ai/  
│   ├── provider.js          // getProvider, getRotatingApiKey, callAI\_API  
│   ├── enhance-quick.js     // buildPromptEnhanceInstruction (A's composer approach)  
│   └── system-prompts.js    // parseSystemPrompts, selectSystemPrompt modal  
├── nav/  
│   ├── widget.js            // createNavInterface, prev/next navigation  
│   ├── scanner.js           // scanMessages, indexConversation  
│   ├── carousel.js          // pinned carousel, drag, orientation  
│   └── pins-db.js           // IndexedDB loadPinsFromDB, savePinsToDB  
├── chat-management/  
│   ├── sidebar.js           // getSidebarChatItems, ensureSidebarDeleteButtons  
│   ├── delete.js            // deleteChatFromSidebarItem, robustClick  
│   └── export.js            // exportChatAsMarkdown, exportChatByHref  
├── dom-watch/  
│   ├── observer.js          // observeDom, pauseObserver, resumeObserver, withObserverPaused  
│   ├── messages.js          // findBestMessageContent, scoreCandidate, refreshMessageStyling  
│   ├── composer.js          // refreshComposerStyling, clearComposerClasses  
│   └── sidebar-buttons.js   // refreshSidebarDeleteButtons  
├── inline-suggest/  
│   ├── suggestion.js        // setupInlineSuggestion, createInlineMenu, renderInlineList  
│   └── complete.js          // completeInlinePrompt, getTextBeforeCaret  
├── smart-editor/  
│   ├── brackets.js          // bracket pair completion  
│   ├── macros.js            // \#\#start/end wrapping  
│   └── syntax.js            // SyntaxHighlighter, attachSmartEditorLogic  
├── tags/  
│   ├── store.js             // loadTagsConfig, saveTagsConfig  
│   └── manager.js           // createOrUpdateTag, deleteTag, getTag  
├── shortcuts/  
│   └── shortcuts.js         // loadShortcuts, saveShortcutsConfig, isShortcutPressed  
├── gist/  
│   └── gist.js              // initGistIntegration  
├── update/  
│   └── updater.js           // checkForUserscriptUpdate (A's fetch-based approach)  
├── ui/  
│   ├── panel/  
│   │   ├── panel.js         // makePanel, panel page routing  
│   │   ├── pages/  
│   │   │   ├── home.js  
│   │   │   ├── themes.js  
│   │   │   ├── layout.js  
│   │   │   ├── font.js  
│   │   │   ├── prompts.js  
│   │   │   ├── settings.js  
│   │   │   └── ui-theme.js  
│   │   └── drag.js          // makeDraggable, makeLauncherDraggable  
│   ├── toolbar/  
│   │   └── pill-button.js   // createPromptButton, positionMenu  
│   ├── menus/  
│   │   ├── prompt-menu.js   // dropdown menu, refreshMenu  
│   │   └── expanded-grid.js // fullscreen grid, multi-column, drag-reorder  
│   ├── modals/  
│   │   ├── prompt-editor.js  
│   │   ├── placeholder.js  
│   │   ├── ai-diff.js  
│   │   ├── prompt-review.js  
│   │   ├── prompt-explorer.js  
│   │   ├── backup.js  
│   │   ├── tags-manager.js  
│   │   └── settings-modal.js  
│   ├── shared/  
│   │   ├── dialog.js        // createDialogo  
│   │   ├── notification.js  // showNotification  
│   │   ├── tooltip.js       // createCustomTooltip  
│   │   └── scroll-arrows.js // setupEnhancedScroll  
│   └── launcher.js          // ghost launcher, hover show/hide  
├── backup/  
│   └── backup.js            // exportAllData, importFromBackup  
└── main.js                  // init(), entry guard, DOMContentLoaded
```

### 8.3 Initialization Flow

```
flowchart TD  
    A\[Script parses at document-idle\] --\> B\{window.\_\_unleashedPromptV1?\}  
    B -- Yes --\> Z\[Exit\]  
    B -- No --\> C\[Set guard flag\]  
    C --\> D\[Parallel async loads\]  
    D --\> D1\[loadSettings from GM\]  
    D --\> D2\[loadPrompts from GM\]  
    D --\> D3\[loadThemeConfig from GM\]  
    D --\> D4\[loadTagsConfig from GM\]  
    D --\> D5\[loadAIConfig from GM\]  
    D --\> D6\[loadShortcuts from GM\]  
    D1 & D2 & D3 & D4 & D5 & D6 --\> E\[init\]  
  
    E --\> F\[applyStyles - structural CSS once\]  
    F --\> F2\[applyThemeVars - theme custom properties\]  
    F2 --\> G\[makePanel - append floating panel\]  
    G --\> H\[injectStyleTag - stable UI CSS\]  
    H --\> I\[setupGlobalEventListeners - document keydown + click\]  
  
    I --\> J\[waitFor composer selector\]  
    J --\> K\[createPillButton - inject into toolbar\]  
    K --\> L\[createPromptMenu - append to body hidden\]  
    L --\> M\[createAllModals - append to body hidden\]  
    M --\> N\[setupInlineSuggestion - bind to composer textarea\]  
    N --\> O\[bindFloatingPromptEvents - document click delegation\]  
  
    O --\> P\[renderFloatingPinnedPrompts\]  
    P --\> Q\[refreshAllStyling\]  
    Q --\> Q1\[pauseObserver\]  
    Q1 --\> Q2\[refreshMessageStyling\]  
    Q2 --\> Q3\[refreshComposerStyling\]  
    Q3 --\> Q4\[refreshGptWarningVisibility\]  
    Q4 --\> Q5\[ensureSidebarDeleteButtons\]  
    Q5 --\> Q6\[resumeObserver\]  
  
    Q6 --\> R\[observeDom - MutationObserver on document.body\]  
    R --\> S\[loadNavConfig async\]  
    S --\> T\[createNavInterface after waitFor messages\]  
    T --\> U\[addMenuCommands - GM menu\]  
    U --\> V\{autoCheckUpdates?\}  
    V -- Yes +2000ms --\> W\[checkForUserscriptUpdate silent\]  
    V -- No --\> X\[scheduleRefresh 220ms\]  
    W --\> X  
    X --\> Y\[setTimeout 1200ms self-heal guard\]
```

### 8.4 State Model

```
// state.js — all mutable state namespaced  
  
const UIState = \{  
  panelHidden: false,  
  panelPage: 'home',       // 'home'|'themes'|'layout'|'font'|'prompts'|'settings'|'ui-theme'  
  panelLeft: null,  
  panelTop: null,  
  launcherHiddenUntilHover: true,  
  moveGuiDragEnabled: false,  
  observerPaused: false,  
  mutationObserver: null,  
  saveTimer: null,  
  refreshTimer: null,  
  notificationTimer: null,  
  isInitialized: false,  
  isInitializing: false,  
  currentPlatform: null,  
  floatingPromptEventsBound: false,  
\};  
  
const PromptState = \{  
  prompts: \[\],              // merged A+B schema  
  savedThemes: \[\],  
  importedThemes: \{\},  
  floatingPinnedCards: \[\],  
  inlineMenu: null,  
  inlineMenuItems: \[\],  
  inlineMenuIndex: -1,  
  macroMemory: new Map(),  
  varMemory: new Map(),  
\};  
  
const ThemeState = \{  
  settings: \{\},             // full merged settings object  
  tagsConfig: \{\},  
\};  
  
const NavState = \{  
  enabled: false,  
  cachedMessages: \[\],  
  savedPins: \[\],  
  activePins: \[\],  
  currentChatId: null,  
  currentNavIndex: 0,  
  currentPinnedCenterIdx: 0,  
  navContainer: null,  
  carouselContainer: null,  
  chatWatchInterval: null,  
  domWatchInterval: null,  
\};  
  
const AIState = \{  
  config: \{\},               // API keys, model, system prompt  
  currentShortcuts: \{\},  
\};
```

### 8.5 Storage Schema

```
// GM storage keys  
const KEYS = \{  
  SETTINGS:        'up\_settings\_v1',      // all appearance + layout settings  
  PROMPTS:         'up\_prompts\_v1',       // object keyed by prompt ID  
  THEMES:          'up\_saved\_themes\_v1',  // user-saved theme objects  
  IMPORTED\_THEMES: 'up\_imported\_themes\_v1',  
  GLOBAL\_FILES:    'up\_global\_files\_v1',  // base64 file array  
  TAGS:            'up\_tags\_v1',  
  AI\_CONFIG:       'up\_ai\_config\_v1',  
  SHORTCUTS:       'up\_shortcuts\_v1',  
  NAV\_CONFIG:      'up\_nav\_config\_v1',  
  SYNTAX\_CONFIG:   'up\_syntax\_v1',  
  PREDICTION:      'up\_prediction\_v1',  
  COLUMNS:         'up\_columns\_v1',  
\};  
  
// sessionStorage key (cross-navigation prompt)  
const PENDING\_PROMPT\_KEY = 'up\_pending\_prompt\_v1';  
  
// IndexedDB  
const IDB\_DB = 'UnleashedPrompt';  
const IDB\_STORE = 'chatPins';  
  
// Merged prompt schema  
const promptSchema = \{  
  id:              String,     // timestamp + perf.now + random  
  title:           String,     // max 80 chars  
  text:            String,     // full prompt body  
  usePlaceholders: Boolean,  
  autoExecute:     Boolean,  
  isFixed:         Boolean,    // pinned to top of list  
  favorite:        Boolean,    // starred  
  type:            String,     // 'user' | 'ai'  
  activeFileIds:   Array,      // GM file IDs  
  tags:            Array,      // lowercase tag names  
  usageCount:      Number,  
  position:        Number,     // manual sort order  
  createdAt:       String,     // ISO8601  
  expanded:        Boolean,    // UI state  
\};
```

### 8.6 DOM Integration Plan

```
ChatGPT Page  
├── \<head\>  
│   ├── \<style id="up-structural-v1"\>     // stable structural CSS (written once)  
│   └── \<style id="up-theme-vars-v1"\>    // CSS custom properties only (rewritten on change)  
│  
└── \<body\>  
    ├── \[ChatGPT native composer toolbar\]  
    │   └── .up-pill-wrapper              // injected pill button  
    │       ├── \[AI Enhance half\]  
    │       └── \[Prompts half\]  
    │  
    ├── \#up-floating-panel-v1             // draggable 7-page settings panel  
    │   ├── .up-panel-launcher            // ghost launcher (collapsed state)  
    │   └── .up-panel-body               // full panel content  
    │  
    ├── \#up-prompt-menu                   // prompt dropdown (hidden by default)  
    ├── \#up-prompt-editor-overlay         // prompt create/edit modal  
    ├── \#up-placeholder-modal             // placeholder fill modal  
    ├── \#up-ai-diff-overlay               // AI enhance diff modal  
    ├── \#up-prompt-review-overlay         // fullscreen prompt review  
    ├── \#up-prompt-explorer-overlay       // search+filter fullscreen  
    ├── \#up-settings-overlay             // settings modal (3-tab)  
    ├── \#up-tags-manager-overlay  
    ├── \#up-backup-overlay  
    ├── \#up-export-chats-modal            // inline in panel or standalone  
    ├── \#up-delete-chats-modal  
    ├── \#up-nav-container                 // message navigator widget  
    ├── \#up-pinned-carousel-wrapper       // pinned message carousel  
    ├── .up-prompt-float-card             // floating pinned prompt cards (N)  
    ├── \#up-inline-menu                   // \# autocomplete  
    ├── \#up-global-notification           // toast notification  
    └── \[.up-tooltip\]                     // transient per-hover
```

### 8.7 Event System

```
// Permanent delegated listeners (set once on init)  
document.addEventListener('click', globalClickHandler);       // close menus on outside click  
document.addEventListener('keydown', globalKeydownHandler);   // shortcuts, Escape  
window.addEventListener('resize', debounce(resizeHandler, 100));  
  
// Panel delegated (set once on panel creation)  
panel.addEventListener('input',  panelInputHandler);   // data-key inputs  
panel.addEventListener('change', panelChangeHandler);  // select, hex text  
panel.addEventListener('click',  panelClickHandler);   // data-action buttons  
panel.addEventListener('wheel',  panelWheelHandler);   // range slider nudge  
  
// Toolbar button  
pillButton.addEventListener('click', promptButtonClickHandler);  
  
// Composer (bound after waitFor)  
composerTextarea.addEventListener('input', debounce(inlineSuggestionHandler, 100));  
  
// Modal events: bound at creation time with explicit stopPropagation()  
// Floating prompt cards: bound at card creation time  
// Nav widget: bound at createNavInterface()  
  
// URL change interception (replaces B's setInterval approach)  
const \_pushState = history.pushState.bind(history);  
history.pushState = (...args) =\> \{  
  \_pushState(...args);  
  onUrlChange();  
\};  
window.addEventListener('popstate', onUrlChange);
```

### 8.8 Settings System

Settings are stored in GM and normalized through a single `normalizeSettings()` function on every load and write. Color keys validated by `sanitizeHexColor`. Numeric keys clamped by `clampNumber`. Boolean keys coerced by `!!`. Changes are debounced 140ms before persisting.

The settings object is split conceptually into:

- **Appearance settings** (colors, fonts, layout) — drive CSS custom property updates

- **Feature toggles** (themeEnabled, fontEnabled, hideWarning, etc.) — gate CSS blocks

- **Panel state** (panelPage, panelHidden, panelLeft, panelTop) — persisted UI state

- **Prompt settings** (sortMode, columnCount) — drive prompt list rendering

- **AI settings** (stored separately for security isolation)

### 8.9 Error Handling Approach

```
Strategy: Fail gracefully, surface errors to user for recoverable failures  
  
1. Storage reads: try/catch → return defaults (never throw on load)  
2. DOM injection: waitFor timeout → show notification "Could not find composer. Try refreshing."  
3. AI API calls: catch all errors → show alert dialog with message (B's pattern)  
4. Chat export: catch per-chat → count failures, notify "Exported N of M (X failed)"  
5. Chat delete: catch per-chat → continue loop, count failures  
6. File reads: reader.onerror → show error in prompt-status element  
7. File size \> 5MB: confirm dialog before reading  
8. Theme import JSON: try/catch JSON.parse → show alert "Invalid theme file"  
9. IndexedDB: catch + console.error → return empty pins array  
10. Update check: catch fetch errors → if not silent, show notification  
11. Pending prompt: try/catch → silently remove malformed entry  
12. Placeholder parsing: any throw → fall back to plain text insertion
```

### 8.10 Debug/Logging Strategy

```
const DEBUG = false; // Set to true via GM menu command "Enable Debug Mode"  
  
const log = \{  
  info:  (...a) =\> DEBUG && console.log  ('\[UP\]', ...a),  
  warn:  (...a) =\> DEBUG && console.warn ('\[UP\]', ...a),  
  error: (...a) =\>           console.error('\[UP\]', ...a), // always log errors  
  group: (...a) =\> DEBUG && console.groupCollapsed('\[UP\]', ...a),  
  end:   ()     =\> DEBUG && console.groupEnd(),  
\};  
  
// GM menu command to toggle debug mode at runtime  
GM\_registerMenuCommand('Toggle Debug Mode', () =\> \{  
  DEBUG = !DEBUG;  
  showNotification(\`Debug mode $\{DEBUG ? 'enabled' : 'disabled'\}\`);  
\});
```

Key debug output points:

- Platform detection result

- Composer candidates (scores)

- Message scoring passes (candidate count, best score)

- Observer mutation events (element id/class, action taken)

- Storage read/write operations (key, value type, size)

- AI API call attempts (provider, model, key index)

### 8.11 Compatibility Strategy for Future ChatGPT UI Changes

```
Selector priority order (most to least stable):  
  1. data-testid="…"          — OpenAI's own test IDs; rarely changed  
  2. aria-label="…"           — accessibility labels; stable  
  3. data-message-author-role — semantic attribute; very stable  
  4. id="…"                   — IDs like "composer-plus-btn"; stable but renamed occasionally  
  5. role="…"                 — ARIA roles; very stable  
  6. Scoring algorithm        — class/text/position heuristics; resilient to class renames  
  7. SVG path fingerprint     — last resort; brittle to icon sprite changes  
  
Resilience patterns:  
  - Multi-selector chains: try selectors 1→N, use first match  
  - MutationObserver re-injection: always re-check on DOM change  
  - Self-healing timer: 1200ms guard recreates missing style/panel  
  - Version guard: window.\_\_unleashedPromptV1 prevents duplicate runs  
  - Observer exclusion: all script-owned nodes excluded from refresh triggers  
    
Testing indicator:  
  - Add a console.warn('\[UP\] SELECTOR\_FALLBACK', selectorUsed) when   
    a fallback selector is used, to surface regressions early
```


## 9. Tradeoff Recommendations

Priority hierarchy used: **User Value → Reliability → Maintainability → UX Polish → Performance**

### Tradeoff 1: External AI API vs. Composer-Based Enhancement

**Chosen:** Include both. External API as primary, composer-based as zero-config fallback.  
**Gained:** Users without API keys still get enhancement. Users with keys get diff view + superior output.  
**Lost:** Code complexity of maintaining two paths. External API calls can fail or have latency.  
**Acceptable because:** Feature richness is a stated priority. The zero-config path has no network risk.

### Tradeoff 2: Full Monolithic Single-File vs. Modular Build

**Chosen:** Modular source (as shown in blueprint), compiled to single IIFE for distribution.  
**Gained:** Dramatically better maintainability; testable modules; fewer merge conflicts.  
**Lost:** Requires a build step (esbuild/rollup). Debugging minified output in browser is harder.  
**Acceptable because:** The scripts are already 5,550+ lines single-file — that approach is clearly hitting its limit. The build step is a one-time setup cost.

### Tradeoff 3: GM Storage vs. localStorage

**Chosen:** GM storage for all user data.  
**Gained:** Isolation from page scripts; cross-platform prompt sharing; higher quota.  
**Lost:** Async-only API requires `await` everywhere; slightly more boilerplate.  
**Acceptable because:** Security isolation and cross-platform sharing are tangible user benefits that outweigh the async overhead.

### Tradeoff 4: Full CSS Rewrite vs. Custom Property Update Only

**Chosen:** Two-tag split: stable structural CSS written once; theme custom properties written on change.  
**Gained:** Eliminates full CSS reparse on every slider drag; significantly better perceived performance.  
**Lost:** Slightly more complex `applyStyles()` split. Need to ensure structural CSS is comprehensive so changes to theme vars do cascade correctly.  
**Acceptable because:** The performance improvement is meaningful and the implementation is straightforward.

### Tradeoff 5: Remove External `@require` Dependencies

**Chosen:** Remove `ScriptNotifier` and `FontLoaderBypass`.  
**Gained:** No third-party code execution risk; fully self-contained; no CDN dependency for core function.  
**Lost:** Built-in update notification UI (replaced by fetch-based checker); web font support via CORS bypass (users must use system/standard fonts or declare fonts via `@font-face` with a hosted URL in settings).  
**Acceptable because:** The security benefit of removing third-party execution outweighs the loss of these convenience features.

### Tradeoff 6: ChatGPT-First vs. Multi-Platform

**Chosen:** ChatGPT-first with extensible adapter architecture.  
**Gained:** Deep, reliable ChatGPT integration; smaller codebase; easier testing.  
**Lost:** Script B's prompt library is cross-platform and shared. Users of Claude.ai, Gemini, etc. lose access.  
**Acceptable because:** The deepest feature set (theming, chat management, nav) is ChatGPT-specific. The adapter architecture means Claude, Gemini, and others can be added in future releases without rearchitecting.

### Tradeoff 7: Placeholder System Complexity

**Chosen:** Include full placeholder system from Script B.  
**Gained:** Prompts become interactive forms — the single highest-value unique feature.  
**Lost:** Significant additional code (~400+ lines for parsing + modal). UX complexity for users who don't know about it.  
**Acceptable because:** Feature is opt-in per prompt (`usePlaceholders: false` by default). Users who don't use it see no difference. Power users get an entirely new capability.

### Tradeoff 8: i18n System

**Recommended decision: Deferred.** The 40-language i18n system from Script B is high-value globally but adds the `@resource IDIOMAS` CDN dependency and 200+ translation keys to maintain.  
**Suggested approach:** Build UI strings as a simple `i18n` object in the script itself with English as baseline, and design the string-lookup system such that translations can be dropped in later without rearchitecting. Do not pull from CDN on initial release.


## 10. Questions Before Code Generation

The synthesis report is complete. Before generating the full starter userscript scaffold, please confirm the following:

**1. Feature set agreement**  
The recommended final feature set includes all 74 features from the inventory (minus the 5 explicitly excluded). Do you agree, or are there features you want removed, deprioritized, or modified?  

Answer: I agree

**2. Architecture confirmation**  
The blueprint proposes a modular source compiled to a single IIFE. Do you want to:

- (a) Use the modular build approach (requires esbuild/rollup build step), or

- (b) Write a single structured IIFE directly (simpler setup, harder to maintain at scale)?  

Answer: A

**3. i18n decision**  
Should the combined script include the 40-language i18n system from Script B (CDN dependency), include English-only with infrastructure for future translations, or skip i18n entirely?  
English Only

**4. Platform scope**  
The blueprint is ChatGPT-first. Should the scaffold include:

- (a) ChatGPT-only (no platform abstraction yet), or

- (b) ChatGPT primary + Claude.ai secondary as the first two platforms?  

Answer: B

**5. Storage migration**  
Both scripts have existing users with data in their respective storage keys. Should the scaffold include a one-time migration utility that reads Script A's `localStorage` keys and/or Script B's GM keys and imports them into the new combined storage schema? 

Answer: No.

**6. Priority adjustment**  
Any features you want elevated to Phase 1 of the scaffold (i.e., fully implemented from day one) vs. Phase 2 (stubbed with placeholder UI)?  
Current suggested Phase 1 priority: theming + basic prompt library + insertion + placeholder system + inline suggest + settings panel.  
Current suggested Phase 2: Nav widget, AI Enhance with diff, Gist, bulk chat management, smart editor, full backup.  

Answer: Continue with current priorities
