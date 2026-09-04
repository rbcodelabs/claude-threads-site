---
title: Agent Tools Reference
description: Every MCP tool available inside a Claude thread — vault, UI, session, thread-coordination, Vault Bridges, and Skills Manager tools.
category: reference
order: 3
---

Every thread runs with built-in tools for vault access, session control, and — for multi-agent workflows — live coordination with other threads. Claude receives them through the host-neutral `claude_threads` MCP server; Codex receives the same canonical definitions through its dynamic-tool protocol. No configuration is required.

The former `obsidian` server and `obsidian_*` names remain callable as deprecated compatibility aliases until the next major release. New prompts, permission rules, and automation should use the canonical names below.

## Vault tools

Read and search your vault from within any thread.

| Tool | Parameters | Description |
|---|---|---|
| `vault_search` | `query`, `limit?` | Full-text search across all Markdown files. Tokenizes multi-word queries so each term is matched independently. Returns results ranked by relevance (filename hits weighted 10×) with a ~300-char excerpt from the densest matching region. Default limit: 20. |
| `vault_get_note_metadata` | `path` | Returns the full metadata cache entry for a note: frontmatter, tags, wikilinks, and headings. |
| `vault_get_backlinks` | `path` | Returns all notes that link to the specified file, with source path and original link text. |
| `vault_get_outgoing_links` | `path` | Returns all wikilinks and Markdown links a note makes to other files, with display text and resolved vault paths. |

## Workspace and host tools

Interact with the active Obsidian or Geode workspace.

| Tool | Parameters | Description |
|---|---|---|
| `workspace_get_active_file` | — | Returns metadata (path, basename, extension, size, mtime, ctime) for the file currently open in the editor, or `null` if nothing is open. |
| `workspace_get_open_tabs` | — | Returns all open tabs with path, title, view type, and which one is active. |
| `workspace_navigate_to_file` | `path`, `newLeaf?` | Opens a vault file in the editor. Pass `newLeaf: true` to open in a new tab. |
| `workspace_insert_at_cursor` | `text` | Inserts text at the cursor in the active editor, replacing any current selection. |
| `host_list_commands` | `query?` | Returns all registered host commands (id + name), sorted alphabetically. Pass a `query` string to filter. Use this to discover command IDs before calling `host_execute_command`. |
| `host_execute_command` | `commandId` | Runs any host command by its ID (e.g. `obsidian-git:push`, `editor:toggle-bold`). Third-party command IDs are unchanged. |
| `host_open_url` | `url`, `newTab?` | Opens a URL in the host Web Viewer panel. Reuses an existing tab by default; set `newTab: true` to force a fresh tab. |

## Session tools

Control the current thread's session state.

