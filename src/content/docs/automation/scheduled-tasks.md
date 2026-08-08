---
title: Scheduled Tasks
description: The built-in scheduler for recurring tasks, and the Cron MCP tools agents use to self-schedule.
category: automation
order: 1
---

Claude Threads has a built-in scheduler for tasks that should run on a recurring basis — independent of any single thread's lifecycle, and surviving Obsidian restarts.

## Creating a scheduled task

Scheduled tasks are created through natural language: ask Claude to set one up, e.g. *"set up a daily task at 9am to check my open PRs and summarize anything that needs attention."* Claude creates the scheduled item, and it opens a new thread on its own schedule going forward.

This is distinct from [`/loop`](/docs/core-workflow/models-goals-loops/#loops), which re-runs a prompt on an interval within the *current* thread and stops when you say so. Scheduled tasks are standalone: each run opens a fresh thread and doesn't depend on the thread that created it still existing.

## Managing scheduled tasks

Existing scheduled tasks are listed under **Settings → Features → Scheduled tasks**, each showing its schedule description, last run time, and next run time (when enabled). You can toggle a task on/off or delete it from the same list — see [Settings Reference → Features](/docs/reference/settings/#features).

## Gate commands

A scheduled task can carry a deterministic **gate** — a shell command that runs *before* each cycle spawns a thread, so cycles with nothing to do are skipped without burning an agent turn. Ask Claude to add one (*"…but only run it if `~/inbox/pending.txt` is non-empty"*), or set it directly through the Cron tools with `gateCommand` (plus the optional `gateTimeoutSeconds`, default 30 and capped at 120, and `gateFailOpen`, default `true`).

The contract mirrors a shell test like `test -s file` or `grep -q`: **exit `0` fires the agent; any clean non-zero exit skips the cycle entirely** — no thread, no prompt, no LLM call — while the schedule still advances normally to the next run.

On a fire, the gate's stdout is fed into the prompt: it replaces a `{{gateOutput}}` placeholder if the prompt has one, otherwise it's appended as a `Gate output:` block (truncated to ~8 KB) — so the agent doesn't have to re-derive what the check already found. The gate runs in the task's working directory with an environment that includes `CRON_LAST_RUN_MS` (epoch ms of the previous run, a natural "since last check" cursor), `CRON_ITEM_ID`, and `CRON_ITEM_NAME`.

If the gate can't be *evaluated* — it times out or fails to spawn (e.g. command not found) — the task **fails open and fires anyway** by default, so a broken check never silently blackholes a real cron job. Set `gateFailOpen: false` to fail closed and skip instead. A clean non-zero exit is always treated as a deliberate skip, regardless of the fail-open setting.

Gates run on desktop only — they're inert on mobile, where a configured gate simply fires every time. The **Settings → Features → Scheduled tasks** list flags gated tasks inline, e.g. *"Every 5 minute(s) · gated"*.

- **`CronCreate`** accepts `gateCommand`, `gateTimeoutSeconds`, and `gateFailOpen`.
- **`CronUpdate`** accepts the same three to set or change the gate, and `clearGate: true` to remove it entirely.

Example: `gateCommand: "test -s ~/inbox/pending.txt"` paired with a prompt of `Process the pending items:\n{{gateOutput}}` fires only when that file is non-empty. Because a gate is an arbitrary command run unattended, it carries the same trust profile as the existing `statusLineCommand` setting: it's authored by the same user who controls the vault.

## Cron MCP tools

Under the hood, the scheduler is exposed to any thread as a set of MCP tools, so an agent can create, inspect, and manage scheduled tasks on its own without you going through Settings:

| Tool | What it does |
|---|---|
| `CronCreate` | Creates a new scheduled item |
| `CronList` | Lists existing scheduled items |
| `CronUpdate` | Updates an existing scheduled item (e.g. change its schedule or prompt) |
| `CronDelete` | Deletes a scheduled item |

These `Cron*` tools are **hidden by default** in the Hidden built-in tools setting (see [Settings Reference → Tools](/docs/reference/settings/#tools)) — the plugin's own scheduler is the intended path for scheduling from inside a session, and hiding the raw Cron tools by default avoids confusion with Claude Code's own unrelated built-in scheduling primitives. Remove them from that list if you want an agent to call them directly.

Threads created by the scheduler run with the `dontAsk` permission mode automatically, so a cron job never stalls waiting on a permission dialog nobody is watching — see [Permission modes and Plan Mode](/docs/permissions/permission-modes-and-plan-mode/) for what that mode means.
