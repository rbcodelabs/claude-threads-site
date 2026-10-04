---
title: Agent Browser
description: Let Claude drive a browser inside Geode — accessibility snapshots, reading and saving large pages, signing in, and resource limits.
category: integrations
order: 6
---

Claude can drive a browser **inside Geode**, using the same embedded web view that powers Web Viewer tabs, instead of launching a separate Chrome. That removes the second browser process entirely — and with it the pile of orphaned Chrome instances that an external automation CLI leaves behind.

Turn it on under **Settings → Tools → Agent browser**, then reload. The session cap and private-network settings are always shown there, and are disabled when the host can't support the browser. The toggle is disabled on hosts that can't support it (see [Limits](#limits)).

## How Claude reads a page

Pages are read as an **accessibility snapshot** rather than screenshots or raw HTML — a compact list of the things a person could actually interact with:

```
- textbox "What needs doing?" [ref=e1]
- button "Submit the form" [ref=e2]
- link "Documentation" [ref=e3]
```

Claude reads that, hands back a ref, and acts on it. No coordinate guessing, no brittle CSS selectors. Hidden and disabled elements are left out, so every ref is something you could have clicked yourself.

## Tools

| Tool | What it does |
|---|---|
| `browser_navigate` | Open a URL and return a snapshot |
| `browser_snapshot` | Re-read the current page |
| `browser_read_text` | Visible page prose (up to ~20,000 characters), for when the snapshot isn't enough |
| `browser_save_page` | Save the page's text or HTML to a temp file and return its path and size, for pages too large to read inline (e.g. raw JSON). Explore it with `jq`, `grep` or Read; files are deleted when the session or thread ends |
| `browser_click` / `browser_type` | Act on a ref |
| `browser_screenshot` | PNG of the current page |
| `browser_status` | How many sessions are open, and the cap |
| `browser_close` | End this thread's session |
| `browser_console` | Buffered console output (log, info, warn, error, debug, plus uncaught errors and unhandled rejections). `level` sets a minimum severity; `limit` and `clear` are optional. Keeps the last 500 messages and resets on navigation |
| `browser_network` | Requests the page made, with type, method, URL, status, duration, size and whether it failed. `filter`, `limit`, `failedOnly` and `clear` are optional. Keeps the last 500 entries and resets on navigation |
| `browser_eval` | Evaluate a JavaScript expression in the page and return size-capped JSON. **Off by default**; see [Devtools](#devtools) |
| `browser_resize` | Resize the viewport (320-1920 wide, 240-1080 tall) and return a fresh snapshot |

## Devtools

`browser_console` and `browser_network` only report what the page already did, so they are read-only and skip the permission prompt. Their output is page-authored, so it comes back wrapped as untrusted data, like `browser_read_text`.

- The console is captured by Geode itself, outside the page's JavaScript, so a page cannot rewrite `console` to hide what it logged.
- The network log comes from a small script injected into the page, because the web view exposes no request events. Requests that fire before the page finishes parsing show up without method or error detail. Status and size are missing for cross-origin resources that don't send `Timing-Allow-Origin`. WebSocket traffic is not logged, and only the top frame is covered.
- Request and response headers and bodies are never recorded. Credentials and sensitive-looking query values (`token`, `key`, `password`, `code`) are masked in logged URLs.

`browser_eval` runs arbitrary JavaScript in the page, so it is **off by default**. Turn it on under **Settings → Tools → Agent browser → Allow agents to evaluate JavaScript in the browser**; it applies immediately. While it is off the tool refuses and names the setting. Each call needs the same approval as `browser_click` and `browser_type`. Results and thrown errors come back as untrusted data, capped at about 20,000 characters.

Literal URLs in an expression are checked against the same blocked-address and private-network rules as `browser_navigate`. That is a tripwire, not a boundary: a URL built while the script runs cannot be checked in advance.

## Large pages and raw JSON

`browser_read_text` returns at most about 20,000 characters and marks the result `truncated` when the page is longer. When a page is bigger than that — a raw JSON API response, a long log, a big table — use `browser_save_page` instead. It writes the page to a file and returns only the path, size and content type, so the content never has to pass through Claude's context. Claude can then query it with `jq` or `grep`, or read just the part it needs.

- `format: "text"` (default) saves the visible text — for JSON and plain-text documents, the raw document, so a saved JSON page parses as valid JSON. `format: "html"` saves the page HTML.
- Files are written under the system temp folder, outside your vault, and contain the page content only (no header).
- Each file is capped at 10 million characters, and only the 20 most recent files per thread are kept.
- Files are deleted when the browser session closes or the thread ends, and when the plugin unloads.
- Because it writes a file, `browser_save_page` goes through the normal [permission prompt](/docs/permissions/permission-modes-and-plan-mode/) unlike the read-only browser tools.

Everything in a saved file is untrusted web content. Claude treats it as data, and reports any instructions it finds there rather than following them.

## Watching it work

In the chat, each browser session is **one live card** instead of a stack of tool pills: a small browser bar with the current address and status, a live view of the page, and a caption naming the step in progress. The live view mirrors the Agent Browser pane: a frame about once a second while Claude is acting, every few seconds when idle, and only while the card is actually on screen. A step list under the card keeps every action's verb, target, outcome and duration.

Frames carry a visible **agent cursor** where Claude last clicked or typed (with a brief ripple on a click) and a **focus ring** around the field it is typing into, so you can follow what it is doing. These marks are drawn into the page the agent is browsing, but they are invisible to its snapshots and never change the page's layout.

When the session ends the card settles to the final screenshot and folds into a one-line chip with a thumbnail (click to expand, click the picture to see the screenshot larger). A failure stays open and shows the error.

Run **Open Agent Browser** from the command palette for a pane, opened as a main-area tab so there's room to work in it, showing live frames, the page, session age, a stop button and **Take over**. It streams only while visible, and closing it never closes Claude's session.

## Signing in

Some sites open a separate popup for login (Google, GitHub, SSO) — the kind of flow Claude can't complete on its own, since it never sees or drives popups. When a page tries to open one, the chat card turns amber with **Sign-in needed**, a 30-second countdown, and **Take control** / **Not now**. The Agent Browser pane shows the same request as a banner, and opens in the main area automatically.

Accepting opens a second, temporary browser page. The card becomes a solid amber **You're in control** with the sign-in page streamed live, a chip above the composer reading *You're in control · Claude is waiting*, and a **Return control** button. Typing and clicking there go to that page, not to Claude's session, which is left completely untouched. Claude can't see that page or what you type: the frames and keystrokes are never added to the conversation, saved data, logs or tool results.

Click **Return control** (or just close the temporary page) when you're done. The card confirms the sign-in, folds back to normal, and Claude picks up wherever the sign-in left things. If the countdown lapses before you click, the request expires and the card says so; ask Claude to try again.

### Take over any page

Not every login is a popup. The pane has a **Take over** button whenever Claude has a browser open. It lets you click and type straight into Claude's own page, so its cookies stay and the login carries over.

- While you're driving, Claude is paused: any browser action it tries fails with a retryable "a person has taken over" error, and it can't screenshot or read the page.
- The page is exempt from the usual idle and age recycling while you drive.
- **Return control** hands the page back exactly as you left it, and Claude re-reads it before continuing.

This is mouse clicks and typing only — no drag, hover, or right-click — and keyboard support covers printable characters plus the common editing and navigation keys, which is what a login or MFA form needs. Mode changes are announced to screen readers, and everything is reachable by keyboard.

## Resource limits

Each session is a real browser process, so they're capped (2 by default, 4 maximum), reclaimed after 5 minutes idle, recycled after 30 minutes, and closed automatically when their thread is deleted or the plugin unloads. Geode measures file-descriptor pressure, and the browser refuses to start a session when the app is running low.

## Safety

Sessions use their own cookie jar, separate from your Web Viewer tabs, so you'll be logged out of most sites. Page text is handed to Claude wrapped as untrusted data rather than as instructions. Typing a stored secret into a page is refused outright. `file:`, `javascript:` and cloud metadata addresses are blocked; private network addresses are behind an opt-in.

## Limits

Geode desktop only — it needs process diagnostics Obsidian doesn't expose, and mobile has no embedded web view at all. Top frame only, no iframes, file uploads, or multiple tabs. It also can't drive Electron desktop apps, evade bot detection, or use cloud browsers.
