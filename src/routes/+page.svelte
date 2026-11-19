<script>
  import { onMount } from 'svelte';
  import CopyEmail from '$lib/chamber/CopyEmail.svelte';
  import ProjectCard from '$lib/chamber/ProjectCard.svelte';
  import SignalChain from '$lib/chamber/SignalChain.svelte';
  import { ambient } from '$lib/circuit/settings.js';
  import { firstSentence } from '$lib/projects.js';

  export let data;

  // schema.org Person, so search engines and other crawlers can read who this is directly.
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Isaiah Murray',
    url: 'https://isaiah-murray.com',
    image: 'https://isaiah-murray.com/faceshot.jpg',
    jobTitle: 'Electrical and computer engineering student',
    description: 'Electrical and computer engineering student at Olin College. Embedded systems, flight hardware and the tools around them.',
    affiliation: { '@type': 'CollegeOrUniversity', name: 'Olin College of Engineering', url: 'https://www.olin.edu' },
    address: { '@type': 'PostalAddress', addressLocality: 'Needham', addressRegion: 'MA', addressCountry: 'US' },
    sameAs: [
      'https://github.com/IsaiahJMurray',
      'https://www.linkedin.com/in/isa-murray/',
      'https://www.instagram.com/isaiah.murray1/',
      'https://cambridge.nuvustudio.com/users/isa-murray'
    ]
  };
  const ldJson = `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</` + `script>`;

  // Cell placement on the 12-column grid, by number of featured projects (desktop).
  // The first one is the big one; the rest are never narrower than a third of the tray.
  const LAYOUTS = {
    1: [['1 / 13', '1 / span 4']],
    2: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 4']],
    3: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 13', '3 / span 2']],
    4: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 13', '3 / span 2'], ['1 / 13', '5 / span 2']],
    5: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 13', '3 / span 2'], ['1 / 7', '5 / span 2'], ['7 / 13', '5 / span 2']],
    6: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 13', '3 / span 2'], ['1 / 5', '5 / span 2'], ['5 / 9', '5 / span 2'], ['9 / 13', '5 / span 2']]
  };

  $: featured = data.featured;
  $: others = data.others;
  $: cells = LAYOUTS[featured.length] || [];

  let filter = 'all';
  let plate;

  // on phones the grid is two columns: the big card spans both, and so does the last one if it would sit alone
  const wideOnPhone = (i, n) => i === 0 || (i === n - 1 && (n - 1) % 2 === 1);

  // The board does not sweep the name on for visitors who prefer reduced motion, so they get
  // the name as plain type instead of an unlit board.
  let still = false;
  onMount(() => { still = matchMedia('(prefers-reduced-motion: reduce)').matches; });

  // Figures from the work in the log below, each one measured on the job.
  const results = [
    { what: 'Heater-fault false positives', fig: ['9%', '0%'], where: 'Formlabs', how: 'Fleet-wide fault detection from first principles; the false alarms were PWM phase jitter between channels.' },
    { what: 'Powder-bed defect classes', fig: ['2', '9'], where: 'Formlabs', how: 'A binary detector became a ResNet-18 classifier with severity ranking.' },
    { what: 'Phased-array radar calibration', fig: ['hours', 'minutes'], where: 'Cherish Health', how: 'Manual gain and phase tuning replaced by an FPGA-controlled workflow.' },
    { what: 'Radar side-lobe interference', fig: ['−20% TX', '−30% RX'], join: ' / ', where: 'Cherish Health', how: 'From the same calibration automation.' },
    { what: 'Cure transients captured', fig: ['~40 Hz', '300+ runs'], join: ' × ', where: 'Formlabs', how: 'In-situ dielectric cure monitoring, correlated with FTIR.' }
  ];
</script>

<svelte:head>
  <title>Isaiah Murray</title>
  <meta
    name="description"
    content="Isaiah Murray: electrical and computer engineering student at Olin College. Embedded systems, flight hardware and the tools around them."
  />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Isaiah Murray" />
  <meta property="og:description" content="Electrical and computer engineering student at Olin College. Embedded systems, flight hardware and the tools around them." />
  <meta property="og:url" content="https://isaiah-murray.com" />
  <meta property="og:image" content="https://isaiah-murray.com/faceshot.jpg" />
  <meta property="og:site_name" content="Isaiah Murray" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Isaiah Murray" />
  <meta name="twitter:description" content="Electrical and computer engineering student at Olin College. Embedded systems, flight hardware and the tools around them." />
  <meta name="twitter:image" content="https://isaiah-murray.com/faceshot.jpg" />
  {@html ldJson}
