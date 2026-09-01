---
title: Git and Vault Integration
description: The git diff bar and Create PR actions, Vault Bridges, Projects, and vault-aware tools.
category: integrations
order: 1
---

## Git diff bar

Whenever a thread's working directory is a git repo on a feature branch, a bar appears just above the compose box showing the branch name and a live diff stat (`+60 -4`) — the total change between the branch's base (e.g. `main`) and the current working tree, including any uncommitted changes. Unlike the [status-line pills](/docs/reference/status-line/), this needs no configuration: it's computed natively from local `git` commands only (no `gh`, no network), and is desktop only.

A **Create PR** split button sits on the right:

- **Create PR** — sends `/create-pr`, which asks Claude to push the branch if needed, run `gh pr create` with a title/description summarizing the session, and report back the PR URL.
- **Create draft PR** (dropdown) — same, but `gh pr create --draft`. Also available directly as `/create-pr --draft`.
- **Manually create PR** (dropdown) — skips Claude entirely and opens GitHub's compare page (`/compare/<base>...<branch>`) in your browser, so you can review the diff and open the PR yourself. Only enabled when the repo's `origin` remote points at GitHub.

The bar is hidden when the cwd isn't a git repo, when the branch can't be resolved (e.g. detached HEAD), or when you're already sitting on the base/default branch (nothing to open a PR against).

Once the **current branch** has a PR, the primary button switches to that PR's number — **PR #121** — opening it the same way pill links do, with the full URL as a tooltip, and a **View PR** item is prepended to the dropdown; the other three actions stay available in case you want to open another PR later.

### One row, not two

Because the bar already names the branch and the PR, it's treated as the single surface for that information. While the bar is visible, the [status-line footer](/docs/reference/status-line/) hides its own `pr` and `branch` pills, so the same branch name and PR number aren't printed twice in adjacent rows. This applies both to pills your status-line script emits and to the footer's own built-in PR pill.

The suppression is conditional, not a blanket removal. As soon as the bar hides — the PR merged and the thread is back on the base branch, or the working directory isn't a git repo — the footer PR pill reappears as the only remaining surface for that PR.

### Which PR the bar shows

The PR named here comes from the live `pr` tag emitted by your [context footer command](/docs/reference/status-line/) — typically a branch-scoped `gh pr view "$branch"` — and **not** from the thread's stored `prUrl`.

That distinction matters for long-lived threads. `prUrl` is thread-scoped *history*: it is deliberately never cleared, so it survives a branch switch and even a `set_working_directory` that moves the thread into a different repository. That stickiness is what lets the release archive-on-merge workflow still match a thread to its PR after the branch is deleted. But it means a thread reused for a second task can still be carrying the first task's PR — potentially from another repo entirely. Driving this button from it would leave the bar confidently advertising a stale, unrelated PR right next to the new branch's name, so the bar asks the branch instead.

If no context footer command is configured, the button simply stays on **Create PR**.

> **If you use a custom context footer command:** keep emitting the `pr` tag even though it's usually hidden behind the bar. It isn't only a pill — it's the sole source of a thread's PR association, and it feeds the diff bar's **PR #N** button, the Kanban PR chip, and archive-on-merge. Dropping it to save a `gh` call turns all three off.

## Vault Bridges integration

