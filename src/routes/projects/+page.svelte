<script>
  export let data;
  const { projects } = data;

  const maturityLabels = {
    production: 'Production',
    polished: 'Polished',
    prototype: 'Prototype',
    wip: 'In Progress',
    archived: 'Archived'
  };
</script>

<section class="section projects-page">
  <header class="section-header">
    <h1 class="section-heading">Projects</h1>
    <p class="section-subtitle">
      A curated selection of systems, tools, and experiments. Click into a project
      for full write-ups and technical details.
    </p>
  </header>

  <div class="projects-grid">
    {#each projects as project}
      <a
        href={`/projects/${project.slug}`}
        class="project-card"
        style={project.accent ? `--accent:${project.accent}` : ''}
      >
        <div class="card-image-wrap">
          <img
            src={project.cardImage}
            alt={project.title}
            loading="lazy"
            class="card-image"
          />
        </div>

        <div class="card-body">
          <div class="card-title-row">
            <h2>{project.title}</h2>
            {#if project.maturity}
              <span class={`maturity-pill maturity-${project.maturity}`}>
                {maturityLabels[project.maturity] ?? project.maturity}
              </span>
            {/if}
          </div>

          {#if project.subtitle}
            <p class="card-subtitle">{project.subtitle}</p>
          {/if}

          {#if project.tags && project.tags.length}
            <div class="card-tags">
              {#each project.tags.slice(0, 4) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if project.tags.length > 4}
                <span class="tag extra">+{project.tags.length - 4}</span>
              {/if}
            </div>
          {/if}

          {#if project.updated || project.date}
            <p class="card-date">
              Updated{' '}
              {new Date(project.updated || project.date).toLocaleDateString()}
            </p>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</section>

<style>
  .projects-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .section-header {
    max-width: 720px;
  }

  .section-heading {
    font-size: clamp(1.6rem, 2.4vw, 1.9rem);
    font-weight: 650;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.9);
    margin: 0 0 0.4rem 0;
  }

  .section-subtitle {
    margin: 0;
    font-size: 0.98rem;
    color: rgba(244, 239, 214, 0.7);
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.4rem;
  }

  .project-card {
    --accent: rgba(117, 189, 255, 0.85);

    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;

    background: radial-gradient(
        circle at 0% 0%,
        rgba(255, 255, 255, 0.02),
        transparent 55%
      ),
      rgba(7, 8, 14, 0.96);
    border-radius: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.035);
    overflow: hidden;
    box-shadow: 0 18px 35px rgba(0, 0, 0, 0.65);

    transition: transform 0.18s ease, box-shadow 0.18s ease,
      border-color 0.18s ease, background 0.18s ease;
  }

  .project-card:hover {
    transform: translateY(-3px) scale(1.01);
    border-color: color-mix(in srgb, var(--accent) 60%, transparent);
    box-shadow: 0 26px 55px rgba(0, 0, 0, 0.8);
    background: radial-gradient(
        circle at 0% 0%,
        color-mix(in srgb, var(--accent) 14%, transparent),
        transparent 60%
      ),
      rgba(7, 8, 14, 0.98);
  }

  .card-image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: radial-gradient(circle at 50% 0%, #161820, #050609);
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.02);
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  .project-card:hover .card-image {
    transform: scale(1.06);
  }

  .card-body {
    padding: 0.9rem 1rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .card-title-row h2 {
    margin: 0;
    font-size: 1.02rem;
    font-weight: 600;
  }

  .maturity-pill {
    font-size: 0.68rem;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(244, 239, 214, 0.22);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
    color: rgba(244, 239, 214, 0.9);
  }

  .maturity-production {
    border-color: color-mix(in srgb, var(--accent) 70%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 60%, transparent),
      rgba(255, 208, 160, 0.55),
      rgba(155, 255, 210, 0.5)
    );
    color: #050608;
  }

  .maturity-polished {
    border-color: color-mix(in srgb, var(--accent) 60%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 50%, transparent),
      rgba(255, 215, 180, 0.45)
    );
    color: #050608;
  }

  .maturity-prototype,
  .maturity-wip {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: rgba(10, 14, 20, 0.9);
    color: rgba(244, 239, 214, 0.9);
  }

  .maturity-archived {
    border-color: rgba(180, 180, 180, 0.35);
    background: rgba(12, 14, 18, 0.95);
    color: rgba(200, 200, 200, 0.75);
  }

  .card-subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(244, 239, 214, 0.8);
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .tag {
    font-size: 0.75rem;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
    background: rgba(22, 24, 32, 0.95);
    border: 1px solid rgba(244, 239, 214, 0.16);
    color: rgba(244, 239, 214, 0.86);
  }

  .tag.extra {
    border-style: dashed;
    opacity: 0.85;
  }

  .card-date {
    margin: 0.1rem 0 0 0;
    font-size: 0.78rem;
    color: rgba(244, 239, 214, 0.6);
  }

  @media (max-width: 768px) {
    .projects-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .card-body {
      padding: 0.75rem 0.9rem 0.85rem 0.9rem;
    }
  }
</style>
