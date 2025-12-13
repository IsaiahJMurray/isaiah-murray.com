<svelte:head>
  <title>Resume · Isaiah Murray</title>
  <meta
    name="description"
    content="Resume for Isaiah Murray — Electrical & Computer Engineering student at Olin College of Engineering."
  />
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
      </p>
    </div>

    <div class="actions">
      <!-- Optional: put your PDF in /static/resume.pdf and update href -->
      <a class="btn" href="src/lib/Isaiah Murray - 2025 Resume - 1025.pdf" target="_blank" rel="noreferrer">
        View PDF
      </a>
      <button class="btn ghost" type="button" on:click={() => printPdf("src/lib/Isaiah Murray - 2025 Resume - 1025.pdf")}>
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
            <h3>CHERISH HEALTH — Engineering Team</h3>
            <div class="right">
              <span class="date">2024–2025</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>Returned full-time during gap year prior to college.</li>
            <li>Calibrated phased radar arrays; reduced side lobe interference by 20% (TX) and 30% (RX).</li>
            <li>Sped up state annotation; built internal interface for storing/comparing radar characterization data.</li>
            <li>Organized contractors for MFP; CAM’ed and manufactured injection-molded and machined components.</li>
            <li>Tools: GCloud, Gitlab, SolidWorks, KeyShot.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>Access Sport America — Coach</h3>
            <div class="right">
              <span class="date">2024–2025</span>
              <span class="loc">Dorchester, MA</span>
            </div>
          </div>
          <ul>
            <li>Coach through two summers across Malibu and Scituate locations.</li>
            <li>Provided accessible watersports (paddleboarding, windsurfing, outrigger canoeing) to disabled individuals.</li>
            <li>Collaborated with Flutey, Options, and Kids are People; focus on individuals with nonverbal autism.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>MIT Chem-E (Strano Research Group) — Laboratory Assistant</h3>
            <div class="right">
              <span class="date">2023</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>MIT HIP-SAT program: refined power output of thermal resonators.</li>
            <li>Tested and developed phase change materials (PCMs).</li>
            <li>Presented final HIP-SAT Symposium talk and a poster at the Boston Mammalian Synthetic Biology Symposium.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>Mathnasium — Mathematics Tutor</h3>
            <div class="right">
              <span class="date">2022–2024</span>
              <span class="loc">Cohasset, MA</span>
            </div>
          </div>
          <ul>
            <li>Tutored students from 3rd grade through 10th grade; employed starting at age 14.</li>
            <li>Worked with owner to build life skills beyond tutoring.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>CHERISH HEALTH — Summer Machine Learning Intern</h3>
            <div class="right">
              <span class="date">2022</span>
              <span class="loc">Cambridge, MA</span>
            </div>
          </div>
          <ul>
            <li>Supported CEO/CTO with user demos during successful Series A round.</li>
            <li>Supported ML data collection and network training; developed skills in product demos, CAD, Python, TensorFlow.</li>
          </ul>
        </section>

        <section class="item">
          <div class="itemTop">
            <h3>Center for Student Coastal Research — Student Researcher</h3>
            <div class="right">
              <span class="date">2016–2022</span>
              <span class="loc">Cohasset, MA</span>
            </div>
          </div>
          <ul>
            <li>Shellfish survey, water quality, drifter teams; received Marjot grant to study Zostera marina.</li>
            <li>Analyzed recovery conditions for Labyrinthula zosterae; built and tested an automated artificial environment.</li>
          </ul>
        </section>
      </div>
    </article>

    <aside class="side">
      <article class="card">
        <div class="cardHeader">
          <h2>Skills</h2>
        </div>

        <div class="kv">
          <div class="k">CAD Software</div>
          <div class="v">
            Fusion 360, SolidWorks, Onshape, KiCad, Altium Designer, Prusa Slicer, Mastercam, KeyShot, Blender
          </div>

          <div class="k">Programming</div>
          <div class="v">
            C, C++, C#, Java, JavaScript, Swift, Python, Rust, MATLAB, Wolfram, LaTeX
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
                <span class="date">2025–present</span>
                <span class="loc">Needham, MA</span>
              </div>
            </div>
            <p class="p">
              Pursuing ECE through project-based classes (DESNAT, QEA1, MODSIM). Baja off-road racing team
              electronics division: ride height sensor for suspension tuning; CAN-based data collection and diagnostic
              sensor canopy. Rugby and MMA through Babson; involved with Babson Mazda Miata racing team.
            </p>
          </section>

          <section class="item tight">
            <div class="itemTop">
              <h3>NuVu Innovation School</h3>
              <div class="right">
                <span class="date">2020–2024</span>
                <span class="loc">Cambridge, MA</span>
              </div>
            </div>
            <p class="p">
              Project-based studios and seminars. Johns Hopkins CTY courses (Bio, Chem, AP Chem, Essay Writing).
              AoPS math (Intermediate Algebra, Precalculus, AP Calculus). Additional coursework: Multivariable Calc,
              Differential Equations, Linear Algebra, PSYC-21, CS-50, CSCI-E80 (Harvard Extension).
            </p>
          </section>
        </div>
      </article>

      <article class="card">
        <div class="cardHeader">
          <h2>Community</h2>
        </div>
        <p class="p">
          Member of Cohasset Middle School and High School Robotics teams, Cohasset Maritime Institute Rowing,
          Cohasset Sailing Club, CSCR, Hingham Sailing Club, and volunteering activities through the Cohasset UU
          Youth Program. Participate in service trips to Appalachia through ASP.
        </p>
      </article>

      <article class="card">
        <div class="cardHeader">
          <h2>Personal</h2>
        </div>
        <p class="p">
          Enjoy software development and industrial design. Studied classical guitar (ages 4–15). Play squash and
          rugby; enjoy tennis, pickleball, and golf. Proficient across C# / C++ / C, JavaScript, LaTeX, Python, Rust,
          Ruby, MATLAB, Java, Swift, Wolfram, NRF embedded firmware, and Intel Quartus Prime FPGA software;
          familiar with RISC-V and ARM chip architecture.
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

  /* Print */
  @media print {
    .resume {
      padding: 0;
      color: #111;
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
