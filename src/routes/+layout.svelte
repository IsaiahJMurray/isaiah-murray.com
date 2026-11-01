<!--
  Site shell: the circuit board background, then header, page and footer.
  Pages render their own <main id="main">; the board keeps clear of its content
  (see src/lib/circuit/CircuitBackground.svelte).
-->
<script>
  import '$lib/styles/chamber.css';
  import Header from '$lib/chamber/Header.svelte';
  import Footer from '$lib/chamber/Footer.svelte';
  import CircuitBackground from '$lib/circuit/CircuitBackground.svelte';
  import { page } from '$app/stores';
  import { inject } from '@vercel/analytics';

  inject(); // Start Vercel Analytics

  // Skip link: jump to the page's <main>, whatever its id.
  function skip(e) {
    const main = document.querySelector('main');
    if (!main) return;
    e.preventDefault();
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus();
    main.scrollIntoView();
  }
</script>

<svelte:head>
  <title>Isaiah Murray</title>
  <!-- One URL per page for crawlers: no query strings, always the production host. -->
  <link rel="canonical" href={`https://isaiah-murray.com${$page.url.pathname}`} />

  <!-- Default Open Graph (overridden by individual pages) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Isaiah Murray" />
  <meta property="og:title" content="Isaiah Murray" />
  <meta property="og:description" content="Electrical and Computer Engineering student at Olin College of Engineering." />
  <meta property="og:url" content="https://isaiah-murray.com" />

  <!-- Default Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Isaiah Murray" />
  <meta name="twitter:description" content="Electrical and Computer Engineering student at Olin College of Engineering." />
</svelte:head>

<a class="skip" href="#main" on:click={skip}>Skip to content</a>

<CircuitBackground />

<div class="shell">
  <Header />
  <div class="page">
    <slot />
  </div>
  <Footer />
</div>

<style>
  .shell { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
  .page { flex: 1; min-width: 0; }
  .skip {
    position: absolute;
    left: var(--gutter);
    top: -100px;
    z-index: 60;
    background: var(--ink);
    color: var(--bg);
    padding: var(--s2) var(--s4);
    font-size: var(--t-sm);
    text-decoration: none;
  }
  .skip:focus { top: var(--s2); }
</style>
