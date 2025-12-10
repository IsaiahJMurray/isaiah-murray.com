<script>
  export let data;
  const { metadata, component: Doc } = data;
</script>

<article class="project-doc section">
  <a class="back-link" href="/projects">← Back to projects</a>

  <header class="project-doc-header">
    <h1>{metadata.title ?? 'Untitled project'}</h1>
    {#if metadata.summary}
      <p class="summary">{metadata.summary}</p>
    {/if}

    <div class="meta-row">
      {#if metadata.date}
        <span class="meta-pill">
          {new Date(metadata.date).toLocaleDateString()}
        </span>
      {/if}
      {#if metadata.tags}
        <div class="tags">
          {#each metadata.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
  </header>

  <div class="doc-body">
    <Doc />
  </div>
</article>

<style>
  article {
    padding: 2rem;
  }
  .back-link {
    font-size: 0.85rem;
    text-decoration: none;
    color: rgba(244, 239, 214, 0.7);
    margin-bottom: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .back-link:hover {
    color: #73d3ff;
  }

  .project-doc-header h1 {
    margin: 0 0 0.4rem 0;
    font-size: clamp(1.5rem, 3vw, 2rem);
  }

  .summary {
    margin: 0 0 0.75rem 0;
    color: rgba(244, 239, 214, 0.78);
    font-size: 0.98rem;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .meta-pill {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(244, 239, 214, 0.25);
    color: rgba(244, 239, 214, 0.8);
  }

  .doc-body :global(h2) {
    margin-top: 1.8rem;
    margin-bottom: 0.6rem;
    font-size: 1.15rem;
  }

  .doc-body :global(p) {
    line-height: 1.6;
    margin: 0.4rem 0;
  }

  .doc-body :global(code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.85rem;
  }

  .doc-body :global(pre) {
    background: rgba(5, 6, 10, 0.95);
    border-radius: 0.6rem;
    padding: 0.8rem 0.9rem;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>
