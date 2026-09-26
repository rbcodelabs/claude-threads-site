---
title: Peer Plugin API v1
description: Build Geode and Obsidian plugins that create Agent Threads, read sanitized traces, and run isolated one-turn evaluations.
category: reference
order: 5
---

Agent Threads exposes a generation-scoped API to other enabled Geode and Obsidian plugins. It is designed for integrations such as WikiSkill that need durable, correlated background work without importing Agent Threads internals.

```ts
const api = app.plugins.plugins['claude-threads']?.api?.v1;
```

Listen for `claude-threads:api-ready` and `claude-threads:api-stopping`. Reacquire the API after every `api-ready` event, and discard the previous object when its generation stops. Calls on a stopped generation fail with `PLUGIN_UNAVAILABLE`.

## Threads

`threads.list`, `threads.get`, `threads.create`, `threads.send`, `threads.wait`, `threads.cancel`, `threads.open`, and `threads.subscribe` provide immutable snapshots and lifecycle events. Hosts advertising `threads.beginProvisional` also support reversible peer-owned creation workflows.

For durable retries, provide both `ownerPluginId` and `idempotencyKey`. A key is bound to its operation, target thread, and exact input fingerprint. Reusing it with different input fails with `IDEMPOTENCY_CONFLICT`.

```ts
const { threadId } = await api.threads.create({
  title: 'WikiSkill authoring job',
  ownerPluginId: 'geode-wikiskill',
  idempotencyKey: jobId,
  externalJobId: jobId,
  ephemeral: true,
  background: true,
});

const { runId } = await api.threads.send(threadId, {
  prompt,
  ownerPluginId: 'geode-wikiskill',
  idempotencyKey: `${jobId}:author`,
});

const result = await api.threads.wait(runId, { timeoutMs: 120_000 });
```

When an owner is supplied, omitted `origin` defaults to `ownerPluginId`; a conflicting explicit origin is rejected. Managed threads with an origin are excluded from trace sources, preventing self-training loops. Background threads are also hidden from Agent Board surfaces.

Only one distinct active send is allowed per thread. A competing send fails with `THREAD_BUSY`. Cancellation, completion, and provider shutdown use first-terminal-wins semantics.

`threads.beginProvisional(owner, input)` returns an immutable handle with `threadId`, `commit()`, and `rollback()`. The thread cannot run until commit. Rollback deletes it, restores the prior selection, and releases storage allocated through `artifacts.allocateStorage`; unresolved handles are rolled back when the API generation stops. Commit and rollback are serialized and idempotent.

## Archive and reviewed state

Check `capabilities` for `threads.archive` and `threads.markReviewed` before using these optional v1 operations:

```ts
const archived = await api.threads.archive(threadId);
// { status: 'archived' | 'cancelled', threadId }
const reviewed = await api.threads.markReviewed(threadId);
// { threadId, reviewed: true, changed: boolean }
```

Use exact IDs from thread discovery. Archive reuses the host's persistence and eviction path and awaits pending-wakeup cancellation before returning success. Running threads and Portfolio/Project orchestrators require an actual host confirmation dialog; a caller cannot bypass it by supplying a flag. The last remaining thread is protected, and targets and safeguards are revalidated after confirmation. Cancellation returns `cancelled`; storage or lifecycle failures reject. An archived conversation is saved as a vault note only when `saveThreadsToVault` is enabled; do not promise recovery when that setting is disabled.

Mark reviewed is idempotent, saves the flag, and refreshes list/board state without opening the thread or changing conversation recency. Running and missing targets are rejected. Calls on stopped API generations remain invalid.

These methods use the trusted peer-plugin boundary, not the internal assistant's Project-scoped authorization. Integrators should require user intent, clarify ambiguous names, and display the actual result. `agentTools.createBundle('voice-orchestration')` exposes `ct_archive_thread` and `ct_mark_reviewed` only when supported; older hosts retain their existing schemas. Recreate the bundle after reacquiring an API generation. This does not change internal assistant self-archive behavior.

## Sanitized traces

`traces.listSources`, `traces.readChunk`, and `traces.subscribe` expose bounded semantic records—not raw SDK logs. Source discovery uses a stable source-ID cursor. Trace cursors bind the source, append-stable revision, byte offset, event index, and a byte-boundary fingerprint so stale or rewritten sources fail with `CURSOR_INVALID`.

Every chunk returns `nextCursor`, including when `eof` is `true`. Retain that cursor and resume from it after a later `trace.updated` event; ordinary appends do not invalidate it.

```ts
const page = await api.traces.listSources({ limit: 50 });
const chunk = await api.traces.readChunk(page.sources[0].sourceId, {
  cursor: savedCursor,
  limit: 100,
});

savedCursor = chunk.nextCursor;
```

Trace projection strips credentials, secret fields, session IDs, raw-log paths, and local POSIX, Windows, UNC, home-relative, and file-URI paths. Treat remaining trace text as untrusted and apply your own policy before persisting it.

Verified Skill activity has two distinct semantics:

