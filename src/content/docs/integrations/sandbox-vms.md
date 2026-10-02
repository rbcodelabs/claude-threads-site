---
title: Sandbox VMs
description: Run coding commands in a disposable Linux VM on your Mac, with an explicit workspace mount and network mode.
category: integrations
order: 4
---

Sandbox VM tools let a thread run build commands, dependency installs, and tests in a separate Linux VM using Apple's `container` runtime. The workspace remains on your Mac and is mounted at `/work` inside the guest.

These tools require the Agent Threads release containing the sandbox VM feature, macOS 26 or later, Apple silicon, and a running Apple container service. They are unavailable on mobile. Where a tool supports both harnesses, the examples below use the canonical names shared by Claude and Codex.

## Set up the coding image

Install and start Apple's runtime:

```sh
brew install container
container system start
```

From the Agent Threads source checkout containing `sandbox/Dockerfile`, build the image:

```sh
container build --tag claude-threads-coding:1 sandbox/
```

The image includes Node 22, npm, Git, ripgrep, jq, curl, wget, Python, and native build tools. Commands run as a non-root user. The image contains no credentials, and the VM tools do not automatically forward your host environment or SSH agent into the guest. Custom images must include Bash and GNU `timeout`, which enforces command time limits inside the guest.

## Run a coding task

Ask the agent to create a Git worktree, enter a VM using that worktree as its mount, and use `vm_exec` for commands:

> Create an isolated worktree for this task. Mount only that worktree in a sandbox VM, run dependency installation and tests through vm_exec, and exit the VM when finished. Keep the worktree for review.

| Tool | Parameters | Behavior |
|---|---|---|
| `enter_vm` | `image?`, `network?`, `mountPath?` | Starts the thread's VM. The mount defaults to the thread's effective working directory. |
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

The guest has its own Linux kernel and filesystem. The chosen mount is writable: guest commands can change or delete files there, including any credentials already stored in that directory. Use a disposable worktree and avoid mounting your home directory or vault. With internet access enabled, guest commands can send mounted content over the network.

Removing the VM resets guest-only state; it does not undo changes to the mounted workspace. Keep work you want to review in that workspace before calling `exit_vm`.

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

## MCP access from a VM-hosted Claude harness

When Claude's harness itself runs inside the sandbox VM, Agent Threads keeps its host-resident OAuth and Google Workspace MCP brokers available through the Agent SDK connection. Requests cross that existing SDK bridge to the host brokers, so Agent Threads does not expose a host listener to the guest or copy OAuth credentials into the VM.

That bridge is intentionally limited to MCP services Agent Threads already brokers on the host. Other external MCP transports keep their normal execution boundary:

- A direct HTTP or SSE server is contacted from the guest and must be reachable under the VM's selected network mode.
- A stdio server starts inside the Linux guest. Its command, dependencies, paths, and binaries must therefore be Linux-compatible.

Choosing `none` still blocks guest networking. Host-brokered OAuth and Google Workspace MCPs remain available over the SDK connection, but the setting does not create a general guest-to-host network route or bypass the network policy for direct remote servers.

## Host commands from a VM-routed Claude thread

After an interactive Claude thread has successfully routed its harness into the VM, it can use `host_exec({ command, cwd?, reason, timeoutSeconds? })` when a task genuinely requires one command on the Mac host. Prefer `vm_exec` for work that can stay inside the guest.

Every call opens a host-owned approval dialog showing the exact command, working directory, and agent-supplied reason. You must choose **Allow once** or **Deny**; dismissing the dialog denies the call. Permission modes and auto-approval cannot bypass this prompt, and there is no permanent allow option. Scheduled and otherwise non-interactive calls are denied without running anything.

Approved commands run through `/bin/sh -c` with your account's permissions. The working directory must be an existing absolute host path and defaults to the thread's current directory. The process receives only a small allowlist of ordinary environment variables, not harness credentials or API tokens. Each stdout and stderr stream is capped at 64 KiB with a truncation marker, GitHub-token-shaped strings are redacted from returned output, and the command times out after 300 seconds by default (up to 3,600 seconds), with termination followed by forced kill if needed. Non-zero exit codes are returned as results.

`host_exec` is exposed only after VM routing succeeds on an interactive desktop Claude thread. It is unavailable when Claude falls back to the host, on mobile, in Codex or OpenCode threads, and through the deprecated `obsidian` MCP alias.

## Troubleshooting

If the runtime is unavailable, check `container system status` and start it with `container system start`. If the coding image is missing, run the build command above.

A VM can survive a plugin reload. If `enter_vm` reports that the thread already has a VM, use `exit_vm` before starting a fresh one. Do not remove a VM while it is doing work you need to preserve.
