---
title: Agent Tools Reference
description: Every MCP tool available inside a Claude thread — vault, UI, session, thread-coordination, and Vault Bridges tools.
category: reference
order: 3
---

Every Claude thread runs with a built-in MCP server that exposes tools for vault access, session control, and — for multi-agent workflows — live coordination with other threads. These tools are available automatically; no configuration is required.

## Vault tools

Read and search your Obsidian vault from within any thread.

| Tool | Parameters | Description |
|---|---|---|
| `obsidian_search_vault` | `query`, `limit?` | Full-text search across all Markdown files. Tokenizes multi-word queries so each term is matched independently. Returns results ranked by relevance (filename hits weighted 10×) with a ~300-char excerpt from the densest matching region. Default limit: 20. |
| `obsidian_get_note_metadata` | `path` | Returns the full metadata cache entry for a note: frontmatter, tags, wikilinks, and headings. |
| `obsidian_get_backlinks` | `path` | Returns all notes that link to the specified file, with source path and original link text. |
| `obsidian_get_outgoing_links` | `path` | Returns all wikilinks and Markdown links a note makes to other files, with display text and resolved vault paths. |

## UI tools

Interact with the active Obsidian workspace.

| Tool | Parameters | Description |
|---|---|---|
| `obsidian_get_active_file` | — | Returns metadata (path, basename, extension, size, mtime, ctime) for the file currently open in the editor, or `null` if nothing is open. |
| `obsidian_get_open_tabs` | — | Returns all open tabs with path, title, view type, and which one is active. |
| `obsidian_navigate_to_file` | `path`, `newLeaf?` | Opens a vault file in the editor. Pass `newLeaf: true` to open in a new tab. |
| `obsidian_insert_at_cursor` | `text` | Inserts text at the cursor in the active editor, replacing any current selection. |
| `obsidian_list_commands` | `query?` | Returns all registered Obsidian commands (id + name), sorted alphabetically. Pass a `query` string to filter. Use this to discover command IDs before calling `obsidian_execute_command`. |
| `obsidian_execute_command` | `commandId` | Runs any Obsidian command by its ID (e.g. `obsidian-git:push`, `editor:toggle-bold`). Returns success or failure. |

## Session tools

Control the current thread's session state.

| Tool | Parameters | Description |
|---|---|---|
| `set_working_directory` | `path` | Changes the working directory for this session. Accepts an absolute path; `~` is expanded. Takes effect on the next turn. |
| `ScheduleWakeup` | `delaySeconds`, `prompt`, `reason` | Schedules a message to be injected into this thread after a delay. Useful for polling CI, waiting for a deploy, or self-pacing a loop. While the wake-up is pending the thread shows a waiting indicator — a "Waiting" group with a live countdown (`Resumes in 4m — <reason>`) in the Agent Dashboard and the [Kanban board](/docs/views/kanban-board/), and a banner above the chat input — each with a one-click Cancel. |
| `EnterWorktree` | `branch?`, `baseBranch?`, `repoPath?` | Creates a git worktree for the current repo and switches the session cwd to it. Automatically routed to the plugin's MCP implementation, which tracks the in-session cwd correctly after `set_working_directory`. |
| `ExitWorktree` | `worktreePath?`, `force?` | Removes the worktree and restores the session cwd to the original repo root. Defaults to the current effective cwd. Pass `force: true` to remove even if there are uncommitted changes. |
| `fork_conversation` | `focus_area?` | Forks the current conversation into a new independent thread. A lightweight Claude call distills the history into a focused starting prompt. The current thread continues unaffected. |
| `request_secret` | `secretName`, `reason`, `force?` | Prompts the user (via a modal) to provide a secret value such as an API key. The value is stored in the OS keychain under the plugin's namespace and injected into future sessions as an environment variable — it never appears in the conversation. Returns `{success: true, secretName, alreadyExisted: boolean}` if the user saves, or `{success: false, reason}` if cancelled. If a secret with the same name already exists, returns `alreadyExisted: true` immediately without prompting. Pass `force: true` to always re-prompt (e.g. when rotating a stale token) — the modal will indicate that the existing value will be replaced. |

## Thread coordination tools

Discover, read, and message other running threads. These tools enable agent-to-agent delegation — one thread can assign work to another, wait for it to finish, and read the result.

