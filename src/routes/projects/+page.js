// src/routes/projects/+page.js
export async function load() {
  const modules = import.meta.glob('/src/lib/docs/projects/*.md');

  const projects = await Promise.all(
    Object.entries(modules).map(async ([path, resolver]) => {
      const mod = await resolver();
      const meta = mod.metadata || {};
      const filename = path.split('/').pop();          // e.g. 'baja-telemetry.md'
      const slug = filename.replace(/\.md$/, '');      // 'baja-telemetry'

      return {
        slug,
        ...meta
      };
    })
  );

  // sort newest first if you want
  projects.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return { projects };
}
