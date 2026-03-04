<script>
  import { onMount } from "svelte";

  export let scrollTarget = "#overview";

  let canvas;

  onMount(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("2D canvas not supported");
      return;
    }

    // ---------- Seeded RNG (Mulberry32) ----------
    function createRNG(seed) {
      return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    let seed = Date.now() ^ Math.floor(performance.now() * 1_000_000);
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      seed ^= buf[0];
    }
    seed >>>= 0;
    const rand = createRNG(seed);
    console.log("❄️ Mobile flame seed:", seed);

    const jitter = (r) => (rand() * 2 - 1) * r;

    function hsvToRgb(h, s, v) {
      h = ((h % 1) + 1) % 1;
      const c = v * s;
      const hp = h * 6.0;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      let r = 0,
        g = 0,
        b = 0;
      if (hp < 1.0) {
        r = c;
        g = x;
        b = 0;
      } else if (hp < 2.0) {
        r = x;
        g = c;
        b = 0;
      } else if (hp < 3.0) {
        r = 0;
        g = c;
        b = x;
      } else if (hp < 4.0) {
        r = 0;
        g = x;
        b = c;
      } else if (hp < 5.0) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      const m = v - c;
      return [r + m, g + m, b + m];
    }

    // Variations
    const variations = {
      linear: (x, y) => [x, y],
      spherical: (x, y) => {
        const r2 = x * x + y * y + 1e-6;
        return [x / r2, y / r2];
      },
      sinusoidal: (x, y) => [Math.sin(x), Math.sin(y)]
    };

    // ---------- Flame spec (core + symmetric arms) ----------
    const ARM_COUNT = 1;
    let transforms = [];
    let cumWeights = [];

    function makeCoreTransform(baseHue) {
        // strong center fill, mostly linear, no big spherical push
        const scale = 0.01;   // smaller scale keeps points near origin
        const a = scale;
        const b = 0;
        const c = 0;
        const d = scale;
        const e = 0;
        const f = 0;

        const rotSpeed = 0.01;      // very slow rotation
        const offsetAmpX = 0.02;    // tiny wobble
        const offsetAmpY = 0.02;
        const offsetFreqX = 0.025;
        const offsetFreqY = 0.3;

        // make this bright to really light up center
        const hue = baseHue + jitter(0.005);
        const sat = 0.8;
        const val = 1;
        const [r, g, bCol] = hsvToRgb(hue, sat, val);

        // IMPORTANT: mostly linear, almost no spherical
        const vars = {
            linear: 0.95,
            spherical: 0.03,
            sinusoidal: 0.02
        };

        return {
            weight: 3.0, // give core heavy weight
            color: [r, g, bCol],
            baseAffine: { a, b, c, d, e, f },
            runtimeAffine: { a, b, c, d, e, f },
            dynamic: {
            rotSpeed,
            offsetAmpX,
            offsetAmpY,
            offsetFreqX,
            offsetFreqY
            },
            vars
        };
        }


    function makeArmTransform(i, baseHue) {
      const angle = (i / ARM_COUNT) * Math.PI * 2;
      const cs = Math.cos(angle);
      const sn = Math.sin(angle);
      const scale = 0.5 + 0.08 * jitter(1);

      const a = cs * scale;
      const b = -sn * scale;
      const c = sn * scale;
      const d = cs * scale;

      // small radial offset, but not too far
      const radius = 0.01;
      const e = radius * cs + jitter(0.03);
      const f = radius * sn + jitter(0.03);

      const rotSpeed = 0.35 + 0.1 * jitter(1);
      const offsetAmpX = 0.06;
      const offsetAmpY = 0.06;
      const offsetFreqX = 0.35 + 0.1 * rand();
      const offsetFreqY = 0.35 + 0.1 * rand();

      let w1 = 0.3 + 0.7 * rand();
      let w2 = 0.3 + 0.7 * rand();
      let w3 = 0.3 + 0.7 * rand();
      const sum = w1 + w2 + w3;
      const vars = {
        linear: w1 / sum,
        spherical: w2 / sum,
        sinusoidal: w3 / sum
      };

      const hue = baseHue + jitter(0.02);
      const sat = 0.7 + 0.1 * rand();
      const val = 0.8 + 0.1 * rand();
      const [r, g, bCol] = hsvToRgb(hue, sat, val);

      return {
        weight: 1.0,
        color: [r, g, bCol],
        baseAffine: { a, b, c, d, e, f },
        runtimeAffine: { a, b, c, d, e, f },
        dynamic: {
          rotSpeed,
          offsetAmpX,
          offsetAmpY,
          offsetFreqX,
          offsetFreqY
        },
        vars
      };
    }

    function buildTransforms() {
      transforms = [];
      cumWeights = [];

      const baseHue = 0.55; // cyan/teal band

      const core = makeCoreTransform(baseHue);
      transforms.push(core);

      for (let i = 0; i < ARM_COUNT; i++) {
        transforms.push(makeArmTransform(i, baseHue));
      }

      let totalW = transforms.reduce((acc, t) => acc + t.weight, 0);
      for (const T of transforms) {
        T.weight /= totalW;
      }

      let sum = 0;
      for (const t of transforms) {
        sum += t.weight;
        cumWeights.push(sum);
      }
      const last = cumWeights[cumWeights.length - 1];
      for (let i = 0; i < cumWeights.length; i++) {
        cumWeights[i] /= last;
      }
    }

    function pickTransform() {
      const r = Math.random();
      for (let i = 0; i < cumWeights.length; i++) {
        if (r < cumWeights[i]) return transforms[i];
      }
      return transforms[transforms.length - 1];
    }

    // ---------- Buffers & sizing ----------
    const RES_SCALE = 1;
    let density, rBuf, gBuf, bBuf;
    let imageData;
    let warmup = 80;

    function initBuffers(width, height) {
      const size = width * height;
      density = new Float32Array(size);
      rBuf = new Float32Array(size);
      gBuf = new Float32Array(size);
      bBuf = new Float32Array(size);
      imageData = ctx.createImageData(width, height);
      warmup = 80;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr * RES_SCALE));
      const height = Math.max(1, Math.floor(rect.height * dpr * RES_SCALE));
      if (width === canvas.width && height === canvas.height) return;
      canvas.width = width;
      canvas.height = height;
      initBuffers(width, height);
    }

    // camera: keep fixed & centered
    const cameraOffsetX = 0;
    const cameraOffsetY = 0;

    function worldToPixel(x, y) {
      const aspect = canvas.width / canvas.height;
      const worldScale = 4; // slightly tighter framing to fill center

      x += cameraOffsetX;
      y += cameraOffsetY;

      const nx = x / (worldScale * aspect);
      const ny = y / worldScale;

      const sx = (nx + 0.5) * canvas.width;
      const sy = (ny + 0.5) * canvas.height;

      return [sx | 0, sy | 0];
    }

    // starting point close to center
    let px = jitter(0.05);
    let py = jitter(0.05);

    let transformPhase = 0;

    function updateDynamicAffines(phase) {
      for (const T of transforms) {
        const baseAffine = T.baseAffine;
        const runtimeAffine = T.runtimeAffine;
        const dynamic = T.dynamic;

        const angle = dynamic.rotSpeed * phase;
        const cs = Math.cos(angle);
        const sn = Math.sin(angle);

        const a0 = baseAffine.a;
        const b0 = baseAffine.b;
        const c0 = baseAffine.c;
        const d0 = baseAffine.d;

        runtimeAffine.a = a0 * cs - c0 * sn;
        runtimeAffine.c = a0 * sn + c0 * cs;
        runtimeAffine.b = b0 * cs - d0 * sn;
        runtimeAffine.d = b0 * sn + d0 * cs;

        runtimeAffine.e =
          baseAffine.e +
          dynamic.offsetAmpX * Math.sin(dynamic.offsetFreqX * phase + 0.3 * seed);
        runtimeAffine.f =
          baseAffine.f +
          dynamic.offsetAmpY * Math.cos(dynamic.offsetFreqY * phase + 0.5 * seed);
      }
    }

    // ---------- Iteration control ----------
    const TARGET_FPS = 30;
    const TARGET_FRAME_MS = 1000 / TARGET_FPS;
    let iterationsPerFrame = 9000;
    const MIN_ITERS = 3000;
    const MAX_ITERS = 1500000;

    function adjustIterations(frameMs) {
      if (frameMs <= 0) return;
      const ratio = TARGET_FRAME_MS / frameMs;
      const k = 0.25;
      const factor = 1 + k * (ratio - 1);
      iterationsPerFrame *= factor;
      if (iterationsPerFrame < MIN_ITERS) iterationsPerFrame = MIN_ITERS;
      if (iterationsPerFrame > MAX_ITERS) iterationsPerFrame = MAX_ITERS;
    }

    function step(iterations) {
      const w = canvas.width;
      const h = canvas.height;
      if (!density || w === 0 || h === 0) return;

      const iters = iterations | 0;

      for (let i = 0; i < iters; i++) {
        const T = pickTransform();
        const A = T.runtimeAffine;

        const ax = A.a * px + A.b * py + A.e;
        const ay = A.c * px + A.d * py + A.f;

        let vx = 0;
        let vy = 0;
        let vSum = 0;
        for (const name in T.vars) {
          const wgt = T.vars[name];
          if (!wgt) continue;
          const [tx, ty] = variations[name](ax, ay);
          vx += wgt * tx;
          vy += wgt * ty;
          vSum += wgt;
        }

        if (vSum > 0) {
          px = vx / vSum;
          py = vy / vSum;
        } else {
          px = ax;
          py = ay;
        }

        if (warmup > 0) {
          warmup--;
          continue;
        }

        const [sx, sy] = worldToPixel(px, py);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        const idx = sy * w + sx;

        density[idx] += 1;
        rBuf[idx] += T.color[0];
        gBuf[idx] += T.color[1];
        bBuf[idx] += T.color[2];
      }
    }

    function renderFlame() {
      const w = canvas.width;
      const h = canvas.height;
      if (!density || w === 0 || h === 0 || !imageData) return;

      const data = imageData.data;

      let maxD = 0;
      for (let i = 0; i < density.length; i++) {
        if (density[i] > maxD) maxD = density[i];
      }
      const invLogMax = maxD > 0 ? 1 / Math.log(1 + maxD) : 1;

      const decay = 0.99;

      for (let i = 0; i < density.length; i++) {
        density[i] *= decay;
        rBuf[i] *= decay;
        gBuf[i] *= decay;
        bBuf[i] *= decay;

        const d = density[i];
        const idx = i * 4;

        if (d <= 0.002) {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
          data[idx + 3] = 255;
          continue;
        }

        const cr = rBuf[i] / d;
        const cg = gBuf[i] / d;
        const cb = bBuf[i] / d;

        let v = Math.log(1 + d) * invLogMax;
        v = Math.pow(v, 0.55);

        const hot = Math.min(1.4, v * 2.2);
        const r = (0.6 * hot + cr * 0.9) * 255 * v;
        const g = (0.9 * hot + cg * 0.3) * 255 * v;
        const b = (1.3 * hot + cb * 0.8) * 255 * v;

        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    let frameId;
    let lastTime = null;

    function loop(now) {
      if (lastTime === null) lastTime = now;
      const frameMs = now - lastTime;
      const dt = frameMs / 1000;
      lastTime = now;

      adjustIterations(frameMs);

      const phaseRate = 0.5; // gentle slow motion
      transformPhase += phaseRate * dt;

      updateDynamicAffines(transformPhase);
      step(iterationsPerFrame);
      renderFlame();

      frameId = requestAnimationFrame(loop);
    }

    buildTransforms();
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameId) cancelAnimationFrame(frameId);
    };
  });
