// src/routes/projects/[slug]/+page.js
import { error } from '@sveltejs/kit';

const modules = import.meta.glob('/src/lib/docs/projects/*.md');

export async function load({ params }) {
  const { slug } = params;

  const match = Object.entries(modules).find(([path]) =>
    path.endsWith(`/${slug}.md`)
  );

  if (!match) {
    throw error(404, 'Project not found');
  }

  const [, resolver] = match;
  const mod = await resolver();

  return {
    slug,
    metadata: mod.metadata || {},
    component: mod.default
  };
}
