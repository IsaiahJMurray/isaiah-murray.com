<!--
  Project page (Build Chamber). Any markdown doc from src/lib/docs/projects, laid out like the
  mockup's #swarm view:
    left  sticky "build height" ruler (≥ 900px): the global BuildColumn docked inside it, one mark
          per h2 of the doc, and a Z readout;
    right header (breadcrumb, H1, subtitle, meta, hero) and the doc body.
  The doc is enhanced on mount (see `enhance`): h2s get ids and data-build labels (they are the
  slice boundaries for the column), tables get a scroll wrapper, runs of image-only paragraphs
  become galleries, and every image opens the shared Lightbox with the doc's full image list.
-->
<script>
  import { tick } from 'svelte';
  import { buildInfo, dockBuildColumn, refreshBuildColumn } from '$lib/chamber/build.js';
  import Lightbox from '$lib/chamber/Lightbox.svelte';

  export let data;

  const STATUS = { wip: 'In progress', prototype: 'Prototype', polished: 'Polished', production: 'Production', archived: 'Archived' };
  const siteBase = 'https://isaiah-murray.com';

  $: ({ metadata, component: Doc, slug, heroImage, neighbors: nb } = data);
  $: pageUrl = `${siteBase}/projects/${slug}`;
  $: ogImage = heroImage?.startsWith('http') ? heroImage : `${siteBase}${heroImage}`;
  $: ogTitle = `${metadata.title} · Isaiah Murray`;
  $: ogDescription = metadata.subtitle || metadata.description || `A project by Isaiah Murray.`;
  $: subtitle = String(metadata.subtitle || '').replace(/\s+/g, ' ').trim();
  $: status = STATUS[data.maturity] || null;
  $: tags = data.tags || [];

  /* ---------- ruler: marks from the column's slice map ---------- */
  const MM_PER_PX = 0.02; // page height → build height, so a longer write-up is a taller part
  const GAP = 22;
  let lb;
  let docMM = 0;
  let lastSlices = null;
  $: info = $buildInfo;
  $: if (info.slices !== lastSlices) {
    lastSlices = info.slices;
    if (typeof document !== 'undefined') docMM = document.documentElement.scrollHeight * MM_PER_PX;
  }
  $: marks = info.docked ? info.slices.slice(1).filter((s) => s.el) : [];
  $: ys = place(marks, info);
  $: active = marks.reduce((on, s, i) => (info.progress + 0.002 >= s.a ? i : on), -1);
  $: z = `Z ${(info.built * docMM).toFixed(2).padStart(6, '0')} mm`;

  function place(list, inf) {
    // marks sit at the base of each part; bottom-up keep ≥ GAP apart, and inside the ruler
    const out = list.map((s) => inf.yForP(s.a));
    for (let i = 1; i < out.length; i++) out[i] = Math.min(out[i], out[i - 1] - GAP);
    for (let i = out.length - 1; i >= 0; i--) out[i] = Math.max(out[i], 8 + (out.length - 1 - i) * GAP);
    return out;
  }

  function jump(s) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    s.el.focus({ preventScroll: true });
  }

  /* ---------- doc enhancement ---------- */
  const slugify = (t) =>
    t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const NUMERIC = /^[~≈<>≤≥±+\-–−]?\s*[\d][\d.,\s]*(?:[a-zA-Zµ°%Ω/]{0,6})?(?:\s*[×x]\s*\d+)?$/;

  function isImagePara(el) {
    if (el.tagName !== 'P' || !el.querySelector('img')) return false;
    return [...el.childNodes].every(
      (n) => (n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'IMG' || n.nodeName === 'BR'
    );
  }

  function zoomButton(img) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'zoom';
    b.setAttribute('aria-label', img.alt ? `Enlarge image: ${img.alt}` : 'Enlarge image');
    img.decoding = 'async';
    img.replaceWith(b);
    b.appendChild(img);
    return b;
  }

  function enhance(node) {
    let items = [];
    const onClick = (e) => {
      const b = e.target.closest?.('button.zoom');
      if (!b || !node.contains(b)) return;
      lb?.open(items, Number(b.dataset.lb) || 0, b);
    };
    node.addEventListener('click', onClick);

    tick().then(() => {
      // h2: ids + slice labels
      const used = new Set();
      node.querySelectorAll('h2').forEach((h, i) => {
        const text = h.textContent.replace(/\s+/g, ' ').trim();
        if (!h.id) {
          const base = slugify(text) || `section-${i + 1}`;
          let id = base;
          for (let n = 2; used.has(id) || document.getElementById(id); n++) id = `${base}-${n}`;
          h.id = id;
        }
        used.add(h.id);
        h.tabIndex = -1;
        h.dataset.build = text || `Section ${i + 1}`;
      });

      // tables: horizontal scroll wrapper + mono figures
      node.querySelectorAll('table').forEach((t) => {
        if (!t.parentElement.classList.contains('tbl-wrap')) {
          const w = document.createElement('div');
          w.className = 'tbl-wrap doc-tbl';
          t.replaceWith(w);
          w.appendChild(t);
        }
        t.querySelectorAll('tbody td').forEach((td) => {
          if (NUMERIC.test(td.textContent.trim())) td.classList.add('num');
        });
      });

      // runs of image-only paragraphs → galleries
      const kids = [...node.children];
      for (let i = 0; i < kids.length; ) {
        if (!isImagePara(kids[i])) { i++; continue; }
        let j = i;
        const imgs = [];
        while (j < kids.length && isImagePara(kids[j])) imgs.push(...kids[j++].querySelectorAll('img'));
        const g = document.createElement('div');
        g.className = `gallery g-${Math.min(imgs.length, 5)}`;
        kids[i].before(g);
        for (const img of imgs) {
          const fig = document.createElement('figure');
          g.appendChild(fig);
          fig.appendChild(img);
          zoomButton(img);
          if (img.alt) {
            const cap = document.createElement('figcaption');
            cap.textContent = img.alt;
            cap.setAttribute('aria-hidden', 'true');
            fig.appendChild(cap);
          }
        }
        for (let k = i; k < j; k++) kids[k].remove();
        i = j;
      }

      // remaining images (inline in text), unless they are already links
      node.querySelectorAll('img').forEach((img) => {
        if (!img.closest('button.zoom, a')) zoomButton(img).classList.add('zoom-inline');
      });

      // lightbox list: every zoomable image in document order
      const btns = [...node.querySelectorAll('button.zoom')];
      items = btns.map((b, i) => {
        b.dataset.lb = String(i);
        const img = b.querySelector('img');
        return { src: img.currentSrc || img.src, alt: img.alt || '', caption: img.alt || '' };
      });

      // video: native controls, sized by CSS
      node.querySelectorAll('video').forEach((v) => {
        v.removeAttribute('width');
        v.removeAttribute('height');
        v.controls = true;
        v.playsInline = true;
        if (!v.getAttribute('preload')) v.preload = 'metadata';
      });

      refreshBuildColumn();
    });

    return { destroy: () => node.removeEventListener('click', onClick) };
  }
