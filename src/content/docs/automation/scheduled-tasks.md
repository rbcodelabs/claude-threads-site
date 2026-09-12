---
title: Scheduled Tasks
description: The built-in scheduler for recurring tasks, and the Cron MCP tools agents use to self-schedule.
category: automation
order: 1
---

Agent Threads has a built-in scheduler for tasks that should run on a recurring basis — independent of any single thread's lifecycle, and surviving Obsidian restarts.

## Creating a scheduled task

Scheduled tasks are created through natural language: ask Claude to set one up, e.g. *"set up a daily task at 9am to check my open PRs and summarize anything that needs attention."* Claude creates the scheduled item, and it opens a new thread on its own schedule going forward.

This is distinct from [`/loop`](/docs/core-workflow/models-goals-loops/#loops), which re-runs a prompt on an interval within the *current* thread and stops when you say so. Scheduled tasks are standalone: each run opens a fresh thread and doesn't depend on the thread that created it still existing.

## Managing scheduled tasks

Open **Settings → Scheduled** for a dashboard of scheduled work. Each non-system schedule appears once in its group: recurring standalone jobs, thread-specific loops, or one-shot wakeups. The plugin's internal orchestrator heartbeat is omitted so it does not distract from work you created.

Schedules use compact disclosure rows that are collapsed by default. At a glance, each row shows its status, cadence, next occurrence, Project, and how it will actually execute — for example, whether it will open a new thread with the current defaults or resume an existing thread with that thread's settings. Enabled schedules are sorted by next occurrence, while paused schedules appear last. Upcoming work includes the exact local time and a relative countdown; an overdue item is labeled as catching up instead of appearing to be a future run.

For an ordinary job, the dashboard labels the upcoming time **Next run**. For a job with a gate, it uses **Next check**, because the gate may decide that no thread needs to run.

Expand a row to inspect its prompt, working directory, active-hours window and gate when applicable, execution details, and recent run history, including runs, skipped checks, and errors. The native disclosure works with standard keyboard controls. From the expanded row you can pause or resume the schedule, use **Open last run** when a previous thread is available, or delete the schedule.

Use **Create with Claude** to open a thread with a scheduling prompt, then describe the work and cadence in natural language. This release does not include a manual schedule form, direct editing in Settings, or a **Run now** control. To change an existing job, ask Claude to update it with the Cron tools described below.

See [Settings Reference → Scheduled](/docs/reference/settings/#scheduled) for a compact reference to the dashboard.

## Working directories and Projects

For a standalone job that opens a new thread, Agent Threads resolves the working directory at fire time in this order:

1. The scheduled item's explicit cwd
2. The current effective cwd of its [Project](/docs/integrations/git-and-vault/#projects)
3. The global default working directory

A gate command and the thread it spawns use the same resolved cwd. A Project-derived job therefore follows later Project cwd edits, while a job with an explicit cwd stays pinned to that path.

New-thread jobs never dispatch with a stale or deleted Project association: creation and updates reject unknown Project IDs, and a saved job whose Project was later deleted records an error instead of falling back — even when that job also stores an explicit cwd.

Existing-thread `/loop` schedules and `ScheduleWakeup` timers behave differently. They resume the existing thread in its existing cwd rather than opening a new Project-derived thread, so they can continue after their Project is deleted. If such an item has a gate that still needs to resolve the deleted Project's cwd, that gate records an error instead.

## Active-hours windows

A scheduled task can be restricted to a local time-of-day window, so it only fires during — say — business hours. Ask Claude to scope it (*"…but only between 7am and 10pm"*), or set it directly through the Cron tools with `activeHoursStart` / `activeHoursEnd` (24-hour `HH:MM`).

When a cycle comes due **outside** the window, the scheduler skips it entirely — no thread is opened, no prompt is sent — and jumps straight to the next window-open time. An every-6-hour job scoped to `07:00`–`22:00` therefore never wastes an overnight run; it simply resumes at 07:00. Overnight windows work too: set the start after the end (e.g. `22:00`–`06:00`) and the window wraps past midnight.

The **Settings → Scheduled** dashboard shows the window in the expanded schedule details.

This replaces the older pattern of baking a business-hours check into the prompt itself (e.g. *"if the current hour is before 7 or after 22, stop immediately"*), which burned a whole thread and turn every time the task fired outside hours just to check the clock and bail. With an active-hours window the out-of-hours run never happens at all.

- **`CronCreate`** accepts `activeHoursStart` and `activeHoursEnd` — provide both together, or neither.
- **`CronUpdate`** accepts `activeHoursStart` / `activeHoursEnd` to set or change the window (a partial change is merged with the existing one), and `clearActiveHours: true` to remove the restriction entirely.

## Gate commands

A scheduled task can carry a deterministic **gate** — a shell command that runs *before* each cycle spawns a thread, so cycles with nothing to do are skipped without burning an agent turn. Ask Claude to add one (*"…but only run it if `~/inbox/pending.txt` is non-empty"*), or set it directly through the Cron tools with `gateCommand` (plus the optional `gateTimeoutSeconds`, default 30 and capped at 120, and `gateFailOpen`, default `true`).

**Exit `0` fires the agent; exit `1` deliberately skips an empty queue; reserved exit `75` reports that the gate could not determine whether work exists and honors `gateFailOpen`.** Other clean non-zero exits retain the existing deliberate-skip behavior. A skipped cycle creates no thread, prompt, or LLM call, while the schedule still advances normally.

On a fire, the gate's stdout is fed into the prompt: it replaces a `{{gateOutput}}` placeholder if the prompt has one, otherwise it's appended as a `Gate output:` block (truncated to ~8 KB) — so the agent doesn't have to re-derive what the check already found. The gate runs in the task's working directory with an ephemeral environment containing configured keychain-backed secrets, `CRON_LAST_RUN_MS` (epoch ms of the previous run, a natural "since last check" cursor), `CRON_ITEM_ID`, and `CRON_ITEM_NAME`. Secret names and values are never written into schedule data.

If the gate can't be evaluated — exit `75`, timeout, or spawn failure such as command not found — the task **fails open and fires anyway** by default, so a broken check never silently blackholes a real cron job. Set `gateFailOpen: false` to fail closed and skip instead. Failed-evaluation diagnostics are stripped of unsafe control sequences, redacted against configured keychain secret names and values, bounded to 4 KiB, and retained in run history for troubleshooting.

Gates run on desktop only — they're inert on mobile, where a configured gate simply fires every time. The **Settings → Scheduled** dashboard identifies gated tasks in their schedule and expanded details.

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

### Archive quiet runs automatically

Each scheduled run normally remains as a thread, which is useful when it found something meaningful to report. For checks that often find nothing, include an instruction in the scheduled prompt such as: *"If there is nothing to report, call `threads_archive` with your own thread ID."* Scheduled threads are allowed to archive themselves; interactive threads are not.

The self-archive call returns success with `deferred: true` rather than removing the live thread immediately. Agent Threads waits until the run has fully settled, then saves and archives it. Runs with useful findings remain available for review, while no-report runs can clean themselves up without losing their final tool result or transcript.

### Clear accumulated runs by hand

For runs that have already piled up, you don't have to open each one. On desktop, right-click the job's rollup row in the [Agents List](/docs/views/agent-dashboard/#archive-from-the-list-right-click) — or a stack card's header row on the [Agent Board](/docs/views/kanban-board/#archive-from-a-card-right-click) — and choose **Archive these N runs**. When that job also has runs sitting in other status groups or Projects, an **Archive all M runs of this job** item appears alongside it. Bulk archiving always asks for confirmation first, and cancels any pending `ScheduleWakeup` on the runs it archives.

`CronList` also surfaces any pending [`ScheduleWakeup`](/docs/reference/agent-tools/#session-tools) timers as `"Wakeup: <reason>"` entries. A wakeup is implemented as the same kind of durable, disk-persisted scheduled item as a Cron task — it survives an Obsidian restart, plugin reload, or the machine sleeping, and self-deletes once it fires (rather than repeating like a recurring Cron task).
