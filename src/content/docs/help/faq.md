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
