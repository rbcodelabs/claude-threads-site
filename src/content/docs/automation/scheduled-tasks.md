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

## Active-hours windows

A scheduled task can be restricted to a local time-of-day window, so it only fires during — say — business hours. Ask Claude to scope it (*"…but only between 7am and 10pm"*), or set it directly through the Cron tools with `activeHoursStart` / `activeHoursEnd` (24-hour `HH:MM`).

When a cycle comes due **outside** the window, the scheduler skips it entirely — no thread is opened, no prompt is sent — and jumps straight to the next window-open time. An every-6-hour job scoped to `07:00`–`22:00` therefore never wastes an overnight run; it simply resumes at 07:00. Overnight windows work too: set the start after the end (e.g. `22:00`–`06:00`) and the window wraps past midnight.

The **Settings → Features → Scheduled tasks** list shows the window inline in each task's schedule description, e.g. *"Every 6 hour(s) (07:00-22:00 only)"*.

This replaces the older pattern of baking a business-hours check into the prompt itself (e.g. *"if the current hour is before 7 or after 22, stop immediately"*), which burned a whole thread and turn every time the task fired outside hours just to check the clock and bail. With an active-hours window the out-of-hours run never happens at all.

- **`CronCreate`** accepts `activeHoursStart` and `activeHoursEnd` — provide both together, or neither.
- **`CronUpdate`** accepts `activeHoursStart` / `activeHoursEnd` to set or change the window (a partial change is merged with the existing one), and `clearActiveHours: true` to remove the restriction entirely.

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
