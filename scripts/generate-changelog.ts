#!/usr/bin/env node
// Fetches every GitHub Release from the plugin repo and writes one Markdown
// file per release into src/content/changelog/. This is a one-time/manual
// generation step, NOT part of the build (the site is `output: 'static'`
// and must not depend on live GitHub API calls at build time). Re-run this
// script manually whenever a new plugin version ships, or to pick up edits
// to existing release notes. See .claude/pr-guidelines.md ("Changelog").
//
// Usage: node scripts/generate-changelog.ts
// Requires: `gh` CLI installed and authenticated (gh auth status).

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = 'rbcodelabs/obsidian-claude-threads';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'changelog');

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  html_url: string;
  draft: boolean;
}

function fetchReleases(): GitHubRelease[] {
  console.log(`Fetching releases from ${REPO} via gh api --paginate ...`);
  const raw = execSync(`gh api repos/${REPO}/releases --paginate`, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50,
  });
  const releases: GitHubRelease[] = JSON.parse(raw);
  console.log(`Fetched ${releases.length} release objects.`);
  return releases;
}

function main() {
  const allReleases = fetchReleases();

  // Drafts aren't real published releases (this repo has one stale draft
  // that duplicates a real tag's version number, which would collide on
  // filename) — exclude them.
  const releases = allReleases.filter((r) => !r.draft);
  console.log(`${releases.length} non-draft releases after filtering.`);

  if (releases.length === 0) {
    throw new Error('No releases fetched — aborting without touching output directory.');
  }

  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true });
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const release of releases) {
    const version = release.tag_name.replace(/^v/, '');
    const body =
      release.body && release.body.trim().length > 0
        ? release.body
        : '_No release notes recorded for this version._';

    const frontmatter = [
      '---',
      `version: ${JSON.stringify(version)}`,
      `tag: ${JSON.stringify(release.tag_name)}`,
      `name: ${JSON.stringify(release.name ?? release.tag_name)}`,
      `date: ${JSON.stringify(release.published_at ?? '')}`,
      `url: ${JSON.stringify(release.html_url)}`,
      '---',
      '',
      body,
      '',
    ].join('\n');

    const filePath = path.join(OUTPUT_DIR, `${version}.md`);
    writeFileSync(filePath, frontmatter, 'utf8');
  }

  const written = readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Wrote ${written.length} changelog files to ${OUTPUT_DIR}`);
}

main();
