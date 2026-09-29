import { loadProjects } from '$lib/projects.js';

export function load() {
  return { projects: loadProjects() };
}
