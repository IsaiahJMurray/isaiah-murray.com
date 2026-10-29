<!--
  CircuitBackground: the logic-gate board behind every page (src/lib/circuit/circuit-field.js).

  Mounted ONCE in src/routes/+layout.svelte, outside .shell. Do not mount it in pages.

  What it draws
    A board of gates, chips and traces that scrolls with the page. Signals are the laser colour;
    traces are --part; lit letters and displays are --ink. Clicking (or tapping) empty space
    fires a burst of signals.

  Keeping content clear
    The board leaves a clear area (no gates or traces) around the header, the footer, every
    direct child of a <section> in <main>, anything else directly in <main>, and anything
    marked `data-circuit-keepout`. When one of those scrolls into view its edge pins fire.

  The name
    A page that wants the name spelled in the board renders an empty, sized element with
    `data-circuit-name` (the home hero does). The name is centred in its top part and the
    subtitle near its bottom. Pages without one get a plain board. Keep a real <h1> as well:
    the board is aria-hidden.

  Theme
    Colours are re-read from the chamber tokens whenever the theme store changes.
-->
<script>
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { theme } from '$lib/chamber/theme.js';

  const NAME = 'Isaiah Murray';
  const SUBTITLE = 'ELECTRICAL & COMPUTER ENGINEERING';
  const KEEPOUT = [
    '[data-circuit-keepout]',
    '.shell > header',
    '.shell > footer',
    'main section > :not(.visually-hidden):not([data-circuit-name])',
    'main > :not(section)'
  ].join(', ');

  let canvas;
  let field = null;

  // Text placement from the [data-circuit-name] element, as the fractions of the viewport
  // (measured from the top of the page) that the board expects.
  function textOptions() {
    const stage = document.querySelector('[data-circuit-name]');
    if (!stage) return { text: '', displays: [] };
    const r = stage.getBoundingClientRect();
    const y = (f) => +((r.top + scrollY + r.height * f) / innerHeight).toFixed(3);
    const x = +((r.left + r.width / 2) / innerWidth).toFixed(3);
    return { text: NAME, textAt: [x, y(0.42)], displays: [{ text: SUBTITLE, at: [x, y(0.82)] }] };
  }

  function colours(t) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return { theme: t, colors: { trace: css('--part'), pulse: css('--laser'), memory: css('--ink') } };
  }

  // After a page change (or a resize that moves the hero): place or drop the name, and light
  // it again when arriving on a page that has one.
  function relayout(light) {
    if (!field) return;
    const opts = textOptions();
    field.setOptions(opts);
    if (light && opts.text) field.reveal(0.8, 0.3);
  }

  afterNavigate(({ from }) => relayout(!!from));

  onMount(() => {
    let alive = true, timer = 0, unTheme = () => {};
    const onResize = () => { clearTimeout(timer); timer = setTimeout(() => relayout(false), 200); };

    // The library is a browser-only script that registers window.CircuitField.
    import('./circuit-field.js').then(() => {
      if (!alive) return;
      let current = 'light';
      unTheme = theme.subscribe((t) => {
        current = t;
        if (field) field.setOptions(colours(t));
      });
      field = window.CircuitField(canvas, {
        scroll: true,
        keepout: KEEPOUT,
        ignore: 'a, button, input, textarea, select, label, summary, [contenteditable], [role="slider"], [data-circuit-ignore]',
        ...colours(current),
        ...textOptions()
      });
      addEventListener('resize', onResize);
    });

    return () => {
      alive = false;
      clearTimeout(timer);
      removeEventListener('resize', onResize);
      unTheme();
      field?.destroy();
      field = null;
    };
  });
</script>

<canvas bind:this={canvas} class="circuit" aria-hidden="true"></canvas>

<style>
  /* The field positions and sizes the canvas itself (and adds tile canvases before it).
     z-index -1 keeps it under all content, like the powder grain. */
  .circuit { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; }
</style>
