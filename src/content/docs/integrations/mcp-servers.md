---
title: Managing MCP Servers
description: Add, edit, and remove external MCP servers from the Settings MCP tab — stdio, HTTP, and SSE — without hand-editing your global Claude Code config.
category: integrations
order: 3
---

Every Claude Threads session ships with a built-in, host-neutral `claude_threads` MCP server (vault access, thread control, worktrees, and more) that needs no configuration. Codex receives the same canonical tool definitions through its dynamic-tool protocol. The former `obsidian` server and `obsidian_*` tool names remain callable as deprecated compatibility aliases until the next major release, but new prompts, permissions, and automation should use `claude_threads` and the canonical names in the [Agent Tools Reference](/docs/reference/agent-tools/).

Beyond that built-in surface, you can wire in **external MCP servers** — Compass, Helio, a company-internal tools server, or anything else that speaks the [Model Context Protocol](https://modelcontextprotocol.io) — and every new thread picks them up automatically, on both the Claude and Codex harnesses.

Those external servers are stored in **this plugin's own `data.json`**, not in any Claude Code config file. The **Settings → MCP** tab lets you list, add, edit, and remove them from inside the host app, so the common cases never require hand-editing JSON.

![Settings MCP tab: a list of configured MCP servers, each with a type badge (stdio, http, or sse), a one-line summary, and Edit and Remove buttons, plus an Add MCP server button](../../../assets/screenshots/screenshot-mcp-servers.png)

## Opening the tab

Open **Settings → Claude Threads** and select the **MCP** tab. On mobile, the settings screen is reduced to pairing and reload controls — MCP servers are managed from desktop only.

## This is per-vault plugin data, not a Claude Code config file

**The MCP tab edits this plugin's own `data.json`** for the current vault — not `~/.claude/settings.json`, and not any other Claude Code config. That means:

- Servers you add here are **scoped to this vault**; they don't show up in other vaults running Claude Threads, and they aren't shared with the `claude` CLI run outside the plugin.
- The `claude` CLI's own `~/.claude/settings.json` is never read or written by this tab — a server added there doesn't appear here, and vice versa.
- Each configured server is injected into a session's tool set **at runtime**, when a thread starts, on whichever harness (Claude or Codex) that thread uses.

Changes take effect for **new threads only** — sessions already running keep whatever MCP servers they started with.

## Google Workspace

The **Google Workspace** section connects Google's hosted MCP servers using the
Google account already connected in the **Google Docs Sync** plugin in the same
vault. Enable **Google Docs**, **Google Drive**, **Google Sheets**, and
**Google Slides** individually. All four start disabled.

Each enabled service exposes Google's available tools, including read and write
operations, to new Claude and Codex threads. The existing harness permission mode
controls tool approvals. Scheduled threads use the same selected services. You do
not need to enter server URLs, copy access tokens, or maintain Google tool schemas.

### Connect your account

1. Install and enable Google Docs Sync in the same desktop host and vault. Connect
   the intended Google account in that plugin's settings.
2. If your organization hosts its own auth service, use Google Docs Sync's
   **Auth proxy URL** setting. Disconnect the old account before changing hosts,
   then reconnect. Use current versions of the plugin and auth service with
   Geode-aware callbacks and the scopes below.
3. Enable the desired services under **Settings → Claude Threads → MCP →
   Google Workspace**, then start a new thread.

Google credentials are refreshed through the existing connection as requests are
made. If the connection is unavailable, the settings section provides connection
guidance. After switching accounts or auth hosts, start a new thread so an
existing conversation does not silently gain access to a different account.

### Google Cloud prerequisites

Google's Workspace MCP servers are currently in Developer Preview. Confirm both
your Workspace developer-account approval and registration of the specific Google
Cloud project backing the OAuth client. Then enable the ordinary API and MCP API
for each service:

| Service | APIs to enable | OAuth scopes requested by the auth service |
|---|---|---|
| Drive | `drive.googleapis.com`, `drivemcp.googleapis.com` | `drive.readonly`, `drive.file` |
| Docs | `docs.googleapis.com`, `docsmcp.googleapis.com` | Drive scopes plus `documents.readonly`, `documents` |
| Sheets | `sheets.googleapis.com`, `sheetsmcp.googleapis.com` | Drive scopes plus `spreadsheets.readonly`, `spreadsheets` |
| Slides | `slides.googleapis.com`, `slidesmcp.googleapis.com` | Drive scopes plus `presentations.readonly`, `presentations` |

Scope names in the table have the prefix `https://www.googleapis.com/auth/`.
Include the explicit read-only scopes even when requesting their write-capable
counterparts. After the auth service adds scopes, reconnect the account to grant
them; refreshing an old token does not add permissions.

See Google's [setup guide](https://developers.google.com/workspace/guides/configure-mcp-servers)
and [Developer Preview Program](https://developers.google.com/workspace/preview).
Immediately after project registration, preview errors may persist or alternate
with successful calls while Google's checks propagate. Once registration and API
enablement are confirmed, retry over several minutes before changing configuration.
Successful initialization or tool discovery alone does not prove tool execution
is authorized; test a read against a non-sensitive file in each selected service.

## The external server list

Each configured server is shown as a row with:

- Its **name** (the key under `mcpServers` in the stored config).
- A **type badge** — `stdio`, `http`, or `sse`.
- A **one-line summary** — the command line for `stdio` servers, the URL for `http`/`sse` servers.
- **Edit** and **Remove** actions.
- A **warning line**, if the server references an environment variable or secret that isn't currently resolvable — see [Placeholders and secrets](#placeholders-and-secrets) below.

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

Environment-variable values and HTTP header values support `${VAR_NAME}` placeholders. These are stored **verbatim** in `data.json` — the tab never resolves or reveals a secret — and are expanded only when a live thread starts, using the same resolution as [Extra environment variables](/docs/reference/settings/#environment): process environment variables merged with keychain-stored secrets. This keeps real tokens out of `data.json` while still letting each thread authenticate.

**If a placeholder can't be resolved — the variable is unset and no matching secret is registered — the server is skipped entirely for that session, rather than starting with a blank credential.** You'll see this in two places:

- A row in the **Settings → MCP** list shows *"Will be skipped: `${VAR_NAME}` is not registered under Settings → Secrets."*
- The first time a thread hits this during a session, a one-time notice banner reports it (deduplicated per warning message, so it won't repeat every turn).

Earlier versions of the plugin expanded an unresolved placeholder to an empty string and injected it anyway — which meant a server could silently authenticate with a blank token and fail in confusing ways. Register the missing variable or secret under **Settings → Claude → Extra environment variables / Secret environment variables** to clear the warning and have the server load normally.

## Related

- [Permission Modes and Plan Mode → MCP Elicitation](/docs/permissions/permission-modes-and-plan-mode/) — how a thread prompts you for a credential or form an MCP server asks for mid-session.
- [Settings Reference](/docs/reference/settings/) — every settings tab at a glance, including this one.
