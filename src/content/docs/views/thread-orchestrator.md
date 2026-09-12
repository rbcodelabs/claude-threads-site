---
title: Project and Portfolio Orchestrators
description: The bundled thread-orchestrator skill — a supervisory agent that tracks peer threads and proposes replies for human approval.
category: views
order: 4
---

The **thread-orchestrator** bundled skill supports two roles: one Project Orchestrator per Project and one Portfolio Orchestrator for unassigned work and Project-level rollups. Open the portfolio role with **Open Portfolio Orchestrator**; create/open a Project role from its Settings row. Project activity also creates its orchestrator automatically on the first completed turn unless that Project's orchestrator was intentionally archived.

## What it does

Each orchestrator uses the [thread-coordination tools](/docs/reference/agent-tools/#thread-coordination-tools) inside its scope. Project Orchestrators own their Project notes and proposals. Portfolio cross-Project raw access is explicit per call, and elevation does not transfer Project-note ownership.

**Goal intake before coordination.** For each new thread, the orchestrator first looks for an explicit `/goal`, the initiating request, and a concrete completion condition. Clear requests are recorded as **user-stated** and proceed without another interview. If the intended outcome or definition of done is ambiguous, the orchestrator records that it is awaiting direction and asks one focused question in the orchestrator conversation before proposing execution, inspection, or verification. A later answer can make the goal **user-confirmed**; an **inferred** goal may guide explicit work already underway but cannot expand its scope.

**Structured notes.** For each thread it's watching, the orchestrator maintains a goal contract, current status, confidence, disposition, and the exact `updatedAt` value from its last review. These are shown in a collapsible "Manager Notes" panel in the Chat view, but are never injected into that thread's own session context, so they don't pollute the conversation the orchestrator is watching. A Project's context prompt can provide the parent goal contract with a desired outcome, current priority, definition of done, constraints, non-goals, and risk tolerance.

**Proposed replies, never auto-sent.** When the orchestrator decides a thread needs a follow-up message, it doesn't send one on your behalf. It calls `threads_set_proposed_reply`, which renders as a banner above that thread's compose box with **Approve & Send**, **Edit**, and **Discard** actions. Nothing is ever sent automatically — a human always makes the final call. This is a deliberate design choice: the orchestrator's job is to keep you oriented across many parallel agents, not to act as one more agent making decisions unsupervised.

Before proposing a reply, the orchestrator requires new evidence, a clear connection to the desired outcome, useful decision value, and a stopping condition. Verification is limited to one additional orchestrator-requested pass for a substantive implementation state unless a new failure, external change, user direction, or concrete risk justifies another. Concluded or unchanged work stays quiet.

## Identifying the orchestrator thread

Portfolio and Project orchestrators carry distinct bot-badge classes and tooltips in Agents List rows, Agent Board cards, and the thread switcher. Closing, archiving, reassigning, or automatically archiving a referenced orchestrator is protected; explicit archive still requires confirmation. That includes the right-click [**Archive thread**](/docs/views/agent-dashboard/#archive-from-the-list-right-click) action in the Agents List and on Agent Board cards — archiving an orchestrator there asks first, and it still asks only once when the orchestrator is swept up in a bulk archive.

## Disabling and re-enabling a Project Orchestrator

Intentionally archiving a Project Orchestrator disables automatic orchestration for that Project. The plugin removes its hourly heartbeat, discards queued or in-flight thread-completion wakeups, and does not recreate or message a replacement when another Project thread finishes.

This disabled state is persisted in `data.json`, so it remains in effect after an Obsidian restart or plugin reload, including when the settings file was synced from another device. Deliberately choosing **Create/Open** for that Project re-enables orchestration and creates or reuses its orchestrator. This lifecycle applies to Project Orchestrators; the Portfolio Orchestrator remains managed separately.

## Wake-up cadence

The orchestrator doesn't need to be manually re-triggered. It runs on two wake-up patterns with different scopes:

- An **hourly heartbeat** reconciles activity across watched threads, including changes an event may have missed. Threads whose `updatedAt` cursor is unchanged are not reread or rewritten.
- **Thread-completion wakeups** include the named threads and their exact `updatedAt` values. They review only those targets, so one completion does not trigger an unrelated Project-wide scan.

Both are implemented with `ScheduleWakeup`, the same session-tool primitive available to any thread — see [Session tools](/docs/reference/agent-tools/#session-tools).

## When to use it

The thread-orchestrator is most useful once you're routinely running more threads in parallel than you can watch directly — a handful of agents working on different parts of a project, or a fan-out where one task spawned several sub-tasks across peer threads. Instead of clicking through each tab to check status, you check the orchestrator thread and its proposed replies.