| Tool | Parameters | Description |
|---|---|---|
| `set_working_directory` | `path` | Changes the working directory for this session. Accepts an absolute path; `~` is expanded. Takes effect on the next turn. |
| `EnterPlanMode` | — | Requests Plan mode without asking for permission. For Codex, the current turn hands off at a safe boundary and Claude Threads starts one fresh native Plan collaboration turn under a read-only sandbox; its structured plan opens the existing Approve/Edit/Reject card. Claude uses its native plan-mode capability for the equivalent transition. |
| `ScheduleWakeup` | `delaySeconds`, `prompt`, `reason` | Schedules a message to be injected into this thread after a delay. Useful for polling CI, waiting for a deploy, or self-pacing a loop. While the wake-up is pending, the [Agents List](/docs/views/agent-dashboard/#waiting-threads) and [Agent Board](/docs/views/kanban-board/) keep the thread in **Waiting** with a live countdown (`Resumes in 4m — <reason>`). In the conversation, a compact [scheduled-activity pill](/docs/reference/status-line/#scheduled-activity) shows the countdown instead of a permanent banner; click it to inspect all wakeups and loops for the thread and cancel only the selected wakeup. Wakeups are persisted to disk (the same durable store backing [Scheduled Tasks](/docs/automation/scheduled-tasks/)), so a pending wakeup survives an Obsidian restart, plugin reload, or the machine sleeping — it fires on schedule, or immediately on next load if the fire time already passed. |
| `EnterWorktree` | `branch?`, `baseBranch?`, `repoPath?` | Creates a git worktree for the current repo and switches the session cwd to it. Automatically routed to the plugin's MCP implementation, which tracks the in-session cwd correctly after `set_working_directory`. |
| `ExitWorktree` | `worktreePath?`, `force?` | Removes the worktree and restores the session cwd to the original repo root. Defaults to the current effective cwd. Pass `force: true` to remove even if there are uncommitted changes. |
| `request_secret` | `secretName`, `reason`, `force?` | Prompts the user (via a modal) to provide a secret value such as an API key. The value is stored in the OS keychain under the plugin's namespace and injected into future sessions as an environment variable — it never appears in the conversation. Returns `{success: true, secretName, alreadyExisted: boolean}` if the user saves, or `{success: false, reason}` if cancelled. If a secret with the same name already exists, returns `alreadyExisted: true` immediately without prompting. Pass `force: true` to always re-prompt (e.g. when rotating a stale token) — the modal will indicate that the existing value will be replaced. |

## Thread coordination tools

Discover, read, and message other running threads. These tools enable agent-to-agent delegation — one thread can assign work to another, wait for it to finish, and read the result.

| Tool | Parameters | Description |
|---|---|---|
| `threads_get_current` | — | Returns this thread's metadata, live status, project, cwd, PR, schedule origin, raw-log path, and message count. |
| `threads_list` | `projectId?` | Returns authorized thread metadata. The Portfolio Orchestrator passes a Project id for explicit one-call elevation. |
| `threads_create` | `prompt`, `title?`, `cwd?`, `projectId?` | Creates an independent thread, queues its initial prompt immediately, and returns `{threadId, title}` without waiting for the thread to finish. Omitted `cwd` and `projectId` inherit from the calling thread; pass `projectId: null` to create the thread without a project. |
| `threads_list_projects` | — | Returns configured Projects, including each `vaultFolder`, optional `cwdOverride`, and resolved `effectiveCwd`. |
| `threads_create_project` | `name`, `vaultFolder`, `description?`, `cwdOverride?` | Creates and persists a project. |
| `threads_update_project` | `projectId`, `name?`, `description?`, `cwdOverride?`, `elevatedProjectId?` | Durably updates the caller's Project name, context description, or cwd override and returns the complete updated Project snapshot, including its resolved `effectiveCwd`. |
| `threads_set_project` | `threadId`, `projectId`, `alignCwd?` | Assigns a thread to a Project, or detaches it with `null`. Association-only by default; `alignCwd: true` switches to a non-null Project's cwd on the next safe turn. Detaching never relocates the thread. |
| `threads_get_messages` | `threadId`, `limit?` | Returns recent user and assistant messages. |
| `threads_open` | `threadId`, `elevatedProjectId?` | Opens and focuses the exact thread UUID. A successful open marks it reviewed and persists the active selection. |
| `threads_get_log` | `threadId?`, `limit?`, `type?` | Returns parsed raw JSONL event-log entries. |
| `threads_wait` | `threadId`, `timeoutSeconds?` | Waits until a target thread becomes idle. |
| `threads_send_message` | `threadId`, `message` | Queues a message on another thread and triggers it. |
| `threads_archive` | `threadId`, `confirm?`, `elevatedProjectId?` | Saves and removes a completed thread. A scheduled thread may target itself; the tool acknowledges with `deferred: true`. Archiving any referenced orchestrator requires `confirm: true`. |

Project members and Project Orchestrators coordinate only inside their Project. Unassigned threads coordinate only with unassigned threads. The Portfolio Orchestrator sees unassigned work by default and must provide a matching `projectId`/`elevatedProjectId` on each raw cross-Project call. Project manager notes remain owned by the Project Orchestrator even during portfolio elevation.

For `threads_update_project`, `projectId` is required and at least one editable field must actually change. `name` is trimmed and must remain nonblank. Omitted fields are preserved; pass `null` for `description` or `cwdOverride` to clear that field. A non-null `cwdOverride` is trimmed and must be an absolute filesystem path. Project members and Project Orchestrators may update their own Project; unassigned and cross-Project callers are denied, while the Portfolio Orchestrator must pass `elevatedProjectId` matching the target. Existing threads keep their current cwd and live session. New Project threads and dynamic Project schedules resolve the updated cwd, and newly initialized sessions receive updated context. The deprecated compatibility name is `obsidian_update_project` on the former `obsidian` server.

This tool updates stored Project configuration only. Automatic vault-relative/repo-relative path disambiguation is a separate product follow-up and is not injected by this feature.
| `threads_set_notes` | `threadId`, `notes` | Sets orchestrator tracking notes. |
| `threads_set_proposed_reply` | `threadId`, `text` | Stages a proposed reply for human approval. |
| `threads_clear_proposed_reply` | `threadId` | Clears a stale proposed reply. |

These three tools back the bundled **thread-orchestrator** skill (`resources/skills/thread-orchestrator`), which lets one thread supervise several peers: it tracks per-thread notes across polling passes and proposes replies for a human to review rather than sending on a peer's behalf.

**`isRunning` vs `status`:** `status` is a persisted field (`waiting`, `active`, `error`, `archived`, `reconnecting`) that reflects the last known state. `isRunning` is a live flag that is `true` only while Claude is actively streaming a response. Use `isRunning` for coordination decisions; use `status` to filter out archived or errored threads. `reconnecting` is a transient state covering two auto-recovered failure modes: either the underlying `claude` CLI transport was force-closed mid-tool-call (a spurious "Stream closed" error) and the plugin is auto-firing one follow-up turn so Claude can verify whether the interrupted action actually succeeded, or the API rejected the turn with a rate-limit/overload error and the plugin is silently retrying the same turn after a backoff delay. Either way it is not necessarily a real failure — treat it as in-flight, not errored. See [Errors and auto-retry](/docs/core-workflow/messaging-and-commands/#errors-and-auto-retry) for the full behavior.

### Coordination pattern

A typical delegation loop:

1. Call `threads_create` with a prompt to create and immediately assign a dedicated thread, or call `threads_list` to find an existing peer
2. For an existing peer, call `threads_send_message` to assign the task
3. Call `threads_wait` to block until the peer finishes
4. Call `threads_get_messages` to read the result

This pattern works across any combination of threads — you can fan out to multiple peers simultaneously by sending messages to several threads before waiting on any of them.

## Vault Bridges integration

If you have the [Vault Bridges](https://github.com/rbcodelabs/obsidian-vault-bridges) plugin installed, Claude agents can inspect and configure bridges directly via MCP — no config-file editing or Obsidian restarts required.

| Tool | Parameters | Description |
|---|---|---|
| `vault_list_bridges` | — | Returns all currently configured bridges. Agents should call this first to check what already exists before adding a new one. |
| `vault_add_bridge` | `name`, `repoPath`, `vaultPath`, `sourcePath?`, `branch?`, `autoSync?`, `syncNow?` | Adds a new bridge live via the Vault Bridges API. The bridge is registered immediately — the status bar updates, per-bridge push/pull commands are wired up, and settings are saved. If a bridge with the same `repoPath` + `vaultPath` already exists, the existing record is returned without creating a duplicate. |

Both tools return a clear error if the vault-bridges plugin is not installed or not enabled.

### Bridge-aware edits

When an agent edits files inside a bridged repo (rather than the synced vault copy), Claude Threads detects it automatically at the end of the turn:

- **Auto-pull** — each affected bridge is synced once per turn, so the vault copies update immediately (a notice confirms success or failure).
- **Vault-relative links** — edited-file chips, the focus button, and absolute repo paths in Claude's messages all resolve to the synced vault note: chips show the vault path and open the note in Obsidian, and message paths become clickable internal links (only when the vault copy exists).

Edits made directly to vault files are unaffected — they don't match any bridge root and behave as before. Note that edits made inside a temporary coding-task worktree only reach the vault after merge plus a normal bridge pull.

## Skills Manager tools

Everything the Skills Manager panel can do — browse the [skills.sh](https://skills.sh) registry, inspect installed skills and configured sources, check for updates, install, uninstall — is also available to agents via MCP, so a thread can manage its own skill packages without a human clicking through the UI.

| Tool | Parameters | Description |
|---|---|---|
| `skills_list_installed` | — | Lists skills currently installed in `~/.claude/skills/`: name, description, install path, and which configured skill source (if any) each came from. |
| `skills_search` | `query`, `limit?` | Searches the skills.sh marketplace registry. Returns each match's name, slug, GitHub source, install count, and whether it's already installed. Default limit: 15. |
| `skills_get` | `identifier` | Returns full detail for one skill, whether installed or not. Pass an installed skill's name, or a marketplace slug in `owner/repo/skill-id` form (as returned by `skills_search`). Installed skills include their full `SKILL.md` content. |
| `skills_list_sources` | — | Lists configured skill sources (GitHub-cloned or local-path plugin sources) plus the built-in skills.sh registry, with id, name, type, and (for GitHub sources) staleness info. |
| `skills_check_updates` | — | Checks every configured GitHub-type skill source for upstream commits it's behind (`git fetch` + count). Returns each source's id, name, and either its refreshed `behindCount`/`lastFetched` or an `error` if the check failed (e.g. offline). |
| `skills_install` | `slug`, `skillId`, `source`, `name` | Installs a skill from the marketplace into `~/.claude/skills/`. Pass the four fields exactly as returned by `skills_search` for the skill you want. |
| `skills_uninstall` | `name` | Permanently deletes an installed skill by name. |
| `skills_update` | `sourceId` | Pulls the latest commits for a configured GitHub-type skill source (`git pull` on its local clone), refreshing every skill it provides. Use the source id from `skills_list_sources` — not `"registry"`, which has no single-source update (reinstall individual skills instead). |
