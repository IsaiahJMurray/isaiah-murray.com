<!--
  Site header: name (home link), nav Work · Resume · Contact, theme toggle.
  The toggle's label is the theme you'd switch TO. Current section gets aria-current="page".
-->
<script>
  import { page } from '$app/stores';
  import { theme, toggleTheme } from './theme.js';

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
    <button class="theme-btn" type="button" on:click={toggleTheme} aria-label={`Switch to ${$theme === 'dark' ? 'light' : 'dark'} theme`}>
      {$theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  </div>
</header>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--s3) var(--s4);
    padding-top: var(--s5);
    padding-bottom: var(--s5);
  }
  .who { font-weight: 700; text-decoration: none; font-size: var(--t-sm); }
  .bar-right { display: flex; align-items: center; gap: var(--s5); }
  ul { display: flex; gap: var(--s5); list-style: none; margin: 0; padding: 0; font-size: var(--t-sm); }
  nav a { text-decoration: none; color: var(--ink-2); padding: var(--s1) 0; }
  nav a:hover { color: var(--ink); }
  nav a[aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-color: var(--ink);
    text-underline-offset: 5px;
  }
  .theme-btn {
    background: none;
    border: 1px solid var(--rule);
    padding: var(--s1) var(--s3);
    font-size: var(--t-xs);
    color: var(--ink-2);
    min-height: 32px;
    min-width: 56px;
  }
  .theme-btn:hover { color: var(--ink); border-color: var(--part); }
  @media (max-width: 480px) {
    .bar { padding-top: var(--s4); padding-bottom: var(--s4); }
    .bar-right, ul { gap: var(--s4); }
  }
</style>
