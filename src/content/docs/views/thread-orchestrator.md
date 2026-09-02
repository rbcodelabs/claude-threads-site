---
title: Project and Portfolio Orchestrators
description: The bundled thread-orchestrator skill — a supervisory agent that tracks peer threads and proposes replies for human approval.
category: views
order: 4
---

The **thread-orchestrator** bundled skill supports two roles: one Project Orchestrator per Project and one Portfolio Orchestrator for unassigned work and Project-level rollups. Open the portfolio role with **Open Portfolio Orchestrator**; create/open a Project role from its Settings row. Project activity also creates its orchestrator automatically on the first completed turn unless that Project's orchestrator was intentionally archived.

## What it does

Each orchestrator uses the [thread-coordination tools](/docs/reference/agent-tools/#thread-coordination-tools) inside its scope. Project Orchestrators own their Project notes and proposals. Portfolio cross-Project raw access is explicit per call, and elevation does not transfer Project-note ownership.

**Structured notes.** For each thread it's watching, the orchestrator maintains free-form tracking notes — an inferred goal, current status, and a last-reviewed cursor — set via `threads_set_notes`. These are shown in a collapsible "Manager Notes" panel in the Chat view, but are never injected into that thread's own session context, so they don't pollute the conversation the orchestrator is watching.

**Proposed replies, never auto-sent.** When the orchestrator decides a thread needs a follow-up message, it doesn't send one on your behalf. It calls `threads_set_proposed_reply`, which renders as a banner above that thread's compose box with **Approve & Send**, **Edit**, and **Discard** actions. Nothing is ever sent automatically — a human always makes the final call. This is a deliberate design choice: the orchestrator's job is to keep you oriented across many parallel agents, not to act as one more agent making decisions unsupervised.

## Identifying the orchestrator thread

Portfolio and Project orchestrators carry distinct bot-badge classes and tooltips in Agents List rows, Kanban cards, and the thread switcher. Closing, archiving, reassigning, or automatically archiving a referenced orchestrator is protected; explicit archive still requires confirmation.

## Disabling and re-enabling a Project Orchestrator

Intentionally archiving a Project Orchestrator disables automatic orchestration for that Project. The plugin removes its hourly heartbeat, discards queued or in-flight thread-completion wakeups, and does not recreate or message a replacement when another Project thread finishes.

This disabled state is persisted in `data.json`, so it remains in effect after an Obsidian restart or plugin reload, including when the settings file was synced from another device. Deliberately choosing **Create/Open** for that Project re-enables orchestration and creates or reuses its orchestrator. This lifecycle applies to Project Orchestrators; the Portfolio Orchestrator remains managed separately.

## Wake-up cadence

The orchestrator doesn't need to be manually re-triggered. It runs on two wake-up patterns:

- An **hourly heartbeat** — a periodic check-in across all watched threads
- **Thread-completion wakeups** — fired as soon as a watched thread finishes a turn, so the orchestrator can react promptly rather than waiting for the next heartbeat

Both are implemented with `ScheduleWakeup`, the same session-tool primitive available to any thread — see [Session tools](/docs/reference/agent-tools/#session-tools).

## When to use it

The thread-orchestrator is most useful once you're routinely running more threads in parallel than you can watch directly — a handful of agents working on different parts of a project, or a fan-out where one task spawned several sub-tasks across peer threads. Instead of clicking through each tab to check status, you check the orchestrator thread and its proposed replies.
