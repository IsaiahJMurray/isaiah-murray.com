<script>
  import { onMount } from 'svelte';

  export let currentSlug = '';

  let similarProjects = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch('/generated/project_similarities.json');
      if (!response.ok) {
        throw new Error('Similarities data not found');
      }
      const data = await response.json();
      
      if (data.similarities && data.similarities[currentSlug]) {
        // Get top 2 similar projects
        const similar = data.similarities[currentSlug].slice(0, 2);
        
        // Fetch vector data to get project metadata
        const vectorsResponse = await fetch('/generated/project_vectors_2d.json');
        if (vectorsResponse.ok) {
          const vectorsData = await vectorsResponse.json();
          const projectMap = new Map(
            vectorsData.projects.map(p => [p.slug, p])
          );
          
          similarProjects = similar.map(s => ({
            ...s,
            ...projectMap.get(s.slug)
          })).filter(p => p.title);
        }
      }
    } catch (e) {
      console.warn('Could not load similar projects:', e.message);
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if !loading && similarProjects.length > 0}
  <section class="similar-projects">
    <h2 class="similar-heading">Similar Projects</h2>
    <div class="similar-grid">
      {#each similarProjects as project}
        <a href="/projects/{project.slug}" class="similar-card">
          <div class="similar-image">
            <img 
              src={project.heroImage} 
              alt={project.title}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="similar-info">
            <h3 class="similar-title">{project.title}</h3>
            {#if project.tags && project.tags.length}
              <div class="similar-tags">
                {#each project.tags.slice(0, 3) as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
            <span class="similarity-score">
              {Math.round(project.score * 100)}% match
            </span>
          </div>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .similar-projects {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .similar-heading {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.85);
    margin-bottom: 1.25rem;
  }

  .similar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .similar-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgba(15, 18, 25, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .similar-card:hover {
    background: rgba(25, 30, 40, 0.8);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  .similar-image {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
  }

  .similar-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .similar-info {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .similar-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(244, 239, 214, 0.95);
    margin: 0;
    line-height: 1.3;
  }

  .similar-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .similar-tags .tag {
    font-size: 0.65rem;
    padding: 0.12rem 0.4rem;
  }

  .similarity-score {
    font-size: 0.75rem;
    color: rgba(123, 220, 255, 0.8);
    margin-top: auto;
  }

  @media (max-width: 640px) {
    .similar-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
