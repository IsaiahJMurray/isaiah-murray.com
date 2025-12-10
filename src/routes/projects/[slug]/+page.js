// src/routes/projects/[slug]/+page.js
import { error } from '@sveltejs/kit';

const modules = import.meta.glob('/src/lib/docs/projects/*.md');

export async function load({ params }) {
  const { slug } = params;

  let found = null;

  await Promise.all(
    Object.entries(modules).map(async ([path, resolver]) => {
      if (found) return;

      const mod = await resolver();
      const meta = mod.metadata || mod.frontmatter || {};
      const filename = path.split('/').pop() || '';
      const defaultSlug = filename.replace(/\.md$/, '');
      const metaSlug = meta.slug || defaultSlug;

      if (metaSlug === slug) {
        const visibility = meta.visibility || 'public';
        if (visibility === 'hidden') {
          throw error(404, 'Project not found');
        }

        found = {
          slug: metaSlug,
          metadata: {
            ...meta,
            title: meta.title || metaSlug
          },
          component: mod.default
        };
      }
    })
  );

  if (!found) {
    throw error(404, 'Project not found');
  }

  const heroImage =
    found.metadata.heroImage || `/generated/logos/${found.slug}.png`;

  return {
    slug: found.slug,
    metadata: found.metadata,
    component: found.component,
    heroImage
  };
}
