---
title: Web Viewer Element Picker
description: Resize live Web Viewer tabs with responsive presets, pick any element on the page, and send a cropped screenshot, computed styles, and source hints straight to a thread.
category: integrations
order: 7
---

Inspect and comment on real web apps running inside Geode's **Web Viewer** — `localhost` dev servers, Tailscale or homelab services, or deployed preview URLs — and send element-level context straight to an Agent Threads coding conversation. Nothing needs to be installed in your browser or added to your app: there is no browser extension, SDK, or sidecar script.

Where [Agent Browser](/docs/integrations/agent-browser/) gives an agent its own browser session to drive autonomously, the Web Viewer picker lets *you* point directly at an element on a page you already have open and hand it to an agent with your note attached.

## Responsive viewport presets

The Web Viewer toolbar includes viewport presets that resize the live browser frame in place so CSS media queries, mobile navigation, and responsive breakpoints render natively:

| Preset | Viewport size | What it does |
|---|---|---|
| **Fill** | Full pane | Expands the page to fill the Web Viewer tab (default) |
| **Desktop** | `1440×900` | Standard desktop layout frame |
| **Tablet** | `768×1024` | Portrait tablet breakpoint |
| **Mobile** | `390×844` | Phone viewport for mobile navs and compact layouts |

Switching presets updates the live page immediately, and any element you pick records the active preset and viewport dimensions so the agent knows the exact screen size you were looking at.

## Picking an element

Click **Pick** in the Web Viewer toolbar on any loaded `http://` or `https://` page to enter inspection mode:

- **Hover** over the page to highlight candidate elements and preview their bounding boxes.
- **Press `[` or `]`** to step up to the parent element or down into a child element when a wrapper or nested node is easier to reach by keyboard than by pointer.
- **Press `Escape`** (or click **Pick** again) to cancel inspection without capturing anything.
- **Click an element** to lock the selection and open the comment popover.

Before you type a note, check the **host-verified origin** shown in the popover header. Any non-loopback address (`https://staging.example.com`, Tailscale hostnames, or public sites) displays an **External origin** badge so you can always see at a glance when you are sending content from outside `localhost`.

## Routing to a thread

From the comment popover, add what you want changed or investigated and choose where to send it:

- **Active thread (default)** — sends the picked element and your comment straight to the conversation you currently have open.
- **Target thread dropdown** — routes the pick inline to any other open conversation without leaving the Web Viewer tab.
- **+ New thread** — starts a fresh coding session seeded with the picked element and your note.

If the target thread is currently mid-turn, Agent Threads holds **one** pending pick for that busy thread in memory and sends it automatically as soon as the current turn finishes. Submitting another pick to the same busy thread before its turn completes replaces the earlier held pick (picks do not stack into the composer's reload-persistent message queue).

## What the agent receives

Each pick arrives in the target thread as a normal user turn backed by three pieces of context:

- **Cropped PNG screenshot** — a crisp crop of the selected element attached natively as an image, supported across Claude, Codex, OpenCode, Antigravity, and remote daemons.
- **Structured element metadata** — the primary CSS selector and alternate selectors, a sanitized HTML snippet, key computed layout and typography styles, accessibility role and accessible name, element bounding box, and the active viewport preset and dimensions.
- **Heuristic `file:line` source hints** — candidate source locations matched inside the target thread's local repository working directory from element IDs, `data-testid` / `data-*` attributes, route paths, and text anchors, giving the agent an immediate foothold in your codebase (local threads only — omitted when the target thread runs on a remote daemon, while the cropped PNG screenshot and DOM metadata still work on remote daemons).

## Safety

- **Zero overhead while off.** The inspector stays completely inert whenever **Pick** is off — no DOM event listeners, observers, or global variables are injected into your app during normal browsing.
- **Host-verified origin.** The origin string and **External origin** badge come from Geode's host web view rather than page scripts, so a page cannot spoof which site you are inspecting.
- **Untrusted-data fencing.** All captured DOM text and HTML snippets are wrapped inside a randomized untrusted-data fence so page content is treated strictly as data and never followed as agent instructions.

## Limits

Geode desktop only — plain Obsidian and mobile do not expose the host Web Viewer APIs required for viewport framing and native element capture, so the controls stay hidden there.

Inspection runs on the **top-level frame** of committed `http://` and `https://` pages only; it is unavailable on `about:blank`, browser error overlays, non-web schemes, and cross-origin iframes. The Web Viewer picker focuses on picking and sending one element at a time on live web apps — for persistent multi-pin mockups and side-by-side explorations, use [Design artifacts (`/design`)](/docs/core-workflow/messaging-and-commands/#design-artifacts-in-geode).
