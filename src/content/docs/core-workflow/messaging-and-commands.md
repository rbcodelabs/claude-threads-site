---
title: Messaging and Commands
description: Sending messages, the message queue, activity indicator, built-in slash commands, and @ file mentions.
category: core-workflow
order: 1
---

## Sending messages

- **Enter** — send message
- **Shift+Enter** — newline
- **`/`** — opens slash command autocomplete
- **Escape** — cancel the running session; the sent message is restored to the input box so you can edit and re-send

**Collapsible input panels.** All three message-input panels (Chat, Agent Dashboard sidebar, and Kanban dispatch) collapse to a minimal bar at rest — just the textarea and send button. Hover over the panel or click into the textarea to expand secondary controls (attach, mic, model picker, more menu, working-directory chip) with a smooth animation. The panel border softens when collapsed so it reads as a quiet background element rather than competing for attention.

## Message queue

If you send a message while Claude is already processing, it goes into a queue — displayed as stacked, removable rows above the composer. Each row shows a preview of the queued message and an `×` button to discard it. Click any row to pull it back into the input box for editing (an inline confirm prompt prevents you from accidentally discarding your current draft). The queue drains automatically as Claude finishes each turn. Queued messages survive thread switches and plugin reloads.

![Message queue — stacked removable rows above the composer showing queued messages](../../../assets/screenshots/screenshot-queue-rows.png)

## Activity indicator

While Claude is processing, a typed status card appears above the input area showing what's happening:

