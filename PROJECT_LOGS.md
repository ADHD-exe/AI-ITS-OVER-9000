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