</script>

<header class="hero hero-mobile">
  <canvas bind:this={canvas} class="hero-canvas"></canvas>

  <div class="hero-overlay">
    <div class="hero-text">
      <h1 class="hero-name">Isaiah Murray</h1>
      <p class="hero-subtitle">
        ECE Student at
        <a href="https://olin.edu" target="_blank" rel="noreferrer">
          Olin College of Engineering
        </a>
        <br>
        <a href="https://formlabs.com/" target="_blank" style="color: #ff5a00" rel="noreferrer">
          Formlabs
        </a>  Materials Intern
      </p>
    </div>

    <a href={scrollTarget} class="scroll-hint" aria-label="Scroll to explore">
      <span>Scroll to explore</span>
      <span class="chevron">⌄</span>
    </a>
  </div>
</header>

<style>
  .hero {
    position: relative;
    width: 100%;
    height: 100svh;
    overflow: hidden;
  }

  .hero-canvas {
    width: 100%;
    height: 100svh;
    display: block;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
    /* IMPORTANT: no touch-action override → scroll works */
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2.5rem 1.5rem;
    background: radial-gradient(
      circle at 50% 25%,
      rgba(0, 0, 0, 0.6),
      rgba(0, 0, 0, 0.15)
    );
    pointer-events: none;
  }

  .hero-text {
    margin-top: auto;
  }

  .hero-name {
    margin: 0 0 0.1rem 0;
    font-size: 2.1rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 0 18px rgba(0, 0, 0, 0.9);
  }

  .hero-subtitle {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 300;
    max-width: 30rem;
    text-shadow: 0 0 12px rgba(0, 0, 0, 0.95);
  }

  .hero-subtitle a {
    pointer-events: auto;
    color: #21b5ff;
    text-decoration: none;
    border-bottom: 1px solid rgba(33, 181, 255, 0.3);
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .hero-subtitle a:hover {
    border-color: rgba(33, 181, 255, 0.8);
    color: #73d3ff;
  }

  .scroll-hint {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: rgba(244, 239, 214, 0.78);
    text-decoration: none;
    opacity: 0.85;
    animation: float 2.6s ease-in-out infinite;
  }

  .scroll-hint span:first-child {
    font-weight: 500;
  }

  .chevron {
    font-size: 1.1rem;
    transform-origin: center;
    animation: bounce 1.1s ease-in-out infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.7;
    }
    50% {
      transform: translateY(-3px);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(3px);
    }
  }
</style>
