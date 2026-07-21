---
title: Status Line (Context Footer)
description: The per-thread pill footer — JSON tag contract, PR detection, and the reference script.
category: reference
order: 4
---

A row of pills below the input area shows live context for each thread — git branch, an open PR, a running dev server URL, AWS session status, or anything else you want. It's powered by a shell command (Settings → **Context footer command**) that the plugin runs **per thread, in the background**, against that thread's working directory. Desktop only.

![Status-line footer pills — dev URL, git branch, a clickable PR pill, and an AWS status pill below the message input](../../../assets/screenshots/screenshot-status-line.png)

## Output format

The command can return either:

- **A JSON array of tags** (recommended) — each pill is a `StatusTag`:

  ```json
  [
    { "label": "http://localhost:3001", "url": "http://localhost:3001", "kind": "dev" },
    { "label": "feat/social-nudge", "kind": "branch" },
    { "label": "PR #225", "url": "https://github.com/acme/app/pull/225", "kind": "pr" },
    { "label": "AWS expired", "tone": "warn", "kind": "aws" }
  ]
  ```

  | Field | Meaning |
  |---|---|
  | `label` | **Required.** Pill text. |
  | `url` | Makes the pill a clickable link (opens in your browser). |
  | `icon` | [Lucide](https://lucide.dev) icon name. Defaults from `kind` if omitted. |
  | `tone` | `normal` (default), `warn`, or `error` — colors the pill. |
  | `kind` | `pr`, `branch`, `dev`, `aws`, or any custom string. A `kind:"pr"` tag (or any `url` ending in `/pull/N`) becomes the thread's PR — shown as the PR pill and surfaced to the Kanban board, MCP tools, and release automation. |

- **Plaintext** (the Claude Code statusline convention) — segments split on 2+ spaces, with heuristic icons (URL→globe, `PR #N`→pull-request, `AWS …`→cloud, else→branch). Existing scripts keep working unchanged.

**Input.** The command receives JSON on stdin: `{ "cwd": "…", "workspace": { "current_dir": "…" }, "provider": "claude" | "bedrock" }`. Use `provider` to gate provider-specific pills — e.g. only emit an AWS pill when `provider == "bedrock"` so a logged-out AWS session doesn't show a spurious warning on a non-Bedrock machine.

## PR detection

PR detection is fully script-driven: a `kind:"pr"` tag with a `url` (e.g. from `gh pr view`) populates the thread's `prUrl`, which is **sticky** — it survives after the PR merges so release tooling can still match the thread.

This replaced an earlier approach that scanned assistant message prose for a GitHub PR URL, which missed the common case of a PR opened via `gh pr create` inside a Bash tool call (the URL lands in tool *output*, not assistant prose, so the scanner never saw it). Sourcing the PR tag from the script instead means it can read the actual result of a `gh pr view` call for the branch, rather than guessing from text.

**Opening links:** clicking a pill with a `url` opens it in Obsidian's in-app **Web Viewer** when that core plugin is enabled (reusing an existing tab); otherwise it opens in your system browser. **Cmd-click** (Ctrl-click on Windows/Linux) always opens in the system browser, even when the Web Viewer is enabled.

## Reference script

A ready-to-use reference script (branch · PR · dev URL · Bedrock-gated AWS pill) ships with the plugin at `docs/statusline-command.example.sh` in the [obsidian-claude-threads](https://github.com/rbcodelabs/obsidian-claude-threads) repo. It emits the JSON tag array described above: it resolves the branch and PR from `git`/`gh` for the thread's cwd, looks up a locally running dev server, and — only when the active provider is `bedrock` — adds an AWS session-status pill. Point **Settings → Context footer command** at your own copy of it (or a script following the same stdin/stdout contract) to get typed, clickable pills instead of plaintext segments.
