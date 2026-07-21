---
title: Introduction
description: What Claude Threads is, the three-panel model, prerequisites, and how to install it.
category: getting-started
order: 1
---

Claude Threads embeds Claude Code directly in your Obsidian sidebar. Each tab is an independent Claude Code session with its own working directory and conversation history. You can run multiple sessions in parallel — one debugging a bug, another drafting docs, another answering questions about your vault.

## The three-panel model

Claude Threads is built around three panels that work together:

| Panel | Location | What it does |
|---|---|---|
| **Chat** | Sidebar (usually left) | Full conversation history for each thread, with tabs for switching between sessions |
| **Agent Dashboard** | Sidebar (usually right) | Dispatch new tasks, monitor running agents at a glance, review results without switching tabs |
| **Kanban Board** | Its own tab | A board view of every thread bucketed by status — an alternative to the Agent Dashboard's list view |

You don't have to use all three at once. Many people run Chat and the Agent Dashboard side-by-side; others prefer working from the Kanban board and only opening Chat when they need to dig into a specific conversation. See [Dispatching your first task](/docs/getting-started/first-thread/), the [Agent Dashboard](/docs/views/agent-dashboard/) page, and the [Kanban board](/docs/views/kanban-board/) page for details on each.

## Prerequisites

- [Obsidian](https://obsidian.md) v1.0.0 or later (desktop only)
- The [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
  - The plugin auto-detects `claude` at `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`, or `~/.local/bin/claude`. If your install lives somewhere else, set the path explicitly — see [Settings Reference → Claude](/docs/reference/settings/#claude).
  - AWS Bedrock / SSO users: set `AWS_PROFILE` and `AWS_REGION` in the plugin's Extra Environment Variables setting instead of authenticating with a Claude account directly.

## Installation

### Via BRAT (recommended for early access)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from Obsidian's Community Plugins
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `rbcodelabs/obsidian-claude-threads`
4. Enable **Claude Threads** in Settings → Community Plugins

BRAT tracks the GitHub repo directly, so you'll get new releases as soon as they ship — useful while the plugin is moving quickly.

### Manual install

1. Download the latest release from [GitHub Releases](https://github.com/rbcodelabs/obsidian-claude-threads/releases)
2. Extract into your vault's plugin folder: `<vault>/.obsidian/plugins/claude-threads/`
3. Enable **Claude Threads** in Settings → Community Plugins

## Next steps

Once installed, open **Claude Threads** from the ribbon icon (a message-square icon on the left edge of the window) or run **Open Claude Threads** from the command palette. Continue to [Dispatching your first task](/docs/getting-started/first-thread/) to send your first message.
