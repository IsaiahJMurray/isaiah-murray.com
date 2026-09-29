import { error } from '@sveltejs/kit';
import { loadProject, neighbors } from '$lib/projects.js';

export async function load({ params }) {
  const project = await loadProject(params.slug);
  if (!project) throw error(404, 'Project not found');
  return { ...project, neighbors: neighbors(project.slug) };
}
