<!--
  SinterHero — the home H1 as a powder bed being sintered (ported from the mockup's `bed`).

    <SinterHero lines={['Isaiah', 'Murray']} id="h1-home" />

  The H1 is real text in --part grey and stays readable at rest; two canvases on top draw the
  hatch (ink, 1px lines at 3px spacing, clipped to the glyphs) and the laser (the only orange).
  Each layer is 110 µm; the hatch rotates 67° per layer; the recoater buries the finished layer
  left to right, then the next layer starts. The readout (layer, Z, hatch angle) is aria-hidden.
  Animation pauses when the hero is off-screen or the tab is hidden, and under
  prefers-reduced-motion a single static hatch layer is drawn instead.
-->
<script>
  import { onMount } from 'svelte';
  import { theme } from './theme.js';

  export let lines = ['Isaiah', 'Murray'];
  export let id = 'h1-home';

  const TOTAL = 1180, START = 214, ROT = 67, LAYER_MM = 0.110;
  const pad = (n) => String(n).padStart(4, '0');
  const angleFor = (l) => ((l - START) * ROT) % 180;

  let wrap, h1, base, top;
  let layer = START;

  $: roLayer = `${pad(layer)} / ${TOTAL}`;
  $: roZ = `${(layer * LAYER_MM).toFixed(2)} mm`;
  $: roHatch = `${String(angleFor(layer)).padStart(3, '0')}°`;

  onMount(() => {
    const SPACING = 3, SCAN_MS = 3400, RECOAT_MS = 750, DWELL_MS = 350, TRAIL = 20, TRAIL_STEP = 3;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const bctx = base.getContext('2d'), tctx = top.getContext('2d');
    let W = 0, H = 0, dpr = 1, mask = null, col = {};
    let phase = 'scan', path = [], segI = 0, segOff = 0, rate = 1, t0 = 0, recoatX = 0;
    let trail = [], sinceSample = 0, running = false, visible = true, raf = 0, last = 0, ready = false, alive = true;

    function recolor() {
      col = { ink: css('--ink'), laser: css('--laser'), powder: css('--powder'), part: css('--part') };
      if (reduced.matches && ready) drawStatic();
    }

    function size() {
      const r = wrap.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!W || !H) { mask = null; return; }
      for (const c of [base, top]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // glyph mask, drawn to match the live H1 exactly
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true });
      const cs = getComputedStyle(h1);
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing;
      o.textBaseline = 'alphabetic'; o.fillStyle = '#000';
      h1.querySelectorAll('span').forEach((s) => {
        const sr = s.getBoundingClientRect();
        const m = o.measureText('M');
        const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
        const y = sr.top - r.top + (sr.height - (A + D)) / 2 + A;
        o.fillText(s.textContent.toUpperCase(), sr.left - r.left, y);
      });
      const data = o.getImageData(0, 0, W, H).data;
      mask = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;
    }

    // hatch path for one layer: serpentine scan lines at angle, runs only inside glyphs
    function buildPath(deg) {
      const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2 + 2;
      const lines = [];
      for (let d = -R; d <= R; d += SPACING) {
        const runs = [];
        let inRun = false, s0 = 0;
        for (let t = -R; t <= R; t += 1) {
          const x = cx + ux * t + nx * d, y = cy + uy * t + ny * d;
          const xi = x | 0, yi = y | 0;
          const on = xi >= 0 && yi >= 0 && xi < W && yi < H && mask[yi * W + xi] === 1;
          if (on && !inRun) { inRun = true; s0 = t; }
          else if (!on && inRun) { inRun = false; if (t - s0 > 1) runs.push([s0, t - 1]); }
        }
        if (inRun) runs.push([s0, R]);
        if (!runs.length) continue;
        const rev = lines.length % 2 === 1;
        const pts = (rev ? runs.slice().reverse() : runs).map(([p, q]) => (rev ? [q, p] : [p, q]));
        lines.push(pts.map(([p, q]) => [cx + ux * p + nx * d, cy + uy * p + ny * d, cx + ux * q + nx * d, cy + uy * q + ny * d]));
      }
      const segs = [];
      let px = null, py = null;
      for (const ln of lines) for (const [x1, y1, x2, y2] of ln) {
        if (px !== null) segs.push({ x1: px, y1: py, x2: x1, y2: y1, len: Math.hypot(x1 - px, y1 - py), on: false });
        segs.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1), on: true });
        px = x2; py = y2;
      }
      return segs;
    }

    function startLayer() {
      phase = 'scan';
      path = buildPath(angleFor(layer));
      segI = 0; segOff = 0; trail = []; sinceSample = 0;
      const cost = path.reduce((s, g) => s + (g.on ? g.len : g.len * 0.2), 0);
      rate = cost / SCAN_MS;
    }

    function advance(budget) {
      bctx.strokeStyle = col.ink; bctx.globalAlpha = 0.85; bctx.lineWidth = 1; bctx.lineCap = 'butt';
      bctx.beginPath();
      while (budget > 0 && segI < path.length) {
        const g = path[segI];
        const w = g.on ? 1 : 0.2;
        const remain = g.len - segOff;
        const step = Math.min(remain, budget / w);
        const f0 = segOff / (g.len || 1), f1 = (segOff + step) / (g.len || 1);
        const ax = g.x1 + (g.x2 - g.x1) * f0, ay = g.y1 + (g.y2 - g.y1) * f0;
        const bx = g.x1 + (g.x2 - g.x1) * f1, by = g.y1 + (g.y2 - g.y1) * f1;
        if (g.on) { bctx.moveTo(ax, ay); bctx.lineTo(bx, by); }
        let s = TRAIL_STEP - sinceSample;
        while (s <= step) { const f = (segOff + s) / (g.len || 1); trail.push([g.x1 + (g.x2 - g.x1) * f, g.y1 + (g.y2 - g.y1) * f, g.on]); s += TRAIL_STEP; }
        sinceSample = (sinceSample + step) % TRAIL_STEP;
        segOff += step; budget -= step * w;
        if (segOff >= g.len - 1e-6) { segI++; segOff = 0; }
      }
      bctx.stroke(); bctx.globalAlpha = 1;
      if (trail.length > TRAIL) trail = trail.slice(-TRAIL);
    }

    function drawLaser() {
      tctx.clearRect(0, 0, W, H);
      if (!trail.length) return;
      tctx.strokeStyle = col.laser; tctx.lineWidth = 1.25; tctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        if (!a[2] || !b[2]) continue;
        tctx.globalAlpha = i / trail.length;
        tctx.beginPath(); tctx.moveTo(a[0], a[1]); tctx.lineTo(b[0], b[1]); tctx.stroke();
      }
      tctx.globalAlpha = 1;
      const h = trail[trail.length - 1];
      tctx.fillStyle = col.laser; tctx.beginPath(); tctx.arc(h[0], h[1], 1.4, 0, Math.PI * 2); tctx.fill();
    }

    function recoatStep(x) {
      // new powder buries the finished layer, left to right
      const x0 = recoatX, x1 = Math.min(W, x);
      if (x1 > x0) {
        bctx.clearRect(x0, 0, x1 - x0 + 1, H);
        bctx.globalAlpha = 0.3; bctx.fillStyle = col.powder; bctx.fillRect(x0, 0, x1 - x0 + 1, H); bctx.globalAlpha = 1;
      }
      recoatX = x1;
      tctx.clearRect(0, 0, W, H);
      tctx.fillStyle = col.part; tctx.globalAlpha = 0.9; tctx.fillRect(Math.min(W - 2, x1), 0, 2, H); tctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(50, now - (last || now)); last = now;
      if (phase === 'scan') {
        advance(dt * rate);
        drawLaser();
        if (segI >= path.length) { phase = 'dwell'; t0 = now; trail = []; tctx.clearRect(0, 0, W, H); }
      } else if (phase === 'dwell') {
        if (now - t0 > DWELL_MS) { phase = 'recoat'; t0 = now; recoatX = 0; }
      } else if (phase === 'recoat') {
        const p = Math.min(1, (now - t0) / RECOAT_MS);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        recoatStep(e * W);
        if (p >= 1) { tctx.clearRect(0, 0, W, H); layer = layer >= TOTAL ? START : layer + 1; startLayer(); }
      }
      raf = requestAnimationFrame(frame);
    }

    function drawStatic() {
      if (!mask) return;
      bctx.clearRect(0, 0, W, H); tctx.clearRect(0, 0, W, H);
      const segs = buildPath(angleFor(layer));
      bctx.strokeStyle = col.ink; bctx.globalAlpha = 0.85; bctx.lineWidth = 1; bctx.beginPath();
      for (const g of segs) if (g.on) { bctx.moveTo(g.x1, g.y1); bctx.lineTo(g.x2, g.y2); }
      bctx.stroke(); bctx.globalAlpha = 1;
    }

    function play() {
      const should = alive && ready && mask && visible && !document.hidden && !reduced.matches;
      if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    }

    function reset() {
      running = false; if (raf) cancelAnimationFrame(raf); raf = 0;
      size();
      if (!mask) return;
      bctx.clearRect(0, 0, W, H); tctx.clearRect(0, 0, W, H);
      if (reduced.matches) { drawStatic(); return; }
      startLayer(); play();
    }

    let io, rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (W !== Math.round(wrap.getBoundingClientRect().width)) reset(); }, 160);
    };
    let firstTheme = true;
    const unTheme = theme.subscribe(() => {
      if (firstTheme) { firstTheme = false; return; }
      recolor();
    });

    (async () => {
      recolor();
      try { await document.fonts.load('900 100px "Chivo"'); await document.fonts.ready; } catch (e) { /* fall back to system face */ }
      if (!alive) return;
      ready = true;
      reset();
      io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; play(); });
      io.observe(wrap);
      document.addEventListener('visibilitychange', play);
      addEventListener('resize', onResize);
      reduced.addEventListener('change', reset);
    })();

    return () => {
      alive = false;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(rt);
      io?.disconnect();
      document.removeEventListener('visibilitychange', play);
      removeEventListener('resize', onResize);
      reduced.removeEventListener('change', reset);
      unTheme();
    };
  });
