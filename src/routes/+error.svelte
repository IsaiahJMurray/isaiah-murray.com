<script>
  import { page } from '$app/stores';

  $: status = $page.status;
  $: notFound = status === 404;
  $: layer = String(status).padStart(4, '0');
  $: message = $page.error?.message || 'Something went wrong.';
</script>

<svelte:head>
  <title>{notFound ? 'Not found' : `Error ${status}`} · Isaiah Murray</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="main">
  <section class="wrap err" data-build={notFound ? 'Not found' : 'Error'} aria-labelledby="h1-err">
    {#if notFound}
      <h1 id="h1-err">Build failed at layer <span class="mono">{layer}</span></h1>
      <p class="lede">That page isn't on the build plate.</p>
    {:else}
      <h1 id="h1-err">Error <span class="mono">{status}</span></h1>
      <p class="lede">{message}</p>
    {/if}

    <dl class="readout mono">
      <dt>status</dt><dd>{status}</dd>
      <dt>path</dt><dd>{$page.url.pathname}</dd>
      {#if notFound}<dt>message</dt><dd>{message}</dd>{/if}
    </dl>

    <ul class="links">
      <li><a href="/">Home</a></li>
      <li><a href="/projects">All projects</a></li>
    </ul>
  </section>
</main>

<style>
  .err { padding-top: var(--s8); padding-bottom: var(--s9); }
  h1 { font-size: clamp(33px, 6vw, 64px); font-weight: 900; letter-spacing: -0.02em; line-height: 1.05; max-width: 16ch; }
  h1 .mono { font-weight: 500; letter-spacing: 0; }
  .lede { margin-top: var(--s4); font-size: var(--t-lg); max-width: 46ch; }
  .readout {
    display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--s1) var(--s5);
    margin: var(--s6) 0 0; padding: var(--s3) 0; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
    font-size: var(--t-sm); max-width: 640px;
  }
  .readout dt { color: var(--ink-2); }
  .readout dd { margin: 0; overflow-wrap: anywhere; }
  .links { list-style: none; margin: var(--s6) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s2) var(--s6); }
  @media (max-width: 600px) { .err { padding-top: var(--s6); padding-bottom: var(--s8); } }
</style>