- **Active work** — a pulsing spinner with a short label (e.g. "Compacting context…" during automatic compaction, "Retrying API call…" on transient errors). The card disappears as soon as the operation completes.
- **Rate limit** — if the API returns a rate limit response *before* rejecting the turn outright, a card shows in warning or error style depending on whether the request was allowed to proceed anyway.
- **Model escalation tip** — when a turn is routed to the escalation model, a brief tooltip pops up from the model button rather than reshuffling the layout. See [Model escalation](/docs/core-workflow/models-goals-loops/#model-escalation) for the full behavior.

![Status rail — active-work card with a spinner above the composer](../../../assets/screenshots/screenshot-status-rail.png)

## Errors and auto-retry

Two failure modes are recovered automatically, shown as a transient amber "reconnecting" notice in the conversation rather than a hard error:

- **Transport hiccup** — the underlying `claude` CLI transport is spuriously force-closed mid-tool-call. The plugin auto-fires one follow-up turn so Claude can verify whether the interrupted action actually succeeded before treating it as a failure.
- **Rate-limited turn** — the API rejects a turn outright with a rate-limit or overload error before processing it at all. The plugin silently retries the *exact same* turn after a backoff delay (up to 5 attempts, growing from ~3s to ~90s) — no duplicate message is added to the conversation, since Claude never saw the original prompt.

If a rate-limited turn exhausts all of its retries, or any other error occurs, it surfaces as a normal error card — but instead of a wall of raw stack-trace text, you get a short one-line summary with a **Show technical details** disclosure you can expand for the full trace.

## Slash commands

Type `/` in the input box to see built-in context commands and your installed Claude Code skills. Navigate with arrow keys, Tab, or Enter.

### Built-in commands (handled by the plugin)

| Command | What it does |
|---|---|
| `/model fable\|opus\|sonnet\|haiku` | Set a persistent model for this thread |
| `/model default` | Reset thread model back to the global default |
| `/model` | Show the current model for this thread |
| `/goal <text>` | Set a persistent goal for this thread — injected into every turn until cleared |
| `/goal clear` | Clear the thread's goal (`/goal` alone shows the current goal) |
| `/loop <interval> <prompt>` | Send a prompt now and re-run it on an interval (e.g. `/loop 10m check CI`); replaces any loop already running on this thread |
| `/loop stop` | Stop the thread's loop (`/loop` alone shows it) |
| `/compact` | Summarize conversation history to free up context window |
| `/clear` | Clear conversation history and start a fresh session |
| `/cost` | Show token usage and cost for the current session |
| `/context` | Show a per-category token usage breakdown for the active session (tools, system prompt, skills, MCP tools, conversation, etc.) |
| `/create-pr` | Ask Claude to push the branch and open a PR (`gh pr create`) — same action as the [git diff bar](/docs/integrations/git-and-vault/#git-diff-bar)'s Create PR button |
| `/create-pr --draft` | Same, but opens a draft PR — same as the git diff bar's Create draft PR button |

`/model`, `/goal`, and `/loop` details are covered in full on [Models, Goals, and Loops](/docs/core-workflow/models-goals-loops/).

**Command pills** — when you complete a built-in command (type `/goal ` or pick one from the dropdown), it turns into a pill chip at the left of the input box. Type the arguments after it; a single Backspace at the start of the input (or clicking the pill's `×`) deletes the whole command. After a command, argument autocomplete kicks in — `/model ` offers `fable|opus|sonnet|haiku|default`.

**Skills** — any `.md` file (or directory) in `~/.claude/skills/` appears below the built-in commands in the same `/` dropdown. Selecting one inserts the skill name into your message, which Claude handles via your `CLAUDE.md` configuration. This is the same slash-command surface the [Skills Manager](/docs/automation/skills-manager/) installs into — anything you add there shows up here automatically, with no separate registration step.

## @ file mentions

Type `@` anywhere in the input box to search vault files by name. A dropdown appears showing up to 20 matching files — navigate with arrow keys and press Tab or Enter to insert.

![@ file mention autocomplete — type @ to search vault files and inject their content as context](../../../assets/screenshots/screenshot-file-mention.png)

Selecting a file inserts `@[[filename]]` into your message. When you send the message, the plugin resolves each mention and appends the file's full content as context for Claude — useful for asking Claude to work with a specific note, doc, or config file without copying and pasting.

Type `@this` (no search needed) to instantly reference the currently active file in Obsidian. It resolves to the same `@[[filename]]` injection at send time.

## Context compaction

When the context window fills up, Claude compacts the conversation automatically. You can also trigger it manually with `/compact`. Either way, a divider appears in the conversation showing when compaction happened and how many tokens were in context beforehand. Compaction markers are persisted and survive plugin reloads.

## Compressed conversation view

Long agentic threads — especially ones with many tool calls spread across dozens of turns — can be hard to scan. Toggle **Compress view** from the `⋯` menu (top-right of the conversation panel) to collapse the history into a scannable list of one-line summaries.

**How it works:**

- Each entry represents one *exchange*: a user message followed by all the consecutive assistant turns that came back before the next user message (i.e., a full agentic run).
- The summary for each entry is generated by running the combined content of all assistant turns through a lightweight background process — so you get one meaningful summary ("Investigated codebase, added 4 MCP tools, wrote tests") rather than N fragments.
- Summaries are generated lazily in a serial queue (one at a time) so toggling compress view on a 50-message thread won't spawn 50 simultaneous Claude processes.
- Click the **⌄** arrow on any entry to expand it and read the full response with all tool calls intact.
- Toggle the menu item again (now labelled **Expand view**) to return to the normal conversation view.

Summaries are cached in memory for the session. They regenerate on the next reload — which keeps storage simple while keeping the background work cheap (the in-process model is fast and inexpensive).

## Thread summaries

A summary bar above the messages shows what the thread is about. It updates automatically after each response if **Auto-summarize** is enabled, or you can trigger it manually with the brain icon. The summarizer updates the tab name — auto-summarize only does this when the name is still the default "Thread N"; manual summarize always applies the new title regardless of what the tab is currently named. (Tabs also rename themselves automatically after the first exchange — see [Dispatching your first task](/docs/getting-started/first-thread/).)

When you switch back to a thread you haven't viewed in over a minute, a **context recap banner** floats at the top of the conversation showing the thread summary and how long ago you were last active. It auto-dismisses after 10 seconds or when you send a message.

![Context recap banner — re-orients you to a thread after returning from a break](../../../assets/screenshots/screenshot-context-recap-banner.png)