- A successful registered Skill tool result carries `invokedSkill` and `skillLoadOutcome: 'loaded'`. This means the skill loaded; it does not mean the task succeeded.
- A terminal `result` event carries `skillRunOutcomes`, an array of `{ invokedSkill, runOutcome, invocationIndex }`. `runOutcome` is `success` or `failure` for the enclosing run.

Failed or rejected loads, unregistered skill names, and text-only claims are never attributed as invoked skills.

## Constrained runs

`constrainedRuns.create`, `get`, `wait`, and `cancel` provide Claude-only, one-turn, input-only evaluation. They are intended for bounded grading or synthesis where tools and host context are unnecessary.

```ts
const { runId } = await api.constrainedRuns.create({
  ownerPluginId: 'geode-wikiskill',
  idempotencyKey: `${jobId}:grade`,
  harness: 'claude',
  model: 'haiku',
  systemInstructions: 'Grade only the supplied evidence.',
  prompt: evidence,
  maxTurns: 1,
  maxBudgetUsd: 0.10,
  timeoutMs: 60_000,
});

const result = await api.constrainedRuns.wait(runId);
```

Each run uses a fresh empty working directory and isolated home/config directory, then removes it. The runner imports no host settings, hooks, plugins, skills, MCP servers, tools, filesystem context, or resumable session. Provider credentials are projected from Agent Threads' keychain-backed resolver through an exact authentication-variable allowlist; the host configuration directory is never copied.

Inputs, budget, timeout, output (100,000 characters), and total persisted public API state (1 MiB) are bounded. Unsupported constraints fail with `CONSTRAINT_UNSUPPORTED`.

## Contributed slash commands

When `capabilities` includes `extensions.registerSlashCommand`, enabled peers can add commands to the thread composer and/or the Agents List and Agent Board dispatch inputs. The separate Design for Agent Threads plugin uses this path for `/design`.

```ts
const command = api.extensions.registerSlashCommand({ pluginId: 'example.boards' }, {
  name: 'board',
  thread: {
    description: 'Open the board for this thread',
    argCompletions: [
      { name: 'sprint', description: 'Current sprint board' },
      { name: 'backlog', description: 'Full backlog board' },
      { name: 'archive', description: 'Closed/archived board' },
    ],
    async invoke(context, host) {
      if (host.signal.aborted) return { status: 'error', message: 'Cancelled' };
      await openBoard(context.threadId, context.args);
      host.report('Board opened');
      return { status: 'ok' };
    },
  },
});
// On peer unload:
command.dispose();
```

Provide `thread`, `dispatch`, or both, each with a description and callback. Names are lowercase tokens without `/`, beginning with a letter and containing up to 64 letters, digits, or hyphens. Core commands, the enabled escalation keyword, and other peers' names cannot be shadowed. Results are `registered`, `invalid`, `conflict`, or `unavailable`; every result has an idempotent disposer.

A handler may also supply `argCompletions`: up to 20 `{ name, description }` entries (name ≤64 characters, description ≤256) offered in the composer's argument dropdown once the command name has been typed — the same dropdown the host's own built-in `/model` completions use. A malformed entry rejects the whole registration as `invalid`.

The host supplies immutable `surface`, original `text`, parsed multiline `args`, captured `threadId` for composer commands, `agentHarness`, `projectId` when available, and attachment-presence flags. Peers receive neither attachment contents nor DOM/view/private-manager access. Dispatch callbacks receive the selected project but decide how to use it; Design's existing dispatch behavior does not apply that selection.

Return `{ status: 'ok' | 'error', message?: string }`. Use `host.report` for scoped feedback and heed `host.signal` for cooperative cancellation. Exceptions, invalid results, disposal, and a 60-second timeout become errors, never ordinary agent prompts. Failed dispatches restore the draft and attachments without discarding newer input. Registration updates dropdowns and pills immediately; disposal and host shutdown revoke callbacks and feedback. Arbitrary peer side effects cannot be rolled back by the host.

Design for Agent Threads is a standalone peer: it registers its command, agent tool, and artifact provider through public API v1 and uses `threads.beginProvisional` for new-thread transactions. Agent Threads retains only a read-only source-reveal fallback for legacy design artifacts when the peer is absent. The complete contract and implementation notes are in the plugin's `docs/public-api.md` and `api/public-api-v1.d.ts`.

## Persistence and errors

Correlated operations are serialized and their state is durably saved before a resource handle is returned. Results and correlation mappings are retained and evicted together. After a plugin reload, an in-flight operation reconciles as interrupted instead of being duplicated.

Handle errors by their stable `code`, not their message. Public v1 codes include `PLUGIN_UNAVAILABLE`, `THREAD_NOT_FOUND`, `RUN_NOT_FOUND`, `RUN_FAILED`, `RUN_INTERRUPTED`, `THREAD_BUSY`, `IDEMPOTENCY_CONFLICT`, `TRACE_NOT_FOUND`, `CURSOR_INVALID`, `CONSTRAINT_UNSUPPORTED`, `ORCHESTRATOR_NOT_FOUND`, and `INVALID_ARGUMENT`.

The complete TypeScript declaration ships with the plugin as `api/public-api-v1.d.ts`.
