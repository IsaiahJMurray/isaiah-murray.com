<script>
  import { DISCIPLINES, firstSentence } from '$lib/projects.js';

  export let data;

  $: projects = data.projects;

  /* ---------- build plate packing (deterministic) ----------
     12-column grid, 88px rows. Parts: featured 6×4 ("big"), small 3×2, wide 6×2.
     The plate is stacked as bands 4 rows tall:
       mixed band = one featured part + a 6×4 block of 1–4 other parts (sides alternate)
       pair band  = two featured parts side by side
       solo band  = one featured part across the plate (only if nothing else can pair with it)
     then trailing 2-row lines of the remaining parts. Every band and line is filled edge to edge. */
  function fill(items, c, r) {
    // 1–4 parts into a 6×4 block at column c, row r
    const [a, b, d, e] = items;
    if (items.length === 1) return [[a, c, r, 6, 4, 'w']];
    if (items.length === 2) return [[a, c, r, 6, 2, 'w'], [b, c, r + 2, 6, 2, 'w']];
    if (items.length === 3) return [[a, c, r, 6, 2, 'w'], [b, c, r + 2, 3, 2, 's'], [d, c + 3, r + 2, 3, 2, 's']];
    return [[a, c, r, 3, 2, 's'], [b, c + 3, r, 3, 2, 's'], [d, c, r + 2, 3, 2, 's'], [e, c + 3, r + 2, 3, 2, 's']];
  }
  function line(items, r) {
    // 1–4 parts across one 2-row line
    const widths = { 1: [12], 2: [6, 6], 3: [6, 3, 3], 4: [3, 3, 3, 3] }[items.length];
    let c = 1;
    return items.map((p, i) => {
      const cell = [p, c, r, widths[i], 2, widths[i] > 3 ? 'w' : 's'];
      c += widths[i];
      return cell;
    });
  }
  function pack(list) {
    const feat = list.filter((p) => p.featured);
    const rest = list.filter((p) => !p.featured);
    const nF = feat.length, nS = rest.length;
    let m = 0; // mixed bands
    if (nF && nS) {
      m = Math.min(nF, nS, Math.max(1, Math.ceil(nS / 4)));
      if ((nF - m) % 2) m = m + 1 <= Math.min(nF, nS) ? m + 1 : m - 1;
    }
    const pairs = Math.floor((nF - m) / 2);
    const solo = (nF - m) % 2;
    const B = m + pairs + solo;
    const used = Math.min(nS, 4 * m);
    const counts = Array.from({ length: m }, (_, i) => Math.floor(used / m) + (i < used % m ? 1 : 0));
    const mixedAt = new Set(Array.from({ length: m }, (_, i) => Math.round(((i + 0.5) * B) / m - 0.5)));

    const cells = [];
    let fi = 0, si = 0, mi = 0, r = 1;
    for (let b = 0; b < B; b++) {
      if (mixedAt.has(b)) {
        const left = mi % 2 === 0;
        cells.push([feat[fi++], left ? 1 : 7, r, 6, 4, 'f']);
        cells.push(...fill(rest.slice(si, si + counts[mi]), left ? 7 : 1, r));
        si += counts[mi++];
      } else if (fi + 1 < nF && !(solo && b === B - 1)) {
        cells.push([feat[fi++], 1, r, 6, 4, 'f'], [feat[fi++], 7, r, 6, 4, 'f']);
      } else {
        cells.push([feat[fi++], 1, r, 12, 4, 'f']);
      }
      r += 4;
    }
    for (; si < nS; si += 4, r += 2) cells.push(...line(rest.slice(si, si + 4), r));
    return cells.map(([p, c, row, w, h, kind]) => ({ p, kind, style: `--gc:${c} / span ${w};--gr:${row} / span ${h}` }));
  }

  $: cells = pack(projects);

  /* ---------- filters (apply to plate and table) ---------- */
  $: filters = DISCIPLINES.filter((d) => projects.some((p) => p.disciplines.includes(d.id)));
  let filter = 'all';
  const matches = (p, f) => f === 'all' || p.disciplines.includes(f);
  $: hits = projects.filter((p) => matches(p, filter));

  /* ---------- index table sort ---------- */
  let sortKey = 'year';
  let dir = -1; // -1 descending, 1 ascending
  function sortBy(key) {
    if (sortKey === key) dir = -dir;
    else { sortKey = key; dir = key === 'year' ? -1 : 1; }
  }
  const byName = (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
  $: rows = [...hits].sort((a, b) =>
    sortKey === 'year'
      ? (a.year ?? -Infinity) === (b.year ?? -Infinity) ? byName(a, b) : dir * ((a.year ?? -Infinity) - (b.year ?? -Infinity))
      : dir * byName(a, b)
  );
  const ariaSort = (key, k, d) => (k === key ? (d === 1 ? 'ascending' : 'descending') : undefined);

  const label = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.label]));
  const meta = (p) => [p.year, p.maturity === 'wip' ? 'in progress' : null].filter(Boolean).join(' · ');

  const desc = 'Every public project by Isaiah Murray: flight hardware, circuit boards, firmware, software and ML.';
