<!--
  Site footer: plain text links, email as selectable text, a mono last-updated line and, faintly,
  the unique-visitor count (src/routes/api/visitors; hidden until a count comes back).
  __BUILD_DATE__ is injected by vite.config.js (define) at build time.
-->
<script>
  /* global __BUILD_DATE__ */
  import { onMount } from 'svelte';

  const built = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';
  const links = [
    { href: 'https://github.com/IsaiahJMurray', label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/isa-murray/', label: 'LinkedIn' },
    { href: 'https://www.instagram.com/isaiah.murray1/', label: 'Instagram' },
    { href: 'https://cambridge.nuvustudio.com/users/isa-murray', label: 'NuVu profile' }
  ];

  let visitors = null;

  // A random id per browser, kept in localStorage. Null when storage is blocked: the count is
  // then only read, not added to.
  function visitorId() {
    try {
      let id = localStorage.getItem('visitor-id');
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID()
          : [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('visitor-id', id);
      }
      return id;
    } catch (e) {
      return null;
    }
  }

  // The footer lives in the layout, so this runs once per full page load, not per navigation.
  onMount(async () => {
    const id = visitorId();
    try {
      const res = await fetch('/api/visitors', id
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }
        : undefined);
      const { count } = await res.json();
      if (typeof count === 'number' && count > 0) visitors = count;
    } catch (e) { /* no count: the line stays hidden */ }
  });
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
    <span class="mono">
      {#if visitors}<span class="count">{visitors.toLocaleString('en-US')} {visitors === 1 ? 'visitor' : 'visitors'} · </span>{/if}{built ? `Updated ${built.replaceAll('-', '.')}` : ''}
    </span>
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
  .count { opacity: 0.6; }
</style>
