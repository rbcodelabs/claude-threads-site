---
title: Sandbox VMs
description: Run coding commands in a disposable Linux VM on your Mac, with an explicit workspace mount and network mode.
category: integrations
order: 4
---

Sandbox VM tools let a thread run build commands, dependency installs, and tests in a separate Linux VM using Apple's `container` runtime. The workspace remains on your Mac and is mounted at `/work` inside the guest.

These tools require the Agent Threads release containing the sandbox VM feature, macOS 26 or later, Apple silicon, and a running Apple container service. They are unavailable on mobile. The examples below use the canonical tool names shared by Claude and Codex.

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

## Troubleshooting

If the runtime is unavailable, check `container system status` and start it with `container system start`. If the coding image is missing, run the build command above.

A VM can survive a plugin reload. If `enter_vm` reports that the thread already has a VM, use `exit_vm` before starting a fresh one. Do not remove a VM while it is doing work you need to preserve.
