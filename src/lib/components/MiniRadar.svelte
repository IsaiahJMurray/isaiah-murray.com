<script>
  import { onMount } from 'svelte';

  export let slug = '';
  export let size = 32;

  let axes = [];
  let loading = true;

  const padding = 3;

  onMount(async () => {
    try {
      const response = await fetch('/generated/project_vectors_2d.json');
      if (!response.ok) return;
      const data = await response.json();
      const project = data.projects?.find((p) => p.slug === slug);
      if (project?.semanticAxes?.length) {
        axes = project.semanticAxes.slice(0, 6);
      }
    } catch (e) {
      // Silent fail
    } finally {
      loading = false;
    }
  });

  $: values = axes.map((f) => Math.max(0.1, Math.min(1, f.value)));
  $: points = values.length
    ? values
        .map((value, i) => {
          const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
          const radius = ((size / 2) - padding) * value;
          const cx = size / 2;
          const cy = size / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ')
    : '';
</script>

{#if !loading}
  <svg
    class="mini-radar"
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    role="img"
    aria-label="Project radar"
  >
    <circle
      cx={size / 2}
      cy={size / 2}
      r={(size / 2) - padding}
      class="radar-ring"
    />
    {#if points}
      <polygon points={points} class="radar-shape" />
    {:else}
      <circle
        cx={size / 2}
        cy={size / 2}
        r="2"
        class="radar-dot"
      />
    {/if}
  </svg>
{/if}

<style>
  .mini-radar {
    display: block;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
  }

  .radar-ring {
    fill: rgba(8, 10, 16, 0.7);
    stroke: rgba(123, 220, 255, 0.25);
    stroke-width: 1;
  }

  .radar-shape {
    fill: rgba(123, 220, 255, 0.35);
    stroke: rgba(123, 220, 255, 0.9);
    stroke-width: 1;
  }

  .radar-dot {
    fill: rgba(123, 220, 255, 0.9);
  }
</style>
