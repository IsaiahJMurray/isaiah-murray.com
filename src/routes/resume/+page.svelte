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
  import { onDestroy } from "svelte";

  let printFrame = null;

  function ensurePrintFrame() {
    if (printFrame) return printFrame;

    printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";

    document.body.appendChild(printFrame);
    return printFrame;
  }

  function printPdf(url) {
    if (typeof window === "undefined") return;

    const iframe = ensurePrintFrame();

    iframe.onload = () => {
      // Give the browser a tick to finish rendering PDF
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          // If browser blocks printing from iframe, fall back:
          window.open(url, "_blank", "noreferrer");
        }
      }, 50);
    };

    // Force reload even if same URL was printed before
    iframe.src = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
  }

  onDestroy(() => {
    if (printFrame && printFrame.parentNode) {
      printFrame.parentNode.removeChild(printFrame);
    }
    printFrame = null;
  });
</script>
<main class="resume">
  <header class="top">
    <div class="identity">
      <h1 class="name">Isaiah Murray</h1>
      <p class="meta">
        <a href="tel:+17815583863">(781) 558-3863</a>
        <span class="sep">|</span>
        <a href="mailto:isaiah.j.murray@gmail.com">isaiah.j.murray@gmail.com</a>
        <span class="sep">|</span>
        <a href="https://linkedin.com/in/isa-murray" target="_blank" rel="noreferrer">
          linkedin.com/in/isa-murray
        </a>
        <span class="sep">|</span>
        <a href="https://isaiah-murray.com" target="_blank" rel="noreferrer">
          isaiah-murray.com
        </a>
        <span class="sep">|</span>
        <a href="https://github.com/IsaiahJMurray" target="_blank" rel="noreferrer">
          github.com/IsaiahJMurray
        </a>
      </p>
      <p class="meta subline">
        Sophomore, Class of 2029 · U.S. Citizen · Embedded systems, instrumentation, and perception for physical hardware
      </p>
    </div>

    <div class="actions">
      <a class="btn" href="/Isaiah_Murray_Resume.pdf" target="_blank" rel="noreferrer">
        View PDF
      </a>
      <button class="btn ghost" type="button" on:click={() => printPdf("/Isaiah_Murray_Resume.pdf")}>
        Print
      </button>
    </div>
  </header>

  <section class="grid">
    <article class="card">
      <div class="cardHeader">
        <h2>Experience</h2>
      </div>

      <div class="items">
        <section class="item">
          <div class="itemTop">
            <h3>Formlabs — Electrical Engineering Intern, SLS &amp; Materials R&amp;D</h3>
            <div class="right">
              <span class="date">Mar 2026 – Aug 2026</span>
              <span class="loc">Somerville, MA</span>
            </div>
          </div>
          <ul>
            <li>Built end-to-end powder-bed defect detection pipeline — GPU-accelerated classical CV region proposal feeding a ResNet-18 classifier over a nine-class taxonomy — replacing a binary detector with classified, severity-ranked results; surfaced order-of-magnitude defect-rate differences between machines running identical material.</li>
            <li>Designed fleet-wide heater fault detection from first-principles physics after establishing no labeled fault data existed; root-caused a 9% false-positive rate to PWM phase jitter between hardware channels and restructured the check to 0% on healthy fleet data — caught a wiring fault on a unit 12h from shipping to a beta customer.</li>
            <li>Replaced a manual filter-swap characterization procedure with a controlled-evaporation sweep producing a continuous pressure–flow surface in one run; built the resulting virtual flow sensor and validated it closed-loop against an independent sensor outside the control loop.</li>
            <li>Built in-situ dielectric cure monitoring rig (PyQt6, VISA impedance analyzer, SSH-triggered exposure); identified cross-machine timing as the data-quality limit and added a dedicated fire-time recorder, enabling ~40 Hz transient capture across 300+ runs. Correlated ionic viscosity with FTIR, enabling FTIR emulation at ~300 Hz.</li>
            <li>Built browser-native lifetime test runner (acoustic cycle detection, crash-safe resumable state, automatic Word/PDF report generation) and ran five qualification campaigns — longest logged 515 insertion cycles.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>Cherish Health — Engineering Team</h3>
            <div class="right">
              <span class="date">2024–2025</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>Automated phased-array radar calibration; replaced manual gain/phase tuning with an FPGA-controlled workflow using spectrum analysis and algorithmic optimization, cutting calibration from hours to minutes and reducing side lobe interference 20% (TX) / 30% (RX).</li>
            <li>Built internal tooling for storing and comparing radar characterization data; accelerated state annotation throughput.</li>
            <li>Sourced alternative LED supplier and coordinated contractors for molded fiber packaging, reducing BOM cost by 5%.</li>
            <li>CAM'ed and manufactured injection-molded and machined components.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>MIT Chem-E — Strano Group, Laboratory Assistant</h3>
            <div class="right">
              <span class="date">May 2023 – Aug 2023</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>Selected for MIT's HIP-SAT summer research program (Strano Lab); investigated graphene nanostructure additives in octadecane-based phase change materials to improve thermal conductivity and raise thermal resonator output voltage.</li>
            <li>Presented findings at HIP-SAT Symposium and Boston Mammalian Synthetic Biology Symposium.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>Cherish Health — ML Intern</h3>
            <div class="right">
              <span class="date">2022–2023</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>Trained detection models and built data collection tooling in Python/TensorFlow.</li>
            <li>Ran technical demos for CEO and CTO supporting a successful Series A round.</li>
          </ul>
        </section>
      </div>

      <div class="cardHeader subhead">
        <h2>Additional Experience</h2>
      </div>

      <div class="items">
        <section class="item tight">
          <div class="itemTop">
            <h3>Access Sport America — Coach</h3>
            <div class="right">
              <span class="date">2024–2025</span>
              <span class="loc">Dorchester, MA</span>
            </div>
          </div>
          <p class="p">
            Adaptive watersports programming for athletes with disabilities; specialized in nonverbal autism support.
          </p>
        </section>

        <section class="item tight">
          <div class="itemTop">
            <h3>Center for Student Coastal Research — Student Researcher</h3>
            <div class="right">
              <span class="date">2016–2022</span>
              <span class="loc">Cohasset, MA</span>
            </div>
          </div>
          <p class="p">
            Won Marjot grant to study Zostera marina; built automated environment chamber testing recovery in
            Labyrinthula zosterae-infected specimens.
          </p>
        </section>
      </div>
    </article>

    <aside class="side">
      <article class="card">
        <div class="cardHeader">
          <h2>Projects</h2>
        </div>
        <div class="items">
          <section class="item tight">
            <p class="p">
              <a href="/projects/autonomous-swarm">Autonomous Swarm</a> <em>(in progress)</em> · Multi-vehicle autonomy stack
              (Isaac Sim, Pegasus, PX4 SITL, MAVSDK-Python); four-vehicle concurrent autonomous flight in sim, hardware
              build underway on an STM32H743 FC.
            </p>
            <p class="p">
              <a href="/projects/canopy">Olin Baja Racing</a> — Ride-height suspension sensor for damper tuning, CAN-based
              data acquisition &amp; diagnostic canopy.
            </p>
            <p class="p">
              <a href="/projects/clasp">CLASP</a> — BLE proximity-logging wearable on Nordic nRF52: custom PCB across
              multiple revisions, low-power RF design.
            </p>
            <p class="p">
              <a href="/projects/bragi">Bragi</a> — Real-time Quest 3 XR perception pipeline: YOLOv5 detection driving
              contextual overlays, Google Cloud STT/TTS.
            </p>
            <p class="p">
              <a href="/projects/binaric">Binaric</a> — Acoustic data transmission protocol: layered modulation,
              Manchester-clocked multi-tone encoding, adaptive error correction.
            </p>
          </section>
        </div>
      </article>

      <article class="card">
        <div class="cardHeader">
          <h2>Skills</h2>
        </div>

        <div class="kv">
          <div class="k">Languages</div>
          <div class="v">
            Python, C, C++, MATLAB, SQL, JavaScript
          </div>

          <div class="k">ML / CV</div>
          <div class="v">
            PyTorch, OpenCV, Kornia, scikit-learn, NumPy, Pandas, SciPy, TensorFlow
          </div>

          <div class="k">Hardware &amp; Instrumentation</div>
          <div class="v">
            KiCad, Altium, PyVISA, USB DAQ, thermal imaging, nRF52, STM32, CAN, PX4/MAVLink
          </div>

          <div class="k">Tools &amp; Infrastructure</div>
          <div class="v">
            BigQuery, Grafana, FastAPI, SQLite, Git, SolidWorks, Fusion 360, Blender, INAV, Docker, Linux
          </div>
        </div>
      </article>

      <article class="card">
        <div class="cardHeader">
          <h2>Education</h2>
        </div>

        <div class="items">
          <section class="item tight">
            <div class="itemTop">
              <h3>Franklin W. Olin College of Engineering</h3>
              <div class="right">
                <span class="date">2025–2029</span>
                <span class="loc">Needham, MA</span>
              </div>
            </div>
            <p class="p">
              B.S. Engineering, Electrical &amp; Computer Engineering concentration · Expected May 2029 · GPA 3.75.
              Built a facial recognition program, compared epidemiology models, and applied biomimicry to
              weight-efficient jumping mechanisms through project-based coursework.
            </p>
          </section>

          <section class="item tight">
            <div class="itemTop">
              <h3>NuVu Innovation School — 8th–12th grades</h3>
              <div class="right">
                <span class="date">2020–2024</span>
                <span class="loc">Cambridge, MA</span>
              </div>
            </div>
            <p class="p">
              Project-based studios; Harvard Extension coursework in multivariable calculus, differential equations,
              linear algebra, CS50.
            </p>
          </section>
        </div>
      </article>

      <article class="card">
        <div class="cardHeader">
          <h2>Interests</h2>
        </div>
        <p class="p">
          Rugby and MMA (Babson) · Babson Mazda Miata racing team · Classical guitar · Delta Tau Delta Alumni Chair
        </p>
      </article>
    </aside>
  </section>
