<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { inject } from '@vercel/analytics';

  inject(); // Start Vercel Analytics

  console.log('Layout is being processed');
</script>

<svelte:head>
  <title>Isaiah Murray</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
 
</svelte:head>

<div class="layout-container">
  <div class="header-container">
  <Header /></div>
  
  <main class="content">
    <slot></slot>
  </main>
  
  <Footer buildDate="December 16th, 2025" />
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    height: 100%;
    color: #fdf6d6;
    background-color: black;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
      sans-serif;
  }

  .header-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 0px;
  }

  .layout-container {
    display: flex;
    flex-direction: column;

    min-height: 100vh;
  }

  .content {
    flex: 1; /* Allows content to grow and push the footer to the bottom */
  }
</style>
