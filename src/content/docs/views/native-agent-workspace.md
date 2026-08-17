---
title: Native Agent Workspace
description: Follow Claude and Codex child agents as a durable, nested team inside their parent thread.
category: views
order: 2
---

When Claude or Codex starts child agents, Claude Threads keeps them attached to the conversation that launched them. The parent conversation gains an **Agent Team** tree where you can follow the full hierarchy without turning every child into a separate thread.

Select an agent in the tree to inspect the information its native harness reports, including its role and task, current activity, lifecycle status, result, and errors. Breadcrumbs show where the selected agent sits in the hierarchy, and nested children remain attached to their parent even when events arrive out of order.

## Dashboard and Kanban visibility

The [Agent Dashboard](/docs/views/agent-dashboard/) shows the same child-agent hierarchy beneath its owning thread. Agent role, task, and current activity are included in dashboard search, so you can find a specific child without opening each conversation first.

In the [Kanban board](/docs/views/kanban-board/), a compact count on each thread card shows how many native agents belong to that thread. Open the thread or dashboard detail to inspect them.

## Persistence and recovery

Agent history is stored with the owning thread, so completed activity and results survive an Obsidian reload. Duplicate native events do not create duplicate agents, and a child whose parent is reported later is reattached automatically.

If Obsidian closes while an agent is active, Claude Threads does not guess that it finished. On reload, the run is marked **unavailable** until its harness reports live activity again.

Background shell jobs and local workflow phases remain ordinary tasks rather than appearing as conversational agents.

## Available controls

The workspace exposes only controls that the active harness can support through a verified host-side API. Currently, Claude and Codex provide stable child identities and lifecycle/activity events, but neither exposes a verified host-callable path for messaging one child or interrupting only that child.

For that reason, direct child-agent messaging and single-agent interruption remain unavailable. Claude Threads explains the limitation in the detail view and never silently redirects an attempted child action to the parent thread.

