# Agent Threads — Marketing Site

Landing page for [Agent Threads](https://github.com/rbcodelabs/obsidian-claude-threads), a plugin compatible with [Geode](https://geode.rbcodelabs.com) and [Obsidian](https://obsidian.md).

Built with [Astro](https://astro.build) + Tailwind CSS v4, deployed on Vercel.

The home page uses a page-scoped ivory and green theme with composed HTML/CSS product illustrations. Documentation and changelog routes keep the shared dark documentation theme.

## Landing page structure

- `src/pages/index.astro` composes the landing page and loads its scoped stylesheet.
- `src/components/Landing*.astro`, `WorkspacePreview.astro`, `WorkflowSteps.astro`, and `VaultContext.astro` contain the landing sections and product illustrations.
- `src/styles/landing.css` owns landing-only presentation; shared documentation styles remain in `src/styles/global.css`.

## Development

```bash
npm install
npm run dev      # start local dev server
npm run check    # astro check (type-check)
npm run build    # astro check && astro build
npm run preview  # preview the production build locally
```

Product claims and installation guidance are sourced from the plugin's own README. See
[`.claude/pr-guidelines.md`](.claude/pr-guidelines.md) for the pre-PR checklist.
