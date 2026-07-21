---
title: Thread Orchestrator
description: The bundled thread-orchestrator skill — a supervisory agent that tracks peer threads and proposes replies for human approval.
category: views
order: 3
---

The **thread-orchestrator** is a bundled Claude Code skill (`resources/skills/thread-orchestrator`) that turns one thread into a supervisor over several peers. Open it with **Open Thread Orchestrator** from the command palette, or the `open-thread-orchestrator` command ID.

## What it does

The orchestrator thread uses the [thread-coordination MCP tools](/docs/reference/agent-tools/#thread-coordination-tools) — `obsidian_list_threads`, `obsidian_get_thread_messages`, `obsidian_set_thread_notes`, and `obsidian_set_thread_proposed_reply` — to poll every other running thread, track what each one is doing, and surface next steps for you to review.

**Structured notes.** For each thread it's watching, the orchestrator maintains free-form tracking notes — an inferred goal, current status, and a last-reviewed cursor — set via `obsidian_set_thread_notes`. These are shown in a collapsible "Manager Notes" panel in the Chat view, but are never injected into that thread's own session context, so they don't pollute the conversation the orchestrator is watching.

**Proposed replies, never auto-sent.** When the orchestrator decides a thread needs a follow-up message, it doesn't send one on your behalf. It calls `obsidian_set_thread_proposed_reply`, which renders as a banner above that thread's compose box with **Approve & Send**, **Edit**, and **Discard** actions. Nothing is ever sent automatically — a human always makes the final call. This is a deliberate design choice: the orchestrator's job is to keep you oriented across many parallel agents, not to act as one more agent making decisions unsupervised.

## Wake-up cadence

The orchestrator doesn't need to be manually re-triggered. It runs on two wake-up patterns:

- An **hourly heartbeat** — a periodic check-in across all watched threads
- **Thread-completion wakeups** — fired as soon as a watched thread finishes a turn, so the orchestrator can react promptly rather than waiting for the next heartbeat

Both are implemented with `ScheduleWakeup`, the same session-tool primitive available to any thread — see [Session tools](/docs/reference/agent-tools/#session-tools).

## When to use it

The thread-orchestrator is most useful once you're routinely running more threads in parallel than you can watch directly — a handful of agents working on different parts of a project, or a fan-out where one task spawned several sub-tasks across peer threads. Instead of clicking through each tab to check status, you check the orchestrator thread and its proposed replies.
