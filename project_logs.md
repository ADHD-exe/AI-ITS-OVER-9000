## Mandatory Project Logging Rule

You must keep a persistent project log throughout the entire task.

Create or update a file named:
PROJECT_LOGS.md

This file is mandatory and must be updated after every meaningful change, fix, investigation, failure, bug discovery, upgrade, refactor, or design decision.

Do not rely on memory or chat history. The log is the source of truth for project continuity.

### Required Log Sections

PROJECT_LOG.md must include:

1. Current Project State
- What currently works
- What is partially implemented
- What is broken or unverified
- What files were changed most recently

2. Completed Changes
For every completed change, record:
- Date/time if available
- File path
- Function/module affected
- What changed
- Why it changed
- How it was verified

3. Known Issues / Bugs
For every issue, record:
- Symptom
- Suspected cause
- Affected file/function
- Reproduction steps if known
- Current status: open, investigating, fixed, deferred

4. Failed Attempts
For every failed approach, record:
- What was attempted
- Why it failed
- What error or behavior occurred
- What should not be repeated

5. Upgrade Ideas / Deferred Work
Record anything useful that should be done later but is not part of the current step.

6. Next Steps
At the end of every work session, write a clear handoff checklist:
- Immediate next action
- Files to inspect next
- Tests to run next
- Risks to watch for

### Non-Negotiable Rules

- Never delete prior log history unless explicitly instructed.
- Append new entries instead of replacing old ones.
- If a bug is fixed, move or mark it as fixed, but keep the original record.
- If a previous mistake is discovered, document it clearly so it is not repeated.
- Before starting new work, read PROJECT_LOG.md first.
- Before reporting completion, update PROJECT_LOG.md.
- If PROJECT_LOG.md does not exist, create it before making code changes.

The goal is to make the repo resumable by any future agent without repeating old mistakes, losing context, or re-debugging already-known issues.
