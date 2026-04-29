PROJECT_LOGS.md — AI-ITS-OVER-9000 Userscript
SOURCE OF TRUTH RULE - Never overwrite — append only.

READ THIS FILE BEFORE MAKING ANY CHANGES, EDITS, REVISIONS, UPGRADES, OR FIXES OF ANY KIND.

This file is the authoritative source for:

Current state
Decisions
Pending work
Constraints
1. Current Project State
What Works (v1.0.3 — Current)
Full ChatGPT/Claude.ai UI Theming — 19 color zones, two-tag CSS strategy, 14 presets
Prompt Library — GM storage, merged schema, CRUD, tags, favorites, sort, filter, search
Dynamic Placeholder System — [input], ##select{}, #file[] with fill modal
AI Enhancement (both modes)
Quick Enhance: composer-based, zero-config
AI Enhance: external API (Gemini/OpenRouter/Groq/HuggingFace/LongCat) + diff modal
Inline # Autocomplete — keyboard nav, caret-aware completion
Smart Editor — bracket pair completion, ##start/end macro wrapping, syntax backdrop
Chat Navigation Widget — message index, prev/next, pinned carousel (IndexedDB-backed)
Chat Management — Markdown export, bulk export/delete modal, sidebar quick-delete buttons
Gist Integration — export/import prompt library via GitHub Gist
Full Backup/Restore — selective key restore from .json backup
Floating Panel (7 pages) — fully implemented: Home, Themes, Layout, Font, Prompts, Settings, UI-Theme
Toolbar Pill Button — Enhance + Prompts halves, search, right-click-to-edit
Prompt Explorer Modal — fullscreen grid, multi-column, drag-to-reorder
Prompt Editor Modal — create/edit/delete, all fields, toggles
Keyboard Shortcuts — 8 configurable actions with recorder
Self-Healing — 1200ms guard recreates missing style/panel nodes
MutationObserver — pause/resume pattern, history.pushState URL interception
GM Menu Commands — 7 commands
Update Checker — self-contained fetch, semver comparison, raw.githubusercontent.com lock
File Auto-Attach — DragEvent + ClipboardEvent strategies
Platform Adapters — ChatGPT (score-based) + Claude.ai
2. Known Issues / Bugs
BUG-001 — Bulk Export/Delete Missing Delete Action

Template Example

Field	Value
ID: BUG-000	Status: Open/Closed
Symptom	Short description of the bug and what it's effecting
Area	in GUI, after clicking bulk export/delete button
Suspected Cause	Missing code
Workaround	Manually delete conversations
Solution	Short explanation of how issue was resolved
3. Upgrade Ideas / Deferred Work
ID	Idea	Priority
UP-001	Create a button that uses AI via API to quickly create and display a summary of the currently selected conversation	Low
Up-002	Create something that keeps track of AI Statictics and shows lifetime usage/stats of different catagories for ChatGPT/ Claude / Etc. Example (Time AI spent thinking/ Questions Asked/Answered/ Messages. # of conversations had, Average response time,	Low
Up-003		
4. Logs
Log Tempelate
### [DATE] - [TASK TITLE]

**Task:** (Not Started / In Progress / Blocked / Completed)

**Summary:**  
Brief description of what is being worked on.

**Files Involved:**  
- path/to/file.js  
- path/to/another/file.md  

**Changes Made:**  
- What was done  
- What was updated  
- What was added/removed  

**Recommended Next Steps:**  
- What still needs to be done  
- Immediate follow-up actions  

**Blockers / Issues:**  
- What bugs/issues were found and documented 

**Notes:**  
- Extra context, decisions, or important details  
LOGS:
2026-04 - FEATURE ADDED — Panel nav button tooltips

Status: Completed

Summary:
Hovering any of the 7 nav buttons at the top of the floating panel now shows a styled tooltip describing that page's contents and key features.

Files:

AI-ITS-OVER-9000.user.js
PROJECT_LOGS.md

Done:

Added PAGE_TOOLTIPS map for navigation button descriptions
Updated createCustomTooltip() for:
requestAnimationFrame positioning
multi-line tooltip support
smart above/below placement logic
horizontal clamping to viewport
Updated tooltip CSS:
increased max width to 280px
enabled text wrapping
themed styling aligned with panel UI

Next:

Define next feature iteration or enhancements

Issues:

Bulk export cross-navigation (Phase 2) may be blocked by CSP depending on environment
File attachment on Claude.ai may fail depending on ClipboardEvent support in different builds
attachSmartEditorLogic bracket skipping only works in textarea, not contenteditable elements

Notes:

initGistIntegration() was previously a log stub in v1.0.0/v1.0.1
Fixed and fully wired in v1.0.2 for gist.github.com pages
AI-ITS-OVER-9000.user.js version updated to 1.0.2
