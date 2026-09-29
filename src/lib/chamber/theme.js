// Theme state shared by Header (toggle), BuildColumn and SinterHero (canvas recolor).
//
// The CSS tokens in chamber.css follow `prefers-color-scheme` unless
// <html data-theme="light|dark"> overrides it. The choice is persisted in
// localStorage under "theme" and re-applied before paint by the inline script
// in src/app.html.
//
//   import { theme, toggleTheme } from '$lib/chamber/theme.js';
//   $theme            -> 'light' | 'dark' (effective theme; 'light' during SSR)
//   toggleTheme()     -> flips it, stores it
//
// Canvas code that reads CSS custom properties should subscribe to `theme`
// and re-read the tokens in the callback (the attribute is already applied).
import { writable } from 'svelte/store';

const KEY = 'theme';
const COLORS = { light: '#E2E2DF', dark: '#1A1A19' };
const hasDom = typeof window !== 'undefined';

function effective() {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncMeta(t) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[t]));
}

export const theme = writable('light', (set) => {
  if (!hasDom) return;
  set(effective());
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => set(effective());
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
});

export function toggleTheme() {
  if (!hasDom) return;
  const next = effective() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked: session-only */ }
  syncMeta(next);
  theme.set(next);
}
