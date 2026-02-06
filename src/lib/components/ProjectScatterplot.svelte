<script>
  import { onMount } from 'svelte';
  
  let projects = [];
  let loading = true;
  let error = null;
  let hoveredProject = null;
  let containerEl;
  let tooltipX = 0;
  let tooltipY = 0;

  // Canvas dimensions
  const width = 100;
  const height = 100;
  const padding = 8;

  onMount(async () => {
    try {
      const response = await fetch('/generated/project_vectors_2d.json');
      if (!response.ok) {
        throw new Error('Vector data not found');
      }
      const data = await response.json();
      projects = data.projects || [];
    } catch (e) {
      console.warn('Could not load project vectors:', e.message);
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function handleMouseEnter(project, event) {
    hoveredProject = project;
    updateTooltipPosition(event);
  }

  function handleMouseMove(event) {
    if (hoveredProject) {
      updateTooltipPosition(event);
    }
  }

  function handleMouseLeave() {
    hoveredProject = null;
  }

  function updateTooltipPosition(event) {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    tooltipX = event.clientX - rect.left;
    tooltipY = event.clientY - rect.top;
  }

  // Scale coordinates to SVG viewBox
  function scaleX(x) {
    return padding + x * (width - 2 * padding);
  }
  
  function scaleY(y) {
    return padding + (1 - y) * (height - 2 * padding); // Flip Y for visual
  }
</script>

{#if !loading && projects.length > 0}
  <div class="scatterplot-container" bind:this={containerEl}>
    <h3 class="scatter-title">Project Space</h3>
    <p class="scatter-subtitle">Projects mapped by semantic similarity</p>
    
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="scatter-wrapper" on:mousemove={handleMouseMove}>
      <svg viewBox="0 0 {width} {height}" class="scatter-svg" role="img" aria-label="Project similarity scatterplot">
        <!-- Grid lines -->
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Connection lines for hovered project -->
        {#if hoveredProject}
          {#each projects as project}
            {#if project.slug !== hoveredProject.slug}
              <line
                x1={scaleX(hoveredProject.x)}
                y1={scaleY(hoveredProject.y)}
                x2={scaleX(project.x)}
                y2={scaleY(project.y)}
                stroke="rgba(123, 220, 255, 0.1)"
                stroke-width="0.3"
              />
            {/if}
          {/each}
        {/if}
        
        <!-- Project dots -->
        {#each projects as project}
          <a href="/projects/{project.slug}" class="scatter-link">
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <circle
              cx={scaleX(project.x)}
              cy={scaleY(project.y)}
              r={hoveredProject?.slug === project.slug ? 3.5 : 2.5}
              class="scatter-dot"
              class:hovered={hoveredProject?.slug === project.slug}
              on:mouseenter={(e) => handleMouseEnter(project, e)}
              on:mouseleave={handleMouseLeave}
              role="button"
              tabindex="0"
              aria-label={project.title}
            />
          </a>
        {/each}
      </svg>

      <!-- Tooltip -->
      {#if hoveredProject}
        <div 
          class="scatter-tooltip"
          style="left: {tooltipX + 12}px; top: {tooltipY - 10}px;"
        >
          <div class="tooltip-image">
            <img src={hoveredProject.heroImage} alt={hoveredProject.title} />
          </div>
          <div class="tooltip-content">
            <span class="tooltip-title">{hoveredProject.title}</span>
            {#if hoveredProject.tags?.length}
              <div class="tooltip-tags">
                {#each hoveredProject.tags.slice(0, 2) as tag}
                  <span class="tooltip-tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div class="scatter-legend">
      <span class="legend-item">
        <span class="legend-dot"></span>
        {projects.length} projects
      </span>
      <span class="legend-hint">Click to explore →</span>
    </div>
  </div>
{/if}

<style>
  .scatterplot-container {
    position: relative;
    padding: 1.25rem;
    border-radius: 1rem;
    background: linear-gradient(
      135deg,
      rgba(15, 20, 30, 0.8) 0%,
      rgba(10, 15, 25, 0.9) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .scatter-title {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.85);
    margin: 0 0 0.25rem 0;
  }

  .scatter-subtitle {
    font-size: 0.78rem;
    color: rgba(244, 239, 214, 0.5);
    margin: 0 0 1rem 0;
  }

  .scatter-wrapper {
    position: relative;
    aspect-ratio: 1;
    max-width: 320px;
    margin: 0 auto;
  }

  .scatter-svg {
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
    background: rgba(5, 8, 15, 0.6);
  }

  .scatter-dot {
    fill: rgba(123, 220, 255, 0.7);
    stroke: rgba(123, 220, 255, 0.3);
    stroke-width: 0.5;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .scatter-dot:hover,
  .scatter-dot.hovered {
    fill: rgba(123, 220, 255, 1);
    stroke: rgba(255, 255, 255, 0.5);
    stroke-width: 1;
  }

  .scatter-link {
    text-decoration: none;
  }

  .scatter-tooltip {
    position: absolute;
    display: flex;
    gap: 0.6rem;
    padding: 0.6rem;
    background: rgba(20, 25, 35, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.5rem;
    pointer-events: none;
    z-index: 10;
    max-width: 220px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .tooltip-image {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 0.35rem;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
  }

  .tooltip-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .tooltip-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(244, 239, 214, 0.95);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tooltip-tags {
    display: flex;
    gap: 0.25rem;
  }

  .tooltip-tag {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    background: rgba(123, 220, 255, 0.15);
    color: rgba(123, 220, 255, 0.9);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .scatter-legend {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    font-size: 0.72rem;
    color: rgba(244, 239, 214, 0.5);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(123, 220, 255, 0.7);
  }

  .legend-hint {
    opacity: 0.7;
  }
</style>
