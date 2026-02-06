<script>
  import { onMount } from 'svelte';

  export let slug = '';
  export let size = 140;
  export let axisCount = 6;
  export let compact = false;
  export let label = 'Semantic Radar';
  export let showLabels = null;

  let axes = [];
  let loading = true;

  const padding = 12;
  const labelPadding = 18;

  onMount(async () => {
    try {
      const response = await fetch('/generated/project_vectors_2d.json');
      if (!response.ok) return;
      const data = await response.json();
      const project = data.projects?.find((p) => p.slug === slug);
      if (project?.semanticAxes?.length) {
        axes = project.semanticAxes.slice(0, axisCount);
      }
    } catch (e) {
      // Silent fail if data is missing
    } finally {
      loading = false;
    }
  });

  $: values = axes.map((f) => Math.max(0, Math.min(1, f.value)));
  $: labels = axes.map((f) => f.label || '');
  $: showAxisLabels = showLabels === null ? !compact : showLabels;
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

{#if !loading && values.length > 0}
  <div class="vector-star" class:compact={compact} class:labeled={showAxisLabels} style={`--size:${size}px`}>
    {#if label && !compact}
      <span class="vector-label">{label}</span>
    {/if}
    <svg
      class="vector-svg"
      viewBox={`${showAxisLabels ? -labelPadding : 0} ${showAxisLabels ? -labelPadding : 0} ${size + (showAxisLabels ? labelPadding * 2 : 0)} ${size + (showAxisLabels ? labelPadding * 2 : 0)}`}
      role="img"
      aria-label="Project semantic radar"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size / 2) - padding}
        class="vector-ring"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size / 2) - padding - (compact ? 4 : 10)}
        class="vector-ring inner"
      />
      <polygon points={points} class="vector-shape" />
      {#if showAxisLabels}
        {#each labels as axisLabel, i}
          {#if axisLabel}
            {@const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2}
            {@const labelRadius = (size / 2) + 8}
            {@const lx = (size / 2) + Math.cos(angle) * labelRadius}
            {@const ly = (size / 2) + Math.sin(angle) * labelRadius}
            <text
              x={lx}
              y={ly}
              class="vector-axis-label"
              text-anchor={Math.cos(angle) > 0.2 ? 'start' : Math.cos(angle) < -0.2 ? 'end' : 'middle'}
              dominant-baseline={Math.sin(angle) > 0.2 ? 'hanging' : Math.sin(angle) < -0.2 ? 'auto' : 'middle'}
            >
              {axisLabel}
            </text>
          {/if}
        {/each}
      {/if}
    </svg>
  </div>
{/if}

<style>
  .vector-star {
    display: inline-flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
  }

  .vector-star.compact {
    gap: 0;
  }

  .vector-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(244, 239, 214, 0.65);
  }

  .vector-svg {
    width: var(--size);
    height: var(--size);
    overflow: visible;
  }

  .vector-star.compact .vector-svg {
    background: radial-gradient(circle at 50% 0%, rgba(123, 220, 255, 0.12), transparent 60%);
    border-radius: 50%;
  }

  .vector-star.labeled .vector-svg {
    background: none;
  }

  .vector-ring {
    fill: rgba(8, 12, 18, 0.5);
    stroke: rgba(123, 220, 255, 0.2);
    stroke-width: 1;
  }

  .vector-ring.inner {
    fill: none;
    stroke: rgba(123, 220, 255, 0.1);
    stroke-dasharray: 2 2;
  }

  .vector-shape {
    fill: rgba(123, 220, 255, 0.25);
    stroke: rgba(123, 220, 255, 0.9);
    stroke-width: 1.5;
  }

  .vector-star.compact .vector-shape {
    stroke-width: 1;
  }

  .vector-axis-label {
    font-size: 9px;
    fill: rgba(244, 239, 214, 0.85);
    letter-spacing: 0.06em;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .vector-axis-label {
      font-size: 8px;
    }
  }
</style>
