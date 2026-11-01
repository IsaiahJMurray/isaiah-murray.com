// The site follows the browser's light/dark preference (`prefers-color-scheme`); there is no
// manual toggle. The CSS tokens in chamber.css switch on the same media query, and the
// theme-color metas in src/app.html do too.
//
//   import { theme } from '$lib/chamber/theme.js';
//   $theme            -> 'light' | 'dark' (current preference; 'light' during SSR)
//
// Canvas code that reads CSS custom properties should subscribe to `theme` and re-read the
// tokens in the callback (the media query has already flipped them).
import { readable } from 'svelte/store';

export const theme = readable('light', (set) => {
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => set(mq.matches ? 'dark' : 'light');
  onChange();
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
});
