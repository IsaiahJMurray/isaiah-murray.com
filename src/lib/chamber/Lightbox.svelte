<!--
  Accessible image viewer (modal dialog). The one place a shadow is allowed.

  Usage
    <script>
      import Lightbox from '$lib/chamber/Lightbox.svelte';
      let lb;
      const images = [{ src, alt, caption }, …];
    </script>
    <button type="button" on:click={() => lb.open(images, 2)}>…</button>
    <Lightbox bind:this={lb} />

  API
    lb.open(items, index = 0, opener = document.activeElement)
        items: [{ src, alt, caption? }]; focus returns to `opener` on close.
    lb.close()
    on:close event (detail: { index }) fires after closing.
  Keys: Esc closes, ←/→ step through items (wrapping), Tab is trapped inside the dialog.
  The dialog is portalled to <body>, locks page scroll while open, and respects reduced motion.
-->
<script>
  import { createEventDispatcher, onDestroy, tick } from 'svelte';

  const dispatch = createEventDispatcher();

  let items = [];
  let index = 0;
  let isOpen = false;
  let shown = false;
  let opener = null;
  let dialog;
  let closeBtn;
  let prevOverflow = '';

  $: item = items[index] || null;
  $: many = items.length > 1;

  export async function open(list, i = 0, from = null) {
    if (!list || !list.length) return;
    items = list;
    index = ((i % list.length) + list.length) % list.length;
    opener = from || (typeof document !== 'undefined' ? document.activeElement : null);
    if (!isOpen) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    isOpen = true;
    await tick();
    closeBtn?.focus();
    requestAnimationFrame(() => { shown = true; });
  }

  export function close() {
    if (!isOpen) return;
    isOpen = false;
    shown = false;
    document.body.style.overflow = prevOverflow;
    const back = opener;
    opener = null;
    if (back && typeof back.focus === 'function' && back.isConnected) back.focus();
    dispatch('close', { index });
  }

  function step(d) {
    if (!items.length) return;
    index = (index + d + items.length) % items.length;
  }

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' && many) { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' && many) { e.preventDefault(); step(-1); }
    else if (e.key === 'Tab') {
      const f = [...dialog.querySelectorAll('button:not([disabled])')];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  // click on the backdrop (not on the image, caption or buttons) closes
  function backdrop(node) {
    const h = (e) => { if (e.target === node || e.target.classList?.contains('lb-stage')) close(); };
    node.addEventListener('click', h);
    return { destroy: () => node.removeEventListener('click', h) };
  }

  function portal(node) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }

  onDestroy(() => {
    if (isOpen && typeof document !== 'undefined') document.body.style.overflow = prevOverflow;
  });
</script>

<svelte:window on:keydown={onKey} />

{#if isOpen && item}
  <div
    class="lb"
    class:open={shown}
    role="dialog"
    aria-modal="true"
    aria-label="Image viewer"
    bind:this={dialog}
    use:portal
    use:backdrop
  >
    <div class="lb-bar">
      <span class="mono" aria-live="polite">{index + 1} / {items.length}</span>
      <button class="lb-btn" type="button" bind:this={closeBtn} on:click={close}>Close</button>
    </div>
    <figure class="lb-stage">
      <img src={item.src} alt={item.alt || ''} decoding="async" />
      {#if item.caption}<figcaption>{item.caption}</figcaption>{/if}
    </figure>
    {#if many}
      <div class="lb-nav">
        <button class="lb-btn" type="button" on:click={() => step(-1)}>Previous</button>
        <button class="lb-btn" type="button" on:click={() => step(1)}>Next</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .lb {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--powder);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding: calc(env(safe-area-inset-top, 0px) + 12px) var(--gutter) calc(env(safe-area-inset-bottom, 0px) + 16px);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .lb.open { opacity: 1; }
  .lb-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--s4); padding-bottom: var(--s3); }
  .lb-bar .mono { font-size: var(--t-xs); color: var(--ink-2); }
  .lb-btn { background: transparent; border: 1px solid var(--rule); min-height: 40px; padding: var(--s2) var(--s4); font-size: var(--t-sm); }
  .lb-btn:hover { border-color: var(--part); }
  figure { margin: 0; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto; justify-items: center; align-items: center; }
  img { max-width: 100%; max-height: 100%; height: auto; object-fit: contain; min-height: 0; box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25); }
  figcaption { font-size: var(--t-sm); color: var(--ink); padding-top: var(--s3); max-width: 66ch; text-align: center; }
  .lb-nav { display: flex; justify-content: center; gap: var(--s3); padding-top: var(--s3); }
</style>