</script>

<div class="hero-top">
  <div class="bed" bind:this={wrap}>
    <h1 {id} tabindex="-1" bind:this={h1} aria-label={lines.join(' ')}>
      {#each lines as line}<span aria-hidden="true">{line}</span>{/each}
    </h1>
    <canvas bind:this={base} aria-hidden="true"></canvas>
    <canvas bind:this={top} aria-hidden="true"></canvas>
  </div>
  <dl class="readout mono" aria-hidden="true">
    <dt>Layer</dt><dd>{roLayer}</dd>
    <dt>Z</dt><dd>{roZ}</dd>
    <dt>Layer thickness</dt><dd>110 µm</dd>
    <dt>Hatch</dt><dd>{roHatch}</dd>
  </dl>
</div>

<style>
  .hero-top { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: var(--s5) var(--s6); }
  .bed { position: relative; justify-self: start; min-width: 0; }
  h1 {
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.035em;
    line-height: 0.88;
    color: var(--part);
    font-size: clamp(64px, 13.4vw, 176px);
    margin: 0;
  }
  h1 span { display: block; white-space: nowrap; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .readout {
    font-size: var(--t-xs);
    color: var(--ink-2);
    display: grid;
    grid-template-columns: auto auto;
    gap: 2px var(--s4);
    padding-bottom: 6px;
    white-space: nowrap;
    margin: 0;
  }
  .readout dt { color: var(--ink-2); }
  .readout dd { margin: 0; color: var(--ink); text-align: right; }
  @media (max-width: 860px) {
    .hero-top { grid-template-columns: minmax(0, 1fr); }
    .readout { grid-template-columns: auto auto auto auto; justify-content: start; gap: 2px var(--s3); }
  }
  @media (max-width: 420px) {
    .readout { grid-template-columns: auto auto; }
    h1 { font-size: 19vw; }
  }
</style>
