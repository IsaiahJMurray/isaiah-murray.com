<!--
  Email address as selectable text + a Copy button.
    <CopyEmail />                                   default address, large display size
    <CopyEmail email="x@y.z" size="sm" />           size: 'lg' (default) | 'sm'
  Clipboard API when available; otherwise (or on failure) the address text is selected so
  the visitor can press Cmd/Ctrl+C. The result is announced politely to screen readers.
-->
<script>
  import { onDestroy } from 'svelte';

  export let email = 'isaiah.j.murray@gmail.com';
  export let size = 'lg';

  let textEl;
  let label = 'Copy';
  let status = '';
  let timer;

  function done(l, s) {
    label = l;
    status = s;
    clearTimeout(timer);
    timer = setTimeout(() => { label = 'Copy'; status = ''; }, 1600);
  }
  function selectText() {
    const r = document.createRange();
    r.selectNodeContents(textEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    done('Selected', 'Email address selected. Press Control or Command C to copy.');
  }
  function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      navigator.clipboard.writeText(email).then(() => done('Copied', 'Email address copied.'), selectText);
    } catch (e) {
      selectText();
    }
  }
  onDestroy(() => clearTimeout(timer));
</script>

<div class="email-row" class:sm={size === 'sm'}>
  <span class="email" bind:this={textEl}>{email}</span>
  <button class="copy-btn" type="button" on:click={copy}>{label}</button>
  <span class="visually-hidden" aria-live="polite">{status}</span>
</div>

<style>
  .email-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s3) var(--s4); min-width: 0; }
  .email {
    font-size: clamp(20px, 3.2vw, var(--t-3xl));
    font-weight: 700;
    letter-spacing: -0.01em;
    user-select: all;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .sm .email { font-size: var(--t-lg); }
  .copy-btn {
    background: var(--ink);
    color: var(--powder);
    border: 0;
    padding: var(--s2) var(--s4);
    font-size: var(--t-sm);
    min-height: 40px;
    min-width: 96px;
  }
  .copy-btn:hover { background: var(--part); }
</style>
