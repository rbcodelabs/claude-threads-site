---
title: FAQ
description: Frequently asked questions and troubleshooting notes.
category: help
order: 1
---

## Safe plugin reload

Use **Claude Threads: Reload plugin (safe)** from the command palette instead of Obsidian's built-in "Reload plugin" button.

- **No threads running** — the plugin reloads immediately.
- **Threads active** — a modal appears showing their names with three choices:
  - **Cancel** — keep working, nothing happens.
  - **Interrupt & Reload** — sends an interrupt signal to every running thread and waits up to 30 seconds for a clean shutdown before reloading.
  - **Force Reload** — kills sessions immediately and reloads.

Reloading via any other path (the Settings toggle, or Obsidian's manifest hot-reload) triggers a graceful 10-second interrupt wait automatically before teardown, so in-flight work still gets a chance to stop cleanly even if you don't use the command palette entry.

## A thread is missing from my thread list

Nothing is deleted when a thread leaves the live list — it is archived, and both
its thread file and (if vault saving is on) its Markdown note plus
`.recovery.json` snapshot are kept.

Go to **Settings → Claude Threads → Vault → Data recovery** and choose **Restore
threads**. The picker lists everything that can be brought back, in two groups:

- **Archived** — threads you archived, or that the
  [idle sweep](/docs/reference/settings/#vault) archived after
  `Auto-archive idle threads after (days)` days of inactivity.
- **Recovery snapshots only** — threads that still have a vault recovery
  snapshot but no thread file. Restoring rebuilds the thread file from the
  snapshot.

Tick the ones you want and choose **Restore selected**. They come back as
`waiting` (their agent session is long gone) with their full message history
intact.

If a thread you expect is in neither group, check your vault folder for a
`<date>-<title>.md` note — the readable transcript is still there even when the
machine-readable snapshot is not.