</script>

<svelte:head>
  <title>Projects · Isaiah Murray</title>
  <meta name="description" content={desc} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Projects · Isaiah Murray" />
  <meta property="og:description" content={desc} />
  <meta property="og:url" content="https://isaiah-murray.com/projects" />
  <meta property="og:image" content="https://isaiah-murray.com/faceshot.jpg" />
  <meta property="og:site_name" content="Isaiah Murray" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Projects · Isaiah Murray" />
  <meta name="twitter:description" content={desc} />
  <meta name="twitter:image" content="https://isaiah-murray.com/faceshot.jpg" />
</svelte:head>

<main id="main">
  <section class="wrap head" data-build="Projects" aria-labelledby="h1-projects">
    <h1 id="h1-projects">Projects</h1>
    <p class="intro">
      All {projects.length} public projects. Featured work gets the larger parts on the plate; the index below lists everything by year or name.
    </p>
    {#if filters.length > 1}
      <div class="filters" role="group" aria-label="Filter projects by discipline">
        <button type="button" aria-pressed={filter === 'all'} on:click={() => (filter = 'all')}>All</button>
        {#each filters as f}
          <button type="button" aria-pressed={filter === f.id} on:click={() => (filter = f.id)}>{f.label}</button>
        {/each}
        <span class="plate-count mono" aria-live="polite">{hits.length} / {projects.length} parts</span>
      </div>
    {/if}
  </section>

  <section class="wrap plate-sec" data-build="Build plate" aria-label="Build plate">
    <div class="plate all">
      {#each cells as { p, kind, style }, i (p.slug)}
        {@const hit = matches(p, filter)}
        <a
          class="part"
          class:big={kind === 'f'}
          class:wide={kind === 'w'}
          class:is-powder={!hit}
          href={`/projects/${p.slug}`}
          {style}
        >
          <div class="img">
            <img src={p.cardImage} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
          </div>
          <div class="lbl">
            <strong>{p.title}</strong>
            {#if meta(p)}<span class="mono">{meta(p)}</span>{/if}
            {#if kind === 'f' && p.subtitle}<p>{firstSentence(p.subtitle)}</p>{/if}
          </div>
          {#if !hit}<span class="visually-hidden">(filtered out)</span>{/if}
        </a>
      {/each}
    </div>
  </section>

  <section class="wrap section" data-build="Index" aria-labelledby="h-index">
    <div class="section-head">
      <h2 id="h-index">Index</h2>
      <span class="plate-count mono">{rows.length} rows</span>
    </div>
    <div class="tbl-wrap index proj-index">
      <table>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('year', sortKey, dir)}>
              <button type="button" class="sort" on:click={() => sortBy('year')}>
                Year<span class="arrow" aria-hidden="true">{sortKey === 'year' ? (dir === 1 ? '↑' : '↓') : ''}</span>
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort('name', sortKey, dir)}>
              <button type="button" class="sort" on:click={() => sortBy('name')}>
                Project<span class="arrow" aria-hidden="true">{sortKey === 'name' ? (dir === 1 ? '↑' : '↓') : ''}</span>
              </button>
            </th>
            <th scope="col" class="c-what">What it is</th>
            <th scope="col" class="c-disc">Disciplines</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as p (p.slug)}
            <tr>
              <td class="yr mono">{p.year ?? '—'}</td>
              <th scope="row"><a href={`/projects/${p.slug}`}>{p.title}</a></th>
              <td>{firstSentence(p.subtitle)}</td>
              <td class="disc">{p.disciplines.map((d) => label[d]).join(', ') || '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</main>

<style>
  .head { padding-top: var(--s7); padding-bottom: var(--s6); }
  h1 { font-weight: 900; font-size: clamp(44px, 7vw, 88px); letter-spacing: -0.03em; line-height: 0.95; }
  .intro { font-size: var(--t-lg); line-height: 1.4; max-width: 46ch; margin-top: var(--s4); }
  .filters { margin-top: var(--s5); }
  .plate-sec { padding-bottom: var(--s8); }

  .plate.all { grid-auto-rows: 88px; }
  .plate.all > .part.wide .lbl strong { font-size: var(--t-md); }
  .plate.all > .part.big .lbl { flex-wrap: nowrap; flex-direction: column; align-items: stretch; gap: var(--s1); }
  .plate.all > .part.big .lbl .mono { order: -1; }
  .plate.all > .part.big .lbl > * { flex-shrink: 0; }
  .plate.all > .part.big .lbl strong { overflow: visible; }
  .plate.all > .part.big .lbl p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    max-height: calc(2 * 1.45em);
  }

  .proj-index .sort {
    background: none;
    border: 0;
    padding: 0;
    font-size: inherit;
    color: inherit;
    display: inline-flex;
    gap: var(--s1);
    align-items: baseline;
    min-height: 24px;
  }
  .proj-index .sort:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
  .proj-index th[aria-sort] { color: var(--ink); }
  .proj-index .arrow { font-family: var(--f-mono); display: inline-block; min-width: 1ch; }
  .proj-index tbody th { width: 24%; }
  .proj-index td.disc { width: 20%; font-size: var(--t-xs); color: var(--ink-2); }

  @media (max-width: 760px) {
    /* phones: one column. Featured parts stay full-bleed; the rest become thumbnail rows. */
    .plate.all { grid-template-columns: minmax(0, 1fr); grid-auto-rows: auto; }
    .plate.all > .part { grid-column: 1 / -1; }
    .plate.all > .part.big .img { aspect-ratio: 4 / 3; }
    .plate.all > .part:not(.big) { flex-direction: row; min-height: 88px; }
    .plate.all > .part:not(.big) .img { flex: none; width: 88px; aspect-ratio: 1 / 1; }
    .plate.all > .part:not(.big) .lbl { flex: 1; justify-content: center; }
  }
  @media (max-width: 600px) {
    .head { padding-top: var(--s5); }
    .intro { font-size: var(--t-md); }
    /* keep the sort buttons reachable: the header becomes a single row of controls */
    .proj-index thead { position: static; width: auto; height: auto; overflow: visible; clip: auto; display: block; }
    .proj-index thead tr { display: flex; gap: var(--s5); padding: 0 0 var(--s2); }
    .proj-index thead th { padding: 0; border: 0; }
    .proj-index thead .c-what, .proj-index thead .c-disc { display: none; }
    .proj-index tr > td.disc { width: auto; }
    .proj-index tbody th { width: auto; }
  }
</style>
