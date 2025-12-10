// src/routes/projects/+page.js
const modules = import.meta.glob('/src/lib/docs/projects/*.md');

export async function load() {
  const maturityRank = {
    production: 0,
    polished: 1,
    prototype: 2,
    wip: 3,
    archived: 4
  };

  const raw = await Promise.all(
    Object.entries(modules).map(async ([path, resolver]) => {
      const mod = await resolver();
      const meta = mod.metadata || mod.frontmatter || {};
      const filename = path.split('/').pop() || '';
      const defaultSlug = filename.replace(/\.md$/, '');

      const slug = meta.slug || defaultSlug;
      const visibility = meta.visibility || 'public';

      if (visibility === 'hidden' || visibility === 'unlisted') {
        // keep unlisted/hidden out of the main grid
        return null;
      }

      const maturity = meta.maturity || 'prototype';
      const featured = Boolean(meta.featured);

      // card image: heroImage if defined, otherwise generated fractal logo
      const cardImage = meta.heroImage || `/generated/logos/${slug}.png`;

      return {
        slug,
        title: meta.title || slug,
        subtitle: meta.subtitle || '',
        date: meta.date || null,
        updated: meta.updated || null,
        tags: meta.tags || [],
        maturity,
        featured,
        visibility,
        accent: meta.accent || null,
        cardImage,
        _maturityRank: maturityRank[maturity] ?? 99
      };
    })
  );

  const projects = raw
    .filter(Boolean)
    .sort((a, b) => {
      // featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // then by maturity rank
      if (a._maturityRank !== b._maturityRank) {
        return a._maturityRank - b._maturityRank;
      }

      // then by updated date desc, then date desc
      const aDate = a.updated || a.date || '';
      const bDate = b.updated || b.date || '';
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return a.slug.localeCompare(b.slug);
    });

  return { projects };
}