</svelte:head>

<main id="main">
  <section class="wrap hero" class:still aria-labelledby="h1-home">
    {#if still}
      <h1 id="h1-home" class="name">Isaiah Murray</h1>
    {:else}
      <!-- The circuit board spells the name in this empty stage and keeps it lit (see CircuitBackground). -->
      <h1 id="h1-home" class="visually-hidden">Isaiah Murray</h1>
      <div class="stage" data-circuit-name aria-hidden="true"></div>
      <div class="stage-bar">
        <span class="hint mono">Click the board to send a signal through it.</span>
        <button
          type="button"
          class="ambient"
          role="switch"
          aria-checked={$ambient}
          on:click={() => ambient.set(!$ambient)}
        ><span class="track" aria-hidden="true"></span>Background signals</button>
      </div>
    {/if}
    <div class="hero-bottom">
      <div class="role">
        <p>I build embedded systems, flight hardware and the tools around them.</p>
        <small>Electrical &amp; computer engineering at Olin College, class of 2029. Needham and Boston, MA.</small>
      </div>
      <div class="now">
        <p>
          <b>Now.</b> Just finished a summer as an Electrical Engineering Intern in SLS &amp; Materials R&amp;D at Formlabs.
          Building the <a href="/projects/autonomous-swarm">Autonomous Swarm</a> and <a href="/projects/canopy">Canopy</a>, telemetry for the Olin Baja car.
        </p>
        <ul class="links">
          <li><a class="btn" href="/Isaiah_Murray_Resume.pdf" data-sveltekit-reload>Resume (PDF)</a></li>
          <li><a class="btn ghost" href="#contact">Email</a></li>
          <li><a href="https://github.com/IsaiahJMurray" rel="me">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/isa-murray/" rel="me">LinkedIn</a></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="wrap section" id="work" aria-labelledby="h-work">
    <div class="section-head">
      <h2 id="h-work">Selected work</h2>
      <SignalChain projects={featured} bind:value={filter} target={plate} />
    </div>

    <div class="plate" bind:this={plate}>
      {#each featured as p, i (p.slug)}
        <ProjectCard
          project={p}
          big={i === 0}
          hit={filter === 'all' || p.disciplines.includes(filter)}
          {filter}
          eager={i < 3}
          wideM={wideOnPhone(i, featured.length)}
          style={cells[i] ? `--gc:${cells[i][0]};--gr:${cells[i][1]}` : ''}
        />
      {/each}
    </div>
    <div class="after-plate">
      <a class="btn ghost" href="/projects">All {data.total} projects</a>
      <p class="legend">
        <span class="leds" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></span>
        Each card's four lights: hardware, firmware, software, ML/CV.
      </p>
    </div>
  </section>

  <section class="wrap section" id="experience" aria-labelledby="h-exp">
    <div class="section-head"><h2 id="h-exp">Experience</h2></div>

    <div class="tbl-wrap results">
      <table>
        <caption class="visually-hidden">Measured results from that work</caption>
        <thead>
          <tr><th scope="col">Measured</th><th scope="col">Result</th><th scope="col" class="c-how">How</th></tr>
        </thead>
        <tbody>
          {#each results as r}
            <tr>
              <th scope="row">{r.what}<span class="where">{r.where}</span></th>
              <td class="fig mono">
                {#if r.join}
                  <span>{r.fig[0]}</span><span class="sep">{r.join.trim()}</span><span>{r.fig[1]}</span>
                {:else}
                  <span class="from">{r.fig[0]}</span><span class="sep" aria-hidden="true">→</span><span class="visually-hidden"> to </span><span>{r.fig[1]}</span>
                {/if}
              </td>
              <td class="how">{r.how}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <ol class="log">
      <li>
        <div class="when mono"><span>2026.03–2026.08</span><span>Somerville, MA</span></div>
        <div class="what">
          <h3>Formlabs</h3>
          <p class="title">Electrical Engineering Intern, SLS &amp; Materials R&amp;D</p>
          <ul>
            <li>Powder-bed defect detection: GPU computer vision and a ResNet-18 classifier, taken from binary to a nine-class taxonomy with severity ranking.</li>
            <li>Heater fault detection built from first principles; false positives from 9% to 0% by addressing PWM phase jitter.</li>
            <li>Automated filter-swap characterization, producing a continuous pressure-flow surface and a virtual flow sensor.</li>
            <li>Dielectric cure monitoring (PyQt6, VISA, SSH): ~40 Hz transients across 300+ runs, correlated with FTIR.</li>
            <li>Browser-based lifetime test runner with acoustic detection, used for five qualification campaigns.</li>
          </ul>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2024–2025</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>Cherish Health</h3>
          <p class="title">Engineering</p>
          <p class="brief">Automated phased-array radar calibration through an FPGA-controlled workflow; radar data comparison and annotation tooling; an alternate LED supplier that cut BOM cost 5%.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>Ongoing</span><span>Olin College</span></div>
        <div class="what">
          <h3>Olin Baja SAE</h3>
          <p class="title">Electrical</p>
          <p class="brief"><a href="/projects/canopy">Canopy</a>, and a ride-height suspension sensor for damper tuning over CAN.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>Summer 2023</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>MIT Strano Group</h3>
          <p class="title">Lab assistant, HIP-SAT</p>
          <p class="brief">Graphene additives in phase change materials; presented at two symposia.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2022–2023</span></div>
        <div class="what">
          <h3>Cherish Health</h3>
          <p class="title">ML intern</p>
          <p class="brief">Detection models and data collection tooling in Python and TensorFlow; technical demos for the Series A.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>Expected 2029.05</span></div>
        <div class="what">
          <h3>Olin College of Engineering</h3>
          <p class="title">B.S. Engineering (ECE), expected May 2029. Before that, NuVu Innovation School, 2020–2024.</p>
        </div>
      </li>
    </ol>
    <dl class="skills">
      <dt>Languages</dt><dd>Python, C, C++, MATLAB, SQL, JavaScript</dd>
      <dt>ML / CV</dt><dd>PyTorch, OpenCV, Kornia, scikit-learn, TensorFlow</dd>
      <dt>Hardware</dt><dd>KiCad, Altium, PyVISA, nRF52, STM32, CAN, PX4/MAVLink, thermal imaging</dd>
      <dt>Tools</dt><dd>SolidWorks, Fusion 360, Blender, Docker, Linux, Grafana, FastAPI</dd>
    </dl>
    <p class="more"><a class="btn ghost" href="/resume">Full resume</a></p>
  </section>

  {#if others.length}
    <section class="wrap section" aria-labelledby="h-index">
      <div class="section-head"><h2 id="h-index">More projects</h2></div>
      <div class="tbl-wrap index">
        <table>
          <thead>
            <tr><th scope="col">Year</th><th scope="col">Project</th><th scope="col">What it is</th></tr>
          </thead>
          <tbody>
            {#each others as p (p.slug)}
              <tr>
                <td class="yr mono">{p.year ?? '—'}</td>
                <th scope="row"><a href={`/projects/${p.slug}`}>{p.title}</a></th>
                <td>{firstSentence(p.subtitle)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="more"><a class="btn ghost" href="/projects">All {data.total} projects</a></p>
    </section>
  {/if}

  <section class="wrap section" id="contact" aria-labelledby="h-contact">
    <div class="section-head"><h2 id="h-contact">Contact</h2></div>
    <div class="contact-grid">
      <div class="email-col"><CopyEmail /></div>
      <ul class="contact-links">
        <li><a href="https://github.com/IsaiahJMurray" rel="me">github.com/IsaiahJMurray</a></li>
        <li><a href="https://www.linkedin.com/in/isa-murray/" rel="me">linkedin.com/in/isa-murray</a></li>
        <li><a href="/Isaiah_Murray_Resume.pdf" data-sveltekit-reload>Resume (PDF)</a></li>
      </ul>
    </div>
  </section>
</main>

<style>
  /* ---------- first screen: the lit name on the board, then who and what ---------- */
  .hero {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 76px);
    min-height: calc(100svh - 76px);
    padding-bottom: var(--s6);
  }
  /* The stage takes whatever the first screen has left; the board fits the name inside it.
     Wide screens keep at least the 18 board rows the two-line pixel name needs. */
  .stage { flex: 1 1 auto; min-height: 320px; }
  @media (min-width: 1100px) { .stage { min-height: 540px; } }
  .hero.still { min-height: 0; padding-top: var(--s8); }
  .name { font-weight: 900; font-size: clamp(56px, 12vw, 168px); letter-spacing: -0.04em; line-height: 0.88; margin-bottom: var(--s7); }

  .stage-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--s4); min-height: 48px; }
  .hint { font-size: var(--t-xs); color: var(--ink-2); }
  .ambient {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
    min-height: 44px;
    padding: 0 var(--s1);
    margin-left: auto;
    background: none;
    border: 0;
    font-family: var(--f-mono);
    font-size: var(--t-xs);
    color: var(--ink-2);
  }
  .ambient:hover { color: var(--ink); }
  .track {
    position: relative;
    width: 26px;
    height: 14px;
    border: 1px solid var(--ink-2);
    background: transparent;
    transition: background-color .15s, border-color .15s;
  }
  .track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 8px;
    height: 8px;
    background: var(--ink-2);
    transition: transform .15s, background-color .15s;
  }
  .ambient[aria-checked='true'] .track { background: var(--accent); border-color: var(--accent); }
  .ambient[aria-checked='true'] .track::after { transform: translateX(12px); background: var(--on-accent); }

  .hero-bottom {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--s5) var(--s6);
    align-items: start;
    padding-top: var(--s4);
    border-top: 1px solid var(--rule);
  }
  .role { grid-column: 1 / span 7; }
  .role p { font-size: clamp(26px, 3.1vw, 41px); font-weight: 700; line-height: 1.12; letter-spacing: -0.02em; max-width: 21ch; text-wrap: balance; }
  .role small { display: block; font-size: var(--t-sm); color: var(--ink-2); margin-top: var(--s3); max-width: 46ch; }
  .now { grid-column: 8 / span 5; font-size: var(--t-md); max-width: 46ch; }
  .now b { font-weight: 700; }
  .links { list-style: none; padding: 0; margin: var(--s4) 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--s3) var(--s4); font-size: var(--t-sm); }
  @media (max-width: 860px) {
    .role, .now { grid-column: 1 / -1; }
    .hero { padding-bottom: var(--s7); }
    .hint { display: none; }
  }
  @media (max-width: 600px) {
    /* leave the statement peeking above the fold on phones */
    .hero { min-height: 0; }
    .stage { flex: none; height: 62vh; height: 62svh; min-height: 300px; }
  }

  /* ---------- work ---------- */
  .after-plate { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s3) var(--s5); margin-top: var(--s4); }
  .legend { display: flex; align-items: center; gap: var(--s3); font-size: var(--t-xs); color: var(--ink-2); }
  .more { margin-top: var(--s5); }

  /* ---------- measured results: figures first ---------- */
  .results { margin-bottom: var(--s7); }
  .results table { font-size: var(--t-sm); }
  .results tbody th { font-weight: 700; font-size: var(--t-md); width: 32%; }
  .results .where { display: block; font-weight: 400; font-size: var(--t-xs); color: var(--ink-2); margin-top: 2px; }
  .results .fig { font-size: var(--t-xl); font-weight: 500; line-height: 1.15; white-space: nowrap; width: 30%; letter-spacing: -0.02em; }
  .results .fig .from { color: var(--ink-2); }
  .results .fig .sep { color: var(--signal); margin: 0 0.35em; }
  .results .how { color: var(--ink-2); line-height: 1.45; }
  .results tbody tr:last-child > * { border-bottom-color: var(--rule); }
  @media (max-width: 760px) {
    .results thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .results tr { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--s3) 0; border-bottom: 1px solid var(--rule); }
    .results th, .results td { border: 0; padding: 0; width: auto; }
    .results tbody th { width: auto; font-size: var(--t-sm); }
    .results .fig { width: auto; margin: var(--s1) 0; white-space: normal; }
  }

  /* ---------- contact ---------- */
  .contact-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s5) var(--s6); align-items: end; }
  .email-col { grid-column: 1 / span 8; min-width: 0; }
  .contact-links { grid-column: 9 / span 4; list-style: none; margin: 0; padding: 0; font-size: var(--t-md); }
  .contact-links li { padding: var(--s1) 0; }
  @media (max-width: 760px) { .email-col, .contact-links { grid-column: 1 / -1; } }
</style>
