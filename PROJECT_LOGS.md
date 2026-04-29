# PROJECT_LOGS.md — AI-ITS-OVER-9000 Userscript

## SOURCE OF TRUTH RULE — Never overwrite (append only)

READ THIS FILE BEFORE MAKING ANY CHANGES, EDITS, REVISIONS, UPGRADES, OR FIXES.

This file is the authoritative source for:
- Current state
- Decisions
- Pending work
- Constraints

---

## 1. Current Project State

### What Works (v1.0.3 — Current)

- **Full ChatGPT / Claude.ai UI Theming**
  - 19 color zones
  - Two-tag CSS strategy
  - 14 presets

- **Prompt Library**
  - GM storage
  - Merged schema
  - CRUD
  - Tags, favorites
  - Sort, filter, search

- **Dynamic Placeholder System**
  - `[input]`
  - `##select{}`
  - `#file[]` with fill modal

- **AI Enhancement**
  - Quick Enhance: composer-based, zero-config
  - AI Enhance: external API (Gemini / OpenRouter / Groq / HuggingFace / LongCat)
  - Diff modal

- **Inline `#` Autocomplete**
  - Keyboard navigation
  - Caret-aware completion

- **Smart Editor**
  - Bracket pair completion
  - `##start/end` macro wrapping
  - Syntax backdrop

- **Chat Navigation Widget**
  - Message index
  - Prev / Next
  - Pinned carousel (IndexedDB-backed)

- **Chat Management**
  - Markdown export
  - Bulk export/delete modal
  - Sidebar quick-delete buttons

- **Gist Integration**
  - Export/import prompt library via GitHub Gist

- **Full Backup / Restore**
  - Selective key restore from `.json` backup

- **Floating Panel (7 pages)**
  - Home, Themes, Layout, Font, Prompts, Settings, UI-Theme

- **Toolbar Pill Button**
  - Enhance + Prompts halves
  - Search
  - Right-click-to-edit

- **Prompt Explorer Modal**
  - Fullscreen grid
  - Multi-column
  - Drag-to-reorder

- **Prompt Editor Modal**
  - Create / edit / delete
  - All fields + toggles

- **Keyboard Shortcuts**
  - 8 configurable actions with recorder

- **Self-Healing**
  - 1200ms guard recreates missing style/panel nodes

- **MutationObserver System**
  - Pause/resume pattern
  - `history.pushState` interception

- **GM Menu Commands**
  - 7 commands

- **Update Checker**
  - Self-contained fetch
  - Semver comparison
  - `raw.githubusercontent.com` lock

- **File Auto-Attach**
  - DragEvent + ClipboardEvent strategies

- **Platform Adapters**
  - ChatGPT (score-based)
  - Claude.ai

---

## 2. Known Issues / Bugs

### Bug Template (Reference)

| Field | Description |
|------|------------|
| ID | BUG-XXX |
| Status | Open / Closed |
| Symptom | What happens |
| Area | Where it occurs |
| Suspected Cause | Root cause |
| Workaround | Temporary fix |
| Solution | Final fix |

---

### Active Bugs

#### BUG-001 — Bulk Export/Delete Missing Delete Action

| Field | Value |
|------|------|
| ID | BUG-001 |
| Status | Open |
| Symptom | Delete action missing in bulk modal |
| Area | Bulk export/delete UI |
| Suspected Cause | Missing implementation |
| Workaround | Manual deletion |
| Solution | Not implemented yet |

---

## 3. Upgrade Ideas / Deferred Work

| UPDATE-ID| Idea | Priority |
|----------|------|----------|
| UP-001 | AI summary button for selected conversation | Low |
| UP-002 | AI usage statistics dashboard (time, messages, conversations, response time) | Low |
| UP-003 | (Unspecified) | — |

---

## 4. Logs



### Logging Instructions
### Logging Instructions

1) Create a new log file in `logs/` using the Log Template  
2) Add an entry to the table below  
3) Every log file MUST have a corresponding row in this table  
4) LOG-ID must be unique and sequential (LOG-001, LOG-002, ...)  

| Date/Time | LOG-ID | Task / Phase | Status | File | Links (BUG / UP) |
|----------|--------|--------------|--------|------|------------------|
| YYYY-MM-DD HH:MM | LOG-XXX | Task title or phase | Completed / In Progress / Blocked | logs/LOG-XXX.md | BUG-XXX, UP-XXX |

### Log Template

```md
### LOG-XXX — [TASK TITLE]

| Field | Value |
|------|------|
| Date/Time | YYYY-MM-DD HH:MM |
| Status | Not Started / In Progress / Blocked / Completed |
| Task | Detailed task description |
| Summary | What was done (1–2 sentences) |
| Files | file1.js, file2.md |
| Changes | Change 1; Change 2 |
| Next Steps | Step 1; Step 2 |
| Blockers | Issue 1; Issue 2 |
| Links | BUG-XXX, UP-XXX |
| Notes | Decisions or important context only |
```

---

## 5. Append-Only Updates

### 2026-04-22 — State Update (v1.0.4)

- The shipped userscript version is now **v1.0.4**.
- The self-update target now points at this repository's actual raw userscript file.
- `New Chat` now stays on the current platform origin so pending prompts survive on `chat.openai.com` and Claude users are not redirected to ChatGPT.
- ChatGPT-only chat export and bulk export/delete flows now fail clearly on unsupported platforms instead of exposing silent/broken behavior.
- API key rotation now starts with the first configured key and advances in order.
- Inline autocomplete now binds its document click listener once, avoiding listener buildup across SPA rerenders.
- The panel home actions and GM menu now expose separate bulk export and bulk delete entries.

