// Shared project loader for home, /projects and /projects/[slug].
//
//   loadProjects()        -> public projects (visibility not hidden/unlisted), in site order. Synchronous.
//   loadProject(slug)     -> Promise<{ ...summary, metadata, component, heroImage } | null>
//                            (null for unknown or hidden; unlisted projects load by direct link)
//   neighbors(slug)       -> { prev, next } summaries around `slug` in loadProjects() order,
//                            wrapping at the ends; both null if `slug` isn't in the public list.
//   firstSentence(text)   -> the first sentence of a subtitle, for tables and captions.
//
// Summary shape: { slug, title, subtitle, date, updated, year, tags, disciplines, maturity,
//                  status, featured, visibility, accent, heroImage, cardImage, order }
//
// Ordering (kept exactly from the old routes/projects/+page.js):
//   1. explicit `order` (unordered projects count as 500, so low numbers promote, 9xx demote)
//   2. featured first  3. maturity rank  4. updated||date, newest first  5. slug

/* ------------------------------------------------------------------
   Tag -> discipline map. Edit freely: a tag may map to one or more of
   'hardware' | 'firmware' | 'software' | 'ml'. Unlisted tags are ignored.
   ------------------------------------------------------------------ */
export const DISCIPLINES = [
  { id: 'hardware', label: 'Hardware' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'software', label: 'Software' },
  { id: 'ml', label: 'ML/CV' }
];

export const TAG_DISCIPLINES = {
  // hardware: boards, mechanisms, fabrication, instruments
  hardware: 'hardware', pcb: 'hardware', 'pcb-design': 'hardware', electronics: 'hardware',
  rf: 'hardware', radar: 'hardware', fpga: ['hardware', 'firmware'], calibration: 'hardware',
  cnc: 'hardware', mechatronics: 'hardware', fabrication: 'hardware', 'laser-cutting': 'hardware',
  optics: 'hardware', woodworking: 'hardware', photography: 'hardware', 'film-photography': 'hardware',
  wearables: 'hardware', automotive: 'hardware', 'sla-printing': 'hardware', 'dielectric-sensing': 'hardware',
  'impedance-analysis': 'hardware', sensors: 'hardware', kinect: 'hardware', lidar: 'hardware',
  robotics: 'hardware', 'physical-computing': 'hardware', 'color-sensing': 'hardware', quest3: 'hardware',
  // firmware: code that runs on the device
  embedded: 'firmware', firmware: 'firmware', stm32: 'firmware', arduino: 'firmware', px4: 'firmware',
  'can-bus': 'firmware', ble: 'firmware', i2c: 'firmware', 'low-power': 'firmware', telemetry: 'firmware',
  // software: desktop, web, simulation, tooling
  python: 'software', javascript: 'software', typescript: 'software', html: 'software', css: 'software',
  svelte: 'software', sveltekit: 'software', swift: 'software', swiftui: 'software', ios: 'software',
  unity: 'software', 'c#': 'software', cpp: 'software', matlab: 'software', simulation: 'software',
  'isaac-sim': 'software', visualization: 'software', automation: 'software', optimization: 'software',
  'signal-processing': 'software', 'real-time-monitoring': 'software', swarm: 'software',
  // ml: learning, perception, vision, language
  ml: 'ml', 'machine-learning': 'ml', 'computer-vision': 'ml', opencv: 'ml', yolov5: 'ml',
  'object-detection': 'ml', perception: 'ml', autonomy: 'ml', nlp: 'ml', faiss: 'ml',
  transformers: 'ml', 'text-classification': 'ml', svd: 'ml', ai: 'ml', 'voice-recognition': 'ml'
};

const MATURITY_RANK = { production: 0, polished: 1, prototype: 2, wip: 3, archived: 4 };
const MATURITY_STATUS = {
  production: 'Finished', polished: 'Finished', prototype: 'Prototype', wip: 'In progress', archived: 'Archived'
};

