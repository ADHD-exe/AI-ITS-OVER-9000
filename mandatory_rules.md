markdown
# Mandatory Project Logging Rule

You must maintain a persistent log file:

```

PROJECT_LOGS.md

````

This file is the **primary source of truth** for the project.

---

## Core Requirements

Update the log after every:

- Change
- Fix
- Bug discovery
- Failed attempt
- Refactor
- Design decision

**Never rely on chat memory.**

---

## Required Log Structure

### 1. Current Project State
- What works
- What is partially implemented
- What is broken or unverified
- Recently modified files

---

### 2. Completed Changes

For each change, record:

- File path
- Function/module affected
- What changed
- Why it changed
- How it was verified

---

### 3. Known Issues / Bugs

- Symptom
- Suspected cause
- Affected area
- Reproduction steps
- Status: `open` / `investigating` / `fixed` / `deferred`

---

### 4. Failed Attempts

- What was attempted
- Why it failed
- Observed behavior
- What should not be repeated

---

### 5. Upgrade Ideas / Deferred Work
*Agent should Share upgrade ideas and ask to add them to this list, Never create add or implement Upgrade ideas without approval*

- Functionality 
- Reliability   
- Stability
- Performance  
- Efficiency
- Code Quality  
- Structure
- Readability  
- Documentation 
- Compatibility
- Security
- User Experience
- Configuration
- Customization
- Compliance with Project Constraints
- Deployment

---

### 6. Next Steps (MANDATORY HANDOFF)

- Immediate next action
- Files to inspect
- Tests to run
- Risks to watch for

---

## Non-Negotiable Rules

- Never delete history
- Always append (no overwrite)
- Preserve all past mistakes
- Mark bugs as fixed instead of removing them
- Read the log before starting work
- Update the log before reporting completion
- If missing → create it before coding

---

## Simplified Backup Rule (Userscript-Appropriate)

### When to Create a Backup

Trigger on:

- Major refactor
- Large UI/DOM rewrite
- Structural changes (>10 meaningful edits)

---

### Backup Method

Instead of a full archive system:

```bash
cp script.user.js OldVersions/script_v1.2_pre-refactor.user.js
````

---

### Naming Format

```
script_vMAJOR.MINOR_<short-description>.user.js
```

**Example:**

```
script_v1.3_input-bar-rewrite.user.js
```

---

### Optional (Recommended if Using Git)

Use Git instead of manual backups:

```bash
git tag v1.3-pre-refactor
```



