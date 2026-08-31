<section id="overview" class="section">
  <h2 class="section-heading">What I Do</h2>
  <p class="section-subtitle">
    I design and build tightly integrated hardware&nbsp;+ software systems:
    embedded controllers, telemetry, and the tools that connect them to people.
  </p>

  <div class="what-grid">
    <article class="what-card">
      <h3>Embedded Systems</h3>
      <p>
        STM32-based boards, real-time firmware, CAN networks, SD card logging,
        LoRa links, and sensor integration for robotics and vehicles.
      </p>
      <div class="tags">
        <span class="tag">STM32</span>
        <span class="tag">CAN</span>
        <span class="tag">SDIO</span>
        <span class="tag">LoRa</span>
      </div>
    </article>

    <article class="what-card">
      <h3>Hardware Design</h3>
      <p>
        Mixed-signal PCBs, power distribution, modular edge-connected boards,
        and validation on real hardware like the Olin Baja car.
      </p>
      <div class="tags">
        <span class="tag">KiCad</span>
        <span class="tag">Power</span>
        <span class="tag">Signal Integrity</span>
      </div>
    </article>

    <article class="what-card">
      <h3>Software &amp; Tooling</h3>
      <p>
        Python tooling, SwiftUI apps, Firebase backends, and ML-assisted
        pipelines that analyze data and automate engineering workflows.
      </p>
      <div class="tags">
        <span class="tag">Python</span>
        <span class="tag">SwiftUI</span>
        <span class="tag">LLM</span>
        <span class="tag">Data</span>
      </div>
    </article>
  </div>
</section>

<style>
  .what-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .what-card {
    padding: 1.2rem 1.3rem;
    border-left: 2px solid rgba(120, 135, 160, 0.55);
    background: rgba(255, 255, 255, 0.02);
  }

  .what-card h3 {
    margin: 0 0 0.35rem 0;
    font-size: 1.02rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .what-card p {
    margin: 0 0 0.75rem 0;
    font-size: 0.92rem;
    line-height: 1.4;
    color: rgba(244, 239, 214, 0.8);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
