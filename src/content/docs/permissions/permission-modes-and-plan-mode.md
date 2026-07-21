---
title: Permission Modes and Plan Mode
description: The full permission mode table, the Plan Mode approve/edit/reject flow, and MCP Elicitation cards.
category: permissions
order: 1
---

## Permissions

When Claude needs to write a file or run a command, a permission card appears inline in the conversation asking you to **Allow**, **Deny**, or **Always Allow**. Always Allow adds the tool to a per-vault allowlist so you're never asked again for that tool. You can also resolve permissions directly from the [Agent Dashboard](/docs/views/agent-dashboard/) without switching threads.

![Inline permission dialog — Deny / Allow / Always Allow before Claude writes a file](../../../assets/screenshots/screenshot-permission.png)

The default behavior can be changed globally in **Settings → Tools → Permission Mode**, or **per-thread** via the shield (🛡) button in the thread footer — a thread-level override takes precedence over the global setting and is useful when you want Plan Mode for one specific task without affecting other threads.

| Mode | Behavior |
|---|---|
| `default` | Use the Claude CLI default (prompts for most tool calls) |
| `acceptEdits` | Automatically accept file edits; prompt for commands and other tools |
| `bypassPermissions` | Skip all permission prompts — Claude executes everything without asking |
| `plan` | Claude proposes a written plan before taking any action; you approve, edit, or reject it before it proceeds — see [Plan Mode](#plan-mode) below |
| `dontAsk` | Suppress all interactive permission dialogs; Claude proceeds without confirmation. Intended for scheduled/background sessions that run unattended |
| `auto` | Claude autonomously decides when to prompt vs. proceed based on action risk |

> **Note for scheduled sessions.** Threads created by the built-in scheduler automatically use `dontAsk` so [cron jobs](/docs/automation/scheduled-tasks/) never stall waiting for a permission dialog that nobody is watching. They also inherit any external MCP servers defined in `~/.claude/settings.json` (Compass, Helio, or any other user-configured HTTP/SSE/stdio server) alongside the plugin's built-in tools, so scheduled agents have the same tool surface as an interactive CLI session — `${VAR_NAME}` placeholders in that config are resolved from environment variables and keychain-stored secrets.

## Plan Mode

Set **Permission Mode → `plan`** globally in Settings, or use the **shield button** in the thread footer to set it for a single thread, to enable Plan Mode. In this mode Claude reads, researches, and thinks — but doesn't write files or run commands — until it has produced a written plan and you've approved it.

**The flow:**

1. You send a message as normal.
2. A **"Planning…"** visual state appears in the thread while Claude gathers context.
3. When Claude finishes its plan, an inline card replaces the spinner, showing the full proposed plan text.
4. You pick one of three actions on the card:
   - **Approve** — Claude proceeds to execute the plan immediately.
   - **Edit** — the plan text becomes editable in-place; submitting the edited version sends it back to Claude as the confirmed plan before execution.
   - **Reject** — Claude stops; no edits are made. You can send a follow-up message to redirect.

Plan Mode is useful for risky or large-scale tasks where you want to review the approach before any files are touched.

## MCP Elicitation

Some MCP servers need a credential or a form filled before they can proceed — for example, an OAuth flow or a confirmation dialog. When this happens, Claude Threads renders an elicitation card inline in the conversation rather than silently failing.

- **URL auth card** — displays a clickable link for the OAuth URL. Click it to open the auth page in Obsidian's Web Viewer (or your system browser), complete the flow, then return to the thread. Claude resumes automatically once the server receives the credential.
- **Form card** — renders input fields derived from the server's JSON schema (text fields, selects, checkboxes). Fill in the form and submit; the response is forwarded to the MCP server and the session continues.

Without elicitation support the session would stall indefinitely with no visible feedback. The card makes the situation visible and actionable without leaving Obsidian.
