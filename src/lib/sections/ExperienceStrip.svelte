<section id="experience" class="section">
  <h2 class="section-heading">Experience</h2>
  <p class="section-subtitle">
    I&apos;m currently focused on embedded systems, telemetry, and tools that
    connect hardware to useful data.
  </p>

  <div class="exp-list">
    <article class="exp-item">
      <h3>Olin Baja SAE – Electrical &amp; Telemetry</h3>
      <p>
        Designing the next-generation electrical system for Olin&apos;s Baja car:
        CAN networks, STM32-based NSB, LoRa uplink, and robust power
        distribution.
      </p>
    </article>

    <article class="exp-item">
      <h3>Independent Hardware &amp; Tooling Projects</h3>
      <p>
        Prototyping embedded boards, wearables, and ML-assisted developer tools
        including Curator, a GitHub-to-portfolio generator.
      </p>
    </article>

    <article class="exp-item">
      <h3>Course &amp; Studio Work at Olin</h3>
      <p>
        Project-heavy courses in embedded systems, modeling &amp; simulation,
        and human-centered design, emphasizing building and testing real
        systems.
      </p>
    </article>
  </div>
</section>

<style>
  .exp-list {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 1.4rem 1.5rem;
  }

  .exp-item {
    border-radius: 1rem;
    padding: 1.1rem 1.2rem;
    border: 1px solid rgba(120, 135, 160, 0.55);
    background: linear-gradient(
      135deg,
      rgba(12, 18, 28, 0.96),
      rgba(8, 10, 18, 0.98)
    );
  }

  .exp-item h3 {
    margin: 0 0 0.3rem 0;
    font-size: 0.98rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .exp-item p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: rgba(244, 239, 214, 0.8);
  }

  @media (max-width: 768px) {
    .exp-list {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  body{
    background-color: black;
  }
</style>