// Only frontmatter is pulled into this bundle; components load lazily in loadProject().
const metas = import.meta.glob('/src/lib/docs/projects/*.md', { eager: true, import: 'metadata' });
const components = import.meta.glob('/src/lib/docs/projects/*.md');

function toYear(v) {
  if (!v) return null;
  if (v instanceof Date) return v.getUTCFullYear();
  const m = String(v).match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}

function disciplinesFor(tags) {
  const out = new Set();
  for (const t of tags) {
    const d = TAG_DISCIPLINES[String(t).toLowerCase()];
    if (d) [].concat(d).forEach((x) => out.add(x));
  }
  return DISCIPLINES.map((d) => d.id).filter((id) => out.has(id));
}

function summarize(path, meta = {}) {
  const filename = path.split('/').pop() || '';
  const slug = meta.slug || filename.replace(/\.md$/, '');
  const maturity = meta.maturity || 'prototype';
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const subtitle = String(meta.subtitle || '').replace(/\s+/g, ' ').trim();
  return {
    slug,
    title: meta.title || slug,
    subtitle,
    date: meta.date || null,
    updated: meta.updated || null,
    year: toYear(meta.date) ?? toYear(meta.updated),
    tags,
    disciplines: disciplinesFor(tags),
    maturity,
    status: MATURITY_STATUS[maturity] || null,
    featured: Boolean(meta.featured),
    visibility: meta.visibility || 'public',
    accent: meta.accent || null,
    heroImage: meta.heroImage || null,
    // card image: heroImage if defined, otherwise the generated logo
    cardImage: meta.heroImage || `/generated/logos/${slug}.png`,
    order: typeof meta.order === 'number' ? meta.order : null,
    _path: path
  };
}

function compare(a, b) {
  // explicit order takes priority over everything else
  if (a.order !== null || b.order !== null) {
    // unordered projects fall in the middle: after any explicit low order
    // (promoted), before any explicit high order (demoted below the fold)
    const aOrder = a.order ?? 500;
    const bOrder = b.order ?? 500;
    if (aOrder !== bOrder) return aOrder - bOrder;
  }
  // featured first
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  // then by maturity rank
  const ar = MATURITY_RANK[a.maturity] ?? 99;
  const br = MATURITY_RANK[b.maturity] ?? 99;
  if (ar !== br) return ar - br;
  // then by updated date desc, then date desc
  const aDate = String(a.updated || a.date || '');
  const bDate = String(b.updated || b.date || '');
  if (aDate && bDate && aDate !== bDate) return bDate.localeCompare(aDate);
  return a.slug.localeCompare(b.slug);
}

const ALL = Object.entries(metas).map(([path, meta]) => summarize(path, meta || {}));
const strip = ({ _path, ...rest }) => rest;
const PUBLIC = ALL
  .filter((p) => p.visibility !== 'hidden' && p.visibility !== 'unlisted')
  .sort(compare)
  .map(strip);

export function loadProjects() {
  return PUBLIC.map((p) => ({ ...p }));
}

export async function loadProject(slug) {
  const found = ALL.find((p) => p.slug === slug);
  if (!found || found.visibility === 'hidden') return null;
  const mod = await components[found._path]();
  const metadata = { ...(mod.metadata || {}), title: found.title };
  return {
    ...strip(found),
    metadata,
    component: mod.default,
    heroImage: found.heroImage || found.cardImage
  };
}

export function neighbors(slug, { wrap = true } = {}) {
  const i = PUBLIC.findIndex((p) => p.slug === slug);
  const n = PUBLIC.length;
  if (i < 0 || n < 2) return { prev: null, next: null };
  const at = (j) => (wrap ? PUBLIC[(j + n) % n] : PUBLIC[j] || null);
  return { prev: at(i - 1), next: at(i + 1) };
}

export function firstSentence(text = '') {
  const t = String(text).replace(/\s+/g, ' ').trim();
  // a period/!/? followed by a space and a capital, digit or quote ends the sentence
  const m = t.match(/^.+?[.!?](?=\s+["“A-Z0-9]|$)/);
  return (m ? m[0] : t).trim();
}
