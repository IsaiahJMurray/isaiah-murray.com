import { loadProjects } from '$lib/projects.js';

const PLATE_MAX = 6;
const OTHERS_MAX = 8;

export function load() {
  const projects = loadProjects();
  // Build plate: featured public projects, in loader order, up to six.
  const featured = projects.filter((p) => p.featured).slice(0, PLATE_MAX);
  const onPlate = new Set(featured.map((p) => p.slug));
  // Other work: the other public projects, newest year first (undated last), loader order within a year.
  const others = projects
    .filter((p) => !onPlate.has(p.slug))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (b.p.year ?? -1) - (a.p.year ?? -1) || a.i - b.i)
    .map(({ p }) => p)
    .slice(0, OTHERS_MAX); // the 8 most recent; the rest live on /projects
  return { projects, featured, others, total: projects.length };
}
