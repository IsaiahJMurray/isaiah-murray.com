<!-- src/lib/hero/ResponsiveHeroFlame.svelte -->
<script>
  import HeroFlameMobile from "./HeroFlameMobile.svelte";

  export let scrollTarget = "#overview";

  // HeroFlame.svelte (a separate desktop-specific variant) exists but is
  // currently unused — HeroFlameMobile is rendered on all viewport sizes.
  // This used to branch on a mobile/desktop media query, but both branches
  // rendered the same component; since the media-query state starts false
  // and flips async in onMount, that caused an unnecessary destroy+recreate
  // of this component on every load, which could crash if a resize event
  // fired mid-teardown (bind:this nulls `canvas` before listeners are
  // unregistered).
</script>

<HeroFlameMobile {scrollTarget} />
