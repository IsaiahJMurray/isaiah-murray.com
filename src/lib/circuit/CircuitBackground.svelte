<!--
  CircuitBackground: the logic-gate board behind every page (src/lib/circuit/circuit-field.js).

  Mounted ONCE in src/routes/+layout.svelte, outside .shell. Do not mount it in pages.

  What it draws
    A board of gates, chips and traces that scrolls with the page. A gate firing lights its whole
    output net at once (`mode: 'nets'`). Signals are --signal, traces are --surface, lit letters
    and displays are --ink. Clicking (or tapping) empty space fires a burst of signals.

  Keeping content clear
    The board leaves a clear area (no gates or traces) around the header, the footer, every
    direct child of a <section> in <main>, anything else directly in <main>, and anything
    marked `data-circuit-keepout`. When one of those scrolls into view its edge pins fire.

  The name
    A page that wants the name spelled in the board renders an empty, sized element with
    `data-circuit-name` (the home hero does). The name and subtitle are fitted inside it: the
    largest layout that fits (pixel letters, then segment digits) is used, so nothing is
    clipped. It is swept on once after load and then stays lit (HOLD), so the first screen
    always reads. Pages without one get a plain board. Keep a real <h1> as well: the board is
    aria-hidden, and it does not light for visitors who prefer reduced motion.

  Theme
    Colours are re-read from the site tokens whenever the theme store changes (theme.js).
-->
<script>
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { theme } from '$lib/chamber/theme.js';
  import { ambient } from './settings.js';
  import { setField } from './field.js';

  const AMBIENT = 0.8; // spontaneous firings per second per megapixel of window, while on
  const HOLD = 3600;   // s a lit letter stays on: once the name is swept on, it stays on
  const NAME = 'Isaiah Murray';
  const SUBTITLE = 'ELECTRICAL & COMPUTER ENGINEERING';
  const SUBTITLE_MIN = 660; // px of stage height before the subtitle is spelled under the name
  const KEEPOUT = [
    '[data-circuit-keepout]',
    '.shell > header',
    '.shell > footer',
    'main section > :not(.visually-hidden):not([data-circuit-name])',
    'main > :not(section)'
  ].join(', ');

  let canvas;
  let field = null;

  // The [data-circuit-name] element's box, as the fractions of the viewport (measured from the
  // top of the page) that the board expects.
  function textOptions() {
    const stage = document.querySelector('[data-circuit-name]');
    if (!stage) return { text: '', subtitle: '', textBox: null };
    const r = stage.getBoundingClientRect();
    const fx = (v) => +(v / innerWidth).toFixed(4), fy = (v) => +((v + scrollY) / innerHeight).toFixed(4);
    // The subtitle line is only worth its rows on a tall stage; on a short one they go to the
    // name, so it can stay in the large pixel letters.
    const subtitle = r.height >= SUBTITLE_MIN ? SUBTITLE : '';
    return { text: NAME, subtitle, textBox: [fx(r.left), fy(r.top), fx(r.right), fy(r.bottom)] };
  }

  function colours(t) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return { theme: t, colors: { trace: css('--surface'), pulse: css('--signal'), memory: css('--ink') } };
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
    let alive = true, timer = 0, unTheme = () => {}, unAmbient = () => {};
    const onResize = () => { clearTimeout(timer); timer = setTimeout(() => relayout(false), 200); };

    // The library is a browser-only script that registers window.CircuitField.
    import('./circuit-field.js').then(() => {
      if (!alive) return;
      let current = 'dark';
      unTheme = theme.subscribe((t) => {
        current = t;
        if (field) field.setOptions(colours(t));
      });
      let on = true;
      unAmbient = ambient.subscribe((v) => {
        on = v;
        if (field) field.setOptions({ ambient: v ? AMBIENT : 0 });
      });
      field = window.CircuitField(canvas, {
        scroll: true,
        mode: 'nets',
        latchHold: HOLD,
        ambient: on ? AMBIENT : 0,
        keepout: KEEPOUT,
        ignore: 'a, button, input, textarea, select, label, summary, [contenteditable], [role="slider"], [data-circuit-ignore]',
        ...colours(current),
        ...textOptions()
      });
      setField(field); // pages reach it through $lib/circuit/field.js
      if (import.meta.env.DEV) window.__circuitField = field; // for poking at it from the console
      addEventListener('resize', onResize);
    });

    return () => {
      alive = false;
      clearTimeout(timer);
      removeEventListener('resize', onResize);
      unTheme();
      unAmbient();
      field?.destroy();
      field = null;
      setField(null);
    };
  });
</script>

<canvas bind:this={canvas} class="circuit" aria-hidden="true"></canvas>

<style>
  /* The field positions and sizes the canvas itself (and adds tile canvases before it).
     z-index -1 keeps it under all content. */
  .circuit { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; }
</style>
