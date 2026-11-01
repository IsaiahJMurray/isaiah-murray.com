// Visitor settings for the circuit background, remembered in localStorage.
//
//   import { ambient } from '$lib/circuit/settings.js';
//   $ambient          -> true while the board fires on its own (default), false when turned off
//   ambient.set(on)   -> change and remember it
//
// Clicks and the bursts from content scrolling into view still work with ambient off.
import { writable } from 'svelte/store';

const KEY = 'circuit-ambient';
const store = writable(true);
let loaded = false;

export const ambient = {
  subscribe(fn) {
    if (!loaded && typeof window !== 'undefined') {
      loaded = true;
      try { store.set(localStorage.getItem(KEY) !== 'off'); } catch (e) { /* storage blocked: default on */ }
    }
    return store.subscribe(fn);
  },
  set(on) {
    store.set(!!on);
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* session-only */ }
  }
};
