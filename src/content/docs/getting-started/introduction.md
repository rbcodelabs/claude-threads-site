---
title: Introduction
description: What Agent Threads is, the three-panel model, prerequisites, and how to install it.
category: getting-started
order: 1
---

Agent Threads embeds Claude Code, OpenAI Codex, and [OpenCode](/docs/integrations/opencode-harness/) directly in [Geode](https://geode.rbcodelabs.com) and [Obsidian](https://obsidian.md). Each thread is an independent agent session with its own harness, working directory, and conversation history. You can run multiple sessions in parallel — one debugging a bug, another drafting docs, another answering questions about your vault.

## The three-panel model

Agent Threads is built around three panels that work together:

| Panel | Location | What it does |
|---|---|---|
| **Chat** | Main area by default (Conversation first); sidebar in Classic | Full conversation history, with a rich switcher for moving between threads |
| **Agents List** | Sidebar (usually right) | Dispatch new tasks and scan running agents in a responsive two-line list |
| **Agent Board** | Its own tab | A kanban view of every thread bucketed by status — the more visual alternative to the Agents List |

You don't have to use all three at once. Many people run Chat and the Agents List side-by-side; others prefer working from the Agent Board and only opening Chat when they need to dig into a specific conversation. See [Dispatching your first task](/docs/getting-started/first-thread/), the [Agents List](/docs/views/agent-dashboard/) page, and the [Agent Board](/docs/views/kanban-board/) page for details on each.

### Conversation-first workspace

On desktop, **Conversation first** is the default placement: it keeps exactly one Chat view in the main area and opens wikilinks, edited or bridged files, web pages, artifacts, and agent-triggered navigation in one reusable native companion beside it. In the main area, Chat uses the host's native document title and header actions. Dragging Chat between the main area and a sidebar adapts the header automatically. Closing the companion returns that space to the conversation, and focusing edited files does not detach unrelated leaves.

Prefer the original layout? Switch to **Classic sidebar** any time under **Settings → General → Conversation placement** — it keeps the compact custom thread controls in the sidebar instead. Installs that were already running before this default changed keep whichever placement they were already using. Conversation-first placement is desktop only; mobile behavior is unchanged.

On Geode hosts with durable companion support, the companion survives plugin reloads, workspace restoration, and placement changes. If you close its destination tab while other tabs remain in the split, the next contextual item opens in a replacement tab in that same split. Close the whole split to retire it.

Older Geode versions and Obsidian retain the existing reload behavior. Previously created panes without ownership metadata remain untouched; duplicate panes from before this support may need one-time manual cleanup.

## Prerequisites

- A compatible [Geode](https://geode.rbcodelabs.com) desktop host or [Obsidian](https://obsidian.md) v1.0.0 or later (desktop only)
- At least one authenticated agent CLI:
  - [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code). The plugin auto-detects `claude` at `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`, or `~/.local/bin/claude`. AWS Bedrock / SSO users can set `AWS_PROFILE` and `AWS_REGION` under Extra environment variables.
  - [OpenAI Codex CLI](https://developers.openai.com/codex/cli/). Select **OpenAI Codex** under **Settings → Agent → Agent harness**.
  - [OpenCode](https://opencode.ai) (desktop only) with at least one provider configured in OpenCode, for example Amazon Bedrock, the Anthropic API, OpenAI, or a local model. Select **OpenCode** under **Settings → Agent → Agent harness**. See [OpenCode Harness](/docs/integrations/opencode-harness/).
- If an executable is installed outside your `$PATH`, set its binary path under [Settings Reference → Agent](/docs/reference/settings/#agent).

## Installation

### Geode

Download the latest build from [GitHub Releases](https://github.com/rbcodelabs/obsidian-claude-threads/releases), then install it through Geode's local plugin flow.

### Obsidian via BRAT (recommended for early access)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from Obsidian's Community Plugins
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `rbcodelabs/obsidian-claude-threads`
4. Enable **Agent Threads** in Settings → Community Plugins

BRAT tracks the GitHub repo directly, so you'll get new releases as soon as they ship — useful while the plugin is moving quickly.

### Obsidian manual install

1. Download the latest release from [GitHub Releases](https://github.com/rbcodelabs/obsidian-claude-threads/releases)
2. Extract into your vault's plugin folder: `<vault>/.obsidian/plugins/claude-threads/`
3. Enable **Agent Threads** in Settings → Community Plugins

> **Why the old technical names remain:** Agent Threads is an in-place rename. The repository, plugin ID, install folder, command IDs, saved workspace view types, and `claude_threads` MCP namespace keep their historical names so existing installations, hotkeys, layouts, and automations continue to work.

## Next steps

Once installed, open **Agent Threads** from the ribbon icon (a message-square icon on the left edge of the window) or run **Open Agent Threads** from the command palette. Continue to [Dispatching your first task](/docs/getting-started/first-thread/) to send your first message.
