<script>
  import SinterHero from '$lib/chamber/SinterHero.svelte';
  import CopyEmail from '$lib/chamber/CopyEmail.svelte';
  import { DISCIPLINES, firstSentence } from '$lib/projects.js';

  export let data;

  // Cell placement on the 12-column plate, by number of parts (desktop). The first part is the big one.
  const LAYOUTS = {
    1: [['1 / 13', '1 / span 4']],
    2: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 4']],
    3: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 13', '3 / span 2']],
    4: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 11', '3 / span 2'], ['11 / 13', '3 / span 2']],
    5: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 11', '3 / span 2'], ['11 / 13', '3 / span 2'], ['1 / 13', '5 / span 2']],
    6: [['1 / 8', '1 / span 4'], ['8 / 13', '1 / span 2'], ['8 / 11', '3 / span 2'], ['11 / 13', '3 / span 2'], ['1 / 6', '5 / span 2'], ['6 / 13', '5 / span 2']]
  };

  $: featured = data.featured;
  $: others = data.others;
  $: cells = LAYOUTS[featured.length] || [];
  // only offer filters for disciplines that are actually on the plate
  $: filters = DISCIPLINES.filter((d) => featured.some((p) => p.disciplines.includes(d.id)));

  let filter = 'all';
  $: hits = featured.filter((p) => filter === 'all' || p.disciplines.includes(filter)).length;

  const meta = (p) => [p.year, p.maturity === 'wip' ? 'in progress' : null].filter(Boolean).join(' · ');
  // on phones the plate is two columns: the big part spans both, and so does the last one if it would sit alone
  const wideOnPhone = (i, n) => i === 0 || (i === n - 1 && (n - 1) % 2 === 1);
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
</svelte:head>

<main id="main">
  <section class="wrap hero" data-build="Intro" aria-labelledby="h1-home">
    <SinterHero lines={['Isaiah', 'Murray']} id="h1-home" />
    <div class="hero-bottom">
      <p class="role">
        Electrical &amp; computer engineering student at Olin College. I build embedded systems, flight hardware and the tools around them.
        <small>Needham and Boston, MA. Olin College of Engineering, class of 2029.</small>
      </p>
      <div class="now">
        <p>
          <b>Now.</b> Just finished a summer as an Electrical Engineering Intern in SLS &amp; Materials R&amp;D at Formlabs.
          Building the <a href="/projects/autonomous-swarm">Autonomous Swarm</a> and <a href="/projects/canopy">Canopy</a>, telemetry for the Olin Baja car.
        </p>
        <ul class="links">
          <li><a href="https://github.com/IsaiahJMurray" rel="me">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/isa-murray/" rel="me">LinkedIn</a></li>
          <li><a href="/Isaiah_Murray_Resume.pdf" data-sveltekit-reload>Resume (PDF)</a></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="wrap section" id="work" data-build="Selected work" aria-labelledby="h-work">
    <div class="section-head">
      <h2 id="h-work">Selected work</h2>
      {#if filters.length > 1}
        <div class="filters" role="group" aria-label="Filter projects by discipline">
          <button type="button" aria-pressed={filter === 'all'} on:click={() => (filter = 'all')}>All</button>
          {#each filters as f}
            <button type="button" aria-pressed={filter === f.id} on:click={() => (filter = f.id)}>{f.label}</button>
          {/each}
          <span class="plate-count mono" aria-live="polite">{hits} / {featured.length} parts</span>
        </div>
      {/if}
    </div>

    <div class="plate">
      {#each featured as p, i (p.slug)}
        {@const hit = filter === 'all' || p.disciplines.includes(filter)}
        <a
          class="part"
          class:big={i === 0}
          class:wide-m={wideOnPhone(i, featured.length)}
          class:is-powder={!hit}
          href={`/projects/${p.slug}`}
          style={cells[i] ? `--gc:${cells[i][0]};--gr:${cells[i][1]}` : ''}
        >
          <div class="img">
            <img src={p.cardImage} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
          </div>
          <div class="lbl">
            <strong>{p.title}</strong>
            {#if meta(p)}<span class="mono">{meta(p)}</span>{/if}
            {#if i === 0 && p.subtitle}<p>{firstSentence(p.subtitle)}</p>{/if}
          </div>
          {#if !hit}<span class="visually-hidden">(filtered out)</span>{/if}
        </a>
      {/each}
    </div>
    <p class="all-link"><a href="/projects">All projects</a></p>
  </section>

  {#if others.length}
    <section class="wrap section" data-build="Other work" aria-labelledby="h-index">
      <div class="section-head"><h2 id="h-index">Other work</h2></div>
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
      <p class="all-link"><a href="/projects">All {data.total} projects</a></p>
    </section>
  {/if}

  <section class="wrap section" id="experience" data-build="Experience" aria-labelledby="h-exp">
    <div class="section-head"><h2 id="h-exp">Experience</h2></div>
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
    <p class="all-link"><a href="/resume">Full resume</a></p>
  </section>

  <section class="wrap section" id="contact" data-build="Contact" aria-labelledby="h-contact">
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
  .hero { padding-top: var(--s7); padding-bottom: var(--s8); }
  .hero-bottom { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s5) var(--s6); margin-top: var(--s7); align-items: start; }
  .role { grid-column: 1 / span 6; font-size: var(--t-lg); line-height: 1.45; max-width: 34ch; }
  .role small { display: block; font-size: var(--t-sm); color: var(--ink-2); margin-top: var(--s2); }
  .now { grid-column: 8 / span 5; font-size: var(--t-md); max-width: 44ch; }
  .now b { font-weight: 700; }
  .links { list-style: none; padding: 0; margin: var(--s4) 0 0; display: flex; flex-wrap: wrap; gap: var(--s2) var(--s5); font-size: var(--t-sm); }
  @media (max-width: 860px) {
    .role, .now { grid-column: 1 / -1; }
    .hero { padding-top: var(--s5); padding-bottom: var(--s7); }
    .hero-bottom { margin-top: var(--s5); }
  }

  .all-link { margin-top: var(--s4); font-size: var(--t-sm); }

  .contact-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s5) var(--s6); align-items: end; }
  .email-col { grid-column: 1 / span 8; min-width: 0; }
  .contact-links { grid-column: 9 / span 4; list-style: none; margin: 0; padding: 0; font-size: var(--t-md); }
  .contact-links li { padding: var(--s1) 0; }
  @media (max-width: 760px) { .email-col, .contact-links { grid-column: 1 / -1; } }
</style>
