<script>
  import { onMount } from 'svelte';
  import SimilarProjects from '$lib/components/SimilarProjects.svelte';
  import ProjectVectorStar from '$lib/components/ProjectVectorStar.svelte';

  export let data;
  const { metadata, component: Doc, slug, heroImage } = data;

  const siteBase = 'https://isaiah-murray.com';
  const pageUrl = `${siteBase}/projects/${slug}`;
  const ogImage = heroImage?.startsWith('http') ? heroImage : `${siteBase}${heroImage}`;
  const ogTitle = `${metadata.title} · Isaiah Murray`;
  const ogDescription = metadata.subtitle || metadata.description || `A project by Isaiah Murray.`;

  const maturityLabels = {
    production: 'Production',
    polished: 'Polished',
    prototype: 'Prototype',
    wip: 'In Progress',
    archived: 'Archived'
  };

  const displayDate = metadata.updated || metadata.date || null;
  const accent = metadata.accent || '#7bdcff';

  // Lightbox state
  let lightboxOpen = false;
  let lightboxSrc = '';
  let lightboxAlt = '';

  function openLightbox(src, alt) {
    lightboxSrc = src;
    lightboxAlt = alt || '';
    lightboxOpen = true;
  }

  function closeLightbox() {
    lightboxOpen = false;
  }

  onMount(() => {
    const docBody = document.querySelector('.doc-body');
    if (!docBody) return;

    // Group consecutive image paragraphs into galleries
    const children = Array.from(docBody.children);
    let i = 0;

    while (i < children.length) {
      const node = children[i];

      // Check if this is a paragraph containing only an image
      if (isImageParagraph(node)) {
        // Collect consecutive image paragraphs
        const group = [node];
        let j = i + 1;

        while (j < children.length && isImageParagraph(children[j])) {
          group.push(children[j]);
          j++;
        }

        // Create gallery wrapper
        const gallery = document.createElement('figure');
        gallery.className = `image-gallery gallery-${Math.min(group.length, 4)}`;

        // Insert gallery before first image
        node.parentNode.insertBefore(gallery, node);

        // Move images into gallery
        group.forEach((p, idx) => {
          const img = p.querySelector('img');
          if (img) {
            const wrapper = document.createElement('div');
            wrapper.className = 'gallery-item';
            
            // Clone the image and add click handler
            const clonedImg = img.cloneNode(true);
            clonedImg.style.cursor = 'zoom-in';
            wrapper.appendChild(clonedImg);
            gallery.appendChild(wrapper);
          }
          p.remove();
        });

        // Add click handlers for lightbox
        gallery.querySelectorAll('img').forEach(img => {
          img.addEventListener('click', () => openLightbox(img.src, img.alt));
        });

        i = j;
      } else {
        i++;
      }
    }

    // Also add lightbox to any remaining standalone images
    docBody.querySelectorAll('img').forEach(img => {
      if (!img.closest('.image-gallery')) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
      }
    });
  });

  function isImageParagraph(node) {
    if (node.tagName !== 'P') return false;
    const img = node.querySelector('img');
    if (!img) return false;
    // Check if paragraph contains only the image (and maybe whitespace)
    const textContent = node.textContent.trim();
    return textContent === '' || textContent === img.alt;
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

<div class = "nav spacer"></div>
<article class="project-page" style={`--accent:${accent}`}>
  <a href="/projects" class="back-link">← Back to projects</a>

  <header class="project-hero">
    <div class="hero-media">
      <img src={heroImage} alt={metadata.title} class="hero-image" />
    </div>

    <div class="hero-text">
      <h1 class="project-title">{metadata.title}</h1>

      {#if metadata.subtitle}
        <p class="project-subtitle">{metadata.subtitle}</p>
      {/if}

      <div class="hero-meta-row">
        {#if metadata.maturity}
          <span class={`maturity-pill maturity-${metadata.maturity}`}>
            {maturityLabels[metadata.maturity] ?? metadata.maturity}
          </span>
        {/if}

        {#if displayDate}
          <span class="meta-pill">
            Updated {new Date(displayDate).toLocaleDateString()}
          </span>
        {/if}
      </div>

      {#if metadata.tags && metadata.tags.length}
        <div class="hero-tags">
          {#each metadata.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>

    <div class="hero-radar-col">
      <ProjectVectorStar slug={slug} size={170} compact={false} showLabels={true} label="" />
    </div>
  </header>

  <section class="project-body">
    <div class="doc-body">
      <Doc />
      <SimilarProjects currentSlug={slug} />
    </div>
  </section>
</article>

<!-- Lightbox Modal -->
{#if lightboxOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="lightbox-overlay" on:click={closeLightbox}>
    <button class="lightbox-close" on:click={closeLightbox} aria-label="Close">×</button>
    <img src={lightboxSrc} alt={lightboxAlt} class="lightbox-image" on:click|stopPropagation />
  </div>
{/if}

<style>
  .nav.spacer {
    height: 3.25em;
  }
  .project-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 2em;
    width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  :global(.project-body) {
    display: flex;
    justify-content: space-evenly;
  }

  .back-link {
    font-size: 0.84rem;
    text-decoration: none;
    color: rgba(244, 239, 214, 0.75);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    width: fit-content;
    padding: 0.2rem 0;
    border-bottom: 1px solid transparent;
  }

  .back-link:hover {
    color: var(--accent);
    border-bottom-color: color-mix(in srgb, var(--accent) 60%, transparent);
  }

  .project-hero {
    display: grid;
    grid-template-columns: minmax(0, 320px) minmax(0, 1fr) auto;
    gap: 1.6rem;
    align-items: center;
  }

  .hero-radar-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.4rem 0;
  }

  .hero-media {
    border-radius: 1.2rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: radial-gradient(circle at 50% 0%, #171924, #050609);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  }

  .hero-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 4 / 3;
    transform: scale(1.02);
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .project-title {
    margin: 0;
    font-size: clamp(1.8rem, 2.7vw, 2.2rem);
    letter-spacing: 0.04em;
  }

  .project-subtitle {
    margin: 0;
    font-size: 0.98rem;
    color: rgba(244, 239, 214, 0.78);
  }

  .hero-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .maturity-pill {
    font-size: 0.7rem;
    padding: 0.22rem 0.7rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    border: 1px solid rgba(244, 239, 214, 0.24);
    white-space: nowrap;
  }

  .maturity-production {
    border-color: color-mix(in srgb, var(--accent) 70%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 65%, transparent),
      rgba(255, 211, 176, 0.6),
      rgba(158, 255, 212, 0.55)
    );
    color: #050608;
  }

  .maturity-polished {
    border-color: color-mix(in srgb, var(--accent) 60%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 55%, transparent),
      rgba(255, 216, 188, 0.5)
    );
    color: #050608;
  }

  .maturity-prototype,
  .maturity-wip {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: rgba(12, 16, 24, 0.95);
    color: rgba(244, 239, 214, 0.95);
  }

  .maturity-archived {
    border-color: rgba(180, 180, 180, 0.4);
    background: rgba(10, 12, 16, 0.98);
    color: rgba(199, 199, 199, 0.8);
  }

  .meta-pill {
    font-size: 0.78rem;
    padding: 0.18rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(244, 239, 214, 0.22);
    color: rgba(244, 239, 214, 0.8);
  }

  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0;
  }

  .tag {
    font-size: 0.78rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: rgba(18, 21, 29, 0.96);
    border: 1px solid rgba(244, 239, 214, 0.18);
    color: rgba(244, 239, 214, 0.86);
  }

  .project-body {
    margin-top: 0.5rem;
  }

  .doc-body {
    max-width: 780px;
    width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DYNAMIC IMAGE GALLERY SYSTEM
     Automatically styled based on consecutive image count
     ═══════════════════════════════════════════════════════════════════════════ */

  /* Base image styling */
  .doc-body :global(img) {
    max-width: 100%;
    height: auto;
    display: block;
    border-radius: 0.5rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
    object-fit: cover;
    transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  }

  .doc-body :global(video) {
    max-width: 100%;
    height: auto;
    display: block;
    border-radius: 0.5rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: #050609;
  }

  .doc-body :global(img:hover) {
    transform: scale(1.015);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
  }

  /* Gallery container base */
  .doc-body :global(.image-gallery) {
    display: grid;
    gap: 0.5rem;
    margin: 1.25rem 0;
    border-radius: 0.6rem;
    overflow: hidden;
  }

  .doc-body :global(.gallery-item) {
    position: relative;
    overflow: hidden;
    border-radius: 0.5rem;
    background: radial-gradient(circle at 50% 0%, #171924, #050609);
  }

  .doc-body :global(.gallery-item img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .doc-body :global(.gallery-item img:hover) {
    transform: scale(1.03);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GALLERY-1: Single hero image — full width, prominent
     ───────────────────────────────────────────────────────────────────────── */
  .doc-body :global(.gallery-1) {
    grid-template-columns: 1fr;
  }

  .doc-body :global(.gallery-1 .gallery-item) {
    aspect-ratio: 16 / 9;
    max-height: 420px;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GALLERY-2: Duo layout — balanced side by side
     ───────────────────────────────────────────────────────────────────────── */
  .doc-body :global(.gallery-2) {
    grid-template-columns: repeat(2, 1fr);
  }

  .doc-body :global(.gallery-2 .gallery-item) {
    aspect-ratio: 4 / 3;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GALLERY-3: Trio layout — feature left, stack right
     ───────────────────────────────────────────────────────────────────────── */
  .doc-body :global(.gallery-3) {
    grid-template-columns: 1.6fr 1fr;
    grid-template-rows: repeat(2, 1fr);
  }

  .doc-body :global(.gallery-3 .gallery-item:first-child) {
    grid-row: 1 / 3;
    aspect-ratio: auto;
  }

  .doc-body :global(.gallery-3 .gallery-item:nth-child(2)),
  .doc-body :global(.gallery-3 .gallery-item:nth-child(3)) {
    aspect-ratio: 16 / 10;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GALLERY-4+: Grid/Masonry layout — flexible grid
     ───────────────────────────────────────────────────────────────────────── */
  .doc-body :global(.gallery-4) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto auto;
  }

  .doc-body :global(.gallery-4 .gallery-item) {
    aspect-ratio: 4 / 3;
  }

  /* For 5+ images, use a more flexible approach */
  .doc-body :global(.gallery-5),
  .doc-body :global(.gallery-6) {
    grid-template-columns: repeat(3, 1fr);
  }

  .doc-body :global(.gallery-5 .gallery-item),
  .doc-body :global(.gallery-6 .gallery-item) {
    aspect-ratio: 4 / 3;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Responsive adjustments
     ───────────────────────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .doc-body :global(.gallery-2),
    .doc-body :global(.gallery-3),
    .doc-body :global(.gallery-4) {
      grid-template-columns: 1fr;
    }

    .doc-body :global(.gallery-3 .gallery-item:first-child) {
      grid-row: auto;
    }

    .doc-body :global(.gallery-item) {
      aspect-ratio: 16 / 10;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LIGHTBOX
     ═══════════════════════════════════════════════════════════════════════════ */
  :global(.lightbox-overlay) {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    animation: lightbox-fade-in 0.2s ease;
  }

  @keyframes lightbox-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  :global(.lightbox-image) {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 0.5rem;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
    animation: lightbox-zoom-in 0.25s ease;
  }

  @keyframes lightbox-zoom-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  :global(.lightbox-close) {
    position: absolute;
    top: 1rem;
    right: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
    font-size: 2rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, transform 0.15s ease;
  }

  :global(.lightbox-close:hover) {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  /* basic markdown styling */
  .doc-body :global(h2) {
    margin-top: 1.8rem;
    margin-bottom: 0.6rem;
    font-size: 1.2rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.9);
  }

  .doc-body :global(h3) {
    margin-top: 1.2rem;
    margin-bottom: 0.4rem;
    font-size: 1.02rem;
  }

  .doc-body :global(p) {
    margin: 0.5rem 0;
    line-height: 1.6;
    font-size: 0.96rem;
    color: rgba(244, 239, 214, 0.88);
  }

  .doc-body :global(ul),
  .doc-body :global(ol) {
    margin: 0.4rem 0 0.8rem 1.2rem;
  }

  .doc-body :global(li) {
    margin: 0.2rem 0;
  }

  .doc-body :global(code) {
    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular,
      Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.85rem;
    background: rgba(15, 18, 24, 0.95);
    padding: 0.08rem 0.25rem;
    border-radius: 0.25rem;
  }

  .doc-body :global(pre) {
    margin: 0.9rem 0;
    padding: 0.9rem 1rem;
    border-radius: 0.7rem;
    background: rgba(8, 10, 16, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.06);
    overflow-x: auto;
    max-width: 100%;
    box-sizing: border-box;
  }

  .doc-body :global(table) {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
  }

  .doc-body :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .doc-body :global(a) {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  }

  .doc-body :global(a:hover) {
    border-bottom-color: var(--accent);
  }

  @media (max-width: 960px) {
    .project-hero {
      grid-template-columns: minmax(0, 1fr);
    }

    .hero-radar-col {
      order: 3;
      justify-self: center;
    }

    .hero-media {
      max-width: 420px;
    }
  }

  @media (max-width: 640px) {
    .project-page {
      padding: 0 1rem;
    }

    :global(.project-body) {
      justify-content: center;
    }

    .doc-body {
      max-width: 100%;
    }
  }
</style>