### 2026-04-22 — Bug Status Addendum

#### BUG-001 — Bulk Export/Delete Missing Delete Action

| Field | Value |
|------|------|
| ID | BUG-001 |
| Status | Fixed |
| Symptom | Delete action missing or misleadingly exposed from bulk chat controls |
| Area | Bulk export/delete UI and GM menu |
| Suspected Cause | Export and delete entry points were collapsed into an export-only launch path |
| Workaround | Open delete flow from the prompt menu only |
| Solution | Added explicit bulk export and bulk delete entry points in the panel home actions and GM menu |

### 2026-04-22 — Completed Changes

- **File:** `AI-ITS-OVER-9000.user.js`
  **Areas:** metadata header, update checker, new chat handoff, export gating, bulk modal gating, AI provider selection, inline autocomplete setup, panel home actions, GM menu commands
  **What changed:** Corrected the raw update/download target, bumped version to `1.0.4`, preserved same-origin pending prompts during new chat navigation, guarded ChatGPT-only actions on unsupported platforms, fixed API key rotation ordering, prevented duplicate global click listeners, and split bulk export/delete actions.
  **Why:** These were the highest-confidence functional issues from the repo review and caused broken updates, cross-origin prompt loss, misleading platform behavior, and event-listener accumulation.
  **How verified:** `node --check AI-ITS-OVER-9000.user.js`

- **File:** `README.md`
  **Areas:** architecture, installation, development workflow
  **What changed:** Replaced the stale modular `src/` description with the current single-file repo shape and added direct installation guidance.
  **Why:** The repository docs no longer matched the actual contents of the repo.
  **How verified:** Manual file review after patching.

- **File:** `logs/LOG-001.md`
  **Areas:** project audit trail
  **What changed:** Added a task log for the review-driven fixes.
  **Why:** Required by the repository logging rules.
  **How verified:** Manual file review after creation.

### 2026-04-22 — Next Steps

- Manually smoke-test `New Chat` on `chatgpt.com`, `chat.openai.com`, and `claude.ai`.
- Manually verify chat export and bulk delete on current ChatGPT DOM.
- Replace remaining `document.execCommand(...)` editor paths when a lower-risk platform-safe alternative is chosen.

### 2026-04-22 — Logs Table Addendum

| Date/Time | LOG-ID | Task / Phase | Status | File | Links (BUG / UP) |
|----------|--------|--------------|--------|------|------------------|
| 2026-04-22 16:07 | LOG-001 | Review fixes and repo sync | Completed | logs/LOG-001.md | BUG-001 |

### 2026-04-22 — UI Simplification Addendum

- Removed the standalone `Export Current Chat` panel button because the current chat can already be exported through `Bulk Export Chats`.
- Removed the matching GM menu command so the visible export UI now has a single primary path.
- Kept the internal `exportCurrentChatAsMarkdown()` function and shortcut behavior unchanged for now to avoid a larger behavior change than requested.

### 2026-04-22 — State Update (v1.0.5)

- The shipped userscript version is now **v1.0.5**.
- The export fallback note now references `Bulk Export Chats` instead of the removed single-chat export UI.
- The `Export Chat` shortcut now opens the bulk export modal.
- All remaining `document.execCommand(...)` usage has been replaced with `Selection` / `Range`-based editing helpers.
- Panel nav tooltips now use stronger event binding and native `title` fallbacks.
- Bubble styling now targets the outer message content container instead of an inner text node wrapper, reducing duplicate grey backing.
- The floating panel now keeps a fixed shell height and scrollable content area for taller pages like `Layout` and `Font`.
- The extra minimized `UP` launcher strip has been removed; the minimized panel header now reopens the GUI directly.
- Warning hiding now marks known warning copy directly instead of relying on a brittle CSS-only selector.
- Font override now applies across the sidebar, panel, composer, and message content.
- Sidebar delete buttons now use absolute positioning and right padding so chat titles stay on one line.

### 2026-04-22 — Completed Changes Addendum

- **File:** `AI-ITS-OVER-9000.user.js`
  **Areas:** export fallback copy, export shortcut behavior, contenteditable editing helpers, tooltip binding, panel shell/layout, minimized header behavior, warning hiding, font override, bubble targeting, sidebar delete layout
  **What changed:** Repointed export messaging and shortcut behavior to the bulk export flow, replaced deprecated editing APIs, improved tooltip and panel behavior, and fixed the reported UI rendering issues around bubbles, warnings, fonts, and sidebar delete controls.
  **Why:** These were direct user-reported bugs and cleanup requests after the earlier review pass.
  **How verified:** `node --check AI-ITS-OVER-9000.user.js`

- **File:** `logs/LOG-002.md`
  **Areas:** project audit trail
  **What changed:** Added a dedicated log entry for the UI bug-fix and editor-modernization pass.
  **Why:** Required by the repository logging rules.
  **How verified:** Manual file review after creation.

### 2026-04-22 — Next Steps Addendum

- Smoke-test bubble styling on the current ChatGPT DOM to confirm there is no remaining double-background wrapper.
- Verify warning-hiding copy on both ChatGPT and Claude in case platform wording changes.
- Remove `exportCurrentChatAsMarkdown()` entirely if the bulk export flow fully replaces it.

### 2026-04-22 — Logs Table Addendum 2

| Date/Time | LOG-ID | Task / Phase | Status | File | Links (BUG / UP) |
|----------|--------|--------------|--------|------|------------------|
| 2026-04-22 17:15 | LOG-002 | UI bug fixes and editor modernization | Completed | logs/LOG-002.md | BUG-001 |
