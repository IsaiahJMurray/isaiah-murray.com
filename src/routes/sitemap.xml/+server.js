// /sitemap.xml: the top-level pages plus every public project (unlisted and hidden ones are
// left out, same as the /projects index). Listed in static/robots.txt.
import { loadProjects } from '$lib/projects.js';

const SITE = 'https://isaiah-murray.com';
const PAGES = ['/', '/projects', '/resume', '/contact'];

// Front-matter dates may be strings or Date objects; the sitemap wants YYYY-MM-DD.
const day = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString().slice(0, 10) : null;
};

export function GET() {
  const urls = PAGES.map((p) => `  <url><loc>${SITE}${p}</loc></url>`);
  for (const p of loadProjects()) {
    const mod = day(p.updated || p.date);
    urls.push(`  <url><loc>${SITE}/projects/${p.slug}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'max-age=3600' } });
}
