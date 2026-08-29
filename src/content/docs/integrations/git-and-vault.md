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

Once a PR exists for the thread (tracked via the same sticky `prUrl` used by the [status-line PR pill](/docs/reference/status-line/#pr-detection)), the primary button switches to **View PR**, opening it the same way pill links do, and a **View PR** item is prepended to the dropdown — the other three actions stay available in case you want to open another PR later.

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

Projects group threads by vault sub-folder and inject shared context into every message, so Claude always knows what it's working on.

**Creating a project:** Go to Settings → Vault → Projects → enter a project name and vault folder path → click **Create project**. You can also add a project context prompt — a few sentences describing the project's goals, conventions, and key files that Claude should always keep in mind.

**Opening a thread in a project:** When you create a new thread, select a project from the dropdown near the input box. The thread's working directory is set to the project's vault folder, and the project context is prepended to every message you send.

**Managing projects:** Edit the name, folder, or context prompt at any time in Settings → Vault → Projects. Deleting a project keeps all its threads — they just lose the project association.

Projects are also how the [Kanban board's folder swimlanes](/docs/views/kanban-board/#group-by-folder) group threads, and how `threads_list_projects` / `threads_create_project` / `threads_set_project` work for [agent-driven project management](/docs/reference/agent-tools/#thread-coordination-tools).

## Where threads are stored

Each thread is its own file inside the plugin folder:

```
<plugin folder>/
  data.json                    settings, projects, and scheduled items only
  threads/
    <thread-id>.json           one live thread — canonical
    archived/
      <thread-id>.json         archived, not loaded into the live list
```

One file per thread means a save only rewrites the threads that actually
changed, and a corrupt or half-written file costs exactly that one thread
instead of all of them.

With **Save threads to vault** enabled, every conversation additionally gets a
readable `.md` note plus a versioned `.recovery.json` snapshot in your vault
folder. That pair is an independent *second* copy: the Markdown body is
presentation-only and is never parsed back into a live conversation, so editing
a thread note can never corrupt the thread.

Anything archived, and anything that survives only as a `.recovery.json`
snapshot, can be brought back from
[Settings → Vault → Data recovery](/docs/reference/settings/#data-recovery).

### Upgrading from an earlier version

The first launch after upgrading migrates the old single-file `data.json` into
the `threads/` folder automatically, and restores any thread that still had a
recovery snapshot but had dropped out of the live list. It is non-destructive:
nothing is removed from `data.json` until every thread file has been written and
read back successfully, and if anything fails it simply retries on the next
launch.

Once the migration has run, **do not downgrade** — an older build would read the
now-empty `threads` array in `data.json` and show no threads.

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
