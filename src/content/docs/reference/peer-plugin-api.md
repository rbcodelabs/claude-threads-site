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

`artifacts.allocateStorage` accepts `{ location: 'hidden' | 'visible', folderName, owner }`; the `artifacts.visibleStorage` capability flag reports support. Hidden storage (the default) stays under `.geode/artifacts/`. Visible storage lands in `<vault>/<root>/<pluginId>/<folderName>/`, where the root is the **Visible artifact folder** setting (default `Artifacts`, a single folder name). `owner` is required for visible storage, and an unsafe plugin id is rejected rather than cleaned. Renaming the root affects new artifacts only; existing ones keep their stored root.

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

Design for Agent Threads is a standalone peer: it registers `/design`, the `EnterDesignMode` agent tool, and the `agent-threads.design` artifact provider through public API v1 and uses `threads.beginProvisional` for new-thread transactions. Agent Threads retains only a read-only source-reveal fallback for legacy design artifacts when the peer is absent. The complete contract and implementation notes are in the plugin's `docs/public-api.md` and `api/public-api-v1.d.ts`.

## Artifacts

Artifacts are durable, peer-owned results shown as cards on a thread. Check `capabilities` before using any of this.

- `extensions.registerArtifactProvider(owner, contribution)` presents them. A provider supplies a namespaced `providerId` (`<publisher>.<capability>`), the artifact `kinds` it owns, `present(ref)` returning a title, optional subtitle and icon, and named actions, and `invoke(actionId, ref, host)` to run one action. It never receives a view, workspace leaf or DOM node; the host lends an `ArtifactActionHost` for each call with `openView()`, `revealInFolder()` and `updateArtifact()`. `ref.data` is opaque to the host, so the provider owns its schema and migrations.
- Duplicate provider ids fail with `status: 'conflict'` and a non-namespaced id with `status: 'invalid'`. Every result has an idempotent `dispose()`, and all registrations are dropped when the host stops.
- Callbacks are isolated and bounded. A `present()` that throws degrades only that card to a placeholder; an `invoke()` that throws or times out becomes an error result shown to the user.
- An artifact whose provider is not registered still renders with its stored title, names the missing provider, and has no actions. Uninstalling a plugin never makes prior work vanish. Legacy `design-static` artifacts keep a read-only source-reveal fallback, which a live Design plugin overrides.
- The `artifacts` namespace creates and opens them without a view or private manager access. `artifacts.attach(owner, threadId, ref)` persists an artifact and returns `attached` or `updated`; it is idempotent on `ref.id`. `artifacts.update` and `artifacts.detach` take the same explicit `owner`, which is checked against whoever registered `ref.providerId`, so one plugin cannot write into another's namespace (`conflict`; `unknown-provider` and `invalid` cover an unregistered provider and an undeclared kind). `owner` is self-declared, not authenticated.
- `artifacts.invokeAction(threadId, artifactId, actionId)` runs an action on the same path a card click takes. Input a caller could plausibly get wrong returns a structured outcome; only a revoked generation throws `PLUGIN_UNAVAILABLE`.
- `ThreadArtifactRef.storageRoot` is optional and must lie inside `<vault>/.geode/artifacts/` or a plugin's folder under the visible root. A bad root fails the whole `attach`. `data` must be a plain JSON object, capped at 256 KiB serialized. `artifacts.allocateStorage` (see [Threads](#threads)) creates the root, and re-allocating returns the existing one with `status: 'existing'`.

## Agent tools

`extensions.registerAgentTool(owner, contribution)` adds an in-process tool that every thread session can call.

- The host injects the thread id: a peer writes `invoke(threadId, args, host)` and never chooses a thread. `AgentToolHost.allocateStorage` stamps the tool's registered owner, so storage allocated from a tool is host-attributed.
- Names cannot be shadowed. A name that collides with a host built-in, a core agent tool such as `Read` or `Bash`, or another peer's tool is rejected with `status: 'conflict'`; the incumbent always survives.
- Schemas are plain JSON Schema, so no shared zod instance is needed. Unrecognised schema shapes degrade to accepted-but-unvalidated, so re-check arguments inside `invoke`.
- Approval is required by default: a tool counts as a mutation unless it sets `requiresApproval: false`.
- A tool that throws, returns a malformed result or hangs past the host timeout becomes an ordinary tool error for that one call.
- Registrations are dropped on `dispose()` and host stop. Running sessions are not retrofitted: a tool registered after a session's tools were built appears on the next session.

`threads.permissions(threadId)` returns the effective permission mode and whether a plan approval or question is pending, so a peer writing on a thread's behalf can tell whether writing is allowed.

## Inline message content

`extensions.registerMessageContentProvider(owner, contribution)` lets a peer render rich content inside an assistant reply, between the surrounding paragraphs, rather than as an artifact above the composer. Check `capabilities` for `extensions.registerMessageContentProvider`, register once per API generation, and dispose on unload. The host owns every card, image, button and sandbox frame; providers never receive host DOM.