</main>

<style>
  /* Page wrapper assumes your global body styles already exist.
     This is self-contained and will look good even without them. */

  .resume {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: 3.5rem 6vw 4.5rem 6vw;
    color: rgba(244, 239, 214, 0.92);
  }

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.25rem;
    margin-bottom: 1.6rem;
  }

  .name {
    margin: 0;
    font-size: clamp(2rem, 3vw, 2.6rem);
    font-weight: 780;
    letter-spacing: 0.04em;
  }

  .meta {
    margin: 0.35rem 0 0 0;
    font-size: 0.92rem;
    color: rgba(244, 239, 214, 0.75);
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.6rem;
    align-items: center;
  }

  .meta a {
    color: rgba(244, 239, 214, 0.86);
    text-decoration: none;
    border-bottom: 1px solid rgba(244, 239, 214, 0.18);
  }

  .meta a:hover {
    color: #5ad1ff;
    border-bottom-color: rgba(90, 209, 255, 0.65);
  }

  .sep {
    opacity: 0.4;
  }

  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn {
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(10, 12, 16, 0.75);
    color: rgba(244, 239, 214, 0.9);
    padding: 0.55rem 0.75rem;
    border-radius: 0.85rem;
    text-decoration: none;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
    cursor: pointer;
  }

  .btn:hover {
    transform: translateY(-1px);
    border-color: rgba(90, 209, 255, 0.35);
    background: rgba(10, 12, 16, 0.9);
  }

  .btn.ghost {
    background: transparent;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.85fr);
    gap: 1.25rem;
    align-items: start;
  }

  .card {
    background: radial-gradient(circle at 0% 0%, rgba(255,255,255,0.03), transparent 55%),
      rgba(7, 8, 14, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 1.15rem;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.72);
    overflow: hidden;
  }

  .cardHeader {
    padding: 0.9rem 1rem 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background: linear-gradient(to bottom, rgba(255,255,255,0.02), transparent);
  }

  .cardHeader h2 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 720;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.86);
  }

  /* mid-card sub-heading (e.g. "Additional Experience" within the Experience card) */
  .cardHeader.subhead {
    padding: 0.6rem 1rem 0.5rem 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    background: none;
  }

  .cardHeader.subhead h2 {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .items {
    padding: 0.35rem 1rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .item {
    padding-top: 0.2rem;
  }

  .item.tight {
    padding-top: 0;
  }

  .itemTop {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: baseline;
    flex-wrap: wrap;
  }

  .itemTop h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .right {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: flex-end;
    text-align: right;
  }

  .date {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.65);
  }

  .loc {
    font-size: 0.78rem;
    color: rgba(244, 239, 214, 0.55);
  }

  ul {
    margin: 0.45rem 0 0 1.1rem;
    padding: 0;
    color: rgba(244, 239, 214, 0.82);
  }

  li {
    margin: 0.2rem 0;
    line-height: 1.55;
    font-size: 0.92rem;
  }

  .kv {
    padding: 0.9rem 1rem 1rem 1rem;
    display: grid;
    grid-template-columns: 10rem 1fr;
    gap: 0.55rem 0.75rem;
  }

  .k {
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.62);
  }

  .v {
    font-size: 0.92rem;
    line-height: 1.55;
    color: rgba(244, 239, 214, 0.86);
  }

  .p {
    padding: 0.85rem 1rem 1rem 1rem;
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.6;
    color: rgba(244, 239, 214, 0.85);
  }

  /* Mobile */
  @media (max-width: 900px) {
    .top {
      flex-direction: column;
      align-items: flex-start;
    }
    .actions {
      justify-content: flex-start;
    }
    .grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .kv {
      grid-template-columns: 1fr;
    }
    .resume {
      padding: 2.5rem 1rem 3rem 1rem;
    }
  }

  /* Print */
  @media print {
    .resume {
      padding: 0;
      color: #111;
      width: 100%;
    }
    .card {
      box-shadow: none;
      background: #fff;
      border: 1px solid #ddd;
    }
    .cardHeader {
      background: transparent;
    }
    .meta a {
      color: #111;
      border-bottom: none;
    }
    .actions {
      display: none;
    }
  }
</style>
