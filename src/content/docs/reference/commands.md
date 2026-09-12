---
title: Commands Reference
description: All 24 command palette entries, the 3 ribbon icons, and keyboard shortcuts.
category: reference
order: 2
---

## Ribbon icons

Three icons appear on the left edge of the Obsidian window (desktop):

| Icon | Opens |
|---|---|
| Message square | Chat (the main Claude Threads view) |
| List | Agents List |
| Puzzle piece | Skills Manager |

On mobile, a single **smartphone** ribbon icon opens the mobile view instead.

## Command palette

Every command below is reachable via `Cmd+P` and searchable by name.

| Command ID | Name | What it does |
|---|---|---|
| `open-claude-threads` | Open Claude Threads | Opens the Chat view |
| `open-agent-dashboard` | Open Agents List | Opens the [Agents List](/docs/views/agent-dashboard/) |
| `open-kanban-board` | Open Agent Board | Opens the [Agent Board](/docs/views/kanban-board/) |
| `open-skills-manager` | Open Skills Manager | Opens the [Skills Manager](/docs/automation/skills-manager/) |
| `new-claude-thread` | New Claude Thread | Opens the Agents List and focuses its dispatch input, ready to type a new task |
| `chat-about-active-document` | Chat about this document | Opens the Agents List and seeds its dispatch input with an `@[[note]]` mention of the active Markdown note, ready for your question — see [Chat about this document](/docs/core-workflow/messaging-and-commands/#chat-about-this-document). Only listed when the active file is a Markdown note; the same action is on the file-explorer and editor right-click menus |
| `next-claude-thread` | Next Claude Thread | Switches to the next tab in Chat |
| `prev-claude-thread` | Previous Claude Thread | Switches to the previous tab in Chat |
| `claude-thread-1` … `claude-thread-9` | Switch to Claude Thread 1–9 | Jumps directly to the Nth tab (9 separate commands, one per index) |
| `jump-to-latest-unreviewed` | Jump to latest unreviewed completed agent | Opens the Agents List (if needed) and jumps to the most recently completed thread you haven't reviewed yet |
| `fork-claude-thread` | Fork current Claude thread | [Forks](/docs/getting-started/first-thread/#forking-a-thread) the active thread into a new, independent thread |
| `interrupt-active-thread` | Interrupt active thread | Stops the active thread's in-flight response |
| `summarize-active-thread` | Summarize active thread | Manually regenerates the summary and tab name for the active thread (requires summarization to be enabled in Settings) |
| `open-thread-orchestrator` | Open Portfolio Orchestrator | Opens (or creates) the portfolio-level [thread orchestrator](/docs/views/thread-orchestrator/) |
| `reload-plugin-safely` | Reload plugin (safe) | Reloads the plugin; if threads are running, prompts with Cancel / Interrupt & Reload / Force Reload — see [Safe plugin reload](/docs/help/faq/#safe-plugin-reload) |
| `generate-diagnostics-report` | Generate diagnostics report | Assembles a redacted, **local-only** diagnostics bundle (performance counters, renderer CPU/memory samples, longtask summary, recent log tail), copies the Markdown to your clipboard, and saves `.md` + `.json` files into a `claude-threads-diagnostics/` folder in the vault root. No message/file contents, absolute home paths, or env values are included. Desktop only — on mobile it shows a "desktop only" notice. Requires the [Diagnostics setting](/docs/reference/settings/) to be enabled for the counters/samples to be populated. |

That's 4 view-opening commands + 2 dispatch shortcuts + 2 tab-navigation commands + 9 thread-index commands + 7 thread-management/diagnostics commands = 24 total.

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

None of the numbered commands, the reload command, or the Agents List/skills-manager commands ship with a default hotkey beyond what's listed above — assign your own under **Settings → Hotkeys** if you want faster access to any of them.