```ts
const registration = api.extensions.registerMessageContentProvider(
  { pluginId: 'example-reports' },
  {
    providerId: 'example.reports',
    present(ref, context) {
      if (ref.schemaVersion !== 1 || typeof ref.data.reportId !== 'string') {
        throw new Error('Unsupported report reference');
      }
      return {
        kind: 'card',
        title: ref.title,
        body: 'Open the report to review its supporting details.',
        actions: [{ id: 'open', label: 'Open report', variant: 'primary' }],
      };
    },
    async invoke(actionId, ref, context, host) {
      if (context.signal.aborted || actionId !== 'open') {
        return { status: 'error', message: 'Action unavailable' };
      }
      await host.openView({ type: 'example-report-view', state: { reportId: ref.data.reportId } });
      return { status: 'ok' };
    },
  },
);

const reference = api.messageContent.formatReference({
  providerId: 'example.reports',
  id: 'report-q3',
  schemaVersion: 1,
  title: 'Quarterly report',
  data: { reportId: 'report-q3' },
});
```

The marker is `agent-content` followed by the serialized JSON object; use `formatReference` instead of assembling it. Return the reference from a contributed tool and instruct the assistant to put it verbatim on its own line, outside a code block. Registering or formatting never sends a message or starts a turn, and Claude and Codex share one rendering path.

| Kind | Content |
|---|---|
| `card` | Title, optional subtitle and icon, optional plain-text body and named actions |
| `image` | Title, image source and alt text, optional subtitle and named actions |
| `document` | Title and self-contained HTML, optional subtitle, bounded height and named actions |

Images accept supported raster data URLs and HTTPS sources; an HTTPS image makes an ordinary browser request, so prefer inline data. Documents run in nested opaque-origin frames: scripts are allowed, but remote resources, navigation, host access, forms, popups and downloads are blocked, so keep CSS, scripts and assets inside the HTML and expose host operations as named card actions.

Only assistant transcript content activates providers; user messages, code examples and plan text cannot. While a message streams, references show inert fallback cards, and provider callbacks and document scripts start once it settles. The mobile relay view shows readable fallback cards without executing desktop providers or forwarding their actions.

The reference is saved as ordinary message content, so its fallback title stays visible if the provider is absent, removed or fails. It can be archived or relayed with the conversation, so use identifiers and non-secret values. Callbacks are bounded, receive `threadId`, `messageId` and an abort signal, and are cancelled on thread switch, rerender, disposal and shutdown; honor cancellation and validate reference data. Invalid or duplicate registrations return structured failures, and a callback error degrades only the affected card.

## MCP presets

Available in Agent Threads v0.58.0 or later. Peer plugins can read the same OAuth MCP presets behind [Settings → MCP → Quick connect](/docs/integrations/mcp-servers/#quick-connect) instead of hardcoding provider URLs.

- `api.mcp.listPresets()` returns the built-in presets as a frozen array of `{ id, label, name, url, scopes?, redirectUri?, requiresClientId, requiresClientSecret, notes?, setupUrl?, source }`. Each call returns fresh frozen copies, so a peer can read but never alter the host's list.
- `api.mcp.registerPreset(id, overrides?)` merges a preset with your overrides and registers it through the same path as `mcp.register`, so validation, the consent dialog, and the `registered` / `unchanged` / `unavailable` results are identical.

Allowed overrides are `name`, `scopes`, `tools`, `clientId`, `clientSecret`, `authorizationServerUrl`, `redirectUri`, and `audience`; overrides win over preset values. `url`, `type`, and `grantType` belong to the preset and can never be overridden — use `mcp.register` for a custom server. `clientSecret` must be a `${NAME}` placeholder for a secret saved with `mcp.requestSecret`, never a literal.

Feature-detect before calling:

```ts
if (api.capabilities.includes('mcp.registerPreset')) {
  const preset = api.mcp.listPresets().find((p) => p.label === 'Linear');
  if (preset) await api.mcp.registerPreset(preset.id);
} else {
  // Older host, or one that cannot register MCP servers
  await api.mcp.register({ name: 'linear', type: 'oauth', url: 'https://mcp.linear.app/mcp' });
}
```

The `mcp.listPresets` capability is always present on hosts that support presets; `mcp.registerPreset` is present only when the host can register MCP servers. On hosts without them, fall back to `mcp.register` with your own configuration.

`registerPreset` throws `INVALID_ARGUMENT` for an unknown preset id, a forbidden override, or a preset that requires a client ID (such as Asana) when no `clientId` override is given.

## Persistence and errors

Correlated operations are serialized and their state is durably saved before a resource handle is returned. Results and correlation mappings are retained and evicted together. After a plugin reload, an in-flight operation reconciles as interrupted instead of being duplicated.

Handle errors by their stable `code`, not their message. Public v1 codes include `PLUGIN_UNAVAILABLE`, `THREAD_NOT_FOUND`, `RUN_NOT_FOUND`, `RUN_FAILED`, `RUN_INTERRUPTED`, `THREAD_BUSY`, `IDEMPOTENCY_CONFLICT`, `TRACE_NOT_FOUND`, `CURSOR_INVALID`, `CONSTRAINT_UNSUPPORTED`, `ORCHESTRATOR_NOT_FOUND`, and `INVALID_ARGUMENT`.

The complete TypeScript declaration ships with the plugin as `api/public-api-v1.d.ts`.
