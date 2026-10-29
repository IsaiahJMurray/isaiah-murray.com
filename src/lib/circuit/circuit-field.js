/*
 * circuit-field.js — a decorative, interactive logic-gate network.
 *
 * A dense grid of AND / OR / XOR / NOT gates wired with Manhattan-routed
 * traces. Signals are pulses that race along wires; when they reach a gate
 * the gate decides whether to fire:
 *   OR   fires on any input
 *   AND  fires only if both inputs arrive within `andWindow`
 *   XOR  fires if one input arrives and the other doesn't within `xorWindow`
 *   NOT  never passes a pulse through; instead it fires on its own now and
 *        then while its input is quiet (these are the ambient sources)
 *   LATCH  memory cells that spell out `text` in a 5x7 pixel font. A latch
 *        that's hit lights its whole letter, holds for `latchHold`, then fades.
 *   CHIP   a few DIP packages, each with a status display:
 *          CD4017 counter   every input steps a lit LED down a column of 10
 *                           and fires the next output in turn; on wrapping
 *                           it fires all of them
 *          NE555 timer      input charges a capacitor bar; when full it ticks
 *                           out `timerCycles` evenly spaced bursts
 *          74HC595 shift    strong inputs shift in a 1, weak ones a 0; every
 *                           8 shifts it fires the outputs whose bit is set
 *   DISPLAY  16-segment character displays spelling `displays[].text`, four
 *        input pins each; they light like latches and pass the glow along
 *        the string
 *   KEEP-OUT  page elements matching `keepout` get a clear area with no
 *        gates or traces. Pins along their left and right edges are wired
 *        into the board; signals arriving there light the pin, and when the
 *        element scrolls into view its output pins send a burst outward.
 * Every hop multiplies a pulse's strength by `decay`, so cascades fade out
 * and the field settles back into the background.
 *
 * With `scroll: true` the board covers the whole document and scrolls with
 * it. Put the canvas directly in <body>; the field positions and sizes it
 * itself and adds tile canvases just before it. Board coordinates are then
 * document px, and `textAt` / `displays[].at` are fractions of the viewport's
 * width and height measured from the top of the page (y > 1 is further down).
 *
 * Usage:
 *   const field = CircuitField(document.querySelector('canvas'), { ... });
 *   field.pulse(x, y);          // inject a burst at canvas-local CSS px
 *   field.reveal();             // sweep the text on, left to right
 *   field.setOptions({ ... });  // live-tune
 *   field.refresh();            // re-measure the page after changing content
 *   field.destroy();
 *
 * The canvas can sit behind content with `pointer-events: none`; clicks are
 * read from the window and ignored on links, buttons, form controls and
 * anything matching `options.ignore`.
 */
