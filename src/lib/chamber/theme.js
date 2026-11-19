// Theme: the board is dark solder mask by default. A visitor can switch to the light board
// (the control is in the header) and that choice is remembered in localStorage.
//
// The current theme lives on <html data-theme="dark|light">. It is set before first paint by
// the inline script in src/app.html; the CSS tokens in chamber.css key off the attribute.
//
//   import { theme } from '$lib/chamber/theme.js';
//   $theme            -> 'dark' | 'light'  ('dark' during SSR)
//   theme.set('light')
//   theme.toggle()
//
// To follow the OS setting by default instead, change DEFAULT here and in app.html to the
// result of matchMedia('(prefers-color-scheme: dark)').
//
// Canvas code that reads CSS custom properties should subscribe to `theme` and re-read the
// tokens in the callback (the attribute has already flipped them).
import { writable } from 'svelte/store';

const KEY = 'theme';
const DEFAULT = 'dark';
const COLOR = { dark: '#03312E', light: '#E3F5F3' };

const current = () =>
  typeof document === 'undefined' ? DEFAULT : document.documentElement.dataset.theme || DEFAULT;

const store = writable(current());

function set(t) {
  const next = t === 'light' ? 'light' : 'dark';
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR[next]);
    try { localStorage.setItem(KEY, next); } catch (e) { /* session-only */ }
  }
  store.set(next);
}

export const theme = {
  subscribe: store.subscribe,
  set,
  toggle: () => set(current() === 'dark' ? 'light' : 'dark')
};
