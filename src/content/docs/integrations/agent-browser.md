---
title: Agent Browser
description: Drive a browser inside Geode using an accessibility-snapshot model, watch it work from a live preview pane, and hand off OAuth-style sign-ins to a temporary page.
category: integrations
order: 6
---

Claude can drive a browser **inside Geode**, using the same embedded web view that powers Web Viewer tabs, instead of launching a separate Chrome. That removes the second browser process entirely — and with it the pile of orphaned Chrome instances that an external automation CLI leaves behind.

Turn it on under **Settings → Tools → Agent browser**, then reload. The toggle is disabled on hosts that can't support it — see *Limits* below.

## Reading a page

Pages are read as an **accessibility snapshot** rather than screenshots or raw HTML — a compact list of the things a person could actually interact with:

```
- textbox "What needs doing?" [ref=e1]
- button "Submit the form" [ref=e2]
- link "Documentation" [ref=e3]
```

Claude reads that, hands back a ref, and acts on it. No coordinate guessing, no brittle CSS selectors. Hidden and disabled elements are left out, so every ref is something you could have clicked yourself.

Refs are scoped to the snapshot that produced them, and the freshness check runs in the same call as the action — so a page that navigates between the check and the click gets refused rather than acted on by accident.

## Tools

| Tool | What it does |
|---|---|
| `browser_navigate` | Open a URL and return a snapshot |
| `browser_snapshot` | Re-read the current page |
| `browser_read_text` | Visible page prose, for when the snapshot isn't enough |
| `browser_click` / `browser_type` | Act on a ref |
| `browser_screenshot` | PNG of the current page |
| `browser_status` | How many sessions are open, and the cap |
| `browser_close` | End this thread's session |
| `browser_resize` | Resize the viewport (320–1920 wide, 240–1080 tall) and return a fresh snapshot |

## Watching it work

Run **Open Agent Browser** from the command palette for a sidebar pane showing live frames, the page, session age, and a stop button. It streams only while visible, and closing it never closes Claude's session.

## Signing in

Some sites open a separate popup for login — Google, GitHub, SSO, or any OAuth-style flow — which Claude can't complete on its own, since it never sees or drives popups. When a page tries to open one, the preview pane shows a **"This page wants you to sign in — Take control?"** banner with a 30-second countdown.

Accepting opens a second, temporary browser page in the same pane. Typing and clicking there go to that page, not to Claude's session, which is left completely untouched — the agent's own guest is never touched or reparented while you're signing in. Click **Return control**, or just close the temporary page, when you're done, and Claude picks up wherever the sign-in left things, reading whatever the identity provider left on the page the same as any other page state.

If the countdown lapses before you click, the request expires and the banner says so; trigger sign-in on the page again to retry. Handoff input is mouse clicks and typing only — no drag, hover, or right-click — and keyboard support covers printable characters plus the common editing and navigation keys, which is what a login or MFA form needs.

## Resource limits

Each session is a real browser process, so they're capped (2 by default, 4 maximum), reclaimed after 5 minutes idle, recycled after 30 minutes, and closed automatically when their thread is deleted or the plugin unloads. Geode measures file-descriptor pressure, and the browser refuses to start a session when the app is running low — the specific condition under which a sandboxed page process otherwise dies on arrival.

The temporary sign-in page from a handoff shares this same admission gate (crash cooldown, create rate limit, cap, file-descriptor pressure) as the agent's own session, and is swept by the same reaper — it doesn't get a separate, uncounted budget.

## Safety

Sessions use their own cookie jar, separate from your Web Viewer tabs, so you'll be logged out of most sites by default — which is exactly why the sign-in handoff exists for flows that need an interactive login. Page text is handed to Claude wrapped as untrusted data rather than as instructions. Typing a stored secret into a page is refused outright. `file:`, `javascript:`, and cloud metadata addresses are blocked; private network addresses are behind an opt-in.

## Limits

Geode desktop only — it needs the process diagnostics Obsidian doesn't expose, and mobile has no embedded web view at all. Top frame only, no iframes, file uploads, or multiple tabs. It also can't drive Electron desktop apps, evade bot detection, or use cloud browsers; the `agent-browser` CLI skill still covers those.
