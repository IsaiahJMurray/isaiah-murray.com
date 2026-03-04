<script>
  import { onMount } from "svelte";

  // where the scroll hint should jump to
  export let scrollTarget = "#overview";

  let canvas;

  // ---------- Pointer state (mouse + touch) ----------
  let pointerNormX = 0; // [-0.5, 0.5] normalized within canvas
  let pointerNormY = 0; // [-0.5, 0.5]
  let pointerActive = false;

  let lastClientX = null;
  let lastClientY = null;

  let smoothedVelX = 0;
  let smoothedVelY = 0;

  const VEL_ALPHA = 0.12; // how quickly new motion affects smoothed velocity
  const VEL_DECAY = 0.92; // how quickly velocity decays when no input

  function updatePointerFromEvent(event) {
    if (!canvas) return;
    return
    const rect = canvas.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    pointerNormX = nx;
    pointerNormY = ny;
    pointerActive = true;

    if (lastClientX !== null) {
      const dx = event.clientX - lastClientX;
      const dy = event.clientY - lastClientY;

      smoothedVelX = smoothedVelX * (1 - VEL_ALPHA) + dx * VEL_ALPHA;
      smoothedVelY = smoothedVelY * (1 - VEL_ALPHA) + dy * VEL_ALPHA;
    }

    lastClientX = event.clientX;
    lastClientY = event.clientY;
  }

  function handlePointerDown(event) {
    event.preventDefault();
    updatePointerFromEvent(event);
  }

  function handlePointerMove(event) {
    event.preventDefault();
    updatePointerFromEvent(event);
  }

  function handlePointerUp() {
    pointerActive = false;
    lastClientX = null;
    lastClientY = null;
  }

  function handlePointerLeave() {
    pointerActive = false;
    lastClientX = null;
    lastClientY = null;
  }

  // ---------- Flame setup ----------
  onMount(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("2D canvas not supported");
      return;
    }

    // Seeded RNG (Mulberry32)
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
    console.log("🔥 Flame seed:", seed);

    // Variations
    const variations = {
      linear: (x, y) => [x, y],
      spherical: (x, y) => {
        const r2 = x * x + y * y + 1e-6;
        return [x / r2, y / r2];
      },
      sinusoidal: (x, y) => [Math.sin(x), Math.sin(y)]
    };

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

    // Flame spec
    const TRANSFORM_COUNT = 5  ; // 1 core + 5 random
    let transforms = [];
    let cumWeights = [];

    function makeRandomTransform(baseHue) {
      const angle = rand() * Math.PI * 2.0;
      const cs = Math.cos(angle);
      const sn = Math.sin(angle);
      const scale = 0.1 + 0.3 * rand();
      const shearX = jitter(0.25);
      const shearY = jitter(0.25);

      const a = cs * scale + shearX * 0.1;
      const b = -sn * scale + shearY;
      const c = sn * scale - shearY * 0.1;
      const d = cs * scale + shearX;
      const e = jitter(1.2);
      const f = jitter(1.2);

      const rotSpeed = (rand() * 2 - 1) * 0.9;
      const offsetAmpX = 0.4 * rand();
      const offsetAmpY = 0.4 * rand();
      const offsetFreqX = 0.6 + 0.8 * rand();
      const offsetFreqY = 0.6 + 0.8 * rand();

      let w1 = 0.3 + 0.7 * rand();
      let w2 = 0.3 + 0.7 * rand();
      let w3 = 0.3 + 0.7 * rand();
      const sum = w1 + w2 + w3;
      const vars = {
        linear: w1 / sum,
        spherical: w2 / sum,
        sinusoidal: w3 / sum
      };

      const hue = baseHue + jitter(0.1);
      const sat = 0.8 + 0.2 * rand();
      const val = 0.55 + 0.4 * rand();
      const [r, g, bCol] = hsvToRgb(hue, sat, val);

      const weight = 0.4 + 0.6 * rand();

      return {
        weight,
        color: [r, g, bCol],
        baseAffine: { a, b, c, d, e, f },
        runtimeAffine: { a, b, c, d, e, f },
        dynamic: { rotSpeed, offsetAmpX, offsetAmpY, offsetFreqX, offsetFreqY },
        vars
      };
    }

    function buildTransforms() {
      transforms = [];
      cumWeights = [];

      const baseHue = 0.02 + 0.06 * rand(); // red-ish band

      // core transform
      const coreScale = 0.5 + 0.2 * rand();
      const core = {
        weight: 1.5,
        color: [1.0, 0.8, 0.6],
        baseAffine: {
          a: coreScale,
          b: jitter(0.05),
          c: jitter(0.05),
          d: coreScale,
          e: jitter(0.2),
          f: jitter(0.2)
        },
        runtimeAffine: { a: coreScale, b: 0, c: 0, d: coreScale, e: 0, f: 0 },
        dynamic: {
          rotSpeed: (rand() * 2 - 1) * 0.6,
          offsetAmpX: 0.2,
          offsetAmpY: 0.2,
          offsetFreqX: 0.7,
          offsetFreqY: 0.9
        },
        vars: {
          linear: 0.2,
          spherical: 0.8,
          sinusoidal: 0
        }
      };
      transforms.push(core);

      let totalW = core.weight;
      for (let i = 1; i < TRANSFORM_COUNT; i++) {
        const T = makeRandomTransform(baseHue);
        transforms.push(T);
        totalW += T.weight;
      }

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

      console.log("🔥 Transforms:", transforms);
    }

    function pickTransform() {
      const r = rand();
      for (let i = 0; i < cumWeights.length; i++) {
        if (r < cumWeights[i]) return transforms[i];
      }
      return transforms[transforms.length - 1];
    }

    // Buffers & sizing
    const RES_SCALE = 1;
    let density;
    let rBuf;
    let gBuf;
    let bBuf;
    let imageData;
    let warmup = 120;

    function initBuffers(width, height) {
      const size = width * height;
      density = new Float32Array(size);
      rBuf = new Float32Array(size);
      gBuf = new Float32Array(size);
      bBuf = new Float32Array(size);
      imageData = ctx.createImageData(width, height);
      warmup = 120;
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

    // camera
    let cameraOffsetX = 0;
    let cameraOffsetY = 0;

    function worldToPixel(x, y) {
      const aspect = canvas.width / canvas.height;
      const worldScale = 3.0;

      x += cameraOffsetX;
      y += cameraOffsetY;

      const nx = x / (worldScale * aspect);
      const ny = y / worldScale;

      const sx = (nx + 0.5) * canvas.width;
      const sy = (ny + 0.5) * canvas.height;

      return [sx | 0, sy | 0];
    }

    // starting point
    let px = jitter(0.5);
    let py = jitter(0.5);

    // phase driven by input motion
    let transformPhase = 1;

    function updateDynamicAffines(phase, motionFactor) {
      for (const T of transforms) {
        const baseAffine = T.baseAffine;
        const runtimeAffine = T.runtimeAffine;
        const dynamic = T.dynamic;
        const rotSpeed = dynamic.rotSpeed;
        const offsetAmpX = dynamic.offsetAmpX;
        const offsetAmpY = dynamic.offsetAmpY;
        const offsetFreqX = dynamic.offsetFreqX;
        const offsetFreqY = dynamic.offsetFreqY;

        const effectiveRot = rotSpeed * motionFactor;
        const angle = effectiveRot * phase;
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

        const mAmpX = offsetAmpX * motionFactor;
        const mAmpY = offsetAmpY * motionFactor;

        runtimeAffine.e =
          baseAffine.e +
          mAmpX * Math.sin(offsetFreqX * phase + 0.3 * seed);
        runtimeAffine.f =
          baseAffine.f +
          mAmpY * Math.cos(offsetFreqY * phase + 0.5 * seed);
      }
    }

    // Iteration control
    const TARGET_FPS = 24;
    const TARGET_FRAME_MS = 1000 / TARGET_FPS;
    let iterationsPerFrame = 12000;
    const MIN_ITERS = 1000;
    const MAX_ITERS = 3_500_000;

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
          const variationFn = variations[name];
          const res = variationFn(ax, ay);
          const tx = res[0];
          const ty = res[1];
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

        const pix = worldToPixel(px, py);
        const sx = pix[0];
        const sy = pix[1];
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

      const decay = 0.97;

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

        const hot = Math.min(1.4, v * 2.4);
        const r = (1.3 * hot + cr * 0.9) * 255 * v;
        const g = (0.55 * hot + cg * 0.25) * 255 * v;
        const b = (0.28 * hot + cb * 0.15) * 255 * v * 0.6;

        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // Dynamic loop
    let frameId;
    let lastTime = null;

    function loop(now) {
      if (lastTime === null) lastTime = now;
      const frameMs = now - lastTime;
      const dt = frameMs / 1000;
      lastTime = now;

      adjustIterations(frameMs);

      if (!pointerActive) {
        smoothedVelX *= VEL_DECAY;
        smoothedVelY *= VEL_DECAY;
      }
      
      smoothedVelX += 0.1

      const velMag = Math.sqrt(
        smoothedVelX * smoothedVelX + smoothedVelY * smoothedVelY
      );
      const rawFactor = velMag * 1; // heavy dampening
      const motionFactor = rawFactor;

      const phaseRate = 1.0;
      transformPhase += motionFactor * phaseRate * dt;

      const cameraBaseStrength = 0.4;
      cameraOffsetX = cameraBaseStrength * pointerNormX * motionFactor;
      cameraOffsetY = cameraBaseStrength * pointerNormY * motionFactor;

      updateDynamicAffines(transformPhase, motionFactor);

      step(iterationsPerFrame);
      renderFlame();

      frameId = requestAnimationFrame(loop);
    }

    // init
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

<header class="hero">
  <canvas
    bind:this={canvas}
    class="hero-canvas"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
    on:pointerleave={handlePointerLeave}
  ></canvas>

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
    height: 100vh;
    overflow: hidden;
  }

  .hero-canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
    touch-action: none;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2.5rem 6vw;
    background: radial-gradient(
      circle at 10% 10%,
      rgba(0, 0, 0, 0.55),
      rgba(0, 0, 0, 0)
    );
    pointer-events: none;
  }

  .hero-text {
    margin-top: auto;
  }

  .hero-name {
    margin: 0 0 0.1rem 0;
    font-size: clamp(2.4rem, 6vw, 4.5rem);
    font-weight: 800;
    letter-spacing: 0.04em;
    text-shadow: 0 0 18px rgba(0, 0, 0, 0.9);
  }

  .hero-subtitle {
    margin: 0;
    font-size: clamp(0.95rem, 3.2vw, 1.5rem);
    font-weight: 300;
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
    gap: 0.6rem;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: rgba(244, 239, 214, 0.78);
    text-decoration: none;
    opacity: 0.8;
    animation: float 2.6s ease-in-out infinite;
  }

  .scroll-hint span:first-child {
    font-weight: 500;
  }

  .chevron {
    font-size: 1.2rem;
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
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }

  @media (max-width: 768px) {
    .hero-overlay {
      padding: 2.5rem 1.5rem;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.9),
        rgba(0, 0, 0, 0.35)
      );
    }

    .hero-name {
      font-size: 2.2rem;
    }

    .hero-subtitle {
      font-size: 0.95rem;
      max-width: 18rem;
    }

    .scroll-hint {
      font-size: 0.75rem;
    }
  }
</style>
