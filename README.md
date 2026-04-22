# AI-ITS-OVER-9000
A maximum-feature ChatGPT/Claude.ai userscript for automated prompt enhancement with AI, chat navigation, templates, tagging, and quick insert tools. Combines a full UI theming engine with deep interface controls into a single, unified platform.

---

## Overview

**Unleashed Prompt** transforms ChatGPT into a **programmable prompt workstation**.

It is not just a prompt saver.

It is a:

* UI theming engine
* Prompt automation framework
* AI enhancement pipeline
* Chat navigation system
* Power-user control layer

All operating directly inside `chatgpt.com`.

---

## Core Philosophy

* **Feature-first, not minimalism**
* **Power-user tooling over simplicity**
* **Composable systems over isolated features**
* **State-driven architecture**
* **Resilient to UI changes (DOM scoring + fallback detection)**

---

## Primary Capabilities

### 1. Full ChatGPT UI Theming Engine

* 19 independently controllable color zones:

  * Page background / text
  * User / assistant bubbles
  * Code blocks
  * Composer
  * Sidebar
  * UI panels

* Features:

  * Per-zone enable/disable
  * Live preview (no reload)
  * Custom themes (save/load)
  * Import/export theme files
  * UI auto-matching (panel adapts to theme)

---

### 2. Advanced Prompt System

* Persistent prompt library (GM storage)
* Tagging system with filtering
* Favorites + pinning
* Usage tracking + auto sorting
* Full-text search
* Drag-and-drop reordering
* Fullscreen prompt grid view

#### Prompt Schema (Merged System)

```json
{
  "id": "string",
  "title": "string",
  "text": "string",
  "usePlaceholders": true,
  "autoExecute": false,
  "isFixed": false,
  "favorite": false,
  "type": "user",
  "activeFileIds": [],
  "tags": [],
  "usageCount": 0,
  "position": 0,
  "createdAt": "ISO",
  "expanded": false
}
```

---

### 3. Dynamic Placeholder System (High-Value Feature)

Prompts become **interactive templates**:

```text
Write a blog post about [topic]

##select:Tone{
Professional
Casual
Humorous
}
```

Supports:

* Text inputs
* Dropdown selectors
* File attachments

Executed via a modal before insertion.

---

### 4. AI Enhancement System

Two modes:

#### Quick Enhance (Zero Config)

* Uses ChatGPT itself
* Wraps prompt with enhancement instructions
* No API key required

#### AI Enhance (Advanced)

* External API providers:

  * OpenRouter
  * Gemini
  * HuggingFace
  * Groq
* Features:

  * Diff comparison view
  * System prompt selection
  * API key rotation
  * Multi-provider routing

---

### 5. Inline Prompt Autocomplete

Type:

```
#your-prompt-name
```

→ Live dropdown appears
→ Navigate with keyboard
→ Insert instantly

---

### 6. Smart Prompt Editor

* Bracket auto-completion
* Macro helpers (`##start / ##end`)
* Variable suggestions
* Syntax highlighting layer

---

### 7. Chat Navigation System

* Floating navigation widget
* Jump between messages
* Indexed conversation scanning
* Pinned message system
* Draggable pinned carousel

---

### 8. Chat Management Tools

* Export current chat → Markdown
* Bulk export multiple chats
* Bulk delete chats
* Sidebar quick-delete buttons
* “New Chat with Prompt” workflow

---

### 9. File System Integration

* Global file store (base64-backed)
* Attach files to prompts
* Auto-inject files on prompt execution

---

### 10. UI Systems

#### Toolbar Integration

* Prompt button injected into ChatGPT composer
* Primary interaction surface

#### Floating Panel

* Draggable
* Multi-page configuration UI
* Hidden-until-hover launcher

#### Modals

* Prompt editor
* Placeholder modal
* AI diff viewer
* Backup/restore
* Tag manager

---

### 11. Keyboard Shortcuts

Configurable shortcuts for:

* Open prompt menu
* AI enhance
* Insert prompt
* Navigate messages
* Save prompt
* Execute prompt

---

### 12. Backup & Restore

* Full configuration export
* Selective restore
* Prompt + theme + settings snapshot

---

### 13. Update System

* Self-contained update checker
* GitHub raw version comparison
* Optional auto-check on load

---

## Architecture

The repository currently ships a **single-file userscript**:

```
AI-ITS-OVER-9000.user.js
```

The code is still organized internally by section:

* Platform adapters
* Prompt engine + placeholders
* Theming
* AI enhancement
* Chat management
* Navigation + pins
* UI panels / modals / toolbar
* Shared utilities

---

## Key Systems

### DOM Strategy

* Multi-layer targeting:

  * `data-testid`
  * `aria-label`
  * semantic attributes
  * scoring fallback system

* MutationObserver:

  * Debounced
  * Self-healing
  * Observer pause/resume pattern

---

### Storage

* Primary: `GM_getValue / GM_setValue`
* IndexedDB:

  * Per-chat pinned messages
* sessionStorage:

  * Cross-navigation prompt injection

---

### CSS Strategy

* Two-layer injection:

  * Static structural styles
  * Dynamic theme variables

Avoids full CSS reparse on updates.

---

## Installation

1. Install Tampermonkey or a compatible userscript manager
2. Open `AI-ITS-OVER-9000.user.js`
3. Install the script in your userscript manager
4. Open `chatgpt.com`, `chat.openai.com`, `claude.ai`, or `gist.github.com`
5. The script initializes automatically on supported pages

---

## Development Workflow

### Current Repo Shape

* No build pipeline is checked into this repository today
* The committed source of execution is the shipped single-file userscript

### Future Build Option

If the project is split back into source modules later, a bundler such as `esbuild` or `rollup` would be a natural fit for producing the final single IIFE userscript.

### Principles

* No external runtime dependencies
* Fully self-contained output
* Strict modular separation in source

---

## Security Considerations

* No unsafe HTML injection (sanitized rendering)
* API keys stored in userscript storage (not page scope)
* File size limits enforced
* External endpoints validated

---

## Limitations

* Tightly coupled to ChatGPT DOM (requires maintenance on UI changes)
* External AI enhancement requires API keys
* Large feature set increases complexity
* Mobile UX is functional but secondary

---

## Future Roadmap

* Claude / multi-platform adapter expansion
* i18n system (currently English-only)
* Plugin system for custom prompt actions
* Sync layer (optional cloud backup)
* Performance profiling + lazy loading

---

## Status

Active development.

This repository represents a **next-generation userscript architecture**, not a simple utility script.

---

## Intended Audience

* Power users
* Prompt engineers
* AI workflow builders
* Userscript developers

---

## Summary

Unleashed Prompt is designed to be:

> The most feature-rich ChatGPT userscript possible without sacrificing control, extensibility, or technical integrity.

---
