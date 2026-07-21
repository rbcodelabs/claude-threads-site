---
title: Commands Reference
description: All 22 command palette entries, the 3 ribbon icons, and keyboard shortcuts.
category: reference
order: 2
---

## Ribbon icons

Three icons appear on the left edge of the Obsidian window (desktop):

| Icon | Opens |
|---|---|
| Message square | Chat (the main Claude Threads view) |
| Layout dashboard | Agent Dashboard |
| Puzzle piece | Skills Manager |

On mobile, a single **smartphone** ribbon icon opens the mobile view instead.

## Command palette

Every command below is reachable via `Cmd+P` and searchable by name.

| Command ID | Name | What it does |
|---|---|---|
| `open-claude-threads` | Open Claude Threads | Opens the Chat view |
| `open-agent-dashboard` | Open Agent Dashboard | Opens the [Agent Dashboard](/docs/views/agent-dashboard/) |
| `open-kanban-board` | Open Kanban Board | Opens the [Kanban board](/docs/views/kanban-board/) |
| `open-skills-manager` | Open Skills Manager | Opens the [Skills Manager](/docs/automation/skills-manager/) |
| `new-claude-thread` | New Claude Thread | Opens the Agent Dashboard and focuses its dispatch input, ready to type a new task |
| `next-claude-thread` | Next Claude Thread | Switches to the next tab in Chat |
| `prev-claude-thread` | Previous Claude Thread | Switches to the previous tab in Chat |
| `claude-thread-1` … `claude-thread-9` | Switch to Claude Thread 1–9 | Jumps directly to the Nth tab (9 separate commands, one per index) |
| `jump-to-latest-unreviewed` | Jump to latest unreviewed completed agent | Opens the Agent Dashboard (if needed) and jumps to the most recently completed thread you haven't reviewed yet |
| `fork-claude-thread` | Fork current Claude thread | [Forks](/docs/getting-started/first-thread/#forking-a-thread) the active thread into a new, independent thread |
| `interrupt-active-thread` | Interrupt active thread | Stops the active thread's in-flight response |
| `summarize-active-thread` | Summarize active thread | Manually regenerates the summary and tab name for the active thread (requires summarization to be enabled in Settings) |
| `open-thread-orchestrator` | Open Thread Orchestrator | Opens (or creates) the [thread-orchestrator](/docs/views/thread-orchestrator/) supervisory thread |
| `reload-plugin-safely` | Reload plugin (safe) | Reloads the plugin; if threads are running, prompts with Cancel / Interrupt & Reload / Force Reload — see [Safe plugin reload](/docs/help/faq/#safe-plugin-reload) |

That's 4 view-opening commands + 1 dispatch shortcut + 2 tab-navigation commands + 9 thread-index commands + 6 thread-management commands = 22 total.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+1` – `Cmd+9` | Switch to Claude Thread 1–9 |
| `Cmd+]` | Next Claude Thread |
| `Cmd+[` | Previous Claude Thread |
| `Enter` | Send message |
| `Shift+Enter` | Newline in the compose box |
| `Escape` | Cancel the running session (message is restored to the input box for editing) |
| `/` | Open slash command autocomplete |
| `@` | Open @ file mention search |

None of the numbered commands, the reload command, or the dashboard/skills-manager commands ship with a default hotkey beyond what's listed above — assign your own under **Settings → Hotkeys** if you want faster access to any of them.
