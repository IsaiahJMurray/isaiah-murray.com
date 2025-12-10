<script>
  export let children;
  export let metadata;
</script>

<article class="doc-layout">
  {#if metadata?.title}
    <h1>{metadata.title}</h1>
  {/if}

  <slot />
</article>

<style>
  .doc-layout {
    padding: 2rem 6vw;
    max-width: 900px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: 1.2rem;
  }
</style>
