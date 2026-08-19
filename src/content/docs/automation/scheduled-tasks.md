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

### Archive quiet runs automatically

Each scheduled run normally remains as a thread, which is useful when it found something meaningful to report. For checks that often find nothing, include an instruction in the scheduled prompt such as: *"If there is nothing to report, call `threads_archive` with your own thread ID."* Scheduled threads are allowed to archive themselves; interactive threads are not.

The self-archive call returns success with `deferred: true` rather than removing the live thread immediately. Claude Threads waits until the run has fully settled, then saves and archives it. Runs with useful findings remain available for review, while no-report runs can clean themselves up without losing their final tool result or transcript.

`CronList` also surfaces any pending [`ScheduleWakeup`](/docs/reference/agent-tools/#session-tools) timers as `"Wakeup: <reason>"` entries. A wakeup is implemented as the same kind of durable, disk-persisted scheduled item as a Cron task — it survives an Obsidian restart, plugin reload, or the machine sleeping, and self-deletes once it fires (rather than repeating like a recurring Cron task).
