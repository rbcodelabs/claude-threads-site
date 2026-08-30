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

Open **Settings → Scheduled** for a dashboard of scheduled work. **Next up** sorts enabled jobs by their persisted next run time, so the order survives plugin reloads and Obsidian restarts. Each entry shows the exact local time and a relative countdown. An overdue item is labeled as catching up instead of appearing to be a future run.

For an ordinary job, the dashboard labels the upcoming time **Next run**. For a job with a gate, it uses **Next check**, because the gate may decide that no thread needs to run.

The dashboard separates recurring standalone jobs from thread-specific loops and one-shot wakeups. The plugin's internal orchestrator heartbeat is omitted from the primary list so it does not distract from work you created.

Each item shows its active hours, project, working directory, and gate. From the dashboard you can pause or resume a job, delete it, and use **Open last run** when the job has a previous thread. You can expand its recent run history to review runs, skipped checks, and errors.

Use **Create with Claude** to open a thread with a scheduling prompt, then describe the work and cadence in natural language. This release does not include a manual schedule form, direct editing in Settings, or a **Run now** control. To change an existing job, ask Claude to update it with the Cron tools described below.

See [Settings Reference → Scheduled](/docs/reference/settings/#scheduled) for a compact reference to the dashboard.

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

### Archive quiet runs automatically

Each scheduled run normally remains as a thread, which is useful when it found something meaningful to report. For checks that often find nothing, include an instruction in the scheduled prompt such as: *"If there is nothing to report, call `threads_archive` with your own thread ID."* Scheduled threads are allowed to archive themselves; interactive threads are not.

The self-archive call returns success with `deferred: true` rather than removing the live thread immediately. Claude Threads waits until the run has fully settled, then saves and archives it. Runs with useful findings remain available for review, while no-report runs can clean themselves up without losing their final tool result or transcript.

`CronList` also surfaces any pending [`ScheduleWakeup`](/docs/reference/agent-tools/#session-tools) timers as `"Wakeup: <reason>"` entries. A wakeup is implemented as the same kind of durable, disk-persisted scheduled item as a Cron task — it survives an Obsidian restart, plugin reload, or the machine sleeping, and self-deletes once it fires (rather than repeating like a recurring Cron task).
