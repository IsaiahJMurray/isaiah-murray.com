<svelte:head>
  <title>Resume · Isaiah Murray</title>
  <meta
    name="description"
    content="Resume for Isaiah Murray — Electrical & Computer Engineering student at Olin College of Engineering."
  />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Resume · Isaiah Murray" />
  <meta property="og:description" content="Resume for Isaiah Murray — Electrical & Computer Engineering student at Olin College of Engineering." />
  <meta property="og:url" content="https://isaiah-murray.com/resume" />
  <meta property="og:image" content="https://isaiah-murray.com/faceshot.jpg" />
  <meta property="og:site_name" content="Isaiah Murray" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Resume · Isaiah Murray" />
  <meta name="twitter:description" content="Resume for Isaiah Murray — Electrical & Computer Engineering student at Olin College of Engineering." />
  <meta name="twitter:image" content="https://isaiah-murray.com/faceshot.jpg" />
</svelte:head>

<script>
  import { onDestroy } from 'svelte';

  const PDF = '/Isaiah_Murray_Resume.pdf';

  // Print the PDF from a hidden iframe (falls back to opening it in a new tab).
  let printFrame = null;

  function ensurePrintFrame() {
    if (printFrame) return printFrame;
    printFrame = document.createElement('iframe');
    Object.assign(printFrame.style, {
      position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden'
    });
    printFrame.title = 'Resume PDF (for printing)';
    document.body.appendChild(printFrame);
    return printFrame;
  }

  function printPdf(url) {
    if (typeof window === 'undefined') return;
    const iframe = ensurePrintFrame();
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          window.open(url, '_blank', 'noreferrer');
        }
      }, 50);
    };
    iframe.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
  }

  onDestroy(() => {
    if (printFrame && printFrame.parentNode) printFrame.parentNode.removeChild(printFrame);
    printFrame = null;
  });

  // slug: a matching doc in src/lib/docs/projects, or null
  const projects = [
    { name: 'Autonomous Swarm', slug: 'autonomous-swarm', status: 'in progress',
      what: 'Multi-vehicle autonomy stack (Isaac Sim, Pegasus, PX4 SITL, MAVSDK-Python); four-vehicle concurrent autonomous flight in sim, hardware build underway on an STM32H743 FC.' },
    { name: 'Olin Baja Racing', slug: 'canopy', status: null,
      what: 'Ride-height suspension sensor for damper tuning, CAN-based data acquisition & diagnostic canopy.' },
    { name: 'CLASP', slug: 'clasp', status: null,
      what: 'BLE proximity-logging wearable on Nordic nRF52: custom PCB across multiple revisions, low-power RF design.' },
    { name: 'Bragi', slug: 'bragi', status: null,
      what: 'Real-time Quest 3 XR perception pipeline: YOLOv5 detection driving contextual overlays, Google Cloud STT/TTS.' },
    { name: 'Binaric', slug: 'binaric', status: null,
      what: 'Acoustic data transmission protocol: layered modulation, Manchester-clocked multi-tone encoding, adaptive error correction.' }
  ];
</script>