(function (root) {
  'use strict';

  const DEFAULTS = {
    cell: 30,              // grid pitch in CSS px; at most one gate per cell
    mobileCell: 24,        // grid pitch on screens narrower than mobileWidth
    mobileWidth: 640,
    density: 0.6,          // fraction of cells holding a gate
    mix: { AND: 0.3, OR: 0.32, XOR: 0.24, NOT: 0.14 },
    reach: 5,              // max columns away a gate looks for a driver
    reachV: 3,             // max rows away
    maxFanout: 4,

    mode: 'particles',     // 'particles': pulses travel along wires
                           // 'nets': a firing gate lights its whole output net at once
    speed: 480,            // px / s along wires
    trail: 44,             // px of glowing tail behind each pulse
    netHop: 0.06,          // nets mode: s for a signal to cross a net
    netFade: 0.45,         // nets mode: s for a lit net to fade
    decay: 0.9,            // strength multiplier per gate hop
    minStrength: 0.06,     // pulses weaker than this aren't emitted
    gateDelay: 0.035,      // s between a gate triggering and its output leaving
    refractory: 0.8,       // s a gate ignores input after firing
    andWindow: 0.3,        // s both AND inputs must arrive within
    xorWindow: 0.12,       // s an XOR waits to see if the other input arrives too

    text: '',              // spelled out in latch cells
    nameFallback: true,    // if the latch text doesn't fit (phones), spell it in
                           // large segment displays instead, one word per line
    textAt: [0.5, 0.5],    // centre of the text as a fraction of width / height
    latchHold: 2.5,        // s a lit letter stays fully on
    latchFade: 1.8,        // s it takes to fade back out
    latchSpread: 0.045,    // s for the glow to step to a neighbouring latch
    latchOutput: 0.7,      // strength multiplier for pulses latches send onward
    intro: true,           // sweep the text on once after load

    chips: 2.5,            // DIP packages per megapixel
    chipOutput: 0.85,      // strength of a chip's burst
    chipThreshold: 1.6,    // timer: summed pulse strength that fills the capacitor
    chipLeak: 2.5,         // timer: s time constant for the charge to drain away
    chipRefractory: 2,     // timer: s it ignores input after a run of ticks
    timerCycles: 4,
    timerPeriod: 0.4,      // s between timer ticks
    shiftThreshold: 0.45,  // shift register: inputs at least this strong shift in a 1

    ambient: 0.8,          // spontaneous firings per second per megapixel
    ambientStrength: [0.3, 0.65],
    clickRadius: 120,
    clickStrength: 1,
    intensity: 1,          // brightness multiplier for pulses and flashes
    maxPulses: 2500,

    theme: 'auto',         // 'auto' | 'dark' | 'light'
    colors: null,          // { pulse, memory, trace, head } as [r,g,b] or '#rrggbb'
    seed: null,            // number for a repeatable layout

    // Fine-text 16-segment displays: [{ text: 'HELLO', at: [0.5, 0.8], size: 1 }].
    // `at` is the text's centre as a fraction of width / height; '\n' starts
    // a new line, and lines too long for the screen wrap at spaces. `size`
    // scales each character (1 = one cell wide, two tall).
    displays: [],
    displaySpread: 0.04,   // s for the glow to step to the next character

    scroll: false,         // true: the board spans the document and scrolls with it
    keepout: '[data-circuit-keepout]', // elements the board leaves clear ('' for none)
    keepoutPad: 14,        // px of clearance around them
    edgeOutput: 0.9,       // strength of the burst a keep-out sends when it scrolls into view
    edgeRefractory: 8,     // s before the same one can send again
    interactive: true,
    respectReducedMotion: true,
    ignore: 'a, button, input, textarea, select, label, summary, [contenteditable], [data-circuit-ignore]',
  };

  // `trace` colours the static board (wires, gates, packages) at the alphas
  // given; `pulse` is moving signals, `memory` is stored state (lit letters,
  // chip and segment displays).
  const THEMES = {
    dark: {
      trace: [150, 175, 205],
      alpha: { wire: 0.08, gate: 0.15, chip: 0.05, chipLine: 0.32 },
      pulse: [110, 210, 255],
      head: [230, 250, 255],
      memory: [235, 240, 248],
      blend: 'lighter',
    },
    light: {
      trace: [40, 55, 80],
      alpha: { wire: 0.085, gate: 0.16, chip: 0.045, chipLine: 0.34 },
      pulse: [25, 110, 205],
      head: [10, 55, 130],
      memory: [30, 36, 48],
      blend: 'source-over',
    },
  };

  // 16-segment geometry in a 1 x 2 box: [x1, y1, x2, y2].
  const SEGMENTS = {
    a1: [0, 0, 0.5, 0], a2: [0.5, 0, 1, 0], b: [1, 0, 1, 1], c: [1, 1, 1, 2],
    d1: [0, 2, 0.5, 2], d2: [0.5, 2, 1, 2], e: [0, 1, 0, 2], f: [0, 0, 0, 1],
    g1: [0, 1, 0.5, 1], g2: [0.5, 1, 1, 1], h: [0, 0, 0.5, 1], i: [0.5, 0, 0.5, 1],
    j: [1, 0, 0.5, 1], k: [0.5, 1, 0, 2], l: [0.5, 1, 0.5, 2], m: [0.5, 1, 1, 2],
  };
  const SEG16 = {
    A: 'a1 a2 b c e f g1 g2', B: 'a1 a2 b c d1 d2 i l g2', C: 'a1 a2 f e d1 d2',
    D: 'a1 a2 b c d1 d2 i l', E: 'a1 a2 f e d1 d2 g1', F: 'a1 a2 f e g1',
    G: 'a1 a2 f e d1 d2 c g2', H: 'f e b c g1 g2', I: 'a1 a2 i l d1 d2',
    J: 'b c d1 d2 e', K: 'f e g1 j m', L: 'f e d1 d2', M: 'f e b c h j',
    N: 'f e b c h m', O: 'a1 a2 b c d1 d2 e f', P: 'a1 a2 f e b g1 g2',
    Q: 'a1 a2 b c d1 d2 e f m', R: 'a1 a2 f e b g1 g2 m', S: 'a1 a2 f g1 g2 c d1 d2',
    T: 'a1 a2 i l', U: 'f e d1 d2 b c', V: 'f e k j', W: 'f e b c k m',
    X: 'h j k m', Y: 'h j l', Z: 'a1 a2 j k d1 d2',
    0: 'a1 a2 b c d1 d2 e f j k', 1: 'b c j', 2: 'a1 a2 b g1 g2 e d1 d2',
    3: 'a1 a2 b c d1 d2 g1 g2', 4: 'f g1 g2 b c', 5: 'a1 a2 f g1 g2 c d1 d2',
    6: 'a1 a2 f e d1 d2 c g1 g2', 7: 'a1 a2 b c', 8: 'a1 a2 b c d1 d2 e f g1 g2',
    9: 'a1 a2 f b g1 g2 c d1 d2',
    '-': 'g1 g2', '+': 'g1 g2 i l', '/': 'j k', '\\': 'h m', '_': 'd1 d2',
    "'": 'i', ',': 'k', '.': 'd1', '=': 'g1 g2 d1 d2', '*': 'g1 g2 h i j k l m',
    '&': 'a1 h i g1 e d1 d2 m', '@': 'a1 a2 b c d2 d1 e f g2 i', '|': 'i l',
  };

  // 5x7 pixel glyphs. Add letters here to spell other text; unknown
  // characters are skipped.
  const FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  };

  // Options that change the generated network and need a rebuild.
  const STRUCTURAL = ['cell', 'mobileCell', 'mobileWidth', 'nameFallback','density', 'mix', 'reach', 'reachV', 'maxFanout', 'seed', 'text', 'textAt', 'chips', 'displays', 'scroll', 'keepout', 'keepoutPad'];
  const CHIP_KINDS = [
    { kind: 'counter', label: 'CD4017', cells: 10 },
    { kind: 'timer', label: 'NE555', cells: 0 },
    { kind: 'shift', label: '74HC595', cells: 8 },
  ];
  // Pulses and flashes are batched into this many alpha levels per frame.
  const BUCKETS = 6;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Half-pixel snap so 1px strokes land crisply on device pixels.
  const snap = (v) => Math.floor(v) + 0.5;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a > 1 ? 1 : a})`;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mixRGB = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));

  // Splits on '\n', then wraps each line at spaces to at most `max` chars.
  // A single word longer than that is left whole.
  function wrap(text, max) {
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ').filter(Boolean)) {
        if (line && line.length + 1 + word.length > max) { out.push(line); line = word; }
        else line = line ? line + ' ' + word : word;
      }
      out.push(line);
    }
    return out;
  }

  // Accepts [r, g, b] or '#rgb' / '#rrggbb'.
  function toRGB(v) {
    if (Array.isArray(v)) return v;
    if (typeof v !== 'string') return null;
    let h = v.trim().replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    const n = parseInt(h, 16);
    return Number.isNaN(n) || h.length !== 6 ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function CircuitField(canvas, options) {
    options = options || {};
    const o = Object.assign({}, DEFAULTS, options);
    o.mix = Object.assign({}, DEFAULTS.mix, options.mix);

    // Two layers. The static board (wires, gates, packages) is cached; the
    // live canvas only draws what's lit or moving.
    //   scroll: false  the static board is one offscreen canvas copied into
    //                  the live canvas every frame.
    //   scroll: true   the static board is a stack of tile canvases placed in
    //                  the page itself, so the browser scrolls them along with
    //                  the content and scrolling costs nothing. Tiles are drawn
    //                  just before they come into view and recycled after. The
    //                  live canvas is also placed in the page, a little taller
    //                  than the window, and only moves when the view nears its
    //                  edge.
    const ctx = canvas.getContext('2d');
    const origCss = canvas.style.cssText;
    const stat = document.createElement('canvas');
    const sctx = stat.getContext('2d');
    const tiles = new Map(), tilePool = [];
    const sprites = {};
    const mqDark = matchMedia('(prefers-color-scheme: dark)');
    const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
    const buckets = Array.from({ length: BUCKETS }, () => []);

    // W x H is the board. The window shows W x viewH of it from `off`; the
    // live canvas covers W x dynH from `dTop`. In scroll mode board (0, 0) is
    // the page point (originX, originY).
    let W = 0, H = 0, viewH = 0, off = 0, dTop = 0, dynH = 0, tileH = 0, step8 = 1, dpr = 1;
    let originX = 0, originY = 0, spriteKey = '', cell = o.cell;
    let gates = [], notGates = [], latches = [], chips = [], displays = [], zones = [];
    let pulses = [], nets = [], queue = [], flashing = [], latched = [];
    let wireCount = 0, chipsActive = false;
    let pal = null;
    let t = 0, last = 0, raf = 0, visible = true, destroyed = false, introAt = -1;
    let dragAt = -1;

    // Without a seed, every rebuild still reuses this one so the layout
    // doesn't reshuffle when the page re-measures.
    const seed0 = (Math.random() * 4294967296) >>> 0;
    const reduced = () => o.respectReducedMotion && mqReduce.matches;
    const view = (cx, top) => cx.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
    // Rounds CSS px to a multiple that lands on whole device pixels, so
    // tiles and the live canvas never sit at a fractional pixel offset.
    const align = (v) => Math.round(v / step8) * step8;

    function updateView() {
      off = o.scroll ? window.scrollY - originY : 0;
    }

    function resolvePalette() {
      const name = o.theme === 'auto' ? (mqDark.matches ? 'dark' : 'light') : o.theme;
      const base = THEMES[name] || THEMES.dark;
      const c = o.colors || {};
      const trace = toRGB(c.trace) || base.trace;
      const pulse = toRGB(c.pulse);
      pal = {
        wire: rgba(trace, base.alpha.wire),
        gate: rgba(trace, base.alpha.gate),
        chip: rgba(trace, base.alpha.chip),
        chipLine: rgba(trace, base.alpha.chipLine),
        pulse: pulse || base.pulse,
        // A custom signal colour gets a matching head: whiter on dark, deeper on light.
        head: toRGB(c.head) || (pulse ? mixRGB(pulse, name === 'light' ? [0, 0, 0] : [255, 255, 255], name === 'light' ? 0.45 : 0.7) : base.head),
        memory: toRGB(c.memory) || base.memory,
        blend: base.blend,
      };
    }

    // ---------------------------------------------------------------- network

    // Lays `o.text` out on the cell grid, one glyph pixel per cell. Returns a
    // per-cell letter index (-1 = not part of the text). Falls back to one
    // word per line, and to nothing if it still doesn't fit. `colAt` /
    // `rowAt` turn a fraction of the viewport into a grid position.
    function layoutText(cols, rows, colAt, rowAt) {
      const mask = new Int16Array(cols * rows).fill(-1);
      const words = String(o.text || '').toUpperCase().split(/\s+/)
        .map((w) => [...w].filter((ch) => FONT[ch]))
        .filter((w) => w.length);
      if (!words.length) return mask;

      const GAP = 3, LEAD = 2, GLYPH_H = 7, MARGIN = 2;
      const wordW = (w) => w.reduce((s, ch) => s + FONT[ch][0].length + 1, -1);
      const lineW = (l) => l.reduce((s, w) => s + wordW(w) + GAP, -GAP);
      let lines = [words];
      if (lineW(words) > cols - 2 * MARGIN) lines = words.map((w) => [w]);
      const width = Math.max(...lines.map(lineW));
      const height = lines.length * GLYPH_H + (lines.length - 1) * LEAD;
      if (width > cols - 2 * MARGIN || height > rows - 2 * MARGIN) return mask;

      const top = clamp(Math.round(rowAt(o.textAt[1]) - height / 2), MARGIN, rows - MARGIN - height);
      let id = 0;
      lines.forEach((line, li) => {
        const lw = lineW(line);
        let col = clamp(Math.round(colAt(o.textAt[0]) - lw / 2), MARGIN, cols - MARGIN - lw);
        const row0 = top + li * (GLYPH_H + LEAD);
        for (const word of line) {
          for (const ch of word) {
            const glyph = FONT[ch];
            glyph.forEach((bits, r) => {
              for (let c = 0; c < bits.length; c++) if (bits[c] === '#') mask[(row0 + r) * cols + col + c] = id;
            });
            col += glyph[0].length + 1;
            id++;
          }
          col += GAP - 1;
        }
      });
      return mask;
    }

    function build() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      step8 = 1;
      for (let q = 1; q <= 8; q++) if (Math.abs(q * dpr - Math.round(q * dpr)) < 1e-3) { step8 = q; break; }
      clearTiles();
      let r;
      if (o.scroll) {
        // Park the live canvas at the top with no height so it doesn't count
        // towards the page height, then measure.
        const de = document.documentElement;
        W = Math.max(1, de.clientWidth); viewH = Math.max(1, de.clientHeight, window.innerHeight);
        canvas.style.cssText = origCss + `;inset:auto;position:absolute;left:0;top:0;width:${W}px;height:0px;`;
        r = canvas.getBoundingClientRect();
        originX = r.left + window.scrollX; originY = r.top + window.scrollY;
        H = Math.max(viewH, de.scrollHeight - originY);
        // Canvas pixels are where the memory goes: the live canvas is only a
        // little taller than the window, and tiles are a third of it so few
        // are held beyond what's on screen.
        dynH = Math.min(align(H), align(viewH * 1.2));
        tileH = Math.max(step8, align(viewH / 3));
        dTop = 0;
        canvas.style.height = dynH + 'px';
        canvas.height = Math.round(dynH * dpr);
        stat.width = stat.height = 0;
      } else {
        canvas.style.cssText = origCss;
        r = canvas.getBoundingClientRect();
        W = Math.max(1, r.width); viewH = H = dynH = Math.max(1, r.height);
        originX = originY = dTop = 0;
        canvas.height = stat.height = Math.round(H * dpr);
        stat.width = Math.round(W * dpr);
      }
      canvas.width = Math.round(W * dpr);
      updateView();

      const rand = mulberry32(o.seed != null ? o.seed : seed0);
      // Phones get a finer grid so there's room for more than a few gates
      // across, and for the name.
      const c = cell = W < o.mobileWidth ? Math.min(o.cell, o.mobileCell) : o.cell;
      const cols = Math.ceil(W / c) + 2, rows = Math.ceil(H / c) + 2;
      const ox = (W - cols * c) / 2, oy = (H - rows * c) / 2;
      const grid = new Array(cols * rows).fill(null);
      const types = Object.keys(o.mix).filter((k) => o.mix[k] > 0);
      const mixTotal = types.reduce((s, k) => s + o.mix[k], 0);
      const pinOut = Math.round(c * 0.3), pinIn = Math.round(c * 0.1);

      gates = []; notGates = []; latches = []; chips = []; displays = []; zones = [];
      pulses = []; nets = []; queue = []; flashing = []; latched = [];
      wireCount = 0;
      const colX = (i) => ox + i * c; // x of the boundary left of column i
      const rowY = (i) => oy + i * c;
      const colAt = (f) => (f * W - ox) / c;
      const rowAt = (f) => (f * viewH - oy) / c;
      const mask = layoutText(cols, rows, colAt, rowAt);

      // Keep-out zones: every cell within `keepoutPad` of a matching element
      // is blocked. Pins sit every other row down the left and right edges.
      const blocked = new Uint8Array(cols * rows);
      const els = o.keepout ? document.querySelectorAll(o.keepout) : [];
      for (const el of els) {
        if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true })) continue;
        const e = el.getBoundingClientRect();
        if (!e.width || !e.height) continue;
        const top = e.top - r.top, left = e.left - r.left;
        const pad = o.keepoutPad;
        const c0 = Math.max(0, Math.floor((left - pad - ox) / c));
        const c1 = Math.min(cols - 1, Math.floor((left + e.width + pad - ox) / c));
        const r0 = Math.max(0, Math.floor((top - pad - oy) / c));
        const r1 = Math.min(rows - 1, Math.floor((top + e.height + pad - oy) / c));
        if (c0 > c1 || r0 > r1) continue;
        for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) blocked[rr * cols + cc] = 1;
        const z = {
          type: 'ZONE', letter: -1, el, c0, c1, r0, r1,
          x0: snap(colX(c0)), x1: snap(colX(c1 + 1)), y0: snap(rowY(r0)), y1: snap(rowY(r1 + 1)),
          ports: [], outs: [], refr: -1e9,
        };
        z.x = (z.x0 + z.x1) / 2; z.y = (z.y0 + z.y1) / 2;
        for (let rr = r0 + 1; rr < r1; rr += 2) {
          for (const side of [-1, 1]) {
            if ((side < 0 && c0 === 0) || (side > 0 && c1 === cols - 1)) continue;
            z.ports.push({
              side, row: rr, col: side < 0 ? c0 : c1, used: false, litT: -1e9, litS: 0,
              x: snap(side < 0 ? colX(c0) + c * 0.18 : colX(c1 + 1) - c * 0.18),
              y: snap(rowY(rr) + c * 0.5),
            });
          }
        }
        zones.push(z);
      }
      for (let i = 0; i < mask.length; i++) if (blocked[i]) mask[i] = -1;

      // True if any leg of wire `w` passes through a zone. The stub at a
      // zone pin (first or last leg) is allowed in.
      function crosses(w, skipFirst, skipLast) {
        if (!zones.length) return false;
        const xs = w.xs, ys = w.ys;
        for (let i = skipFirst ? 1 : 0; i < xs.length - 1 - (skipLast ? 1 : 0); i++) {
          const ax = Math.min(xs[i], xs[i + 1]), bx = Math.max(xs[i], xs[i + 1]);
          const ay = Math.min(ys[i], ys[i + 1]), by = Math.max(ys[i], ys[i + 1]);
          for (const z of zones) if (bx > z.x0 && ax < z.x1 && by > z.y0 && ay < z.y1) return true;
        }
        return false;
      }

      // Segment displays go down first since their position is chosen. Each
      // character is a package `size` columns wide and twice that tall, with
      // two input pins down each side. Lines are 3 * size rows apart, and
      // wrap at spaces to fit the visible width.
      const visCols = Math.floor(W / c) - 1;
      function placeDisplay(spec) {
        const s = Math.max(1, Math.round(spec.size || 1));
        const lines = wrap(String(spec.text || '').toUpperCase(), Math.floor(visCols / s));
        const n = Math.max(0, ...lines.map((l) => l.length));
        const width = n * s, height = lines.length * 3 * s - s;
        if (!n || width > cols - 2 || height > rows - 2) return;
        const at = spec.at || [0.5, 0.5];
        const left = clamp(Math.round(colAt(at[0]) - width / 2), 1, cols - 1 - width);
        const top = clamp(Math.round(rowAt(at[1]) - height / 2), 1, rows - 1 - height);
        let prev = null;
        lines.forEach((line, li) => {
          const r0 = top + li * 3 * s, c0 = left + Math.floor((n - line.length) / 2) * s;
          for (let i = 0; i < line.length; i++) {
            const col = c0 + i * s;
            let free = true;
            for (let r = r0; free && r < r0 + 2 * s; r++) {
              for (let cc = col; cc < col + s; cc++) if (grid[r * cols + cc] || blocked[r * cols + cc]) { free = false; break; }
            }
            if (!free) continue;
            const bx = snap(colX(col) + c * 0.1), by = snap(rowY(r0) + c * 0.1);
            const bw = Math.round(s * c - c * 0.2), bh = Math.round(2 * s * c - c * 0.2);
            // Glyph box inside the package, slanted a little like a real LED digit.
            const gx = bx + bw * 0.24, gy = by + bh * 0.12, gw = bw * 0.5, gh = bh * 0.76;
            const pt = (u, v) => [gx + u * gw + (1 - v / 2) * gw * 0.18, gy + (v / 2) * gh];
            const segAt = {};
            for (const [name, sg] of Object.entries(SEGMENTS)) {
              const [x1, y1] = pt(sg[0], sg[1]), [x2, y2] = pt(sg[2], sg[3]);
              // Pull the ends in so neighbouring segments don't touch.
              const k = Math.min(0.45, (1.6 * s) / Math.hypot(x2 - x1, y2 - y1));
              segAt[name] = [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, x2 - (x2 - x1) * k, y2 - (y2 - y1) * k];
            }
            const segs = (SEG16[line[i]] || '').split(' ').filter((n) => segAt[n]).map((n) => segAt[n]);
            const d = {
              type: 'DISPLAY', letter: -1, col, row: r0,
              x: colX(col) + (s * c) / 2, y: rowY(r0) + s * c, bx, by, bw, bh,
              segs, allSegs: Object.values(segAt), segW: Math.max(1.5, c * 0.075 * s),
              ports: [], outs: [], refr: -1e9, fireT: -1e9, level: 0, prev, next: null,
            };
            for (const r of [r0 + (s >> 1), r0 + s + (s >> 1)]) {
              for (const side of [-1, 1]) {
                d.ports.push({
                  side, row: r, col: side < 0 ? col : col + s - 1, used: false,
                  x: snap(side < 0 ? colX(col) + c * 0.06 : colX(col + s) - c * 0.06),
                  y: snap(rowY(r) + c * 0.5),
                });
              }
            }
            if (prev) prev.next = d;
            prev = d;
            displays.push(d);
            for (let r = r0; r < r0 + 2 * s; r++) {
              for (let cc = col; cc < col + s; cc++) { grid[r * cols + cc] = d; mask[r * cols + cc] = -1; }
            }
          }
        });
      }

      // A name too wide for the latch font (on a phone) is spelled in the
      // largest segment displays that fit instead, a word per line.
      const specs = (o.displays || []).slice();
      const words = String(o.text || '').toUpperCase().split(/\s+/).filter(Boolean);
      if (o.nameFallback && words.length && !mask.some((v) => v >= 0)) {
        const longest = Math.max(...words.map((w) => w.length));
        const visRows = Math.floor(viewH / c) - 2;
        let size = 1;
        for (const s of [3, 2]) {
          if (longest * s <= visCols && words.length * 3 * s - s <= visRows / 2) { size = s; break; }
        }
        specs.unshift({ text: words.join('\n'), at: o.textAt, size });
      }
      for (const spec of specs) placeDisplay(spec);

      // Chips go down first, each with clear cells around it so traces can
      // reach its pins. Pins sit on the left and right edges, two per row.
      const nChips = Math.round(o.chips * W * H / 1e6);
      const kindOffset = Math.floor(rand() * CHIP_KINDS.length);
      for (let i = 0; i < nChips; i++) {
        for (let tries = 0; tries < 40; tries++) {
          // Cycle through the kinds so every screen gets a mix; counters get
          // a taller package to fit their ten LEDs.
          const spec = CHIP_KINDS[(chips.length + kindOffset) % CHIP_KINDS.length];
          const w = 3, h = spec.kind === 'counter' ? 6 + Math.floor(rand() * 2) : 4 + Math.floor(rand() * 4);
          if (cols - w - 4 < 1 || rows - h - 4 < 1) break;
          const c0 = 2 + Math.floor(rand() * (cols - w - 4)), r0 = 2 + Math.floor(rand() * (rows - h - 4));
          let clear = true;
          for (let r = r0 - 1; clear && r <= r0 + h; r++) {
            for (let cc = c0 - 2; cc <= c0 + w + 1; cc++) {
              if (grid[r * cols + cc] || mask[r * cols + cc] >= 0 || blocked[r * cols + cc]) { clear = false; break; }
            }
          }
          if (!clear) continue;

          const ch = {
            type: 'CHIP', letter: -1, c0, r0, w, h,
            kind: spec.kind, label: spec.label,
            x: colX(c0) + (w * c) / 2, y: rowY(r0) + (h * c) / 2,
            bx: snap(colX(c0) + c * 0.3), by: snap(rowY(r0) + c * 0.12),
            bw: Math.round(w * c - c * 0.6), bh: Math.round(h * c - c * 0.24),
            ports: [], outs: [], cells: [], bar: null,
            refr: -1e9, fireT: -1e9,
            count: 0, stepT: new Array(10).fill(-1e9),              // counter
            bits: new Array(8).fill(0), shifted: 0, bitT: -1e9,     // shift
            charge: 0, chargeT: 0, oscStart: -1e9, oscEnd: -1e9,    // timer
          };

          // Status display: a column on the right of the package, with the
          // part number running up the left.
          const dx = Math.round(ch.bx + ch.bw * 0.68);
          const top = ch.by + c * 0.35, span = ch.bh - c * 0.7;
          if (spec.cells) {
            const pitch = span / spec.cells;
            const s = Math.max(3, Math.round(Math.min(pitch * 0.62, ch.bw * 0.2)));
            for (let i = 0; i < spec.cells; i++) {
              ch.cells.push({ x: dx - s / 2, y: Math.round(top + pitch * (i + 0.5) - s / 2), s });
            }
          } else {
            const s = Math.max(3, Math.round(ch.bw * 0.16));
            ch.cells.push({ x: dx - s / 2, y: Math.round(top), s });
            const bw = Math.max(4, Math.round(ch.bw * 0.2));
            ch.bar = { x: dx - bw / 2, y: Math.round(top + s * 2), w: bw, h: Math.round(span - s * 2) };
          }
          for (let r = 0; r < h; r++) {
            for (const dy of [-1, 1]) {
              for (const side of [-1, 1]) {
                ch.ports.push({
                  side, row: r0 + r, col: side < 0 ? c0 : c0 + w - 1, used: false,
                  x: snap(side < 0 ? colX(c0) + c * 0.18 : colX(c0 + w) - c * 0.18),
                  y: snap(rowY(r0 + r) + c * 0.5 + dy * c * 0.22),
                });
              }
            }
          }
          for (let r = r0; r < r0 + h; r++) for (let cc = c0; cc < c0 + w; cc++) grid[r * cols + cc] = ch;
          chips.push(ch);
          break;
        }
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row * cols + col] || blocked[row * cols + col]) continue;
          const letter = mask[row * cols + col];
          let type = 'LATCH', dir = 1;
          if (letter < 0) {
            if (rand() >= o.density) continue;
            let pick = rand() * mixTotal;
            for (const k of types) { type = k; if ((pick -= o.mix[k]) <= 0) break; }
            dir = rand() < 0.5 ? 1 : -1;
          }
          const x = snap(ox + (col + 0.5) * c), y = snap(oy + (row + 0.5) * c);
          const nIn = type === 'NOT' ? 1 : 2;
          const ix = x - dir * pinOut;
          const g = {
            x, y, col, row, type, dir, nIn, letter, neighbors: null, level: 0,
            out: { x: x + dir * pinOut, y },
            ins: nIn === 1 ? [{ x: ix, y }] : [{ x: ix, y: y - pinIn }, { x: ix, y: y + pinIn }],
            drivers: nIn === 1 ? [null] : [null, null],
            outs: [],
            inT: [-1e9, -1e9], inS: [0, 0],
            refr: -1e9, quiet: -1e9, fireT: -1e9, flash: 0, lit: false,
          };
          grid[row * cols + col] = g;
          gates.push(g);
          if (type === 'NOT') notGates.push(g);
          if (type === 'LATCH') latches.push(g);
        }
      }

      // Latches pass their glow straight to touching latches of the same
      // letter (no visible wire), so a hit anywhere floods the whole glyph.
      for (const g of latches) {
        g.neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = g.row + dr, cc = g.col + dc;
            if ((dr || dc) && r >= 0 && r < rows && cc >= 0 && cc < cols) {
              const n = grid[r * cols + cc];
              if (n && n.letter === g.letter) g.neighbors.push(n);
            }
          }
        }
      }

      // Wires run along the gaps between cells (column / row boundaries) so
      // they never cross a gate body; small lane offsets keep parallel runs
      // from collapsing onto one line and give a bus-like texture.
      const lane = () => (Math.floor(rand() * 5) - 2) * c * 0.08;

      // Routes from pin P to pin Q. `a` and `b` give the cell and facing of
      // each end ({ col, row, dir }), which decide the boundaries used. A
      // `tight` end runs its vertical leg exactly on the boundary, for pins
      // that sit too close to it for a lane offset.
      function route(a, P, b, Q) {
        const ba = a.col + (a.dir > 0 ? 1 : 0); // boundary in front of a's output
        const bb = b.col + (b.dir > 0 ? 0 : 1); // boundary behind b's inputs
        let pts;
        if (ba === bb) {
          const x = snap(colX(ba) + (a.tight || b.tight ? 0 : lane()));
          pts = [P.x, P.y, x, P.y, x, Q.y, Q.x, Q.y];
        } else {
          const lo = Math.min(a.row, b.row), hi = Math.max(a.row, b.row);
          const idx = lo === hi ? lo + (rand() < 0.5 ? 0 : 1) : lo + 1 + Math.floor(rand() * (hi - lo));
          const x1 = snap(colX(ba) + (a.tight ? 0 : lane()));
          const x2 = snap(colX(bb) + (b.tight ? 0 : lane()));
          const y = snap(rowY(idx) + lane());
          pts = [P.x, P.y, x1, P.y, x1, y, x2, y, x2, Q.y, Q.x, Q.y];
        }

        const xs = [], ys = [];
        for (let i = 0; i < pts.length; i += 2) {
          const x = pts[i], y = pts[i + 1], n = xs.length;
          if (n && xs[n - 1] === x && ys[n - 1] === y) continue;
          if (n >= 2 && ((xs[n - 2] === xs[n - 1] && xs[n - 1] === x) || (ys[n - 2] === ys[n - 1] && ys[n - 1] === y))) {
            xs[n - 1] = x; ys[n - 1] = y;
            continue;
          }
          xs.push(x); ys.push(y);
        }
        const cum = [0];
        for (let i = 1; i < xs.length; i++) cum.push(cum[i - 1] + Math.abs(xs[i] - xs[i - 1]) + Math.abs(ys[i] - ys[i - 1]));

        return { xs, ys, cum, len: cum[cum.length - 1], y0: Math.min(...ys), y1: Math.max(...ys) };
      }

      function link(owner, w, to, slot) {
        w.to = to;
        w.slot = slot;
        owner.outs.push(w);
        wireCount++;
      }

      // Free chip pin on `side`, nearest to `row`.
      function freePort(ch, side, row) {
        let best = null;
        for (const p of ch.ports) {
          if (p.used || p.side !== side) continue;
          if (!best || Math.abs(p.row - row) < Math.abs(best.row - row)) best = p;
        }
        return best;
      }

      // Zone pins go first so they get first pick of gate inputs. About half
      // drive gates outside (fired when the zone scrolls into view); the rest
      // are fed by gates and light when a signal arrives.
      for (const z of zones) {
        z.ports.forEach((p, idx) => {
          if (rand() < 0.2) return;
          const out = rand() < 0.5;
          for (let tries = 0; tries < 16; tries++) {
            const col = p.col + p.side * (1 + Math.floor(rand() * o.reach));
            const row = p.row + Math.round((rand() * 2 - 1) * o.reachV);
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
            const d = grid[row * cols + col];
            if (!d || d.type === 'CHIP' || d.type === 'DISPLAY') continue;
            const end = { col: p.col, row: p.row, dir: out ? p.side : -p.side, tight: true };
            if (out) {
              const k = d.drivers.indexOf(null);
              if (k < 0 || ((d.x - p.x) * d.dir < 0 && rand() < 0.7)) continue;
              const w = route(end, p, d, d.ins[k]);
              if (crosses(w, true, false)) continue;
              w.port = p;
              d.drivers[k] = w;
              link(z, w, d, k);
            } else {
              if (d.outs.length >= o.maxFanout || ((p.x - d.x) * d.dir < 0 && rand() < 0.7)) continue;
              const w = route(d, d.out, end, p);
              if (crosses(w, false, true)) continue;
              link(d, w, z, idx);
            }
            p.used = true;
            break;
          }
        });
      }

      for (const g of gates) {
        for (let k = 0; k < g.nIn; k++) {
          if (g.drivers[k]) continue;
          for (let tries = 0; tries < 16; tries++) {
            const dc = Math.floor(rand() * (o.reach + 1));
            const col = g.col + (rand() < 0.8 ? -g.dir : g.dir) * dc;
            const row = g.row + Math.round((rand() * 2 - 1) * o.reachV);
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
            const d = grid[row * cols + col];
            if (!d || d === g || d.type === 'DISPLAY' || d.outs.some((w) => w.to === g)) continue;
            if (d.type === 'CHIP') {
              // Leave at least half the pins free for the chip's inputs.
              if (d.outs.length >= d.ports.length / 2) continue;
              const p = freePort(d, g.x < d.x ? -1 : 1, g.row);
              if (!p) continue;
              const w = route({ col: p.col, row: p.row, dir: p.side }, p, g, g.ins[k]);
              if (crosses(w)) continue;
              p.used = true;
              g.drivers[k] = w;
              link(d, w, g, k);
              break;
            }
            if (d.outs.length >= o.maxFanout) continue;
            if (d.type === 'LATCH' && g.type === 'LATCH') continue;
            // Mostly pick drivers already facing us, so traces read left-to-right / right-to-left.
            if ((g.x - d.x) * d.dir < 0 && rand() < 0.7) continue;
            const w = route(d, d.out, g, g.ins[k]);
            if (crosses(w)) continue;
            g.drivers[k] = w;
            link(d, w, g, k);
            break;
          }
        }
      }

      // Most remaining chip pins, and display pins, become inputs fed by
      // gates on that side.
      for (const ch of chips.concat(displays)) {
        const isDisplay = ch.type === 'DISPLAY';
        for (const p of ch.ports) {
          if (p.used || rand() < (isDisplay ? 0.15 : 0.3)) continue;
          for (let tries = 0; tries < 16; tries++) {
            const col = p.col + p.side * (1 + Math.floor(rand() * o.reach));
            const row = p.row + Math.round((rand() * 2 - 1) * o.reachV);
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
            const d = grid[row * cols + col];
            if (!d || d.type === 'CHIP' || d.type === 'DISPLAY' || d.outs.length >= o.maxFanout) continue;
            if ((p.x - d.x) * d.dir < 0 && rand() < 0.7) continue;
            const w = route(d, d.out, { col: p.col, row: p.row, dir: -p.side, tight: isDisplay }, p);
            if (crosses(w)) continue;
            p.used = true;
            link(d, w, ch, 0);
            break;
          }
        }
      }

      if (zoneIO) {
        zoneIO.disconnect();
        for (const z of zones) zoneIO.observe(z.el);
      }
      for (const z of zones) ro.observe(z.el);
      lastSize = sizeKey();

      // The intro runs once, but a rebuild clears the queue, and pages often
      // re-measure just after load (web fonts, images). A rebuild within the
      // first 1.5 s of the intro starts it again.
      if (o.intro && (latches.length || displays.length) && !reduced() && (introAt < 0 || t - introAt < 1.5)) {
        api.reveal(0.6, introAt < 0 ? 0.6 : 0.1);
        if (introAt < 0) introAt = t;
      }
    }

    // ---------------------------------------------------------------- drawing

    // Appends a gate symbol to the current path. Uses the transform to mirror
    // left-facing gates; the caller resets the transform before stroking.
    // `top` is the board y at the top of the target canvas.
    function gatePath(cx, g, leads, top) {
      cx.setTransform(g.dir * dpr, 0, 0, dpr, g.x * dpr, (g.y - top) * dpr);
      gateShape(cx, g.type, g.nIn, leads);
    }

    // The symbol itself, centred on the origin and facing +x.
    function gateShape(cx, type, nIn, leads) {
      const c = cell, hw = c * 0.17, hh = c * 0.16;
      const pin = Math.round(c * 0.3), pi = Math.round(c * 0.1);
      let back = -hw, tip = hw;
      switch (type) {
        case 'LATCH': {
          const s = Math.round(c * 0.17);
          cx.rect(-s, -s, 2 * s, 2 * s);
          back = -s; tip = s;
          break;
        }
        case 'AND':
          cx.moveTo(-hw, -hh);
          cx.lineTo(hw - hh, -hh);
          cx.arc(hw - hh, 0, hh, -Math.PI / 2, Math.PI / 2);
          cx.lineTo(-hw, hh);
          cx.closePath();
          break;
        case 'NOT': {
          const r = c * 0.05;
          cx.moveTo(-hw, -hh);
          cx.lineTo(hw - 2 * r, 0);
          cx.lineTo(-hw, hh);
          cx.closePath();
          cx.moveTo(hw, 0);
          cx.arc(hw - r, 0, r, 0, Math.PI * 2);
          break;
        }
        case 'XOR': {
          const k = c * 0.07;
          cx.moveTo(-hw - k, -hh);
          cx.quadraticCurveTo(-hw * 0.4 - k, 0, -hw - k, hh);
          back = -hw * 0.82 - k;
        }
        // falls through
        default:
          cx.moveTo(-hw, -hh);
          cx.quadraticCurveTo(hw * 0.2, -hh, hw, 0);
          cx.quadraticCurveTo(hw * 0.2, hh, -hw, hh);
          cx.quadraticCurveTo(-hw * 0.4, 0, -hw, -hh);
          cx.closePath();
          if (type !== 'XOR') back = -hw * 0.82;
      }
      if (leads) {
        cx.moveTo(tip, 0); cx.lineTo(pin, 0);
        if (nIn === 1) {
          cx.moveTo(-pin, 0); cx.lineTo(back, 0);
        } else {
          cx.moveTo(-pin, -pi); cx.lineTo(back, -pi);
          cx.moveTo(-pin, pi); cx.lineTo(back, pi);
        }
      }
    }

    // Appends the stretch of a wire between distances s0 and s1 to the path.
    function tracePath(cx, w, s0, s1) {
      if (s0 < 0) s0 = 0;
      if (s1 > w.len) s1 = w.len;
      if (s1 <= s0) return;
      const xs = w.xs, ys = w.ys, cum = w.cum, n = xs.length;
      let i = 0;
      while (i < n - 2 && cum[i + 1] <= s0) i++;
      let f = (s0 - cum[i]) / (cum[i + 1] - cum[i]);
      cx.moveTo(xs[i] + (xs[i + 1] - xs[i]) * f, ys[i] + (ys[i + 1] - ys[i]) * f);
      while (i < n - 2 && cum[i + 1] < s1) { i++; cx.lineTo(xs[i], ys[i]); }
      f = (s1 - cum[i]) / (cum[i + 1] - cum[i]);
      cx.lineTo(xs[i] + (xs[i + 1] - xs[i]) * f, ys[i] + (ys[i + 1] - ys[i]) * f);
    }

    // Each gate symbol (with leads) pre-drawn once per type and facing, so
    // the static layer stamps images instead of tracing a thousand curves.
    function makeSprites() {
      const key = [dpr, cell, pal.gate].join();
      if (key === spriteKey) return;
      spriteKey = key;
      const half = Math.ceil(cell * 0.36 * dpr) + 2;
      // Gate centres sit on half pixels; bake that offset into the sprite.
      const f = (0.5 * dpr) % 1;
      for (const type of ['AND', 'OR', 'XOR', 'NOT', 'LATCH']) {
        for (const dir of [1, -1]) {
          const cv = sprites[type + dir] || document.createElement('canvas');
          cv.width = cv.height = 2 * half + 1;
          const cx = cv.getContext('2d');
          cx.setTransform(dir * dpr, 0, 0, dpr, half + f, half + f);
          cx.beginPath();
          gateShape(cx, type, type === 'NOT' ? 1 : 2, true);
          cx.setTransform(1, 0, 0, 1, 0, 0);
          cx.lineWidth = dpr;
          cx.strokeStyle = pal.gate;
          cx.stroke();
          sprites[type + dir] = cv;
        }
      }
      sprites.half = half;
      sprites.f = f;
    }

    // Draws the static board for board rows [top, top + h) into `cx`:
    // wires, gates, and the unlit parts of chips, displays and keep-outs.
    function drawStatic(cx, top, h) {
      makeSprites();
      const c = cell, lo = top - 2 * c, hi = top + h + 2 * c;
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height);
      view(cx, top);
      cx.lineWidth = 1;
      cx.lineJoin = 'miter';

      cx.beginPath();
      for (const list of [gates, chips, zones]) {
        for (const g of list) {
          for (const w of g.outs) if (w.y1 >= lo && w.y0 <= hi) tracePath(cx, w, 0, w.len);
        }
      }
      cx.strokeStyle = pal.wire;
      cx.stroke();

      cx.setTransform(1, 0, 0, 1, 0, 0);
      const half = sprites.half, f = sprites.f;
      for (let i = lowerY(gates, lo); i < gates.length && gates[i].y <= hi; i++) {
        const g = gates[i];
        cx.drawImage(sprites[g.type + g.dir], Math.round(g.x * dpr - f) - half, Math.round((g.y - top) * dpr - f) - half);
      }

      const near = (p) => p.by + p.bh >= lo && p.by <= hi;
      const chs = chips.filter(near), ds = displays.filter(near);
      const zs = zones.filter((z) => z.y1 >= lo && z.y0 <= hi);
      view(cx, top);

      // Packages knock out the traces under them, so wires appear to run
      // beneath the chip.
      if (chs.length || ds.length) {
        cx.beginPath();
        for (const p of chs) cx.rect(p.bx, p.by, p.bw, p.bh);
        for (const p of ds) cx.rect(p.bx, p.by, p.bw, p.bh);
        cx.globalCompositeOperation = 'destination-out';
        cx.fillStyle = '#000';
        cx.fill();
        cx.globalCompositeOperation = 'source-over';
        cx.fillStyle = pal.chip;
        cx.fill();
        cx.strokeStyle = pal.chipLine;
        cx.stroke();
      }

      if (chs.length) {
        const notch = c * 0.14, leg = Math.max(2, Math.round(c * 0.09));
        cx.beginPath();
        for (const ch of chs) {
          const mx = ch.bx + ch.bw / 2;
          cx.moveTo(mx + notch, ch.by);
          cx.arc(mx, ch.by, notch, 0, Math.PI);
          // Unlit display: outlined LEDs, or the empty capacitor bar.
          for (const q of ch.cells) cx.rect(q.x + 0.5, q.y + 0.5, q.s - 1, q.s - 1);
          if (ch.bar) cx.rect(ch.bar.x + 0.5, ch.bar.y + 0.5, ch.bar.w - 1, ch.bar.h - 1);
        }
        cx.stroke();

        cx.beginPath();
        for (const ch of chs) {
          for (const p of ch.ports) {
            const edge = p.side < 0 ? ch.bx : ch.bx + ch.bw;
            cx.rect(Math.min(edge, p.x), p.y - leg / 2, Math.abs(p.x - edge), leg);
          }
        }
        cx.fillStyle = pal.chipLine;
        cx.fill();

        cx.font = `${Math.round(c * 0.3)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        for (const ch of chs) {
          cx.setTransform(0, -dpr, dpr, 0, (ch.bx + ch.bw * 0.3) * dpr, (ch.by + ch.bh / 2 - top) * dpr);
          cx.fillText(ch.label, 0, 0);
        }
        view(cx, top);
      }

      if (ds.length) {
        // Pins, then every segment faintly, like a display that's off.
        const leg = Math.max(2, Math.round(c * 0.08));
        cx.beginPath();
        for (const d of ds) {
          for (const p of d.ports) {
            const edge = p.side < 0 ? d.bx : d.bx + d.bw;
            cx.rect(Math.min(edge, p.x), p.y - leg / 2, Math.max(1, Math.abs(p.x - edge)), leg);
          }
        }
        cx.fillStyle = pal.chipLine;
        cx.fill();

        cx.lineCap = 'round';
        cx.strokeStyle = pal.gate;
        for (const d of ds) {
          cx.beginPath();
          for (const s of d.allSegs) { cx.moveTo(s[0], s[1]); cx.lineTo(s[2], s[3]); }
          cx.lineWidth = d.segW;
          cx.stroke();
        }
        cx.lineCap = 'butt';
        cx.lineWidth = 1;
      }

      if (zs.length) {
        // Silkscreen corner marks around each keep-out, and a pad at each
        // wired pin.
        const arm = Math.round(c * 0.5);
        const inset = Math.round(Math.min(c * 0.42, Math.max(2, o.keepoutPad - 3)));
        const pw = Math.round(c * 0.24), ph = Math.max(2, Math.round(c * 0.12));
        cx.beginPath();
        for (const z of zs) {
          const l = z.x0 + inset, r = z.x1 - inset, tp = z.y0 + inset, bt = z.y1 - inset;
          cx.moveTo(l, tp + arm); cx.lineTo(l, tp); cx.lineTo(l + arm, tp);
          cx.moveTo(r - arm, tp); cx.lineTo(r, tp); cx.lineTo(r, tp + arm);
          cx.moveTo(r, bt - arm); cx.lineTo(r, bt); cx.lineTo(r - arm, bt);
          cx.moveTo(l + arm, bt); cx.lineTo(l, bt); cx.lineTo(l, bt - arm);
        }
        cx.strokeStyle = pal.gate;
        cx.stroke();

        cx.beginPath();
        for (const z of zs) for (const p of z.ports) if (p.used) cx.rect(p.x - pw / 2, p.y - ph / 2, pw, ph);
        cx.fillStyle = pal.chipLine;
        cx.fill();
      }
    }

    // ------------------------------------------------------------------ tiles

    // Hidden tiles drop their pixels (width 0) so only shown ones hold memory.
    function recycle(cv) {
      cv.style.display = 'none';
      cv.width = cv.height = 0;
      tilePool.push(cv);
    }

    function clearTiles() {
      for (const cv of tiles.values()) recycle(cv);
      tiles.clear();
    }

    // Draws the tiles covering the view plus a quarter tile either side, and
    // recycles the rest.
    function ensureTiles() {
      if (!o.scroll || !tileH) return;
      const n = Math.ceil(H / tileH);
      const lo = Math.max(0, Math.floor((off - tileH / 4) / tileH));
      const hi = Math.min(n - 1, Math.floor((off + viewH + tileH / 4) / tileH));
      for (const [i, cv] of tiles) {
        if (i >= lo && i <= hi) continue;
        recycle(cv);
        tiles.delete(i);
      }
      for (let i = lo; i <= hi; i++) {
        if (tiles.has(i)) continue;
        let cv = tilePool.pop();
        if (!cv) {
          cv = document.createElement('canvas');
          cv.setAttribute('aria-hidden', 'true');
          cv.style.cssText = 'position:absolute;left:0;pointer-events:none;';
        }
        if (cv.parentNode !== canvas.parentNode || cv.nextSibling !== canvas) canvas.parentNode.insertBefore(cv, canvas);
        const top = i * tileH, h = Math.min(tileH, align(H) - top);
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(h * dpr);
        cv.style.top = top + 'px';
        cv.style.width = W + 'px';
        cv.style.height = h + 'px';
        cv.style.zIndex = getComputedStyle(canvas).zIndex;
        cv.style.display = 'block';
        drawStatic(cv.getContext('2d'), top, h);
        tiles.set(i, cv);
      }
    }

    // Moves the live canvas when the view gets near its edge. Returns true
    // if it moved (and so needs drawing).
    function placeLive() {
      if (!o.scroll) return false;
      const m = (dynH - viewH) / 2, buf = m / 3;
      if (off >= dTop + buf && off + viewH <= dTop + dynH - buf) return false;
      const next = clamp(align(off - m), 0, Math.max(0, align(H) - dynH));
      if (next === dTop) return false;
      dTop = next;
      canvas.style.top = dTop + 'px';
      return true;
    }

    // Redraws all cached static board (after a rebuild or a colour change).
    function redrawStatic() {
      if (o.scroll) { clearTiles(); updateView(); ensureTiles(); }
      else drawStatic(sctx, 0, H);
    }

    function render() {
      updateView();
      placeLive();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!o.scroll) ctx.drawImage(stat, 0, 0);
      ctx.globalCompositeOperation = pal.blend;
      ctx.lineJoin = 'miter';
      const I = o.intensity;
      const lo = dTop - cell, hi = dTop + dynH + cell;
      const near = (p) => p.by + p.bh >= lo && p.by <= hi;

      if (latched.length) {
        for (const b of buckets) b.length = 0;
        let k = 0;
        for (const g of latched) {
          const age = t - g.fireT;
          const env = age < o.latchHold
            ? Math.min(1, age / 0.08)
            : Math.exp(-(age - o.latchHold) / (o.latchFade / 3));
          const a = g.level * env;
          if (age >= o.latchHold && a < 0.02) { g.lit = false; continue; }
          latched[k++] = g;
          g.glow = a;
          buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(g);
        }
        latched.length = k;
        // Lit latches are solid blocks that nearly fill their cell, shrinking
        // back to the resting square as they lose charge.
        const rest = Math.round(cell * 0.17), full = cell * 0.42;
        view(ctx, dTop);
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          const a = (b + 0.5) / BUCKETS;
          ctx.beginPath();
          for (const g of list) {
            const h = Math.round(rest + (full - rest) * Math.min(1, g.glow));
            ctx.rect(g.x - 0.5 - h, g.y - 0.5 - h, h * 2 + 1, h * 2 + 1);
          }
          ctx.fillStyle = rgba(pal.memory, Math.min(1, 0.2 + 0.75 * a) * I);
          ctx.fill();
        }
      }

      if (flashing.length) {
        for (const b of buckets) b.length = 0;
        let k = 0;
        for (const g of flashing) {
          const a = g.flash * Math.exp(-(t - g.fireT) / 0.25);
          if (a < 0.03) { g.lit = false; continue; }
          flashing[k++] = g;
          buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(g);
        }
        flashing.length = k;
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          ctx.beginPath();
          for (const g of list) gatePath(ctx, g, false, dTop);
          view(ctx, dTop);
          ctx.lineWidth = 1.25;
          ctx.strokeStyle = rgba(pal.pulse, ((b + 0.5) / BUCKETS) * 0.9 * I);
          ctx.stroke();
        }
      }

      // Signals are clipped out of chip and display packages so they seem
      // to run underneath them.
      const chs = chips.filter(near), ds = displays.filter(near);
      const clipped = (pulses.length || nets.length) && (chs.length || ds.length);
      if (clipped) {
        view(ctx, dTop);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, dTop, W, dynH);
        for (const p of chs) ctx.rect(p.bx, p.by, p.bw, p.bh);
        for (const p of ds) ctx.rect(p.bx, p.by, p.bw, p.bh);
        ctx.clip('evenodd');
      }

      if (pulses.length) {
        for (const b of buckets) b.length = 0;
        for (const p of pulses) buckets[Math.min(BUCKETS - 1, (p.str * BUCKETS) | 0)].push(p);
        view(ctx, dTop);
        const L = o.trail;
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          const a = Math.pow((b + 0.5) / BUCKETS, 1.3) * I;

          ctx.beginPath();
          for (const p of list) tracePath(ctx, p.w, p.s - L, p.s);
          ctx.lineWidth = 1;
          ctx.strokeStyle = rgba(pal.pulse, a * 0.22);
          ctx.stroke();

          ctx.beginPath();
          for (const p of list) tracePath(ctx, p.w, p.s - L * 0.4, p.s);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = rgba(pal.pulse, a * 0.45);
          ctx.stroke();

          ctx.beginPath();
          for (const p of list) tracePath(ctx, p.w, p.s - 4, p.s);
          ctx.lineWidth = 2;
          ctx.strokeStyle = rgba(pal.head, a * 0.9);
          ctx.stroke();
        }
      }

      if (nets.length) {
        for (const b of buckets) b.length = 0;
        let k = 0;
        for (const n of nets) {
          const a = n.str * Math.exp(-(t - n.t0) / (o.netFade / 3));
          if (a < 0.02) continue;
          nets[k++] = n;
          buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(n);
        }
        nets.length = k;
        view(ctx, dTop);
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          const a = Math.pow((b + 0.5) / BUCKETS, 1.3) * I;
          ctx.beginPath();
          for (const n of list) tracePath(ctx, n.w, 0, n.w.len);
          ctx.lineWidth = 4;
          ctx.strokeStyle = rgba(pal.pulse, a * 0.16);
          ctx.stroke();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = rgba(pal.pulse, a * 0.9);
          ctx.stroke();
        }
      }
      if (clipped) ctx.restore();

      chipsActive = false;
      view(ctx, dTop);
      ctx.globalCompositeOperation = pal.blend;
      ctx.lineWidth = 1;

      if (chips.length) {
        // Status lights. Chips off the live canvas still count as active so
        // their state keeps advancing.
        for (let b = 0; b < BUCKETS; b++) buckets[b].length = 0;
        const lit = (q, a) => {
          if (a < 0.02) return;
          buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(q);
        };

        for (const ch of chips) {
          const show = near(ch);
          if (ch.kind === 'counter') {
            // Current step stays on; the steps it just left trail off.
            for (let i = 0; i < 10; i++) {
              const a = i === ch.count ? 1 : 0.8 * Math.exp(-(t - ch.stepT[i]) / 0.25);
              if (i !== ch.count && a >= 0.02) chipsActive = true;
              if (show) lit(ch.cells[i], a * I);
            }
          } else if (ch.kind === 'shift') {
            const fresh = Math.exp(-(t - ch.bitT) / 0.2);
            if (fresh >= 0.02) chipsActive = true;
            if (show) for (let i = 0; i < 8; i++) lit(ch.cells[i], (ch.bits[i] ? 0.7 : 0) + (i === 0 ? 0.3 * fresh : 0));
          } else {
            // Capacitor bar: leaky charge level, or a triangle wave while ticking.
            let level;
            if (t < ch.oscEnd) {
              const phase = ((t - ch.oscStart) / o.timerPeriod) % 1;
              level = phase < 0.5 ? phase * 2 : 2 - phase * 2;
              chipsActive = true;
            } else {
              level = Math.min(1, (ch.charge * Math.exp(-(t - ch.chargeT) / o.chipLeak)) / o.chipThreshold);
              if (level >= 0.02) chipsActive = true;
            }
            if (show) {
              lit(ch.cells[0], Math.exp(-(t - ch.fireT) / 0.18) * I);
              if (level >= 0.02) {
                const h = Math.round(ch.bar.h * level);
                ctx.fillStyle = rgba(pal.memory, 0.6 * I);
                ctx.fillRect(ch.bar.x, ch.bar.y + ch.bar.h - h, ch.bar.w, h);
              }
            }
          }

          // Whole-package flash when the chip fires its outputs.
          const flash = Math.exp(-(t - ch.fireT) / 0.4) * I;
          if (flash >= 0.015) {
            chipsActive = true;
            if (show) {
              ctx.fillStyle = rgba(pal.pulse, flash * 0.14);
              ctx.fillRect(ch.bx, ch.by, ch.bw, ch.bh);
              ctx.strokeStyle = rgba(pal.pulse, flash * 0.9);
              ctx.strokeRect(ch.bx, ch.by, ch.bw, ch.bh);
            }
          }
        }

        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          ctx.beginPath();
          for (const q of list) ctx.rect(q.x, q.y, q.s, q.s);
          ctx.fillStyle = rgba(pal.memory, (b + 0.5) / BUCKETS);
          ctx.fill();
        }
      }

      if (displays.length) {
        for (const b of buckets) b.length = 0;
        for (const d of displays) {
          const age = t - d.fireT;
          const env = age < o.latchHold
            ? Math.min(1, age / 0.06)
            : Math.exp(-(age - o.latchHold) / (o.latchFade / 3));
          const a = d.level * env;
          if (a < 0.02) continue;
          chipsActive = true;
          if (near(d)) buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(d);
        }
        ctx.lineCap = 'round';
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          const a = ((b + 0.5) / BUCKETS) * I;
          const glow = rgba(pal.memory, a * 0.18), core = rgba(pal.memory, a);
          for (const d of list) {
            ctx.beginPath();
            for (const s of d.segs) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); }
            ctx.lineWidth = d.segW * 2.6;
            ctx.strokeStyle = glow;
            ctx.stroke();
            ctx.lineWidth = d.segW;
            ctx.strokeStyle = core;
            ctx.stroke();
          }
        }
        ctx.lineCap = 'butt';
      }

      if (zones.length) {
        // Pads flash when a signal goes in or out.
        const pw = Math.round(cell * 0.24), ph = Math.max(2, Math.round(cell * 0.12));
        for (const b of buckets) b.length = 0;
        for (const z of zones) {
          for (const p of z.ports) {
            if (!p.used) continue;
            const a = p.litS * Math.exp(-(t - p.litT) / 0.3) * I;
            if (a < 0.02) continue;
            chipsActive = true;
            if (p.y >= lo && p.y <= hi) buckets[Math.min(BUCKETS - 1, (a * BUCKETS) | 0)].push(p);
          }
        }
        for (let b = 0; b < BUCKETS; b++) {
          const list = buckets[b];
          if (!list.length) continue;
          const a = (b + 0.5) / BUCKETS;
          ctx.beginPath();
          for (const p of list) ctx.rect(p.x - pw / 2 - 2, p.y - ph / 2 - 2, pw + 4, ph + 4);
          ctx.fillStyle = rgba(pal.pulse, a * 0.25);
          ctx.fill();
          ctx.beginPath();
          for (const p of list) ctx.rect(p.x - pw / 2, p.y - ph / 2, pw, ph);
          ctx.fillStyle = rgba(pal.head, a);
          ctx.fill();
        }
      }
    }

    // ------------------------------------------------------------- simulation

    function schedule(at, g, str, kind, slot) {
      queue.push({ at, g, str, kind, slot });
    }

    function emit(w, s) {
      if (s < o.minStrength || pulses.length + nets.length >= o.maxPulses) return;
      if (o.mode === 'nets') {
        nets.push({ w, str: s, t0: t });
        schedule(t + o.netHop, w.to, s, 'arrive', w.slot);
      } else {
        pulses.push({ w, s: 0, str: s, done: false });
      }
    }

    // Fires a chip's outputs; with `bits`, only output i where bits[i % 8] is set.
    function chipBurst(ch, str, bits) {
      ch.fireT = t;
      const s = str * o.decay;
      ch.outs.forEach((w, i) => { if (!bits || bits[i % bits.length]) emit(w, s); });
    }

    function startTimer(ch) {
      ch.charge = 0;
      ch.chargeT = t;
      ch.oscStart = t;
      ch.oscEnd = t + o.timerCycles * o.timerPeriod;
      ch.refr = ch.oscEnd + o.chipRefractory;
      for (let k = 0; k < o.timerCycles; k++) schedule(t + (k + 0.5) * o.timerPeriod, ch, o.chipOutput, 'tick');
    }

    // A pulse arriving at any chip input.
    function chipInput(ch, str) {
      if (t < ch.refr) return;
      if (ch.kind === 'counter') {
        ch.refr = t + 0.05;
        ch.count = (ch.count + 1) % 10;
        ch.stepT[ch.count] = t;
        if (ch.count === 0) chipBurst(ch, o.chipOutput);
        else if (ch.outs.length) emit(ch.outs[ch.count % ch.outs.length], Math.max(str, 0.4) * o.decay);
      } else if (ch.kind === 'shift') {
        ch.refr = t + 0.05;
        ch.bits.pop();
        ch.bits.unshift(str >= o.shiftThreshold ? 1 : 0);
        ch.bitT = t;
        if (++ch.shifted >= 8) {
          ch.shifted = 0;
          chipBurst(ch, o.chipOutput, ch.bits);
        }
      } else {
        ch.charge = ch.charge * Math.exp(-(t - ch.chargeT) / o.chipLeak) + str;
        ch.chargeT = t;
        if (ch.charge >= o.chipThreshold) startTimer(ch);
      }
    }

    // A click on a chip runs it through a full cycle so you see what it does.
    function chipTrigger(ch) {
      if (ch.kind === 'timer') {
        if (t >= ch.refr) startTimer(ch);
        return;
      }
      const n = ch.kind === 'counter' ? 10 - ch.count : 8 - ch.shifted;
      for (let k = 0; k < n; k++) {
        const str = ch.kind === 'shift' ? (Math.random() < 0.5 ? 1 : 0.2) : 1;
        schedule(t + k * 0.07, ch, str, 'in');
      }
    }

    // A segment display behaves like a latch: any input lights it, it holds,
    // then fades, and the glow steps along to its neighbours in the string.
    function displayHit(d, str) {
      if (t < d.refr) return;
      d.refr = t + o.latchHold;
      d.fireT = t;
      d.level = Math.min(1, 0.35 + 0.65 * str);
      if (d.prev) schedule(t + o.displaySpread, d.prev, str, 'disp');
      if (d.next) schedule(t + o.displaySpread, d.next, str, 'disp');
    }

    function fire(g, str) {
      if (t < g.refr) return;
      g.fireT = t;
      let s = str * o.decay;
      if (g.type === 'LATCH') {
        // Brightness tracks how hard the letter was hit, with a floor so
        // even a faint ambient wave shows something.
        g.refr = t + o.latchHold;
        g.level = Math.min(1, 0.35 + 0.65 * str);
        if (!g.lit) { g.lit = true; latched.push(g); }
        for (const n of g.neighbors) schedule(t + o.latchSpread, n, str, 'fire');
        s *= o.latchOutput;
      } else {
        g.refr = t + o.refractory;
        g.flash = Math.min(1, str);
        if (!g.lit) { g.lit = true; flashing.push(g); }
      }
      for (const w of g.outs) emit(w, s);
    }

    // A keep-out scrolled into view: its output pins fire top to bottom.
    function zoneFire(z) {
      if (t < z.refr || reduced()) return;
      z.refr = t + o.edgeRefractory;
      z.outs.forEach((w, i) => schedule(t + (w.port.y - z.y0) / 900, z, o.edgeOutput, 'edge', i));
      wake();
    }

    function arrive(g, slot, str) {
      if (g.type === 'ZONE') { const p = g.ports[slot]; p.litT = t; p.litS = Math.min(1, str + 0.3); return; }
      if (g.type === 'CHIP') { chipInput(g, str); return; }
      if (g.type === 'DISPLAY') { displayHit(g, str); return; }
      g.inT[slot] = t;
      g.inS[slot] = str;
      if (g.type === 'NOT') { g.quiet = t + 2.5; return; }
      if (t < g.refr) return;
      const other = slot ^ 1;
      // An AND/XOR with only one input wired behaves as a buffer.
      const paired = g.nIn === 2 && g.drivers[other];
      if (g.type === 'AND' && paired) {
        if (t - g.inT[other] <= o.andWindow) schedule(t + o.gateDelay, g, Math.max(str, g.inS[other]), 'fire');
      } else if (g.type === 'XOR' && paired) {
        schedule(t + o.xorWindow, g, str, 'xor', slot);
      } else {
        schedule(t + o.gateDelay, g, str, 'fire');
      }
    }

    // First index in `list` (sorted by y) with y >= v.
    function lowerY(list, v) {
      let lo = 0, hi = list.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (list[m].y < v) lo = m + 1; else hi = m; }
      return lo;
    }

    // Ambient sources near the view only: on a long page, firing ones far
    // off screen would just burn time.
    function spontaneous() {
      const pool = notGates.length ? notGates : gates;
      const a = lowerY(pool, off - viewH * 0.3), n = lowerY(pool, off + viewH * 1.3) - a;
      if (n <= 0) return;
      for (let i = 0; i < 6; i++) {
        const g = pool[a + ((Math.random() * n) | 0)];
        if (t >= g.refr && t >= g.quiet) {
          const [lo, hi] = o.ambientStrength;
          fire(g, lo + Math.random() * (hi - lo));
          return;
        }
      }
    }

    function step(dt) {
      t += dt;

      if (o.ambient > 0 && !reduced()) {
        for (let n = o.ambient * (W * viewH / 1e6) * dt; n > 0; n--) if (Math.random() < n) spontaneous();
      }

      if (queue.length) {
        let k = 0;
        for (let i = 0; i < queue.length; i++) {
          const e = queue[i];
          if (e.at > t) { queue[k++] = e; continue; }
          if (e.kind === 'fire') fire(e.g, e.str);
          else if (e.kind === 'arrive') arrive(e.g, e.slot, e.str);
          else if (e.kind === 'tick') chipBurst(e.g, e.str);
          else if (e.kind === 'in') chipInput(e.g, e.str);
          else if (e.kind === 'chip') chipTrigger(e.g);
          else if (e.kind === 'disp') displayHit(e.g, e.str);
          else if (e.kind === 'edge') {
            const w = e.g.outs[e.slot];
            w.port.litT = t; w.port.litS = e.str;
            emit(w, e.str);
          }
          // XOR: fire only if the other input stayed quiet around this arrival.
          else if (e.g.inT[e.slot ^ 1] < e.at - 2 * o.xorWindow) fire(e.g, e.str);
        }
        queue.length = k;
      }

      const ds = o.speed * dt;
      for (const p of pulses) {
        p.s += ds;
        if (!p.done && p.s >= p.w.len) { p.done = true; arrive(p.w.to, p.w.slot, p.str); }
      }
      let k = 0;
      for (const p of pulses) if (p.s - o.trail < p.w.len) pulses[k++] = p;
      pulses.length = k;
    }

    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      render();
      const idle = !pulses.length && !nets.length && !queue.length && !flashing.length && !latched.length && !chipsActive &&
        (o.ambient <= 0 || reduced());
      if (!idle && visible && !destroyed) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf && visible && !destroyed) { last = 0; raf = requestAnimationFrame(frame); }
    }

    function rebuild() {
      build();
      redrawStatic();
      render();
      wake();
    }

    // ------------------------------------------------------------------ input

    // Pointer position in board coordinates.
    function local(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top + dTop];
    }

    // Touch pulses on a tap (finger lifted without moving), so swiping to
    // scroll doesn't set the board off. Mouse and pen pulse on press and can
    // drag to draw current.
    let tap = null;

    function onDown(e) {
      if (!o.interactive || e.button !== 0) return;
      if (o.ignore && e.target instanceof Element && e.target.closest(o.ignore)) return;
      const [x, y] = local(e);
      if (x < 0 || y < off || x > W || y > off + viewH) return;
      if (e.pointerType === 'touch') { tap = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
      api.pulse(x, y);
      dragAt = performance.now();
    }

    function onMove(e) {
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
      if (dragAt < 0) return;
      if (!(e.buttons & 1)) { dragAt = -1; return; }
      const now = performance.now();
      if (now - dragAt < 60) return;
      dragAt = now;
      const [x, y] = local(e);
      api.pulse(x, y, o.clickStrength * 0.7, o.clickRadius * 0.3);
    }

    function onUp(e) {
      dragAt = -1;
      if (tap && e.type === 'pointerup' && performance.now() - tap.t < 500) {
        const [x, y] = local(e);
        api.pulse(x, y);
      }
      tap = null;
    }

    function onScheme() {
      if (o.theme !== 'auto') return;
      resolvePalette();
      redrawStatic();
      render();
    }

    // The page scrolls the tiles and live canvas itself; this only brings in
    // tiles that are about to show and moves the live canvas when needed.
    function onScroll() {
      if (!o.scroll || destroyed) return;
      updateView();
      ensureTiles();
      if (placeLive() && !raf) render();
    }

    // Everything the layout depends on: viewport size, page height and where
    // the keep-outs are. The board rebuilds when it changes.
    let lastSize = '', resizeTimer = 0;
    const sizeKey = () => {
      const de = document.documentElement;
      let key, bx, by;
      if (o.scroll) {
        // Body height rather than scrollHeight: the board's own canvases
        // would otherwise hold the page open when content shrinks. Window
        // height is left out: a phone's address bar showing and hiding
        // changes it constantly, and fitView handles that without a rebuild.
        key = de.clientWidth + ':' + document.body.offsetHeight;
        bx = originX - window.scrollX; by = originY - window.scrollY;
      } else {
        const r = canvas.getBoundingClientRect();
        key = Math.round(r.width) + 'x' + Math.round(r.height);
        bx = r.left; by = r.top;
      }
      if (o.keepout) {
        for (const el of document.querySelectorAll(o.keepout)) {
          const e = el.getBoundingClientRect();
          key += '|' + [e.left - bx, e.top - by, e.width, e.height].map(Math.round).join(',');
        }
      }
      return key;
    };
    // Scroll mode: the window got taller or shorter (address bar) without
    // the layout changing. Resize the live canvas and fill in tiles.
    function fitView() {
      if (!o.scroll) return;
      const h = Math.max(1, document.documentElement.clientHeight, window.innerHeight);
      if (h === viewH) return;
      viewH = h;
      dynH = Math.min(align(H), align(viewH * 1.2));
      canvas.style.height = dynH + 'px';
      canvas.height = Math.round(dynH * dpr);
      updateView();
      dTop = clamp(align(off - (dynH - viewH) / 2), 0, Math.max(0, align(H) - dynH));
      canvas.style.top = dTop + 'px';
      ensureTiles();
      render();
    }

    const checkLayout = () => {
      fitView();
      const key = sizeKey();
      if (key === lastSize) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 150);
    };
    const ro = new ResizeObserver(checkLayout);
    const zoneIO = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const z = zones.find((q) => q.el === e.target);
            if (z) zoneFire(z);
          }
        }, { threshold: 0.2 })
      : null;
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          visible = entries[entries.length - 1].isIntersecting;
          if (visible) wake();
          else if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; }
        })
      : null;

    const api = {
      /** Fire every gate within `radius` of (x, y), rippling outward. */
      pulse(x, y, strength = o.clickStrength, radius = o.clickRadius) {
        for (const g of gates) {
          const d = Math.hypot(g.x - x, g.y - y);
          if (d <= radius) schedule(t + d / o.speed, g, strength * (1 - 0.35 * d / radius), 'fire');
        }
        for (const ch of chips) {
          const d = Math.hypot(ch.x - x, ch.y - y);
          if (d <= radius) schedule(t + d / o.speed, ch, strength, 'chip');
        }
        for (const ds of displays) {
          const d = Math.hypot(ds.x - x, ds.y - y);
          if (d <= radius) schedule(t + d / o.speed, ds, strength, 'disp');
        }
        wake();
      },
      /** Light the name and the segment displays left to right, `delay` s from now. */
      reveal(strength = 0.8, delay = 0) {
        const all = latches.concat(displays);
        if (!all.length) return;
        const x0 = Math.min(...all.map((g) => g.x));
        for (const g of latches) schedule(t + delay + (g.x - x0) / 900, g, strength, 'fire');
        for (const d of displays) schedule(t + delay + (d.x - x0) / 900, d, strength, 'disp');
        wake();
      },
      setOptions(next) {
        const structural = STRUCTURAL.some((k) => k in next);
        Object.assign(o, next);
        if (next.mix) o.mix = Object.assign({}, DEFAULTS.mix, next.mix);
        const recolour = 'theme' in next || 'colors' in next;
        if (recolour) resolvePalette();
        if (structural) build();
        if (structural || recolour) redrawStatic();
        render();
        wake();
      },
      /** Re-measure the page and keep-outs and rebuild the board. */
      refresh() { rebuild(); },
      get options() { return Object.assign({}, o); },
      stats() {
        return {
          gates: gates.length, chips: chips.length, zones: zones.length, wires: wireCount,
          pulses: pulses.length + nets.length, queued: queue.length,
        };
      },
      destroy() {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        ro.disconnect();
        if (io) io.disconnect();
        if (zoneIO) zoneIO.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', checkLayout);
        clearTiles();
        for (const cv of tilePool) cv.remove();
        canvas.style.cssText = origCss;
        mqDark.removeEventListener('change', onScheme);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      },
    };

    resolvePalette();
    rebuild();
    ro.observe(canvas);
    // Content reflowing (images, fonts) moves the keep-outs and page height.
    ro.observe(document.body);
    if (document.fonts) document.fonts.ready.then(() => { if (!destroyed) checkLayout(); });
    if (io) io.observe(canvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkLayout);
    mqDark.addEventListener('change', onScheme);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return api;
  }

  CircuitField.defaults = DEFAULTS;
  CircuitField.themes = THEMES;
  root.CircuitField = CircuitField;
})(typeof window !== 'undefined' ? window : this);