| Tool | Parameters | Description |
|---|---|---|
| `obsidian_get_current_thread` | — | Returns this thread's own metadata: `id`, `title`, `status`, `isRunning`, `projectId`, `cwd`, `updatedAt`, `messageCount`. Useful for knowing your own context before coordinating with peers. |
| `obsidian_list_threads` | — | Returns all threads with the same metadata fields as `obsidian_get_current_thread`, including a live `isRunning` flag. |
| `obsidian_list_projects` | — | Returns all configured projects: `id`, `name`, `description`, `vaultFolder`. Useful for deciding which project context a new thread should use. |
| `obsidian_create_project` | `name`, `vaultFolder`, `description?`, `cwdOverride?` | Creates a new project and persists it. Returns the created project snapshot including its `id` — capture this for use with `CronCreate`, `obsidian_set_thread_project`, and other project-aware APIs. |
| `obsidian_set_thread_project` | `threadId`, `projectId` | Assigns a thread to a project. Pass `projectId: null` to detach the thread from its current project. Call `obsidian_list_projects` first to get a valid `projectId`. |
| `obsidian_get_thread_messages` | `threadId`, `limit?` | Returns the live message history for any thread. Messages are filtered to `user` and `assistant` roles (internal compaction markers are excluded). Default: last 20 messages. |
| `obsidian_wait_for_thread` | `threadId`, `timeoutSeconds?` | Blocks until the target thread finishes its current request (`isRunning` → `false`). Polls every second. Returns `{ done: true, elapsedSeconds }` on success, or `{ timedOut: true }` if the timeout is reached (default 120s, max 600s). Returns immediately if the thread is already idle. |
| `obsidian_send_message_to_thread` | `threadId`, `message` | Queues a user message on another thread and triggers Claude to process it. Returns immediately once the message is enqueued — use `obsidian_wait_for_thread` to block until the response is ready. Cannot send to the current thread. |
| `obsidian_archive_thread` | `threadId` | Saves the thread as a vault note (if vault save is enabled) then removes it from the active thread list. Use at the end of a release or multi-step session to close out completed threads automatically. A thread cannot archive itself. |
| `obsidian_open_url` | `url`, `newTab?` | Opens a URL in the Obsidian Web Viewer panel. Reuses an existing Web Viewer tab by default; set `newTab: true` to force a fresh tab. Useful for opening local dev servers (`http://localhost:…`), HTML prototypes, or any web page directly from an agent without manual URL entry. |
| `obsidian_set_thread_notes` | `threadId`, `notes` | Sets (overwrites) a thread's orchestrator tracking notes — free-form text for an inferred goal, status, and a last-reviewed cursor. Shown in a collapsible "Manager Notes" panel in ThreadsView, but never injected into any session's context. Pass an empty string to clear. |
| `obsidian_set_thread_proposed_reply` | `threadId`, `text` | Sets an AI-proposed next message for a thread, awaiting human approval. Rendered as a banner above the compose box with **Approve & Send** / **Edit** / **Discard** actions — nothing is ever sent automatically. Distinct from the thread's own unsent compose-box draft. Cannot target the current thread. |
| `obsidian_clear_thread_proposed_reply` | `threadId` | Clears a thread's pending proposed reply, if any, without sending it. Use when a prior proposal is stale or no longer relevant. |

These three tools back the bundled **thread-orchestrator** skill (`resources/skills/thread-orchestrator`), which lets one thread supervise several peers: it tracks per-thread notes across polling passes and proposes replies for a human to review rather than sending on a peer's behalf.

**`isRunning` vs `status`:** `status` is a persisted field (`waiting`, `active`, `error`, `archived`, `reconnecting`) that reflects the last known state. `isRunning` is a live flag that is `true` only while Claude is actively streaming a response. Use `isRunning` for coordination decisions; use `status` to filter out archived or errored threads. `reconnecting` is a transient state covering two auto-recovered failure modes: either the underlying `claude` CLI transport was force-closed mid-tool-call (a spurious "Stream closed" error) and the plugin is auto-firing one follow-up turn so Claude can verify whether the interrupted action actually succeeded, or the API rejected the turn with a rate-limit/overload error and the plugin is silently retrying the same turn after a backoff delay. Either way it is not necessarily a real failure — treat it as in-flight, not errored. See [Errors and auto-retry](/core-workflow/messaging-and-commands/#errors-and-auto-retry) for the full behavior.

### Coordination pattern

A typical delegation loop:

1. Call `obsidian_list_threads` to find a peer, or `fork_conversation` to create a dedicated one
2. Call `obsidian_send_message_to_thread` to assign a task
3. Call `obsidian_wait_for_thread` to block until the peer finishes
4. Call `obsidian_get_thread_messages` to read the result

This pattern works across any combination of threads — you can fan out to multiple peers simultaneously by sending messages to several threads before waiting on any of them.

## Vault Bridges integration

If you have the [Vault Bridges](https://github.com/rbcodelabs/obsidian-vault-bridges) plugin installed, Claude agents can inspect and configure bridges directly via MCP — no config-file editing or Obsidian restarts required.

| Tool | Parameters | Description |
|---|---|---|
| `obsidian_list_vault_bridges` | — | Returns all currently configured bridges. Agents should call this first to check what already exists before adding a new one. |
| `obsidian_add_vault_bridge` | `name`, `repoPath`, `vaultPath`, `sourcePath?`, `branch?`, `autoSync?`, `syncNow?` | Adds a new bridge live via the Vault Bridges API. The bridge is registered immediately — the status bar updates, per-bridge push/pull commands are wired up, and settings are saved. If a bridge with the same `repoPath` + `vaultPath` already exists, the existing record is returned without creating a duplicate. |

Both tools return a clear error if the vault-bridges plugin is not installed or not enabled.

### Bridge-aware edits

When an agent edits files inside a bridged repo (rather than the synced vault copy), Claude Threads detects it automatically at the end of the turn:

- **Auto-pull** — each affected bridge is synced once per turn, so the vault copies update immediately (a notice confirms success or failure).
- **Vault-relative links** — edited-file chips, the focus button, and absolute repo paths in Claude's messages all resolve to the synced vault note: chips show the vault path and open the note in Obsidian, and message paths become clickable internal links (only when the vault copy exists).

Edits made directly to vault files are unaffected — they don't match any bridge root and behave as before. Note that edits made inside a temporary coding-task worktree only reach the vault after merge plus a normal bridge pull.