<main id="main" class="resume">
  <header class="wrap head" data-build="Resume">
    <h1>Resume</h1>
    <p class="who">Isaiah Murray · Sophomore, Class of 2029 · U.S. Citizen · Embedded systems, instrumentation, and perception for physical hardware</p>
    <div class="actions">
      <a class="pdf" href={PDF} target="_blank" rel="noreferrer" data-sveltekit-reload>Resume (PDF)</a>
      <button class="print" type="button" on:click={() => printPdf(PDF)}>Print</button>
    </div>
    <ul class="contact mono">
      <li><a href="tel:+17815583863">(781) 558-3863</a></li>
      <li><a href="mailto:isaiah.j.murray@gmail.com">isaiah.j.murray@gmail.com</a></li>
      <li><a href="https://linkedin.com/in/isa-murray" target="_blank" rel="noreferrer">linkedin.com/in/isa-murray</a></li>
      <li><a href="https://isaiah-murray.com">isaiah-murray.com</a></li>
      <li><a href="https://github.com/IsaiahJMurray" target="_blank" rel="noreferrer">github.com/IsaiahJMurray</a></li>
    </ul>
  </header>

  <section class="wrap section" data-build="Experience" aria-labelledby="h-exp">
    <div class="section-head"><h2 id="h-exp">Experience</h2></div>
    <ol class="log">
      <li>
        <div class="when mono"><span>2026.03–2026.08</span><span>Somerville, MA</span></div>
        <div class="what">
          <h3>Formlabs</h3>
          <p class="title">Electrical Engineering Intern, SLS &amp; Materials R&amp;D</p>
          <ul>
            <li>Built end-to-end powder-bed defect detection pipeline — GPU-accelerated classical CV region proposal feeding a ResNet-18 classifier over a nine-class taxonomy — replacing a binary detector with classified, severity-ranked results; surfaced order-of-magnitude defect-rate differences between machines running identical material.</li>
            <li>Designed fleet-wide heater fault detection from first-principles physics after establishing no labeled fault data existed; root-caused a 9% false-positive rate to PWM phase jitter between hardware channels and restructured the check to 0% on healthy fleet data — caught a wiring fault on a unit 12h from shipping to a beta customer.</li>
            <li>Replaced a manual filter-swap characterization procedure with a controlled-evaporation sweep producing a continuous pressure–flow surface in one run; built the resulting virtual flow sensor and validated it closed-loop against an independent sensor outside the control loop.</li>
            <li>Built in-situ dielectric cure monitoring rig (PyQt6, VISA impedance analyzer, SSH-triggered exposure); identified cross-machine timing as the data-quality limit and added a dedicated fire-time recorder, enabling ~40 Hz transient capture across 300+ runs. Correlated ionic viscosity with FTIR, enabling FTIR emulation at ~300 Hz.</li>
            <li>Built browser-native lifetime test runner (acoustic cycle detection, crash-safe resumable state, automatic Word/PDF report generation) and ran five qualification campaigns — longest logged 515 insertion cycles.</li>
          </ul>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2024–2025</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>Cherish Health</h3>
          <p class="title">Engineering Team</p>
          <ul>
            <li>Automated phased-array radar calibration; replaced manual gain/phase tuning with an FPGA-controlled workflow using spectrum analysis and algorithmic optimization, cutting calibration from hours to minutes and reducing side lobe interference 20% (TX) / 30% (RX).</li>
            <li>Built internal tooling for storing and comparing radar characterization data; accelerated state annotation throughput.</li>
            <li>Sourced alternative LED supplier and coordinated contractors for molded fiber packaging, reducing BOM cost by 5%.</li>
            <li>CAM'ed and manufactured injection-molded and machined components.</li>
          </ul>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2023.05–2023.08</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>MIT Chem-E — Strano Group</h3>
          <p class="title">Laboratory Assistant</p>
          <ul>
            <li>Selected for MIT's HIP-SAT summer research program (Strano Lab); investigated graphene nanostructure additives in octadecane-based phase change materials to improve thermal conductivity and raise thermal resonator output voltage.</li>
            <li>Presented findings at HIP-SAT Symposium and Boston Mammalian Synthetic Biology Symposium.</li>
          </ul>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2022–2023</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>Cherish Health</h3>
          <p class="title">ML Intern</p>
          <ul>
            <li>Trained detection models and built data collection tooling in Python/TensorFlow.</li>
            <li>Ran technical demos for CEO and CTO supporting a successful Series A round.</li>
          </ul>
        </div>
      </li>
    </ol>

    <h3 class="subhead" id="h-add">Additional experience</h3>
    <ol class="log" aria-labelledby="h-add">
      <li>
        <div class="when mono"><span>2024–2025</span><span>Dorchester, MA</span></div>
        <div class="what">
          <h3>Access Sport America</h3>
          <p class="title">Coach</p>
          <p class="brief">Adaptive watersports programming for athletes with disabilities; specialized in nonverbal autism support.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2016–2022</span><span>Cohasset, MA</span></div>
        <div class="what">
          <h3>Center for Student Coastal Research</h3>
          <p class="title">Student Researcher</p>
          <p class="brief">Won Marjot grant to study <i>Zostera marina</i>; built automated environment chamber testing recovery in <i>Labyrinthula zosterae</i>-infected specimens.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="wrap section" data-build="Projects" aria-labelledby="h-proj">
    <div class="section-head"><h2 id="h-proj">Projects</h2></div>
    <div class="tbl-wrap">
      <table class="ptbl">
        <thead><tr><th scope="col">Project</th><th scope="col">What it is</th></tr></thead>
        <tbody>
          {#each projects as p}
            <tr>
              <th scope="row">
                {#if p.slug}<a href={`/projects/${p.slug}`}>{p.name}</a>{:else}{p.name}{/if}
                {#if p.status}<span class="st mono">{p.status}</span>{/if}
              </th>
              <td>{p.what}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="wrap section" data-build="Education" aria-labelledby="h-edu">
    <div class="section-head"><h2 id="h-edu">Education</h2></div>
    <ol class="log">
      <li>
        <div class="when mono"><span>2025–2029</span><span>Needham, MA</span></div>
        <div class="what">
          <h3>Franklin W. Olin College of Engineering</h3>
          <p class="title">B.S. Engineering, Electrical &amp; Computer Engineering concentration · Expected May 2029 · GPA <span class="mono">3.75</span></p>
          <p class="brief">Built a facial recognition program, compared epidemiology models, and applied biomimicry to weight-efficient jumping mechanisms through project-based coursework.</p>
        </div>
      </li>
      <li>
        <div class="when mono"><span>2020–2024</span><span>Cambridge, MA</span></div>
        <div class="what">
          <h3>NuVu Innovation School</h3>
          <p class="title">8th–12th grades</p>
          <p class="brief">Project-based studios; Harvard Extension coursework in multivariable calculus, differential equations, linear algebra, CS50.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="wrap section" data-build="Skills" aria-labelledby="h-skills">
    <div class="section-head"><h2 id="h-skills">Skills</h2></div>
    <dl class="skills spec">
      <dt>Languages</dt>
      <dd class="mono">Python, C, C++, MATLAB, SQL, JavaScript</dd>
      <dt>ML / CV</dt>
      <dd class="mono">PyTorch, OpenCV, Kornia, scikit-learn, NumPy, Pandas, SciPy, TensorFlow</dd>
      <dt>Hardware &amp; Instrumentation</dt>
      <dd class="mono">KiCad, Altium, PyVISA, USB DAQ, thermal imaging, nRF52, STM32, CAN, PX4/MAVLink</dd>
      <dt>Tools &amp; Infrastructure</dt>
      <dd class="mono">BigQuery, Grafana, FastAPI, SQLite, Git, SolidWorks, Fusion 360, Blender, INAV, Docker, Linux</dd>
    </dl>
  </section>

  <section class="wrap section" data-build="Interests" aria-labelledby="h-int">
    <div class="section-head"><h2 id="h-int">Interests</h2></div>
    <ul class="interests">
      <li>Rugby and MMA (Babson)</li>
      <li>Babson Mazda Miata racing team</li>
      <li>Classical guitar</li>
      <li>Delta Tau Delta Alumni Chair</li>
    </ul>
  </section>
</main>

<style>
  .head { padding-top: var(--s7); padding-bottom: var(--s7); }
  h1 { font-size: clamp(41px, 7vw, 72px); font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
  .who { margin-top: var(--s4); font-size: var(--t-lg); line-height: 1.45; max-width: 52ch; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s3); margin-top: var(--s5); }
  .pdf, .print {
    display: inline-flex; align-items: center; min-height: 40px; padding: var(--s2) var(--s4);
    font-size: var(--t-sm); text-decoration: none; border: 1px solid var(--ink);
  }
  .pdf { background: var(--ink); color: var(--powder); font-weight: 700; }
  .pdf:hover { background: var(--part); border-color: var(--part); }
  .print { background: transparent; }
  .print:hover { border-color: var(--part); color: var(--ink-2); }
  .contact {
    list-style: none; margin: var(--s5) 0 0; padding: 0;
    display: flex; flex-wrap: wrap; gap: var(--s2) var(--s5); font-size: var(--t-sm); color: var(--ink-2);
  }
  .contact li { min-width: 0; overflow-wrap: anywhere; }

  .subhead { font-size: var(--t-lg); margin: var(--s7) 0 var(--s5); color: var(--ink-2); font-weight: 700; }

  .ptbl { font-size: var(--t-md); }
  .ptbl tbody th { width: 30%; }
  .ptbl td { color: var(--ink-2); font-size: var(--t-sm); line-height: 1.55; }
  .st { display: block; font-weight: 400; font-size: var(--t-xs); color: var(--ink-2); margin-top: var(--s1); }
  @media (max-width: 600px) {
    .ptbl thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .ptbl tr { display: block; padding: var(--s3) 0; border-bottom: 1px solid var(--rule); }
    .ptbl th, .ptbl td { display: block; border: 0; padding: 0; width: auto; }
    .ptbl tbody th { width: auto; }
    .ptbl td { margin-top: var(--s1); }
  }

  .spec { margin-top: 0; }
  .spec dt, .spec dd { padding-bottom: var(--s3); border-bottom: 1px solid var(--rule); }
  .spec dd { font-size: var(--t-sm); line-height: 1.6; }
  @media (max-width: 760px) {
    .spec dt { border-bottom: 0; padding-bottom: 0; }
    .spec dd { margin-bottom: var(--s2); }
  }

  .interests { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s2) var(--s6); }

  @media print {
    .actions, .print { display: none; }
  }
</style>
