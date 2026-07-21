---
title: Kanban Board
description: Status columns, folder swimlanes, task lists on cards, and auto-collapsing side panels.
category: views
order: 2
---

Toggle the **Kanban** button in the Agent Dashboard toolbar (or run **Open Kanban Board** from the command palette) to switch from the default list view to a board layout. Each thread is a card, bucketed into a column for its agent state:

| Column | Meaning |
|---|---|
| **Working** | Actively processing a turn |
| **Awaiting** | Waiting on a permission prompt |
| **Waiting** | A `ScheduleWakeup` is pending — shows a live countdown, e.g. "Resumes in 4m — check CI status" |
| **New** | Unreviewed — completed since you last looked |
| **Done** | Finished and reviewed |
| **Failed** | Ended in an error state |
| **Ready** | Empty — no active work |

Columns are sorted most-recently-active first. The board has its own floating dispatch panel at the bottom — type a task and press Enter to launch a new thread without leaving the board. List view is the default; the preference persists across reloads.

![Kanban board grouped by status — Working, Awaiting, Waiting, New, Done, Failed, and Ready columns, each holding thread cards](../../../assets/screenshots/screenshot-kanban-status.png)

## Task list on cards

When a thread has an active `TodoWrite` / `TaskCreate` checklist, its kanban card shows a compact task list: up to 5 items with status icons (✔ completed, ■ in-progress, ○ pending), a "X / Y done" progress line, and "+N more" when there are additional tasks. The list updates live as the agent ticks items off — useful for seeing exactly how far along a long-running task is without opening the conversation.

## Group by folder

Use the group-by toggle in the board header (the columns/folder icon, next to search) to switch from status columns to **folder swimlanes** — one horizontal lane per app/project, so you can see every conversation for a given codebase together. Each lane is keyed by the thread's assigned [Project](/docs/integrations/git-and-vault/#projects), falling back to a working-directory label (git repo name) when no project is set, and an **Unassigned** lane catches threads with no folder. Inside each lane the cards are still grouped into the same status columns (empty columns are hidden to keep lanes compact). Lanes are ordered by most-recent activity, with Unassigned pinned last. The choice persists across reloads.

![Kanban board grouped by folder — one horizontal swimlane per app/project, each with its own nested status columns](../../../assets/screenshots/screenshot-kanban-folder.png)

## Auto-collapse side panels

Set **Settings → Features → Kanban board → Auto-collapse side panel** to `Left sidebar`, `Right sidebar`, or `Both sidebars` to automatically collapse Obsidian's sidebar panel(s) when the Kanban tab opens, giving the board more horizontal room. Only the panel(s) the Kanban view collapsed are restored when you close the tab, so it won't fight a panel you collapsed or expanded manually. Defaults to `None` (opt-in) — see [Settings Reference → Features](/docs/reference/settings/#features).
