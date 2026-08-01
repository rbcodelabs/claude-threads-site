---
title: Managing MCP Servers
description: Add, edit, and remove external MCP servers from the Settings MCP tab — stdio, HTTP, and SSE — without hand-editing your global Claude Code config.
category: integrations
order: 3
---

Every Claude Threads session ships with a built-in `obsidian` MCP server (vault access, thread control, worktrees, and more) that needs no configuration. Beyond that, you can wire in **external MCP servers** — Compass, Helio, a company-internal tools server, or anything else that speaks the [Model Context Protocol](https://modelcontextprotocol.io) — and every new thread picks them up automatically.

Those external servers live in your **global Claude Code config** (`~/.claude/settings.json`). The **Settings → MCP** tab lets you list, add, edit, and remove them from inside Obsidian, so the common cases never require hand-editing JSON.

![Settings MCP tab: a list of configured MCP servers, each with a type badge (stdio, http, sdk), a one-line summary, and Edit and Remove buttons, plus an Add MCP server button](../../../assets/screenshots/screenshot-mcp-servers.png)

## Opening the tab

Open **Settings → Claude Threads** and select the **MCP** tab. On mobile, the settings screen is reduced to pairing and reload controls — MCP servers are managed from desktop only.

## This edits your global config

**The MCP tab edits your global `~/.claude/settings.json`** (or the per-machine file it symlinks to) — not a per-vault or per-plugin config. That file is shared by:

- Every Obsidian vault running Claude Threads on this machine, and
- The `claude` CLI itself.

So a server you add here shows up everywhere, and a server you (or a teammate's setup script) added via the CLI shows up here too. The tab always displays the resolved path to the file it is editing, so you can confirm exactly what's on disk.

Changes take effect for **new threads only** — sessions already running keep whatever MCP servers they started with. There's no plugin reload required; the per-thread merge logic re-reads the file each time a thread starts.

## The server list

Each configured server is shown as a row with:

- Its **name** (the key under `mcpServers` in the config).
- A **type badge** — `stdio`, `http`, `sse`, or `sdk`.
- A **one-line summary** — the command line for `stdio` servers, the URL for `http`/`sse` servers.
- **Edit** and **Remove** actions.

If no servers are configured yet, the list shows an empty state instead of rows.

## Adding or editing a server

**Add MCP server** (or **Edit** on an existing row) opens a form with a type toggle between the two transports Claude Code can launch from file config:

![Add or edit MCP server form: a toggle between Command (stdio) and HTTP or SSE, with Name, Command, Arguments, and Environment variables fields; the environment field shows a NOTES_API_TOKEN placeholder referencing an environment variable](../../../assets/screenshots/screenshot-mcp-edit-server.png)

| Type | Fields |
|---|---|
| **Command (stdio)** | Name, Command, Arguments (one per line), Environment variables (`KEY=VALUE` per line) |
| **HTTP or SSE** | Name, URL, transport (`http` or `sse`), Headers (`KEY=VALUE` per line) |

Names may contain only letters, numbers, hyphens, and underscores, and must be unique. The form validates required fields (a command for stdio, a URL for HTTP/SSE) before saving, and renaming an entry moves it to the new key rather than leaving a duplicate behind.

### Placeholders and secrets

Environment-variable values and HTTP header values support `${VAR_NAME}` placeholders. These are stored **verbatim** — the tab never resolves or reveals a secret — and are expanded only when a live thread starts, using the same resolution as [Extra environment variables](/docs/reference/settings/#environment): process environment variables merged with keychain-stored secrets. This keeps real tokens out of `settings.json` while still letting each thread authenticate.

## Read-only `sdk` servers

Servers with `type: "sdk"` are registered by an in-process integration rather than a spawned command or a remote URL. They can't be reconstructed from JSON alone, so the tab shows them **read-only** — you can see them in the list, but editing one means opening `~/.claude/settings.json` by hand.

## Safety with a malformed config

If `~/.claude/settings.json` contains invalid JSON, the tab shows the parse error and **hides the add/edit controls** rather than risk a write that clobbers whatever is actually on disk. Fix the JSON by hand, reopen the tab, and the controls return. Saves also re-read the file at write time, so a change you made in another editor won't be silently overwritten by a stale in-memory copy.

## Related

- [Permission Modes and Plan Mode → MCP Elicitation](/docs/permissions/permission-modes-and-plan-mode/) — how a thread prompts you for a credential or form an MCP server asks for mid-session.
- [Settings Reference](/docs/reference/settings/) — every settings tab at a glance, including this one.
