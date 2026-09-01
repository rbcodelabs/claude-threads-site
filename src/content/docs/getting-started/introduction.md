---
title: Introduction
description: What Claude Threads is, the three-panel model, prerequisites, and how to install it.
category: getting-started
order: 1
---

Claude Threads embeds Claude Code and OpenAI Codex directly in Obsidian. Each tab is an independent agent session with its own harness, working directory, and conversation history. You can run multiple sessions in parallel — one debugging a bug, another drafting docs, another answering questions about your vault.

## The three-panel model

Claude Threads is built around three panels that work together:

| Panel | Location | What it does |
|---|---|---|
| **Chat** | Sidebar by default; main area in Conversation first | Full conversation history for each thread, with tabs for switching between sessions |
| **Agents List** | Sidebar (usually right) | Dispatch new tasks and scan running agents in a responsive two-line list |
| **Kanban Board** | Its own tab | A board view of every thread bucketed by status — the more visual alternative to the Agents List |

You don't have to use all three at once. Many people run Chat and the Agents List side-by-side; others prefer working from the Kanban board and only opening Chat when they need to dig into a specific conversation. See [Dispatching your first task](/docs/getting-started/first-thread/), the [Agents List](/docs/views/agent-dashboard/) page, and the [Kanban board](/docs/views/kanban-board/) page for details on each.

### Conversation-first workspace

On desktop, **Settings → General → Conversation placement** offers an opt-in **Conversation first** prototype. It keeps exactly one Chat view in the main area and opens wikilinks, edited or bridged files, web pages, artifacts, and agent-triggered navigation in one reusable native companion beside it. Closing the companion returns that space to the conversation, and focusing edited files does not detach unrelated leaves.

**Classic sidebar** remains the default. Conversation-first placement is desktop only; mobile behavior is unchanged.

## Prerequisites

- [Obsidian](https://obsidian.md) v1.0.0 or later (desktop only)
- At least one authenticated agent CLI:
  - [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code). The plugin auto-detects `claude` at `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`, or `~/.local/bin/claude`. AWS Bedrock / SSO users can set `AWS_PROFILE` and `AWS_REGION` under Extra environment variables.
  - [OpenAI Codex CLI](https://developers.openai.com/codex/cli/). Select **OpenAI Codex** under **Settings → Agent → Agent harness**.
- If either executable is installed outside your `$PATH`, set its binary path under [Settings Reference → Agent](/docs/reference/settings/#agent).

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
