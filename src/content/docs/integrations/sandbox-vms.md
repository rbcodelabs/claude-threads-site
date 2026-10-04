---
title: Sandbox VMs
description: Run coding commands in a disposable Linux VM on your Mac, with an explicit workspace mount and network mode.
category: integrations
order: 4
---

Sandbox VM tools let a thread run build commands, dependency installs, and tests in a separate Linux VM using Apple's `container` runtime. The workspace remains on your Mac and is mounted at `/work` inside the guest. Your vault is also mounted at `/vault` (see below).

These tools require macOS 26 or later, Apple silicon, and Apple's `container` runtime (installed for you by the setup above). They are unavailable on mobile. Where a tool supports both harnesses, the examples below use the canonical names shared by Claude and Codex.

## Set up the sandbox

Open **Settings → Claude → Sandbox setup** and press **Set up sandbox**. Agent Threads then:

1. installs Apple's `container` runtime (a pinned, SHA-256-verified copy of the signed installer, unpacked without admin rights into `~/Library/Application Support/claude-threads/runtime`, outside the vault, and only used when no system copy exists);
2. starts the runtime's service (the first start downloads a Linux kernel, about 29 MB);
3. pulls the published base image and builds the local Claude layer.

A confirmation states what will be downloaded before anything starts (the runtime installer is about 118 MB, the base image several hundred MB), progress is shown live, and **Cancel** stops it. Every step is skipped when already satisfied, so running it twice is safe. The button reads **Set up sandbox**, **Finish setup**, or **Update sandbox** depending on what is left. It is hidden on unsupported Macs (the reason is shown instead) and on mobile.

