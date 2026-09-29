<!--
  BuildColumn — reading progress drawn as an SLS build (ported from the mockup's `buildCols`).

  Mounted ONCE in src/routes/+layout.svelte. Do not mount it in pages.

  What it draws
    Scroll progress = build progress. Each page section is a sintered part in the slice map; the
    laser rasters the current top layer, serpentine, pixel by pixel. Scrolling back "unprints".

  Slice map (per page)
    Every element with `data-build="Label"` on the current page, in document order.
    Fallback when there are none: `main > section` (labelled by its first h1/h2).
    Re-measured after every navigation, on resize (ResizeObserver on <body> and the canvas),
    when web fonts are ready and whenever an image/video inside the page finishes loading.
    If a page changes height without resizing <body>, call `refreshBuildColumn()`.

  Placement
    Default: fixed at the right edge on viewports > 900px wide (hidden at ≤ 900px).
    Docking: a page can move the column into its own element (e.g. a left "build height" ruler):
        import { dockBuildColumn } from '$lib/chamber/build.js';
        <div class="ruler-col" use:dockBuildColumn></div>
    or, imperatively, `buildDock.set(el)` / `buildDock.set(null)`. The target must have an explicit
    width and height; the canvas fills it. While docked the column is visible at any width
    (the page decides whether its ruler shows). Undocking happens automatically when the action's
    element is destroyed, and the column returns to the right edge.

  Reading its state (for ruler marks, a Z readout …)
    import { buildInfo } from '$lib/chamber/build.js';
    $buildInfo = { slices: [{ a, label, el }], progress, built, docked, yForP(p) }
      a         0..1 start of each section as a share of the document height
      progress  0..1 scroll progress;   built  0..1 layers actually drawn (quantized)
      yForP(p)  CSS px from the canvas top where the layer at progress p sits

  Accessibility
    role="slider" (vertical), focusable; ArrowUp/Right +2 %, ArrowDown/Left −2 %, PageUp/Down ±10 %,
    Home/End. aria-valuetext names the section. Click/drag scrolls the page.
    Reduced motion: no laser animation, layers still fill statically. Animation stops while the tab
    is hidden or the canvas is not displayed.
-->
<script>
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { buildDock, buildInfo, _setRelayout } from './build.js';
  import { theme } from './theme.js';

  let canvas;
  let home;
  let docked = false;
  let queue = () => {};

  afterNavigate(() => queue());

  onMount(() => {
    const LAYER = 2, RECOAT_MS = 150, COOL_MS = 400, FAST_PASS = 260, IDLE_PASS = 2800, BURST_MS = 240, HEAD = 4;
    const INSETS = [[3, 3], [2, 4], [4, 2], [2, 3], [3, 2], [4, 4], [2, 2]];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const ctx = canvas.getContext('2d');
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const docH = () => Math.max(1, document.documentElement.scrollHeight);
    const maxScroll = () => Math.max(1, docH() - innerHeight);
    const prog = () => clamp(scrollY / maxScroll());

    let tok = {};
    let raf = 0, sraf = 0, lraf = 0;
    const readTok = () => {
      tok = { part: css('--part'), shade: css('--powder-shade'), powder: css('--powder'), laser: css('--laser'), ink: css('--ink'), ink2: css('--ink-2'), rule: css('--rule') };
    };

    function sections() {
      let els = [...document.querySelectorAll('[data-build]')];
      if (!els.length) els = [...document.querySelectorAll('main > section')];
      return els
        .filter((el) => el.getClientRects().length)
        .map((el, i) => ({
          el,
          label: el.dataset.build || el.querySelector('h1, h2')?.textContent.trim() || `Section ${i + 1}`
        }));
    }
    // share of the document each section owns; a reading line sweeping the viewport hits them in step with p
    function sliceMap() {
      const secs = sections();
      if (!secs.length) return [{ a: 0, label: '', el: null }];
      const H = docH();
      const out = secs.map((s) => ({ a: clamp((s.el.getBoundingClientRect().top + scrollY) / H), label: s.label, el: s.el }));
      out[0].a = 0;
      for (let i = 1; i < out.length; i++) out[i].a = Math.max(out[i].a, out[i - 1].a);
      return out;
    }

    const S = { W: 0, H: 0, dpr: 1, lp: 2, wp: 1, pl: 2, ix0: 0, iw: 0, N: 8, rows: [], slices: [], L: -1, p: 0,
      heat: null, hx0: 0, hw: 0, s: 0, passMs: IDLE_PASS, recoatAt: -1e9, lastChange: -1e9, last: 0, visible: false, pct: -1 };
    const rowY = (k) => S.H - S.pl - (k + 1) * S.lp; // device px, top of layer k (layer 0 sits on the plate)

    function publish() {
      buildInfo.set({
        slices: S.slices,
        progress: S.p,
        built: S.visible ? Math.min(S.L, S.N) / S.N : S.p,
        docked,
        yForP: (p) => (S.H - S.pl - p * S.N * S.lp) / S.dpr
      });
    }

    function layout(p) {
      const r = canvas.getBoundingClientRect();
      S.visible = r.width > 0 && r.height > 0;
      S.p = p;
      S.slices = sliceMap();
      if (!S.visible) { aria(); publish(); return; }
      const d = (S.dpr = Math.min(3, window.devicePixelRatio || 1));
      S.W = Math.round(r.width * d); S.H = Math.round(r.height * d);
      canvas.width = S.W; canvas.height = S.H;
      S.lp = Math.max(2, Math.round(LAYER * d)); S.wp = Math.max(1, Math.round(d)); S.pl = Math.max(2, Math.round(2 * d));
      S.ix0 = S.wp; S.iw = S.W - 2 * S.wp;
      S.N = Math.max(8, Math.floor((S.H - S.pl - S.wp) / S.lp) - HEAD);
      buildRows();
      S.L = -1; S.pct = -1;
      setProgress(p, performance.now());
    }

    function buildRows() {
      const { N, dpr, ix0, iw, slices } = S;
      const gap = N > 160 ? 2 : 1;
      const idx = new Int16Array(N), lo = [], hi = [];
      for (let k = 0, j = 0; k < N; k++) {
        const pk = (k + 0.5) / N;
        while (j + 1 < slices.length && pk >= slices[j + 1].a) j++;
        idx[k] = j; if (lo[j] === undefined) lo[j] = k; hi[j] = k;
      }
      S.rows = new Array(N).fill(null);
      for (let k = 0; k < N; k++) {
        const j = idx[k], a = lo[j] + gap, b = hi[j];
        if (k < a || b - a < 1) continue; // unsintered powder between parts
        let [l, r] = INSETS[j % INSETS.length];
        if ((k === a || k === b) && b - a > 3) { l += 1; r += 1; } // one-layer chamfer top and bottom
        S.rows[k] = { x0: ix0 + Math.round(l * dpr), x1: ix0 + iw - Math.round(r * dpr) };
      }
    }

    function paintAll() {
      const { W, H, wp, pl } = S;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
      ctx.fillStyle = tok.powder; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = tok.rule; ctx.fillRect(0, 0, W, wp); ctx.fillRect(0, 0, wp, H - pl); ctx.fillRect(W - wp, 0, wp, H - pl);
      ctx.fillStyle = tok.ink2; ctx.fillRect(0, H - pl, W, pl);
      for (let k = 0; k < Math.min(S.L, S.N); k++) paintDone(k);
    }
    function paintDone(k) {
      const y = rowY(k), r = S.rows[k];
      ctx.fillStyle = tok.shade; ctx.fillRect(S.ix0, y, S.iw, S.lp);
      if (r) { ctx.fillStyle = tok.part; ctx.fillRect(r.x0, y, r.x1 - r.x0, S.lp); }
      ctx.globalAlpha = 0.12; ctx.fillStyle = tok.powder; ctx.fillRect(S.ix0, y, S.iw, 1); ctx.globalAlpha = 1;
    }
    function paintFresh(k0, k1) {
      const yTop = Math.max(S.wp, rowY(k1)), yBot = rowY(k0) + S.lp;
      if (yBot > yTop) { ctx.fillStyle = tok.powder; ctx.fillRect(S.ix0, yTop, S.iw, yBot - yTop); }
    }

    // mode: 'recoat' (blade sweeps, then a fast scan), 'carry' (mid-scroll: laser keeps its place), 'cool' (static)
    function startLayer(now, mode) {
      const r = S.L < S.N ? S.rows[S.L] : null;
      const total = S.heat ? S.heat.length : 0, frac = total ? S.s / total : 0;
      if (r) { S.hx0 = r.x0; S.hw = r.x1 - r.x0; S.heat = new Float64Array(S.hw * S.lp); } else { S.hw = 0; S.heat = null; }
      if (mode === 'cool' || reduced.matches) { if (S.heat) S.heat.fill(1); S.s = 0; S.passMs = IDLE_PASS; S.recoatAt = -1e9; }
      else if (mode === 'carry') { S.s = S.heat ? frac * S.heat.length : 0; S.passMs = FAST_PASS; }
      else { S.s = 0; S.passMs = FAST_PASS; S.recoatAt = now; }
    }

    function setProgress(p, now) {
      S.p = p;
      if (!S.visible) { aria(); publish(); return; }
      const L = Math.min(S.N, Math.floor(p * S.N + 1e-6)), prev = S.L;
      if (prev < 0) { S.L = L; paintAll(); startLayer(now, 'cool'); }
      else if (L > prev) {
        for (let k = prev; k < L; k++) paintDone(k); // completed layers jump in instantly
        S.L = L;
        const recoating = now - S.recoatAt < RECOAT_MS;
        startLayer(now, recoating ? 'carry' : (now - S.lastChange < BURST_MS ? 'carry' : 'recoat'));
        if (recoating) S.s = 0;
      } else if (L < prev) { // scrolling back unprints, no drama
        paintFresh(L, Math.min(prev, S.N) + HEAD);
        S.L = L; startLayer(now, 'cool');
      }
      if (L !== prev) S.lastChange = now;
      paintTop(now);
      aria();
      publish();
    }

    function pix(i, y) {
      const sub = (i / S.hw) | 0, w = i - sub * S.hw;
      return [S.hx0 + (sub & 1 ? S.hw - 1 - w : w), y + S.lp - 1 - sub];
    }
    function paintTop(now) {
      const { L, N, lp } = S;
      if (L >= N) return;
      paintFresh(L, L + HEAD);
      const y = rowY(L), rec = now - S.recoatAt;
      if (rec < RECOAT_MS) {
        const x = S.ix0 + Math.round(S.iw * rec / RECOAT_MS);
        ctx.fillStyle = tok.shade; ctx.fillRect(S.ix0, y, x - S.ix0, lp);
        ctx.globalAlpha = 0.4; ctx.fillStyle = tok.ink;
        ctx.fillRect(Math.min(x, S.ix0 + S.iw - S.wp), Math.max(S.wp, y - 3 * lp), S.wp, y + lp - Math.max(S.wp, y - 3 * lp));
        ctx.globalAlpha = 1;
        return;
      }
      ctx.fillStyle = tok.shade; ctx.fillRect(S.ix0, y, S.iw, lp);
      const heat = S.heat; if (!heat) return;
      ctx.fillStyle = tok.part;
      for (let i = 0; i < heat.length; i++) if (heat[i]) { const [px, py] = pix(i, y); ctx.fillRect(px, py, 1, 1); }
      ctx.fillStyle = tok.laser;
      for (let i = 0; i < heat.length; i++) {
        const age = now - heat[i];
        if (!heat[i] || age >= COOL_MS) continue;
        const [px, py] = pix(i, y);
        ctx.globalAlpha = 0.7 * (1 - age / COOL_MS); ctx.fillRect(px, py, 1, 1);
      }
      ctx.globalAlpha = 1;
      if (reduced.matches) return;
      // laser spot: fills the layer's height, with a faint bloom into the fresh powder above
      const dw = Math.max(3, Math.round(3 * S.dpr));
      const [lx] = pix(Math.min(heat.length - 1, Math.floor(S.s)), y);
      const dx = Math.min(Math.max(S.ix0, lx - (dw >> 1)), S.ix0 + S.iw - dw);
      ctx.fillRect(dx, y, dw, lp);
      ctx.globalAlpha = 0.28;
      ctx.fillRect(Math.max(S.ix0, dx - S.wp), Math.max(S.wp, y - lp), Math.min(dw + 2 * S.wp, S.ix0 + S.iw - Math.max(S.ix0, dx - S.wp)), lp);
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      const dt = Math.min(64, now - (S.last || now)); S.last = now;
      if (!S.visible) return;
      if (S.heat && now - S.recoatAt >= RECOAT_MS) {
        const total = S.heat.length, s1 = S.s + total / S.passMs * dt;
        for (let i = Math.floor(S.s); i < Math.min(total, Math.floor(s1)); i++) S.heat[i] = now;
        if (s1 >= total) { S.s = 0; S.passMs = IDLE_PASS; } else S.s = s1;
      }
      paintTop(now);
    }

    function aria() {
      const pct = Math.round(S.p * 100);
      if (pct === S.pct) return; S.pct = pct;
      let lab = ''; for (const s of S.slices) if (S.p >= s.a) lab = s.label;
      canvas.setAttribute('aria-valuenow', String(pct));
      canvas.setAttribute('aria-valuetext', `${pct}% built${lab ? ', ' + lab : ''}`);
    }

    // click / drag / keys: scroll the view to that proportion
    const pFromY = (cy) => { const r = canvas.getBoundingClientRect(); return clamp((S.H - S.pl - (cy - r.top) * S.dpr) / (S.N * S.lp)); };
    const go = (p, smooth) => scrollTo({ top: p * maxScroll(), behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
    let drag = null;
    const onDown = (e) => { if (e.button) return; drag = { y: e.clientY, moved: false }; try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } go(pFromY(e.clientY), true); };
    const onMove = (e) => { if (!drag) return; if (Math.abs(e.clientY - drag.y) > 3) drag.moved = true; if (drag.moved) go(pFromY(e.clientY), false); };
    const onUp = () => { drag = null; };
    const onKey = (e) => {
      const step = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02, PageUp: 0.1, PageDown: -0.1 }[e.key];
      let p = null;
      if (step !== undefined) p = prog() + step; else if (e.key === 'Home') p = 0; else if (e.key === 'End') p = 1;
      if (p === null) return;
      e.preventDefault(); go(clamp(p), false);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('keydown', onKey);

    // ---- loop + scheduling ----
    const live = () => S.visible && !reduced.matches && !document.hidden;
    function loop(now) { raf = 0; if (!live()) return; tick(now); raf = requestAnimationFrame(loop); }
    function kick() { if (!raf && live()) { S.last = 0; raf = requestAnimationFrame(loop); } }
    function relayout() { layout(prog()); kick(); }
    const schedule = () => { if (!lraf) lraf = requestAnimationFrame(() => { lraf = 0; relayout(); }); };
    queue = schedule;
    _setRelayout(schedule);
    const onScroll = () => { sraf = 0; setProgress(prog(), performance.now()); };
    const onScrollEvt = () => { if (!sraf) sraf = requestAnimationFrame(onScroll); };
    const onMediaLoad = (e) => { const t = e.target; if (t && (t.tagName === 'IMG' || t.tagName === 'VIDEO' || t.tagName === 'IFRAME')) schedule(); };

    addEventListener('scroll', onScrollEvt, { passive: true });
    addEventListener('resize', schedule);
    addEventListener('load', schedule);
    document.addEventListener('load', onMediaLoad, true); // load doesn't bubble; capture catches images
    document.addEventListener('loadedmetadata', onMediaLoad, true);
    document.addEventListener('visibilitychange', kick);
    reduced.addEventListener('change', relayout);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    ro.observe(canvas);
    document.fonts?.ready.then(() => queue()).catch(() => {});

    // ---- theme ----
    let first = true;
    const unTheme = theme.subscribe(() => {
      readTok();
      if (first) { first = false; return; }
      if (S.visible) { S.L = -1; setProgress(S.p, performance.now()); }
    });

    // ---- docking ----
    const unDock = buildDock.subscribe((target) => {
      const dest = target && target.isConnected !== false ? target : home;
      if (dest && canvas.parentNode !== dest) dest.appendChild(canvas);
      docked = !!target;
      queue();
    });

    readTok();
    relayout();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (sraf) cancelAnimationFrame(sraf);
      if (lraf) cancelAnimationFrame(lraf);
      queue = () => {};
      _setRelayout(null);
      removeEventListener('scroll', onScrollEvt);
      removeEventListener('resize', schedule);
      removeEventListener('load', schedule);
      document.removeEventListener('load', onMediaLoad, true);
      document.removeEventListener('loadedmetadata', onMediaLoad, true);
      document.removeEventListener('visibilitychange', kick);
      reduced.removeEventListener('change', relayout);
      ro.disconnect();
      unTheme();
      unDock();
      if (canvas.parentNode !== home) home?.appendChild(canvas);
    };
  });
</script>

<div class="bc-home" bind:this={home}>
  <canvas
    bind:this={canvas}
    class="build-col"
    class:build-col--fixed={!docked}
    class:build-col--docked={docked}
    role="slider"
    tabindex="0"
    aria-label="Build progress (page scroll)"
    aria-orientation="vertical"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="0"
  ></canvas>
</div>

<style>
  .bc-home { display: contents; }
  .build-col { display: block; cursor: pointer; touch-action: none; background: var(--powder); }
  .build-col--fixed {
    position: fixed;
    z-index: 5;
    right: max(12px, env(safe-area-inset-right));
    top: calc(env(safe-area-inset-top, 0px) + 24px);
    width: 22px;
    height: calc(100vh - 48px - env(safe-area-inset-top, 0px));
  }
  .build-col--docked { width: 100%; height: 100%; }
  @media (max-width: 900px) {
    .build-col--fixed { display: none; }
  }
</style>
