<script>
  export let data;
  const { projects } = data;
</script>

<section class="section">
  <h1 class="section-heading">Projects</h1>
  <p class="section-subtitle">
    Deep dives into the systems I’ve built: design decisions, failures, and what shipped.
  </p>

  <div class="projects-list">
    {#each projects as project}
      <a class="project-row" href={`/projects/${project.slug}`}>
        <div class="project-main">
          <h2>{project.title ?? project.slug}</h2>
          {#if project.summary}
            <p>{project.summary}</p>
          {/if}
          {#if project.tags}
            <div class="tags">
              {#each project.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          {/if}
        </div>
        {#if project.date}
          <span class="project-date">
            {new Date(project.date).toLocaleDateString()}
          </span>
        {/if}
      </a>
    {/each}
  </div>
</section>

<style>
  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .project-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-radius: 0.75rem;
    background: rgba(9, 10, 14, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.03);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.18s ease, transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .project-row:hover {
    border-color: rgba(117, 189, 255, 0.6);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
    transform: translateY(-1px);
  }

  .project-main h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.05rem;
    font-weight: 600;
  }

  .project-main p {
    margin: 0;
    font-size: 0.92rem;
    color: rgba(244, 239, 214, 0.8);
  }

  .tags {
    margin-top: 0.4rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .project-date {
    font-size: 0.78rem;
    color: rgba(244, 239, 214, 0.6);
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .project-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
