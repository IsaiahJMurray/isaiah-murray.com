<script>
  export let data;
  const { metadata, component: Doc, slug, heroImage } = data;

  const maturityLabels = {
    production: 'Production',
    polished: 'Polished',
    prototype: 'Prototype',
    wip: 'In Progress',
    archived: 'Archived'
  };

  const displayDate = metadata.updated || metadata.date || null;
  const accent = metadata.accent || '#7bdcff';
</script>
<div class = "nav spacer"></div>
<article class="project-page" style={`--accent:${accent}`}>
  <a href="/projects" class="back-link">← Back to projects</a>

  <header class="project-hero">
    <div class="hero-media">
      <img src={heroImage} alt={metadata.title} class="hero-image" />
    </div>

    <div class="hero-text">
      <h1 class="project-title">{metadata.title}</h1>

      {#if metadata.subtitle}
        <p class="project-subtitle">{metadata.subtitle}</p>
      {/if}

      <div class="hero-meta-row">
        {#if metadata.maturity}
          <span class={`maturity-pill maturity-${metadata.maturity}`}>
            {maturityLabels[metadata.maturity] ?? metadata.maturity}
          </span>
        {/if}

        {#if displayDate}
          <span class="meta-pill">
            Updated {new Date(displayDate).toLocaleDateString()}
          </span>
        {/if}
      </div>

      {#if metadata.tags && metadata.tags.length}
        <div class="hero-tags">
          {#each metadata.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
  </header>

  <section class="project-body">
    <div class="doc-body">
      <Doc />
    </div>
  </section>
</article>

<style>
  .nav.spacer {
    height: 3.25em;
  }
  .project-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin: 2em;
  }

  :global(.project-body) {
    display: flex;
    justify-content: space-evenly;
  }

  .back-link {
    font-size: 0.84rem;
    text-decoration: none;
    color: rgba(244, 239, 214, 0.75);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    width: fit-content;
    padding: 0.2rem 0;
    border-bottom: 1px solid transparent;
  }

  .back-link:hover {
    color: var(--accent);
    border-bottom-color: color-mix(in srgb, var(--accent) 60%, transparent);
  }

  .project-hero {
    display: grid;
    grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
    gap: 1.6rem;
    align-items: center;
  }

  .hero-media {
    border-radius: 1.2rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: radial-gradient(circle at 50% 0%, #171924, #050609);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  }

  .hero-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 4 / 3;
    transform: scale(1.02);
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .project-title {
    margin: 0;
    font-size: clamp(1.8rem, 2.7vw, 2.2rem);
    letter-spacing: 0.04em;
  }

  .project-subtitle {
    margin: 0;
    font-size: 0.98rem;
    color: rgba(244, 239, 214, 0.78);
  }

  .hero-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .maturity-pill {
    font-size: 0.7rem;
    padding: 0.22rem 0.7rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    border: 1px solid rgba(244, 239, 214, 0.24);
    white-space: nowrap;
  }

  .maturity-production {
    border-color: color-mix(in srgb, var(--accent) 70%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 65%, transparent),
      rgba(255, 211, 176, 0.6),
      rgba(158, 255, 212, 0.55)
    );
    color: #050608;
  }

  .maturity-polished {
    border-color: color-mix(in srgb, var(--accent) 60%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 55%, transparent),
      rgba(255, 216, 188, 0.5)
    );
    color: #050608;
  }

  .maturity-prototype,
  .maturity-wip {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: rgba(12, 16, 24, 0.95);
    color: rgba(244, 239, 214, 0.95);
  }

  .maturity-archived {
    border-color: rgba(180, 180, 180, 0.4);
    background: rgba(10, 12, 16, 0.98);
    color: rgba(199, 199, 199, 0.8);
  }

  .meta-pill {
    font-size: 0.78rem;
    padding: 0.18rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(244, 239, 214, 0.22);
    color: rgba(244, 239, 214, 0.8);
  }

  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.2rem;
  }

  .tag {
    font-size: 0.78rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: rgba(18, 21, 29, 0.96);
    border: 1px solid rgba(244, 239, 214, 0.18);
    color: rgba(244, 239, 214, 0.86);
  }

  .project-body {
    margin-top: 0.5rem;
  }

  .doc-body {
    max-width: 780px;
  }

  /* basic markdown styling */
  .doc-body :global(h2) {
    margin-top: 1.8rem;
    margin-bottom: 0.6rem;
    font-size: 1.2rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.9);
  }

  .doc-body :global(h3) {
    margin-top: 1.2rem;
    margin-bottom: 0.4rem;
    font-size: 1.02rem;
  }

  .doc-body :global(p) {
    margin: 0.5rem 0;
    line-height: 1.6;
    font-size: 0.96rem;
    color: rgba(244, 239, 214, 0.88);
  }

  .doc-body :global(ul),
  .doc-body :global(ol) {
    margin: 0.4rem 0 0.8rem 1.2rem;
  }

  .doc-body :global(li) {
    margin: 0.2rem 0;
  }

  .doc-body :global(code) {
    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular,
      Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.85rem;
    background: rgba(15, 18, 24, 0.95);
    padding: 0.08rem 0.25rem;
    border-radius: 0.25rem;
  }

  .doc-body :global(pre) {
    margin: 0.9rem 0;
    padding: 0.9rem 1rem;
    border-radius: 0.7rem;
    background: rgba(8, 10, 16, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.06);
    overflow-x: auto;
  }

  .doc-body :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .doc-body :global(a) {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  }

  .doc-body :global(a:hover) {
    border-bottom-color: var(--accent);
  }

  @media (max-width: 860px) {
    .project-hero {
      grid-template-columns: minmax(0, 1fr);
    }

    .hero-media {
      max-width: 420px;
    }
  }
</style>
