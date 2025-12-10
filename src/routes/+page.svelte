<script>
  import ResponsiveHeroFlame from "$lib/hero/ResponsiveHeroFlame.svelte";
  import WhatIDo from "$lib/sections/WhatIDo.svelte";
  import ProjectsGrid from "$lib/sections/ProjectsGrid.svelte";
  import ExperienceStrip from "$lib/sections/ExperienceStrip.svelte";
</script>

<svelte:head>
  <title>Isaiah Murray</title>
  <meta
    name="description"
    content="Isaiah Murray – Electrical and Computer Engineering student at Olin College of Engineering."
  />
</svelte:head>

<div class="page">
  <ResponsiveHeroFlame scrollTarget="#overview" />

  <main class="content">
    <WhatIDo />
    <ProjectsGrid />
    <ExperienceStrip />
  </main>
</div>
<style>
  /* Global page look */
  :global(body) {
    margin: 0;
    background: #050608;
    color: #fdf6d6;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
      sans-serif;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: black;
  }

  .content {
    flex: 1;
    padding: 3.5rem 6vw 4.5rem 6vw;
    max-width: 1120px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  /* Shared section styles */
  :global(.section) {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  :global(.section-heading) {
    font-size: clamp(1.3rem, 2vw, 1.6rem);
    font-weight: 650;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.86);
  }

  :global(.section-subtitle) {
    max-width: 40rem;
    font-size: 0.98rem;
    color: rgba(244, 239, 214, 0.7);
  }

  /* Shared tag chip styling (for skills / tech labels) */
  :global(.tag) {
    display: inline-flex;
    align-items: center;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(120, 135, 160, 0.6);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(211, 219, 240, 0.92);
    background: radial-gradient(
      circle at 0% 0%,
      rgba(33, 181, 255, 0.12),
      rgba(7, 10, 16, 0.95)
    );
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .content {
      padding: 0px;
      gap: 3rem;
      margin: 1em;
      width: auto;
      padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px));
    }
  }
</style>
