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

`threads.list`, `threads.get`, `threads.create`, `threads.send`, `threads.wait`, `threads.cancel`, `threads.open`, and `threads.subscribe` provide immutable snapshots and lifecycle events.

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

## Persistence and errors

Correlated operations are serialized and their state is durably saved before a resource handle is returned. Results and correlation mappings are retained and evicted together. After a plugin reload, an in-flight operation reconciles as interrupted instead of being duplicated.

Handle errors by their stable `code`, not their message. Public v1 codes include `PLUGIN_UNAVAILABLE`, `THREAD_NOT_FOUND`, `RUN_NOT_FOUND`, `RUN_FAILED`, `RUN_INTERRUPTED`, `THREAD_BUSY`, `IDEMPOTENCY_CONFLICT`, `TRACE_NOT_FOUND`, `CURSOR_INVALID`, `CONSTRAINT_UNSUPPORTED`, `ORCHESTRATOR_NOT_FOUND`, and `INVALID_ARGUMENT`.

The complete TypeScript declaration ships with the plugin as `api/public-api-v1.d.ts`.
