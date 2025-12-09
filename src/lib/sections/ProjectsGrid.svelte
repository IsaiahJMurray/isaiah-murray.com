<section id="projects" class="section">
  <h2 class="section-heading">Featured Projects</h2>
  <p class="section-subtitle">
    A sample of the systems I&apos;ve built recently. Most of these combine
    embedded hardware, firmware, and higher-level software.
  </p>

  <div class="projects-grid">
    <article class="project-card">
      <div class="project-header">
        <span class="tag">Telemetry · Power</span>
      </div>
      <h3>Network Supervisor Board (NSB)</h3>
      <p>
        Modular STM32H7 board for the Olin Baja car, handling CAN telemetry,
        LoRa uplink, SD card logging, and power distribution under race
        conditions.
      </p>
      <ul>
        <li>Redesigned CAN architecture and node layout.</li>
        <li>Integrated engine, CVT, and ride-height sensors.</li>
      </ul>
    </article>

    <article class="project-card">
      <div class="project-header">
        <span class="tag">iOS · LoRa</span>
      </div>
      <h3>Porter – Location-Based Game</h3>
      <p>
        A SwiftUI iOS app backed by LoRa radios and a cloud backend, creating a
        multiplayer game that ties physical location to in-game state.
      </p>
      <ul>
        <li>Designed radio protocol and message schema.</li>
        <li>Built Firebase-based backend and real-time updates.</li>
      </ul>
    </article>

    <article class="project-card">
      <div class="project-header">
        <span class="tag">BLE · Wearable</span>
      </div>
      <h3>CLASP – Social Interaction Bracelet</h3>
      <p>
        nRF52832-based bracelet that logs and visualizes social interactions
        using BLE, haptics, and a companion app.
      </p>
      <ul>
        <li>PCB design and firmware bring-up.</li>
        <li>Low-power event logging and sync.</li>
      </ul>
    </article>

    <article class="project-card">
      <div class="project-header">
        <span class="tag">LLM · Automation</span>
      </div>
      <h3>Curator – GitHub Portfolio Generator</h3>
      <p>
        Python toolchain that crawls GitHub repositories, summarizes them with
        LLMs, and emits structured project pages for portfolios like this one.
      </p>
      <ul>
        <li>Modular CLI for repo ingestion and summarization.</li>
        <li>Outputs markdown/HTML ready for static sites.</li>
      </ul>
    </article>
  </div>
</section>

<style>
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.6rem;
  }

  .project-card {
    border-radius: 1.1rem;
    padding: 1.25rem 1.35rem 1.3rem;
    border: 1px solid rgba(120, 135, 160, 0.55);
    background: radial-gradient(
        circle at 0% 0%,
        rgba(33, 181, 255, 0.1),
        transparent 55%
      ),
      radial-gradient(
        circle at 100% 100%,
        rgba(255, 120, 0, 0.12),
        rgba(5, 7, 11, 0.96) 55%
      );
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.72);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .project-header {
    display: flex;
    justify-content: flex-start;
  }

  .project-card h3 {
    margin: 0;
    font-size: 1.02rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .project-card p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: rgba(244, 239, 214, 0.83);
  }

  .project-card ul {
    margin: 0.15rem 0 0 1.1rem;
    padding: 0;
    font-size: 0.86rem;
    color: rgba(244, 239, 214, 0.78);
  }

  .project-card li + li {
    margin-top: 0.2rem;
  }
</style>
