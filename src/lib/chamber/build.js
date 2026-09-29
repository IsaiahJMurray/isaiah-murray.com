// Stores and helpers for the global BuildColumn (see BuildColumn.svelte for the full API notes).
import { writable } from 'svelte/store';

/** Element the column should live inside instead of the fixed right-edge slot (null = right edge). */
export const buildDock = writable(null);

/**
 * Live state of the column, for pages that draw their own ruler beside it.
 * slices:   [{ a: 0..1 (start of the section as a share of the document), label, el }]
 * progress: scroll progress 0..1
 * built:    share of layers actually drawn (quantized progress) 0..1
 * docked:   true while the column is inside a dock target
 * yForP(p): CSS px from the top of the canvas where progress p sits (base of that layer)
 */
export const buildInfo = writable({ slices: [], progress: 0, built: 0, docked: false, yForP: () => 0 });

let relayout = () => {};
/** @internal set by BuildColumn */
export function _setRelayout(fn) { relayout = fn || (() => {}); }
/** Ask the column to re-measure the page (e.g. after content expands without resizing <body>). */
export function refreshBuildColumn() { relayout(); }

/**
 * Svelte action: dock the column inside this element while it is mounted.
 *   <div class="my-ruler-slot" use:dockBuildColumn></div>
 * The element must have an explicit size; the canvas fills it (width/height 100%).
 */
export function dockBuildColumn(node) {
  buildDock.set(node);
  return {
    destroy() {
      buildDock.update((cur) => (cur === node ? null : cur));
    }
  };
}
