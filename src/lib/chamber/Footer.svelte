<!--
  Site footer: plain text links, email as selectable text, a mono build-date line.
  __BUILD_DATE__ is injected by vite.config.js (define) at build time.
-->
<script>
  /* global __BUILD_DATE__ */
  const built = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';
  const links = [
    { href: 'https://github.com/IsaiahJMurray', label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/isa-murray/', label: 'LinkedIn' },
    { href: 'https://www.instagram.com/isaiah.murray1/', label: 'Instagram' },
    { href: 'https://cambridge.nuvustudio.com/users/isa-murray', label: 'NuVu profile' }
  ];
</script>

<footer class="wrap foot">
  <div class="row">
    <span class="email">isaiah.j.murray@gmail.com</span>
    <ul>
      {#each links as l}
        <li><a href={l.href} rel="me noopener">{l.label}</a></li>
      {/each}
    </ul>
  </div>
  <div class="row meta">
    <span>Isaiah Murray, Needham / Boston, MA</span>
    <span class="mono">{built ? `Build ${built.replaceAll('-', '.')} · ` : ''}110 µm layers</span>
  </div>
</footer>

<style>
  .foot {
    border-top: 1px solid var(--rule);
    padding-top: var(--s5);
    padding-bottom: calc(var(--s6) + env(safe-area-inset-bottom, 0px));
    font-size: var(--t-sm);
  }
  .row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: var(--s2) var(--s5); }
  .email { user-select: all; overflow-wrap: anywhere; }
  ul { display: flex; flex-wrap: wrap; gap: var(--s2) var(--s5); list-style: none; margin: 0; padding: 0; }
  .meta { margin-top: var(--s4); font-size: var(--t-xs); color: var(--ink-2); }
</style>
