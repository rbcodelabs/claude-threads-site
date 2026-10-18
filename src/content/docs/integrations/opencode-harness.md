---
title: OpenCode Harness
description: Run a thread on OpenCode to use Amazon Bedrock, the Anthropic API, OpenAI, OpenRouter, or local models, with setup, model IDs, and current limitations.
category: integrations
order: 5
---

Agent Threads can run a thread on one of three agent harnesses: **Claude Code**, **OpenAI Codex**, and **OpenCode**. [OpenCode](https://opencode.ai) is an open-source coding agent that works with many model providers, so an OpenCode thread can use Amazon Bedrock, the Anthropic API, OpenAI, OpenRouter, a local model, or any other provider OpenCode supports. The thread keeps the usual Agent Threads chat, permission cards, host tools, and [harness switching](#switching-harnesses).

OpenCode is **desktop only**. Mobile never launches it.

> **Billing:** OpenCode uses the API key or cloud credentials of whichever provider you configure, and that provider bills you for the usage. It does not use a Claude subscription. If you have a Claude Pro or Max subscription, use the **Claude** harness to run on that subscription.

## Install OpenCode

Install the `opencode` binary using one of the methods in the [OpenCode docs](https://opencode.ai/docs/), for example:

```bash
npm install -g opencode-ai
```

Agent Threads looks for `opencode` on your `$PATH` and in the usual locations: Homebrew, `/usr/local/bin`, and `~/.opencode/bin`. If you installed it somewhere else, set **Settings → Agent → OpenCode binary path** to the full path of the executable.

Each active OpenCode thread starts its own local `opencode serve` process, which listens only on `127.0.0.1`. That process stops when the thread's session closes.

### OpenCode versions

Agent Threads supports both the 1.x and 2.x OpenCode servers (verified against 1.18.32 and 2.0.32). It detects which one is installed, so there is nothing to configure. On 2.x, OpenCode's task/todo list stays empty in the thread because the 2.x server doesn't send todo events.

## Configure a provider and model

Agent Threads does not manage OpenCode providers, models, or credentials. You set them up in OpenCode itself, using one of these methods:

- **`opencode auth login`**: run it in a terminal to store a provider API key in OpenCode's own credential store.
- **Environment variables**: set them under **Settings → Agent → Extra environment variables**, or store them in [Secrets](/docs/reference/settings/#secrets) so the value stays out of `data.json`. OpenCode threads receive both. Common examples:
  - `ANTHROPIC_API_KEY` for the Anthropic API
  - `OPENAI_API_KEY` for OpenAI
  - `AWS_PROFILE` and `AWS_REGION` for Amazon Bedrock with AWS profile or SSO credentials, or `AWS_BEARER_TOKEN_BEDROCK` (together with `AWS_REGION`) for a Bedrock API key
- **`~/.config/opencode/opencode.json`**: define `provider` entries (for example, a local model or a custom base URL) and a default `model`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "amazon-bedrock/anthropic.claude-sonnet-4-5-20250929-v1:0",
  "provider": {
    "amazon-bedrock": {
      "options": { "region": "us-east-1", "profile": "my-sso-profile" }
    }
  }
}
```

The provider name and model ID above are examples. To see the IDs your installation accepts, run `opencode models`.

## Skills

OpenCode threads load the same skill sources as Claude and Codex threads: your [plugin skill sources](/docs/automation/skills-manager/), your local Skills folder, and skills installed in your vault. Agent Threads hands these folders to OpenCode through its native `skills.paths` setting, so nothing is copied or symlinked.

Two OpenCode behaviors to be aware of:

- OpenCode also scans `~/.claude/skills` on its own, so skills there are available regardless of your skill sources.
- On OpenCode 2.x, stray top-level `.md` files inside a skill folder can show up as skills. Keep only `<name>/SKILL.md` layouts in folders you share with OpenCode.

## Select OpenCode

- **For new threads:** choose **OpenCode** under **Settings → Agent → Agent harness**, or pick it in the Agents List or Agent Board kickoff selector.
- **For an existing thread:** open its footer menu, choose **Harness**, and then select **OpenCode**.

### Model IDs

OpenCode model IDs use the form `provider/model`, for example `openai/gpt-5` or `anthropic/claude-sonnet-4-5`. The thread's model menu and [`/model`](/docs/core-workflow/models-goals-loops/) list the models your OpenCode installation reports. If you don't choose a model, the thread uses the default `model` from your OpenCode config.

## Permissions and plan mode

Agent Threads applies [permission modes](/docs/permissions/permission-modes-and-plan-mode/) to OpenCode as the session runs:

| Mode | OpenCode behavior |
|---|---|
| Default | Prompts for anything beyond read-only tools. Read-only tools (read, glob, grep, list) always run. |
| Accept edits | Approves file edits automatically. Other actions still prompt. |
| Bypass / Auto | Approves everything. |
| Don't ask | Denies anything that would prompt, so scheduled runs never stall. |
| Plan | Uses OpenCode's read-only `plan` agent and refuses edits. |

Agent Threads host tools (vault, thread coordination, and others) reach OpenCode through a private per-session MCP endpoint. They follow the same approval rules as on Codex. On OpenCode 2.x, the bridge's tools are allowed by name prefix.

## Switching harnesses

A thread's harness is saved with the thread, so changing the default harness doesn't affect existing threads. You can switch an idle thread between Claude, Codex, and OpenCode. The transcript and thread identity stay in place. The new harness starts a fresh native session from a summary of the conversation, and the model resets to that harness's default.

## Current limitations

Compared with the Claude and Codex harnesses, OpenCode threads currently have these gaps:

- **No plan-approval card.** In plan mode, OpenCode's `plan` agent answers in prose instead of presenting a plan to approve.
- **No MCP elicitation.** MCP servers can't ask you for input during a tool call.
- **Subagents aren't shown as agent runs.** Work that OpenCode delegates with its `task` tool is followed for permission prompts and questions, but it doesn't appear as a separate background agent.
- **No quota data.** The usage panel has no account quota or rate-limit information for OpenCode.
- **Effort setting is ignored.** Claude's effort level and Codex reasoning effort don't apply to OpenCode threads.