</script>

<svelte:head>
  <title>{ogTitle}</title>
  <meta name="description" content={ogDescription} />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="Isaiah Murray" />
  {#if metadata.date}
    <meta property="article:published_time" content={metadata.date} />
  {/if}
  {#if metadata.updated}
    <meta property="article:modified_time" content={metadata.updated} />
  {/if}
  {#if metadata.tags}
    {#each metadata.tags as tag}
      <meta property="article:tag" content={tag} />
    {/each}
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={ogTitle} />
  <meta name="twitter:description" content={ogDescription} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<main id="main" class="proj">
  <aside class="ruler" aria-label="Build height: reading progress">
    <div class="ruler-col" use:dockBuildColumn></div>
    <div class="ruler-ticks" aria-hidden="true"></div>
    <div class="ruler-marks">
      {#each marks as s, i (s.el)}
        <button type="button" class:on={i === active} style={`top:${ys[i]}px`} on:click={() => jump(s)}>
          <span class="mono" aria-hidden="true">{(s.a * docMM).toFixed(1).padStart(5, '0')}</span>
          <span class="t">{s.label}</span>
        </button>
      {/each}
    </div>
    <div class="ruler-z mono" aria-hidden="true">{z}</div>
  </aside>

  {#key slug}
    <article class="proj-main">
      <header class="proj-head" data-build="Intro">
        <nav class="crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="/projects">Projects</a></li>
            <li aria-current="page">{metadata.title}</li>
          </ol>
        </nav>
        <h1>{metadata.title}</h1>
        {#if subtitle}<p class="lede" class:long={subtitle.length > 150}>{subtitle}</p>{/if}
        <div class="head-grid">
          <dl class="meta">
            {#if status}<dt>Status</dt><dd>{status}</dd>{/if}
            {#if data.year}<dt>Year</dt><dd class="mono">{data.year}</dd>{/if}
            {#if tags.length}<dt>Tags</dt><dd class="mono tags">{tags.join(', ')}</dd>{/if}
          </dl>
          <figure class="hero">
            <img src={heroImage} alt={metadata.title} loading="eager" fetchpriority="high" decoding="async" />
          </figure>
        </div>
      </header>

      <div class="doc" use:enhance>
        <svelte:component this={Doc} />
      </div>

      <nav class="next" aria-label="More projects">
        {#if nb?.prev}
          <a class="go prev" href={`/projects/${nb.prev.slug}`}><small>Previous project</small>{nb.prev.title}</a>
        {/if}
        {#if nb?.next}
          <a class="go nxt" href={`/projects/${nb.next.slug}`}><small>Next project</small>{nb.next.title}</a>
        {/if}
        <a class="all" href="/projects">All projects</a>
      </nav>
    </article>
  {/key}
</main>

<Lightbox bind:this={lb} />

<style>
  /* ---------- page grid + ruler ---------- */
  .proj {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 0 var(--s6);
    max-width: var(--wrap);
    margin: 0 auto;
    padding: 0 var(--gutter);
  }
  .ruler {
    position: sticky;
    top: calc(env(safe-area-inset-top, 0px) + 24px);
    align-self: start;
    height: calc(100vh - 48px);
    margin-top: var(--s5);
  }
  .ruler-col { position: absolute; left: 0; top: 0; width: 32px; height: calc(100% - 36px); }
  .ruler-ticks {
    position: absolute;
    left: 38px;
    top: 0;
    bottom: 36px;
    width: 6px;
    background: repeating-linear-gradient(to bottom, var(--rule) 0 1px, transparent 1px 12px);
  }
  .ruler-marks { position: absolute; left: 36px; top: 0; bottom: 36px; right: 0; }
  .ruler-marks button {
    position: absolute;
    left: 0;
    max-width: 100%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: var(--s2);
    background: none;
    border: 0;
    padding: 2px 0;
    font-size: var(--t-xs);
    color: var(--ink-2);
    text-align: left;
    white-space: nowrap;
    line-height: 1.2;
  }
  .ruler-marks button::before { content: ''; width: 12px; height: 1px; background: var(--part); flex: none; }
  .ruler-marks .mono { font-size: 11px; color: var(--ink-2); min-width: 4ch; flex: none; }
  .ruler-marks .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .ruler-marks button:hover, .ruler-marks button.on { color: var(--ink); }
  .ruler-marks button.on::before { background: var(--laser); height: 2px; }
  .ruler-z { position: absolute; left: 0; bottom: 0; font-size: var(--t-xs); color: var(--ink); }
  @media (max-width: 900px) {
    .proj { grid-template-columns: minmax(0, 1fr); }
    .ruler { display: none; }
  }

  /* ---------- header ---------- */
  .proj-main { min-width: 0; padding-bottom: var(--s8); }
  .proj-head { padding: var(--s5) 0 var(--s7); }
  .crumbs ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0 var(--s2); font-size: var(--t-sm); color: var(--ink-2); }
  .crumbs li { min-width: 0; }
  .crumbs li + li::before { content: '/'; margin-right: var(--s2); color: var(--rule); }
  .crumbs a { color: var(--ink-2); }
  .crumbs a:hover { color: var(--ink); }
  h1 {
    font-weight: 900;
    font-size: clamp(40px, 6.4vw, 84px);
    letter-spacing: -0.03em;
    line-height: 0.95;
    margin-top: var(--s6);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .lede { font-size: var(--t-xl); line-height: 1.35; max-width: 34ch; margin-top: var(--s5); letter-spacing: -0.005em; }
  .lede.long { font-size: var(--t-lg); line-height: 1.45; max-width: 52ch; }
  .head-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--s5) var(--s6);
    margin-top: var(--s6);
    align-items: start;
  }
  .meta { grid-column: 1 / span 4; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--s2) var(--s4); margin: 0; font-size: var(--t-sm); }
  .meta dt { color: var(--ink-2); }
  .meta dd { margin: 0; min-width: 0; }
  .meta .tags { font-size: var(--t-xs); line-height: 1.6; overflow-wrap: anywhere; color: var(--ink-2); }
  .hero { grid-column: 5 / -1; margin: 0; padding: 7px; background: var(--powder-shade); }
  .hero img { width: 100%; aspect-ratio: 5 / 4; object-fit: contain; background: var(--powder-shade); }
  @media (max-width: 760px) {
    .meta, .hero { grid-column: 1 / -1; }
    .lede { font-size: var(--t-lg); }
    .lede.long { font-size: var(--t-md); }
    .proj-head { padding-bottom: var(--s6); }
  }

  /* ---------- doc body ---------- */
  .doc { overflow-wrap: break-word; }
  .doc > :global(:first-child) { margin-top: 0; }
  .doc :global(h2) {
    font-size: var(--t-2xl);
    letter-spacing: -0.01em;
    margin: var(--s7) 0 var(--s4);
    scroll-margin-top: 24px;
  }
  .doc :global(hr + h2) { margin-top: 0; }
  .doc :global(h3) { font-size: var(--t-lg); margin: var(--s6) 0 var(--s2); }
  .doc :global(h4) { font-size: var(--t-md); margin: var(--s5) 0 var(--s1); }
  .doc :global(h2 + h3) { margin-top: var(--s4); }
  .doc :global(p) { max-width: 68ch; margin: var(--s3) 0 0; }
  .doc :global(:is(h2, h3, h4) + p) { margin-top: 0; }
  .doc :global(strong) { font-weight: 700; }
  .doc :global(ul), .doc :global(ol) { max-width: 68ch; padding-left: 1.2em; margin: var(--s3) 0 0; }
  .doc :global(li) { margin-top: var(--s2); }
  .doc :global(li > ul), .doc :global(li > ol) { margin-top: var(--s1); }
  .doc :global(li::marker) { color: var(--part); }
  .doc :global(ol > li::marker) { font-family: var(--f-mono); font-size: var(--t-sm); }
  .doc :global(hr) { border: 0; border-top: 1px solid var(--rule); margin: var(--s7) 0 var(--s6); }
  .doc :global(blockquote) {
    max-width: 68ch;
    margin: var(--s5) 0 0;
    padding: 0 0 0 var(--s4);
    border-left: 2px solid var(--part);
    color: var(--ink-2);
  }
  .doc :global(blockquote p:first-child) { margin-top: 0; }

  /* code */
  .doc :global(:not(pre) > code) { background: var(--powder-shade); padding: 1px 4px; overflow-wrap: anywhere; }
  .doc :global(pre) { margin: var(--s5) 0 0; }
  .doc :global(pre code) { background: none; padding: 0; }

  /* tables (wrapped on mount; the fallback keeps SSR output from overflowing) */
  .doc :global(table) { display: block; overflow-x: auto; }
  .doc :global(.doc-tbl) { margin-top: var(--s5); }
  .doc :global(.doc-tbl table) { display: table; }
  .doc :global(td.num) { font-family: var(--f-mono); font-size: var(--t-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .doc :global(td), .doc :global(th) { min-width: 9ch; }
  .doc :global(td code) { white-space: nowrap; }

  /* media */
  .doc :global(img) { max-width: 100%; height: auto; }
  .doc :global(video) {
    width: 100%;
    height: auto;
    max-height: 80vh;
    margin-top: var(--s5);
    background: var(--part);
  }
  .doc :global(audio) { display: block; width: 100%; max-width: 68ch; margin-top: var(--s3); }
  .doc :global(button.zoom) { display: block; width: 100%; padding: 0; border: 0; background: var(--part); cursor: zoom-in; }
  .doc :global(button.zoom img) { width: 100%; height: 100%; object-fit: cover; }
  .doc :global(button.zoom-inline) { display: inline-block; width: auto; max-width: 100%; vertical-align: middle; background: none; }

  /* galleries: parts on a powder tray, flush, 7px apart */
  .doc :global(.gallery) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    padding: 7px;
    margin: var(--s5) 0 0;
    background: var(--powder-shade);
  }
  .doc :global(.gallery figure) { margin: 0; min-width: 0; display: flex; flex-direction: column; }
  .doc :global(.gallery .zoom) { aspect-ratio: 4 / 3; position: relative; overflow: hidden; }
  .doc :global(.gallery .zoom img) { position: absolute; inset: 0; }
  .doc :global(.gallery figcaption) { font-size: var(--t-xs); line-height: 1.4; color: var(--ink-2); padding: var(--s2) 2px var(--s1); }
  .doc :global(.gallery.g-1) { grid-template-columns: minmax(0, 1fr); }
  .doc :global(.gallery.g-1 .zoom) { aspect-ratio: auto; background: var(--powder-shade); }
  .doc :global(.gallery.g-1 .zoom img) { position: static; height: auto; max-height: 72vh; object-fit: contain; margin: 0 auto; width: auto; max-width: 100%; }
  .doc :global(.gallery.g-3) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .doc :global(.gallery.g-5) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 560px) {
    .doc :global(.gallery.g-3), .doc :global(.gallery.g-5) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .doc :global(.gallery:not(.g-1) figure:last-child:nth-child(odd)) { grid-column: 1 / -1; }
    .doc :global(.gallery:not(.g-1) figure:last-child:nth-child(odd) .zoom) { aspect-ratio: 16 / 9; }
    .doc :global(h2) { font-size: var(--t-xl); }
  }

  /* ---------- prev / next ---------- */
  .next {
    margin-top: var(--s8);
    padding-top: var(--s5);
    border-top: 1px solid var(--rule);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s5) var(--s6);
    align-items: baseline;
  }
  .next .go { font-size: var(--t-xl); font-weight: 700; text-decoration: none; line-height: 1.2; min-width: 0; overflow-wrap: break-word; }
  .next .go:hover { text-decoration: underline; }
  .next .nxt { grid-column: 2; text-align: right; }
  .next small { display: block; font-size: var(--t-xs); color: var(--ink-2); font-weight: 400; margin-bottom: var(--s1); }
  .next .all { grid-column: 1 / -1; font-size: var(--t-sm); color: var(--ink-2); }
  @media (max-width: 560px) {
    .next { grid-template-columns: minmax(0, 1fr); }
    .next .nxt { grid-column: 1; text-align: left; }
    .next .go { font-size: var(--t-lg); }
  }
</style>
