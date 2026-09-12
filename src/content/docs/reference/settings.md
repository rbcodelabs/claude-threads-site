---
title: Settings Reference
description: Every setting in the plugin, organized by its actual tab — General, Agent, Tools, Vault, Features, Scheduled, Remote, Skills, and MCP.
category: reference
order: 1
---

Settings are organized into nine tabs. On desktop, all nine are shown; on mobile, a reduced settings screen shows only pairing, plugin reload, and relay URL — see [Mobile settings](#mobile-settings) at the bottom of this page.

## General

| Setting | Description |
|---|---|
| Conversation placement | `Conversation first` (default on new installs), or `Classic sidebar` for the original layout. On desktop, Conversation first keeps one Chat view in the main area and reuses an adjacent native companion for contextual content without detaching unrelated leaves; the Agents List and Skills Manager open in the right sidebar to match. Existing installs keep whichever placement they were already using. Mobile is unchanged. |
| Layout density | `Compact`, `Comfortable` (default), or `Spacious` — controls message spacing and padding in the conversation view |
| Context footer command | Shell command that produces the [status-line pills](/docs/reference/status-line/) (JSON tags or plaintext). Runs per-thread, in the background, against that thread's working directory. Desktop only. |
| Keep computer awake | Prevent the Mac from sleeping while Claude is responding; shows a ☕ indicator in the status bar |
| Debug logging | Verbose console logs for stream events, session lifecycle, and relay connections. Turn on only when diagnosing issues. |
| Diagnostics | Enable the always-on, **local-only** telemetry layer (performance counters plus renderer CPU/memory samples) that powers the [Generate diagnostics report](/docs/reference/commands/) command. Nothing ever leaves your machine — no network calls. On by default; turning it off stops the sampler and freezes the counters. A **Copy diagnostics** button next to the toggle runs the report command directly. Desktop only. |

With **Conversation first**, Geode hosts that support durable companions reuse the same companion split after reloads, workspace restoration, and placement changes. Closing only its destination tab preserves sibling tabs and allows the next contextual item to open in that split. Older Geode versions and Obsidian keep their existing reload behavior. See [Conversation-first workspace](/docs/getting-started/introduction/#conversation-first-workspace) for closure and one-time cleanup details.

## Agent

| Setting | Description |
|---|---|
| Agent harness | Initial Claude or Codex default for new [Agents List and Agent Board kickoff selectors](/docs/views/agent-dashboard/#dispatch-box). A selection made in either mounted view stays local to that view and does not rewrite this setting. Existing threads retain their original harness. |
| Claude binary path | Path to the `claude` executable. Leave empty to find it on `$PATH` — the plugin auto-detects `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`, or `~/.local/bin/claude`. |
| Codex binary path | Path to the `codex` executable. Leave empty to find it on `$PATH`; set this when Codex is installed somewhere else. |
| Account / provider | `Claude account` (default, uses the CLI's own login) or `Amazon Bedrock` (sets `CLAUDE_CODE_USE_BEDROCK=1` — also add `AWS_PROFILE` and `AWS_REGION` under Extra environment variables) |
| Default model | Model for new turns unless a thread overrides it with [`/model`](/docs/core-workflow/models-goals-loops/). "CLI default" defers to the Claude Code CLI configuration. Family aliases always track the latest version; pinned IDs lock to a specific release. Start a thread to populate the full model list from the CLI. |
| Thinking mode | `Disabled` (default), `Adaptive` (Claude decides when to use extended thinking), or `Enabled` (fixed token budget) |
| Thinking token budget | Maximum tokens for thinking when mode is `Enabled` (default: 8,000) |
| Effort level | `Default` (CLI default), `Low`, `Medium`, `High`, `Extra high` (Opus 4.7+), or `Max` (Opus 4.6+, Sonnet 4.6) — how much reasoning effort Claude applies per turn |
| Codex reasoning effort | `Default`, `Low`, `Medium`, `High`, `XHigh`, or `Ultra` — how much reasoning effort Codex applies per turn. `Ultra` enables Codex's supported proactive multi-agent mode for work that divides cleanly; it can increase latency and compute use, and does not guarantee that Codex will fan work out to child agents. |
| Agent progress summaries | When enabled, running sub-agents emit an AI-generated progress summary roughly every 30 seconds |
| Enable 1M context window (beta) | Passes the `context-1m-2025-08-07` beta header for Sonnet 4/4.5. Requires a model that supports it. |
| Default working directory | Starting directory for new threads. Leave empty to use the vault root. |

### Environment

| Setting | Description |
|---|---|
| Extra environment variables | `KEY=VALUE` pairs, one per line, merged into the Claude process environment (e.g. `AWS_PROFILE`, `AWS_REGION`) |
| Secret environment variables | Keychain-backed env vars — add, change, or remove a named secret; values are stored in the OS keychain and never appear in `data.json` |

> **macOS users:** the first time Claude accesses a folder like `~/Documents`, macOS shows a privacy dialog. Click Allow — it only appears once per folder.

### Model escalation

| Setting | Description |
|---|---|
| Enable model escalation | When the keyword appears in a message, route that single turn to the escalation model. The keyword is stripped before sending. |
| Escalation keyword | Word or phrase that triggers escalation (default: `/escalate`). Only shown when escalation is enabled. |
| Escalation model | Model the escalation keyword routes that turn to (default: Opus). Only shown when escalation is enabled. |

See [Model escalation](/docs/core-workflow/models-goals-loops/#model-escalation) for the in-conversation behavior these settings control.

## Tools

| Setting | Description |
|---|---|
| Permission mode | How the active Claude or Codex harness handles tool-use permission prompts — see the full [permission mode table](/docs/permissions/permission-modes-and-plan-mode/#permissions) |
| Web Viewer tool | Lets Claude open URLs directly in the host Web Viewer panel (`host_open_url`). In Obsidian, this requires the Web Viewer core plugin to be enabled under Settings → Core plugins. |
| Inline visualizations | Renders a wrapped `visualize{…}` content reference from Codex as a live sandboxed chart inside the message, with a pop-out to full size — see [Inline visualizations](/docs/core-workflow/messaging-and-commands/#inline-visualizations). Desktop only. On by default. |
| Hidden built-in tools | Comma-separated Claude Code built-in tools to hide from sessions. `Cron*` tools are hidden by default — the plugin has its own [scheduler](/docs/automation/scheduled-tasks/). |

### Always-allowed tools

A list of tools granted automatically without prompting. Tools land here when you choose "Always Allow" in a [permission prompt](/docs/permissions/permission-modes-and-plan-mode/#permissions), or you can add one by name directly (e.g. `Bash`, `Read`, `mcp__claude_threads__…`). Each entry can be removed individually. Existing `mcp__obsidian__…` entries continue to work as deprecated compatibility aliases until the next major release.

## Vault

| Setting | Description |
|---|---|
| Save threads to vault | Auto-save conversations as Obsidian notes after each response |
| Save raw JSONL logs | Append each thread's raw event stream (tool calls, results, usage) to `<vault folder>/logs/<thread id>.jsonl`, linked from the note's `raw_log` frontmatter. Lets agents retrieve and analyze the full transcript. |
| Auto-archive idle threads after (days) | Automatically archive a waiting thread once it has been idle (no activity) for this many days. Archiving writes the thread to its markdown note, with any images embedded, and removes it from the live thread list, so finished threads stop accumulating and `data.json` does not grow without bound. Only waiting threads qualify; active threads, the orchestrator thread, and threads awaiting a plan or question are never touched. Default: `14`. Set to `0` to disable auto-archiving entirely. |
| Vault folder | Where thread notes are saved, relative to the vault root (default: `Claude`) |

### Projects

Add a new Project with a name and vault folder. Its working directory defaults to `<vault root>/<vault folder>`; set a filesystem cwd override for work outside the vault. Each Project shows its resolved effective cwd, and clearing the override returns it to the vault-derived path.

Edit existing [Projects](/docs/integrations/git-and-vault/#projects) inline — rename, create/open its orchestrator, delete with an impact preview, change the cwd override, or edit the context prompt. Intentionally archiving a Project Orchestrator disables its heartbeat, completion wakeups, and automatic recreation; the disabled state survives reloads from synced `data.json`. Deliberately choosing **Create/Open** re-enables it. Deletion detaches threads and preserves scheduled work at the former effective cwd.

> Projects focus initial context; they do not restrict vault tools, MCP servers, skills, secrets, filesystem permissions, or thread-coordination tools.

## Features

### Summarization

| Setting | Description |
|---|---|
| Enable summarization | Show a Summarize button in each thread and enable the "Summarize active thread" command |
| Auto-summarize after response | Regenerate the summary + tab name after each assistant turn. Only shown when summarization is enabled. |
| Summarization model | Model alias passed to `claude --model` for summarization (e.g. `haiku` is fast and cheap, `sonnet` is higher quality). Only shown when summarization is enabled. |

### Speech to text

| Setting | Description |
|---|---|
| OpenAI API key | Used for Whisper speech-to-text. Stored in your OS keychain — set a new key, change an existing one, or link a key already stored by another plugin. |
| Push-to-talk hotkey | Hold this key while focused in any input to record. Default: `Alt+Space` (`Option+Space` on Mac). Click to capture a new key combination, or reset to the default. |

See [Push-to-talk voice input](/docs/integrations/remote-and-voice/#push-to-talk-voice-input) for the recording behavior these settings control.

<a id="kanban-board"></a>

### Agent Board

| Setting | Description |
|---|---|
| Auto-collapse side panel | `None` (default), `Left sidebar`, `Right sidebar`, or `Both sidebars` — collapses the chosen sidebar(s) when the [Agent Board](/docs/views/kanban-board/#auto-collapse-side-panels) opens, restoring them when it closes |
| Stack scheduled job threads | On by default — collapses repeat runs of the same scheduled/cron job into an expandable rollup in the [Agent Board](/docs/views/kanban-board/#stacked-scheduled-job-threads)'s quiet columns and within each Project's New, Reviewed, or Ready groups in the [Agents List](/docs/views/agent-dashboard/#scheduled-jobs) |

### Portfolio Orchestrator

Shows the status of the [thread-orchestrator](/docs/views/thread-orchestrator/) thread: setup guidance if none has been created yet, an **Open** button once it resolves to a live thread, or a warning if the stored thread was deleted or archived outside the plugin.

## Scheduled

The Scheduled tab is a dashboard for managing and inspecting [scheduled work](/docs/automation/scheduled-tasks/):

| Section or control | Description |
|---|---|
| Schedule rows | Each non-system schedule appears once in its group. Rows are collapsed by default and summarize status, cadence, next occurrence, Project, and actual execution behavior. |
| Ordering | Enabled schedules are sorted by next occurrence. Paused schedules appear last. Past-due work is marked as overdue and catching up. |
| Next run / Next check | Ordinary jobs show **Next run**. Gated jobs show **Next check**, since a gate may skip that occurrence. |
| Scheduled work groups | Recurring standalone jobs are separated from thread-specific loops and one-shot wakeups. The internal orchestrator heartbeat is omitted from the primary list. |
| Expanded details | Shows the prompt, working directory, active hours and gate when applicable, execution details, and recent outcomes/history, including runs, skipped checks, and errors. The native disclosure is keyboard accessible. |
| Pause / Resume | Disables or enables future occurrences without deleting the job. |
| Open last run | Opens the most recent thread created by the job, when one is available. |
| Delete | Permanently removes the scheduled item. |
| Create with Claude | Opens a thread with a scheduling prompt so you can describe the work and cadence in natural language. |

Manual create/edit forms and a **Run now** control are not available in this release. Ask Claude to create or update a schedule instead.

## Remote

| Setting | Description |
|---|---|
| Enable remote access | Turn on/off mobile pairing via the WebSocket relay. Generates a room ID the first time it's enabled. |
| Room ID | Your device pairing identifier (masked). **Show pairing QR code** opens the pairing modal; **Rotate room ID** generates a new ID and disconnects all currently paired devices. |
| Connection status | Whether the mobile relay is currently connected |
| Relay URL | WebSocket relay server URL. Change only if self-hosting. |

See [Remote access (mobile)](/docs/integrations/remote-and-voice/#remote-access-mobile) for the full pairing flow.

## Skills

Register local skill collections — GitHub repos or local folders — to browse and install from within the [Skills Manager](/docs/automation/skills-manager/). Each source shows its type, path, and (for GitHub sources) an update badge when the clone is behind its remote, with **Update** and **Remove** actions per source, and an **Add Source** button to register a new one.

## MCP

Add, edit, and remove the external MCP servers (stdio, HTTP, or SSE) that get merged into newly initialized sessions on both the Claude and Codex harnesses — no hand-editing JSON required for the common case. Servers are stored in **this plugin's own `data.json`**, scoped to this vault — not in `~/.claude/settings.json` and not shared with the `claude` CLI. An interactive desktop agent can also propose a create-only registration with `mcp_register_server`, subject to a separate host confirmation. See [Managing MCP Servers](/docs/integrations/mcp-servers/) for the full walkthrough, including agent registration, the add/edit form, `${VAR_NAME}` placeholders, and what happens when a placeholder can't be resolved (the server is skipped, with a warning, rather than starting with a blank credential).

The MCP tab also has a **Google Workspace** section with opt-in **Google Docs**,
**Google Drive**, **Google Sheets**, and **Google Slides** toggles. It uses the
Google Docs Sync account connected in the same vault and exposes Google's hosted
tools to new threads on either harness. See [Google Workspace setup](/docs/integrations/mcp-servers/#google-workspace)
for connection, OAuth scopes, and preview-enrollment prerequisites.

## Mobile settings

Obsidian Mobile shows a reduced settings screen instead of the eight tabs above:

| Setting | Description |
|---|---|
| Pairing code | Paste the code shown on desktop to connect manually, as an alternative to scanning the QR code |
| Paired room | Shows the masked room ID once paired, with a **Disconnect** button |
| Reload plugin | Reload Claude Threads; if threads are currently running you're warned before the plugin restarts — see [Safe plugin reload](/docs/help/faq/#safe-plugin-reload) |
| Relay URL | WebSocket relay server. Change only if self-hosting. |
