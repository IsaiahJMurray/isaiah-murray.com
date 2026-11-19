<!--
  Site header: name (home link), nav Work · Resume · Contact, and the board switch (dark solder
  mask by default, light as the visitor's choice; see theme.js). The current section gets
  aria-current="page". Both switch labels are in the markup and CSS shows the right one, so the
  server-rendered header is correct before hydration.
-->
<script>
  import { page } from '$app/stores';
  import { theme } from './theme.js';

  const nav = [
    { href: '/projects', label: 'Work' },
    { href: '/resume', label: 'Resume' },
    { href: '/contact', label: 'Contact' }
  ];

  $: path = $page.url.pathname;
  const isCurrent = (href, p) => p === href || p.startsWith(href + '/');
</script>

<header class="wrap bar">
  <a class="who" href="/" aria-current={path === '/' ? 'page' : undefined}>Isaiah Murray</a>
  <div class="bar-right">
    <nav aria-label="Main">
      <ul>
        {#each nav as item}
          <li>
            <a href={item.href} aria-current={isCurrent(item.href, path) ? 'page' : undefined}>{item.label}</a>
          </li>
        {/each}
      </ul>
    </nav>
    <button type="button" class="mask" on:click={theme.toggle}>
      <span class="swatch" aria-hidden="true"></span>
      <span class="to-light">Light<span class="visually-hidden"> board</span></span>
      <span class="to-dark">Dark<span class="visually-hidden"> board</span></span>
    </button>
  </div>
</header>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--s2) var(--s4);
    padding-top: var(--s4);
    padding-bottom: var(--s4);
  }
  .who { font-weight: 900; text-decoration: none; font-size: var(--t-md); letter-spacing: -0.01em; padding: var(--s2) 0; }
  .bar-right { display: flex; align-items: center; gap: var(--s5); }
  ul { display: flex; gap: var(--s5); list-style: none; margin: 0; padding: 0; font-size: var(--t-sm); }
  nav a { display: inline-block; text-decoration: none; color: var(--ink-2); padding: var(--s3) 0; }
  nav a:hover { color: var(--ink); }
  nav a[aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-color: var(--signal);
    text-decoration-thickness: 2px;
    text-underline-offset: 6px;
  }
  .mask {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
    min-height: 44px;
    padding: 0;
    background: none;
    border: 0;
    font-family: var(--f-mono);
    font-size: var(--t-xs);
    color: var(--ink-2);
  }
  .mask:hover { color: var(--ink); }
  /* a chip of the board you would switch to */
  .swatch { width: 14px; height: 14px; border: 1px solid var(--ink-2); background: #E3F5F3; }
  .to-dark { display: none; }
  :global(:root[data-theme='light']) .swatch { background: #03312E; }
  :global(:root[data-theme='light']) .to-light { display: none; }
  :global(:root[data-theme='light']) .to-dark { display: inline; }
  @media (max-width: 480px) {
    .bar { flex-wrap: nowrap; }
    .who { font-size: 15px; white-space: nowrap; }
    .bar-right, ul { gap: var(--s3); }
    .mask .to-light, .mask .to-dark { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .mask { min-width: 28px; justify-content: flex-end; }
  }
</style>
