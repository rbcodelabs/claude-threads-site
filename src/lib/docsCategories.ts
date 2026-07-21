// Single source of truth for docs category ordering + display labels.
// Shared by DocsLayout, DocsSidebar, and the /docs index page so sidebar
// grouping, prev/next ordering, and the landing page category cards never
// drift out of sync with each other.

export const CATEGORY_ORDER = [
  'getting-started',
  'core-workflow',
  'views',
  'automation',
  'permissions',
  'integrations',
  'reference',
  'help',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  'getting-started': 'Getting Started',
  'core-workflow': 'Core Workflow',
  views: 'Views',
  automation: 'Automation',
  permissions: 'Permissions',
  integrations: 'Integrations',
  reference: 'Reference',
  help: 'Help',
};

/** Sorts docs collection entries by category order, then by their `order` frontmatter field. */
export function sortDocs<T extends { data: { category: string; order: number } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.data.category as (typeof CATEGORY_ORDER)[number]) -
      CATEGORY_ORDER.indexOf(b.data.category as (typeof CATEGORY_ORDER)[number]);
    if (catDiff !== 0) return catDiff;
    return a.data.order - b.data.order;
  });
}
