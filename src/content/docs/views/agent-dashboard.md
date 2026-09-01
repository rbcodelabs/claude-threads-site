---
title: Agents List
description: Dispatch tasks and scan every thread in a responsive, adaptive list.
category: views
order: 1
---

Open the **Agents List** from the ribbon or command palette to see all threads at a glance. Threads are grouped by Project and status. Each adaptive row uses two lines: status, title, and recency on the primary line; live activity, repository/path, and child-agent count on the secondary line. Lower-priority metadata truncates before the row can overflow a narrow sidebar.

## Dispatch box

A floating dispatch box sits at the bottom of the Agents List. Type a task and press Enter to spin up a new thread and start it working immediately — this is the fastest way to launch a task without first opening Chat. The dispatch box also accepts the `/model`, `/goal`, `/loop`, and `/design` prefixes described in [Dispatching with commands](/docs/core-workflow/models-goals-loops/#dispatching-with-commands), and supports attaching images or files via the paperclip button or drag-and-drop.

Use the accessible **Project** selector to choose the new thread's Project and initial working directory. **Unassigned** uses the global default cwd. Your Project choice remains selected while you add or change harness, model, goal, loop, attachment, or image options. See [Projects](/docs/integrations/git-and-vault/#projects) for cwd resolution and the distinction between context focus and access control.

Use `/design <brief>` here to create a new native design-artifact thread, open it in Chat, and launch Geode's ArtifactView preview. Bare `/design` shows a usage notice and creates no thread. Design dispatch does not accept image or text attachments; if any are present, Threads keeps the draft and asks you to remove them. See [Design artifacts in Geode](/docs/core-workflow/messaging-and-commands/#design-artifacts-in-geode) for the artifact workflow and in-Chat revision behavior.

The kickoff button displays the harness that will own the new thread: **Claude** or **Codex**. Press Enter or click the button to dispatch with the harness shown. To change it without dispatching, right-click or press and hold the button; from the keyboard, focus it and use `Shift+F10`, the Context Menu key, or `Alt+Down`. Choosing Claude or Codex updates the button, and that choice stays local to the mounted list while you launch more threads.

**Settings → Agent → Agent harness** provides the initial default only. An Agents List choice does not rewrite that setting, and a thread stays with the harness that created it—you cannot switch an existing thread. The [Kanban dispatch panel](/docs/views/kanban-board/#dispatching-from-the-board) uses the same selector.

You can resolve pending permission requests directly from Agents List rows without switching threads — see [Permissions](/docs/permissions/permission-modes-and-plan-mode/) for what those requests look like.

## Waiting threads

When a thread has a pending `ScheduleWakeup`, the Agents List keeps it in the **Waiting** group and shows a live `Resumes in…` countdown with the wakeup reason. This list classification remains visible across threads even though the conversation itself uses a compact [scheduled-activity pill and popover](/docs/reference/status-line/#scheduled-activity) for inspection and item-specific controls.

## Live activity (running threads)

While a thread is actively processing, the Agents List shows a live one-line summary of the current tool call or step — so you can see "Reading src/components/Header.tsx" or "Running npm test" without switching to that tab.

When a thread runs the `Workflow` tool for multi-agent orchestration, this live activity extends into a full inline progress block in the conversation itself — pinned above the streaming output — showing the workflow's name, current phase, and a row per spawned sub-agent (a pulsing dot while running, filled when done, ✗ on failure). Rows appear as agents launch and update in place as they complete, so you can see the full run at a glance even before the workflow finishes. The block is rendered entirely from the SDK event stream, so it appears immediately and has zero overhead for threads that don't use workflows.

![Inline workflow progress — live agent rows with running/done dots and a phase label](../../../assets/screenshots/screenshot-workflow-progress.png)

## Native agent teams

When a Claude or Codex thread launches native child agents, the Agents List shows a compact agent-count control beneath the owning thread. Search still includes agent role, task, and current activity, and clicking the count opens the parent conversation’s team picker, where a compact composer pill and popover give you the same tree. See [Native Agent Workspace](/docs/views/native-agent-workspace/) for persistence, reload behavior, and currently supported controls.

## Auto-generated summaries (idle threads)

After each completed response, the summarizer runs in a lightweight background process (a separate Claude Code instance using a small model) and writes a multi-sentence recap of what that thread worked on. This summary is shown in the Agents List row so you can re-orient yourself to any thread at a glance — what it accomplished, what files it touched, what's left to do.

This combination means you can dispatch several threads in parallel, switch to other work, then return to the Agents List to understand the state of every agent without reading through each conversation. Summarization behavior — auto vs. manual, and which model does the summarizing — is configurable in [Settings Reference → Features](/docs/reference/settings/#features).

## Scheduled Jobs

An hourly (or more frequent) [scheduled task](/docs/automation/scheduled-tasks/) can produce dozens of quiet threads a day, burying the manually-created ones you actually need to triage. When a run created by the scheduler is unreviewed, reviewed, or empty — never one that's running, awaiting a permission/question, or errored — it's pulled out of its normal group into a **Scheduled Jobs** section at the bottom of the Agents List, one collapsed row per job showing its name, run count, and the latest run's time. Click a row to expand it into the individual runs.

Enabled by default — disable via **Settings → Features → Kanban board → Stack scheduled job threads**, see [Settings Reference → Features](/docs/reference/settings/#kanban-board).

## Jump to latest unreviewed

Run **Jump to latest unreviewed completed agent** from the command palette to open the Agents List (if it isn't already open) and jump straight to the most recently completed thread you haven't looked at yet. This is the fastest way to work through a backlog of finished agents after dispatching several tasks in parallel.

You can also send messages to any thread directly from the Agents List without switching tabs.

## Background tasks stay "Working"

A thread that spawns a background subagent (`Agent(..., run_in_background: true)`) or runs the `Workflow` tool can have its own turn finish — and its activity line stop updating — before that spawned work actually completes server-side. Rather than misclassifying the thread as New/Reviewed/Ready the moment the outer turn ends, the Agents List (and the [Kanban board](/docs/views/kanban-board/)) keeps it under **Working** until the background task or workflow reports back, so you don't have to stumble onto a stray notification to realize something is still running.

What happens when it reports back depends on whether the thread is still active:

- **Thread still streaming:** the result appears inline through the running turn's live task pill.
- **Thread has gone idle:** a ✓/✗ summary is appended to the conversation as a subtle centered notice row, so it remains available when you reopen the thread or scroll back instead of disappearing as a transient toast.
