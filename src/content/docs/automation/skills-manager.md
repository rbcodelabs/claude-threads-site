---
title: Skills Manager
description: Browse, install, and edit Claude Code skills from the Installed and Browse tabs, and configure skill sources.
category: automation
order: 2
---

Open the **Skills Manager** panel from the ribbon (puzzle icon) or command palette to browse, install, and edit Claude Code skills. The list and detail panels are split by a **draggable divider** — drag it to resize, double-click to reset to the default width; your chosen width is remembered next time you open the panel.

![Skills Manager: source tree on the left with skill/agent detail and editor on the right](../../../assets/screenshots/screenshot-skills-manager.png)

## Installed tab

Shows everything installed as a collapsible source tree.

The top-right corner of the tab bar has two icon buttons (Installed tab only):

- **Import (+)** — opens a menu with **Folder…** and **File (.skill)…**, letting you install a skill directly from a local folder or a packaged `.skill`/`.zip` archive without going through GitHub.
- **Check for updates (↻)** — shown once you have at least one GitHub plugin source; re-fetches staleness for all GitHub plugin sources in parallel. Its icon spins while running, and a toast reports the result when it finishes, including which sources failed to check (e.g. if you're offline). An indicator dot appears on the button afterward if any plugin has updates. Hover either button for its full status/tooltip.

**GitHub plugin sources** appear as top-level nodes with a badge (`•N`) when updates are available; clicking one expands it to reveal its skills and opens a detail panel with:

- **Update** — git pull, highlighted when updates are available
- **Reload** — re-scan from disk
- **Reinstall** — delete and re-clone for broken installs
- **Remove Source**

A **Local** node at the bottom groups your standalone skills and agents — click any item to view and edit it. For skills: **Save**, **Reload**, **Reveal in Finder**, **Uninstall**. For agents: **Save**, **Reload**, **Reveal in Finder**, **Delete**.

## Browse tab

Search the [skills.sh](https://skills.sh) registry. Results show the skill name, GitHub source, and install count. Click a result to see details and an **Install** button that clones the skill from GitHub into `~/.claude/skills/`.

## Skill Sources settings

**Settings → Skills** registers local skill collections to browse and install from within the Skills Manager, independent of the Browse tab's registry search. Each source is either:

- **GitHub** — a repo URL that's cloned into the vault's plugin folder, with an optional display name override. Staleness (`behindCount`) is tracked per source and drives the update badges described above.
- **Local** — a path to an existing skills folder on disk, with an optional separate git repo path if the skills folder lives inside a larger repo (so Update pulls the right repo).

Add or remove sources from Settings → Skills, or via the **Add Source** button, which opens the same add-source flow reachable from the Skills Manager itself.

Once a skill or agent from `~/.claude/skills/` is installed, it's automatically available in the [`/` slash command dropdown](/docs/core-workflow/messaging-and-commands/#slash-commands) in every thread — there's no separate step to wire a newly installed skill into the chat input.