When a Claude thread starts on the host because the sandbox is not set up, a one-time card in that thread offers the same setup (**Set up sandbox**, **Not now**, **Don't ask again**). The thread keeps running on your Mac meanwhile; a finished setup applies from its next fresh session start.

### Update or reset the image

An image is treated as out of date when it carries an older version label (the current base image is version 2; version 1 predates the GitHub CLI `gh`), or when running it shows it lacks a required tool (`gh` and `git` in the coding image, plus `claude` in the harness image). An unlabeled image that has every tool is treated as your own build and kept.

When an image is out of date, **Sandbox setup** shows **Update available**, an **Image version** line (for example `Image unlabeled -> v2 available (missing gh)`), and an **Update sandbox** button that pulls the current base and rebuilds the Claude layer. When a thread starts in a VM whose image is out of date, a notice in the transcript (or a note on the `enter_vm` result) names the problem and points at the button. The VM still starts. A check that cannot run is treated as unknown, never as out of date.

**Reset sandbox** appears next to the setup button once the runtime is installed. After a confirmation it removes the local base and harness images and runs setup again, so both are pulled and rebuilt from scratch. Stop running sandbox VMs first: an image in use cannot be removed, and the reset stops with a message naming it. A reset also discards a hand-built `claude-threads-coding:1`.

### Manual fallback (advanced)

If you prefer to manage the runtime yourself, or automatic setup cannot run, install and start Apple's runtime and build the image from the Agent Threads source checkout containing `sandbox/Dockerfile`:

```sh
brew install container
container system start
container build --tag claude-threads-coding:1 sandbox/
```

A system copy of the runtime (Homebrew or Apple's installer) always takes precedence over the managed one.

The image includes Node 22, npm, Git, the GitHub CLI (`gh`, in images built from the current Dockerfile), ripgrep, jq, curl, wget, Python, and native build tools. Commands run as a non-root user. The image contains no credentials, and the VM tools do not automatically forward your host environment or SSH agent into the guest. Custom images must include Bash, GNU `timeout`, and `sleep infinity`.

### Memory and CPUs

Each container gets a 4G memory ceiling and 4 CPUs by default. Change them under Settings → Agent → **Sandbox VM memory** (for example `8G` or `2048M`) and **Sandbox VM CPUs** (a whole number from 1 to 64). Invalid values fall back to the defaults. Changes apply only to newly created containers: remove an existing one with `container rm --force claude-threads-vm-<thread-id>` and it is recreated on next use. Removing a harness container also discards its native Claude history; the thread can then recover with a fresh session and recent saved conversation context.

## Run a coding task

Ask the agent to create a Git worktree, enter a VM using that worktree as its mount, and use `vm_exec` for commands:

> Create an isolated worktree for this task. Mount only that worktree in a sandbox VM, run dependency installation and tests through vm_exec, and exit the VM when finished. Keep the worktree for review.

| Tool | Parameters | Behavior |
|---|---|---|
| `enter_vm` | `image?`, `network?`, `mountPath?` | Starts the thread's VM. The mount defaults to the thread's effective working directory. A stale image adds a note to the result; connected external roots are listed under `mountedExternal`. |
| `vm_exec` | `command`, `timeoutSeconds?` | Executes `bash -lc` in `/work`. The default timeout is 300 seconds. Returns the command's exit code, stdout, and stderr; long output is truncated with a marker. |
| `exit_vm` | `force?` | Stops and removes the thread's VM. Guest-only files are discarded; files written through `/work` remain on your Mac. |

For example, after entering the VM:

```json
{"command":"npm ci && npm test","timeoutSeconds":300}
```

`enter_vm` does not switch the agent's ordinary shell or file tools into the VM. Only `vm_exec` runs commands there. Host tools retain their existing permissions. Ask explicitly for VM execution when you want dependency scripts or tests to run inside the guest.

Install dependencies inside the guest: existing macOS `node_modules` may contain binaries that cannot run on Linux. A Git worktree's `.git` file can also point to host metadata outside the mount; use host Git tools for commits and PRs when that metadata is unavailable inside the guest.

## Choose a network mode

Network mode is chosen when entering the VM and applies for its lifetime. Exit and enter again to change it.

| Mode | Internet | Host network |
|---|---|---|
| `default` | Allowed, including package registries | Reachable according to the runtime's bridge routing |
| `internal` | Blocked | Host gateway remains reachable |
| `none` | Blocked | No network route |

Full internet access is the default so dependency downloads work. For offline tasks, choose `none` and prepare dependencies beforehand. `internal` is host-only networking, not a complete network disconnect.

## Understand the boundary

The guest has its own Linux kernel and filesystem. The chosen `/work` mount is writable: guest commands can change or delete files there, including any credentials already stored in that directory. Use a disposable worktree and avoid selecting your home directory as the mount. With internet access enabled, guest commands can send mounted content over the network.

Besides the selected workspace, the guest also gets:

- **Your vault, read-write, at `/vault`.** The path is fixed regardless of the thread's working directory, so agents working in a disposable worktree can still edit notes. It also means a VM is not a boundary protecting the vault: guest commands can modify or delete any note, so keep vault backups or sync history. If the thread's working directory is the vault itself, it is mounted twice (`/work` and `/vault`). The mount is skipped when the host exposes no vault filesystem path. A container created before this mount existed is kept to preserve its conversation history; new thread containers include it, and for an `enter_vm` VM you can `exit_vm` and enter again.
- **Geode external roots, read-only, at `/ext/<label>`.** On Geode, each connected external root is mounted read-only. Roots that are not absolute existing directories, contain a colon, or fall inside `/work` are skipped, and colliding labels get `-2`, `-3` suffixes.
- **GitHub access, when enabled.** With **Use Geode GitHub connection** on (Geode only), `git` over HTTPS and `gh` inside the VM are authenticated through a short-lived private file that is never under `/work`. Use `github_list_access` and `github_check_repo` to see which repositories are reachable; commits use your GitHub noreply address unless you set **GitHub commit email**. Your own `GH_TOKEN`, `gh` login, and git credential helpers take priority. See [Settings](/docs/reference/settings/#sandbox-vms).

Removing the VM resets guest-only state; it does not undo changes to the mounted workspace. Keep work you want to review in that workspace before calling `exit_vm`.

Deleting or archiving a thread removes its container automatically, so calling `exit_vm` first is optional. About a minute after startup on desktop, a best-effort sweep also removes leftover `claude-threads-vm-*` containers whose thread no longer exists, and skips any it can't match to a thread.

## Choose container or host per thread

Claude threads can run their harness in the sandbox container or directly on the host. Open the thread's harness menu and use the **Run in** section:

| Choice | Behavior |
|---|---|
| **Container** | Always run this thread's harness in the container. |
| **Host (no container)** | Always run this thread's harness on the host. |
| **Default (follows settings)** | Clear the override and follow the global container setting. |

The header shows the mode, for example "Harness: Claude · Container" or "Harness: Claude · Host (no container)". Codex threads do not show the section because they are not routed through the container.

A change takes effect the next time the thread's session starts. The menu items are disabled while a turn or other pending work is in progress.

Switching between **Host** and **Container** asks for confirmation. The container has its own `~/.claude`, so a native Claude session cannot be resumed across the boundary. If you confirm, the thread resets its session and continues from a summary and transcript references, as it does when you switch harnesses. Switching between **Default** and **Container** keeps the session, because both use the container when it is available.

### Skills and lifecycle tools in a container-routed thread

When a Claude thread runs in the container, your skill directories (configured skill sources, vault skills, bundled skills, `~/.claude/skills`, and `~/.claude/agents`) are bind-mounted into it read-only and the session's plugin paths are rewritten to the guest paths. Agent Threads never writes into `~/.claude`. Because `vm_exec` shares the container, the agent can read these mounts, so skills you consider private are visible to it.

Because the harness already runs inside the container, container-routed sessions do not offer `enter_vm` or `exit_vm`; host-local sessions, including automatic fallbacks, keep all three VM tools. The container is removed when the thread is deleted or archived, not at ordinary session close.

## MCP access from a VM-hosted Claude harness

When Claude's harness itself runs inside the sandbox VM, Agent Threads keeps its host-resident OAuth and Google Workspace MCP brokers available through the Agent SDK connection. Requests cross that existing SDK bridge to the host brokers, so Agent Threads does not expose a host listener to the guest or copy OAuth credentials into the VM.

That bridge is intentionally limited to MCP services Agent Threads already brokers on the host. Other external MCP transports keep their normal execution boundary:

- A direct HTTP or SSE server is contacted from the guest and must be reachable under the VM's selected network mode.
- A stdio server starts inside the Linux guest. Its command, dependencies, paths, and binaries must therefore be Linux-compatible.

Choosing `none` still blocks guest networking. Host-brokered OAuth and Google Workspace MCPs remain available over the SDK connection, but the setting does not create a general guest-to-host network route or bypass the network policy for direct remote servers.

## Host commands from a VM-routed Claude thread

After an interactive Claude thread has successfully routed its harness into the VM, it can use `host_exec({ command, cwd?, reason, timeoutSeconds? })` when a task genuinely requires one command on the Mac host. Prefer `vm_exec` for work that can stay inside the guest.

Every call shows an inline approval card in the thread (desktop and mobile) with the command as the headline and the working directory, agent-supplied reason, and timeout under Details. You must choose **Allow once** or **Deny**. There is no pop-up dialog. Permission modes and auto-approval cannot bypass this prompt, there is no permanent allow option, and a previously saved always-allow entry for `host_exec` is ignored. Scheduled and otherwise non-interactive calls are denied without running anything.

Approved commands run through `/bin/sh -c` with your account's permissions. The working directory must be an existing absolute host path and defaults to the thread's current directory. The process receives only a small allowlist of ordinary environment variables, not harness credentials or API tokens. Each stdout and stderr stream is capped at 64 KiB with a truncation marker, GitHub-token-shaped strings are redacted from returned output, and the command times out after 300 seconds by default (up to 3,600 seconds), with termination followed by forced kill if needed. Non-zero exit codes are returned as results.

`host_exec` is exposed only after VM routing succeeds on an interactive desktop Claude thread. It is unavailable when Claude falls back to the host, on mobile, in Codex or OpenCode threads, and through the deprecated `obsidian` MCP alias.

## Troubleshooting

When the Claude harness runs in a container, its native conversation history lives in the guest filesystem. Agent Threads preserves that container across plugin reloads, including when configured skill mounts change, so saved sessions remain available. Existing containers retain their original mount set; new mount paths become available in new thread containers. Plugins whose paths are absent from an existing container are omitted from that session.

If a container was already removed, or Claude otherwise cannot find a saved conversation, Agent Threads can continue in the same visible thread with a fresh native session and recent saved conversation history. This recovery happens once before assistant or tool work begins. It does not restore every detail of the original native session.

If the runtime is unavailable, check `container system status` and start it with `container system start`. If the coding image is missing or out of date, press **Set up sandbox** / **Update sandbox**, or **Reset sandbox** to rebuild from scratch.

A VM can survive a plugin reload. If `enter_vm` reports that the thread already has a VM, use `exit_vm` before starting a fresh one. Do not remove a VM while it is doing work you need to preserve.
