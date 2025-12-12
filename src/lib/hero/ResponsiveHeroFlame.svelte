<!-- src/lib/hero/ResponsiveHeroFlame.svelte -->
<script>
  import { onMount } from "svelte";
  import HeroFlame from "./HeroFlame.svelte";
  import HeroFlameMobile from "./HeroFlameMobile.svelte";

  export let scrollTarget = "#overview";

  let isMobile = false;

  onMount(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => {
      isMobile = mq.matches;
    };
    update();
    mq.addEventListener("change", update);

    return () => {
      mq.removeEventListener("change", update);
    };
  });
</script>

{#if isMobile}
  <HeroFlameMobile {scrollTarget} />
{:else}
  <HeroFlameMobile {scrollTarget} />
{/if}