If you have the [Vault Bridges](https://github.com/rbcodelabs/obsidian-vault-bridges) plugin installed, Claude agents can inspect and configure bridges directly via MCP — no config-file editing or Obsidian restarts required.

| Tool | Parameters | Description |
|---|---|---|
| `vault_list_bridges` | — | Returns all currently configured bridges. Agents should call this first to check what already exists before adding a new one. |
| `vault_add_bridge` | `name`, `repoPath`, `vaultPath`, `sourcePath?`, `branch?`, `autoSync?`, `syncNow?` | Adds a new bridge live via the Vault Bridges API. The bridge is registered immediately — the status bar updates, per-bridge push/pull commands are wired up, and settings are saved. If a bridge with the same `repoPath` + `vaultPath` already exists, the existing record is returned without creating a duplicate. |

Both tools return a clear error if the Vault Bridges plugin is not installed or not enabled.

### Bridge-aware edits

When an agent edits files inside a bridged repo (rather than the synced vault copy), Claude Threads detects it automatically at the end of the turn:

- **Auto-pull** — each affected bridge is synced once per turn, so the vault copies update immediately (a notice confirms success or failure).
- **Vault-relative links** — edited-file chips, the focus button, and absolute repo paths in Claude's messages all resolve to the synced vault note: chips show the vault path and open the note in Obsidian, and message paths become clickable internal links (only when the vault copy exists).

Edits made directly to vault files are unaffected — they don't match any bridge root and behave as before. Note that edits made inside a temporary coding-task worktree only reach the vault after merge plus a normal bridge pull.

## Projects

Projects group threads, choose their initial working directory, inject shared context, and may own a Project Orchestrator, so Claude always knows what it's working on.

**Creating a project:** Go to Settings → Vault → Projects, enter a project name and vault folder path, and click **Add**. By default, the working directory is derived as `<vault root>/<vault folder>`. Use the optional filesystem cwd override when the work belongs in a repo or directory outside the vault. Settings always shows the resolved effective cwd, and clearing the override returns the Project to its vault-derived path. You can also add a project context prompt — a few sentences describing the project's goals, conventions, and key files that Claude should always keep in mind.

**Opening a thread in a project:** The Agents List and Kanban dispatch panels have an accessible **Project** selector. Choose a Project before dispatching, or leave it **Unassigned** to use the global default working directory. The new thread starts in the Project's effective cwd, and the Project context is prepended to every message you send.

**Reassigning an existing thread:** `threads_set_project` changes only the Project association by default; it does not silently relocate an existing session. Pass `alignCwd: true` to align an assigned thread through the safe next-turn cwd reset path. Detaching a thread from a Project never changes its current cwd.

**Managing projects:** Edit the name, cwd override, or context prompt at any time in Settings → Vault → Projects. Create or open its Project Orchestrator from the same row; the first completed Project thread also creates one automatically without changing focus. Deleting a Project detaches its threads, clears pending proposed replies, removes the Project heartbeat, and pins its schedules to the former effective cwd.

> **Projects focus context; they are not security boundaries.** Thread-coordination tools are operationally Project-scoped, but vault tools, MCP servers, skills, secrets, and filesystem permissions are not. Use harness permissions, operating-system permissions, and tool/server configuration for access control.

Projects are also how the [Kanban board's folder swimlanes](/docs/views/kanban-board/#group-by-folder) group threads, and how `threads_list_projects` / `threads_create_project` / `threads_set_project` work for [agent-driven project management](/docs/reference/agent-tools/#thread-coordination-tools).

## Vault tools

Every Claude thread runs with the built-in `claude_threads` MCP server, which exposes read and search access to your vault — no configuration required:

| Tool | Parameters | Description |
|---|---|---|
| `vault_search` | `query`, `limit?` | Full-text search across all Markdown files. Tokenizes multi-word queries so each term is matched independently. Returns results ranked by relevance (filename hits weighted 10×) with a ~300-char excerpt from the densest matching region. Default limit: 20. |
| `vault_get_note_metadata` | `path` | Returns the full metadata cache entry for a note: frontmatter, tags, wikilinks, and headings. |
| `vault_get_backlinks` | `path` | Returns all notes that link to the specified file, with source path and original link text. |
| `vault_get_outgoing_links` | `path` | Returns all wikilinks and Markdown links a note makes to other files, with display text and resolved vault paths. |

Combined with native `[[wikilink]]` rendering in the conversation — links Claude writes or references resolve the same way they would in any Obsidian note — this means an agent can navigate and reason about your vault's link graph the same way you do.

See the full [Agent tools reference](/docs/reference/agent-tools/) for every MCP tool available in a thread, including UI, session, and thread-coordination tools beyond the vault-specific ones above.
