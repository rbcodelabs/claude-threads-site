---
title: Native Agent Workspace
description: Follow Claude and Codex child agents from a compact composer pill, without an agent tree crowding out your conversation.
category: views
order: 2
---

When Claude or Codex starts child agents, Claude Threads keeps them attached to the conversation that launched them, without turning every child into a separate thread and without letting agent status take over the screen. Your conversation stays the conversation.

## Explicit and proactive agents

Both harnesses can start native child agents when a task or instruction explicitly calls for delegation. Codex can also decide proactively to divide suitable work when **Settings → Agent → Codex reasoning effort** is set to `Ultra`. Ultra increases the reasoning available for cleanly separable work, but it can also increase latency and compute use and does not guarantee that every task will fan out.

Explicit and proactive agents use the same workspace described below. Claude Threads displays the native identities, hierarchy, activity, and lifecycle events reported by the active harness; it does not simulate a separate agent system.

## The agent pill

While a thread has child agents, a compact pill appears in the composer footer. It reports how many agents are working, how many failed, or a plain count once everything has finished. The pill stays visible at rest for as long as agents exist, so you never have to hover to check on them. When a thread has no agent runs at all, the pill disappears and the footer returns to its normal hover-only behavior.

## The agent tree

Click the pill to open a popover above the composer listing every agent in the thread, indented under its parent. Each row shows the agent's role, its current activity, and its status. Arrow keys move between rows, `Escape` closes the popover, and clicking anywhere outside dismisses it.

Nested children remain attached to their parent even when events arrive out of order.

## Following one agent

Select an agent to replace the message pane with that agent's activity: the information its native harness reports, including its role and task, current activity, lifecycle status, result, and errors.

A sticky breadcrumb at the top reads `Main conversation › parent › child`. Every crumb before the last is clickable, so you can step up to a parent agent or straight back to the conversation. A close button in the same header returns to the conversation directly. Your scroll position in the main conversation is restored when you come back, and live agent events update the timeline in place without yanking you away from something you scrolled up to read.

The composer stays live the whole time. Its placeholder notes that a message goes to the main conversation, and sending one visibly returns you there rather than quietly redirecting it out of sight.

## Agents List and Kanban visibility

The [Agents List](/docs/views/agent-dashboard/) shows a compact child-agent count beneath its owning thread. Agent role, task, and current activity are included in list search, so you can find a specific child without opening each conversation first.

In the [Kanban board](/docs/views/kanban-board/), a compact count on each thread card shows how many native agents belong to that thread. Open the thread or Agents List detail to inspect them.

## Persistence and recovery

Agent history is stored with the owning thread, so completed activity and results survive an Obsidian reload. Duplicate native events do not create duplicate agents, and a child whose parent is reported later is reattached automatically.

If Obsidian closes while an agent is active, Claude Threads does not guess that it finished. On reload, the run is marked **unavailable** until its harness reports live activity again.

Background shell jobs and local workflow phases remain ordinary tasks rather than appearing as conversational agents.

## Available controls

The workspace exposes only controls that the active harness can support through a verified host-side API. Currently, Claude and Codex provide stable child identities and lifecycle/activity events, but neither exposes a verified host-callable path for messaging one child or interrupting only that child.

For that reason, direct child-agent messaging and single-agent interruption remain unavailable, whether an agent was started explicitly or proactively. Claude Threads explains the limitation in the agent activity view and never silently redirects an attempted child action to the parent thread.
