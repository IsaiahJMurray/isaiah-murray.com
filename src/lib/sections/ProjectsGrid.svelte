<script>
  import { onMount, onDestroy } from 'svelte';
  import ProjectScatterplot from '$lib/components/ProjectScatterplot.svelte';
  import MiniRadar from '$lib/components/MiniRadar.svelte';

  let scrollProgress = 0;
  let galleryEl;
  let ticking = false;
  let observer;

  const featuredProjects = [
    {
      slug: 'egg-lathe',
      title: 'Egg Lathe',
      heroImage: '/images/projects/egg_lathe/4042049F-4E5C-4FE2-90E5-DB033294D7C5_1_105_c.jpeg',
      docImages: [
        '/images/projects/egg_lathe/413E6CA7-410C-4811-B012-0264FC44B8B6_1_105_c.jpeg',
        '/images/projects/egg_lathe/07E0E0C1-4AAA-49F0-9761-DE9BF86FBBAB_1_105_c.jpeg'
      ],
      tags: ['CNC', 'Mechatronics', 'Fabrication']
    },
    {
      slug: 'clasp',
      title: 'CLASP',
      heroImage: '/images/projects/clasp/IMG_4305-min.jpg',
      docImages: [
        '/images/projects/clasp/Screenshot_2025-01-06_at_3.58.46_PM.png',
        '/images/projects/clasp/Screenshot_2025-01-06_at_9.49.19_AM.png'
      ],
      tags: ['BLE', 'Hardware', 'PCB']
    },
    {
      slug: 'pcb_business_card',
      title: 'PCB Business Card',
      heroImage: '/images/projects/pcb_card/IMG_4365.jpeg',
      docImages: [
        '/images/projects/pcb_card/Screenshot_2024-09-27_at_9.36.49_AM.png',
        '/images/projects/pcb_card/Screenshot_2024-09-27_at_9.23.11_AM.png'
      ],
      tags: ['PCB', 'Electronics', 'Design']
    },
    {
      slug: 'radar_calibration',
      title: 'Radar Calibration',
      heroImage: '/images/projects/radar-calibration/image.png',
      docImages: [
        '/images/projects/radar-calibration/Screenshot_(3).png'
      ],
      tags: ['Signal Processing', 'Hardware', 'Automation']
    }
  ];

  /* RAF-throttled scroll handler — avoids layout thrashing */
  function handleScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      ticking = false;
    });
  }

  onMount(() => {
    /* IntersectionObserver for staggered reveal on scroll */
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.15 }
    );

    if (galleryEl) {
      galleryEl.querySelectorAll('.gallery-item').forEach((el) => {
        observer.observe(el);
      });
    }
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });
</script>

<svelte:window on:scroll={handleScroll} />

<section id="projects" class="section">
  <h2 class="section-heading">Featured Projects</h2>
  <p class="section-subtitle">
    A selection of recent systems combining embedded hardware, firmware, and
    software. Explore more on the projects page.
  </p>

  <div class="gallery" bind:this={galleryEl}>
    {#each featuredProjects as project, i (project.slug)}
      <a
        href={`/projects/${project.slug}`}
        class="gallery-item"
        class:alt={i % 2 !== 0}
      >
        <div class="gallery-hero">
          <img
            src={project.heroImage}
            alt={`${project.title} hero`}
            class="hero-image"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="gallery-details">
          {#each project.docImages as docImg, j}
            <div class="doc-image">
              <img
                src={docImg}
                alt={`${project.title} detail ${j + 1}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          {/each}
          {#if project.docImages.length === 1}
            <!-- filler keeps the grid 2-row even with 1 image -->
            <div class="doc-image filler"></div>
          {/if}
        </div>

        <div class="gallery-overlay">
          <div class="overlay-radar">
            <MiniRadar slug={project.slug} size={26} />
          </div>
          <div class="overlay-content">
            <h3>{project.title}</h3>
            <div class="overlay-tags">
              {#each project.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <div class="see-more">
    <a href="/projects" class="see-more-link">Explore All Projects →</a>
  </div>

  <div class="scatterplot-section">
    <ProjectScatterplot />
  </div>
</section>

<div class="scroll-progress" style={`width: ${scrollProgress}%`}></div>

<style>
  /* ——— Gallery container ——— */
  .gallery {
    display: flex;
    flex-direction: column;
    gap: 2.2rem;
  }

  /* ——— Each gallery card ——— */
  .gallery-item {
    display: grid;
    grid-template-columns: 3fr 2fr;
    grid-template-rows: minmax(340px, auto);
    border-radius: 1.3rem;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    position: relative;

    /* CSS containment: isolate layout/paint so reflows don't cascade */
    contain: content;
    content-visibility: auto;
    contain-intrinsic-size: auto 340px;

    background: radial-gradient(
        circle at 0% 0%,
        rgba(33, 181, 255, 0.08),
        transparent 60%
      ),
      rgba(10, 12, 18, 0.7);
    border: 1px solid rgba(120, 135, 160, 0.35);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);

    /* GPU-accelerated properties */
    will-change: transform, box-shadow;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1),
                border-color 0.28s ease;

    /* Staggered reveal: start hidden */
    opacity: 0;
    transform: translateY(28px);
  }

  /* Alternating layout: flip hero to right side */
  .gallery-item.alt {
    grid-template-columns: 2fr 3fr;
  }
  .gallery-item.alt .gallery-hero  { order: 2; }
  .gallery-item.alt .gallery-details { order: 1; }
  .gallery-item.alt .gallery-overlay {
    justify-content: flex-end;
    text-align: right;
  }
  .gallery-item.alt .overlay-tags { justify-content: flex-end; }

  /* Reveal state (set by IntersectionObserver) */
  .gallery-item.visible,
  .gallery-item:global(.visible) {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1),
                border-color 0.28s ease;
  }

  .gallery-item:hover {
    transform: translateY(-3px);
    border-color: rgba(100, 180, 255, 0.55);
    box-shadow:
      0 28px 60px rgba(0, 0, 0, 0.6),
      0 0 24px rgba(33, 181, 255, 0.12);
  }

  /* ——— Hero image panel ——— */
  .gallery-hero {
    position: relative;
    overflow: hidden;
    min-height: 340px;
    background: linear-gradient(135deg, #161820, #0a0c12);
  }

  .overlay-radar {
    position: absolute;
    top: 0.65rem;
    left: 0.65rem;
    z-index: 2;
  }

  .gallery-item.alt .overlay-radar {
    left: auto;
    right: 0.65rem;
  }

  .hero-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: transform;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .gallery-item:hover .hero-image {
    transform: scale(1.06);
  }

  /* ——— Detail images panel ——— */
  .gallery-details {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 0.8rem;
    padding: 0.8rem;
    background: linear-gradient(135deg, rgba(14, 16, 28, 0.5), rgba(5, 8, 14, 0.7));
  }

  .doc-image {
    position: relative;
    overflow: hidden;
    border-radius: 0.8rem;
    min-height: 0;            /* let the 1fr grid handle sizing */
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(120, 135, 160, 0.25);
  }

  .doc-image.filler {
    /* empty placeholder keeps the 2-row grid consistent */
    background: radial-gradient(
      circle at 50% 50%,
      rgba(33, 181, 255, 0.06),
      rgba(5, 8, 14, 0.7) 70%
    );
    border-style: dashed;
    border-color: rgba(120, 135, 160, 0.18);
  }

  .doc-image img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: transform;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .gallery-item:hover .doc-image img {
    transform: scale(1.04);
  }

  /* ——— Title / tag overlay ——— */
  .gallery-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 1.4rem;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent 40%,
      rgba(0, 0, 0, 0.35) 70%,
      rgba(5, 8, 14, 0.88) 100%
    );
  }

  .overlay-content {
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .overlay-content h3 {
    margin: 0 0 0.55rem 0;
    font-size: 1.35rem;
    font-weight: 650;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(244, 239, 214, 0.95);
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  }

  .overlay-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tag {
    display: inline-flex;
    font-size: 0.68rem;
    padding: 0.24rem 0.58rem;
    border-radius: 999px;
    background: rgba(33, 181, 255, 0.14);
    border: 1px solid rgba(120, 180, 255, 0.55);
    color: rgba(200, 220, 255, 0.92);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* ——— "See more" button ——— */
  .see-more {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .see-more-link {
    padding: 0.85rem 2.1rem;
    border: 1.5px solid rgba(120, 135, 160, 0.5);
    border-radius: 0.7rem;
    color: rgba(244, 239, 214, 0.88);
    text-decoration: none;
    font-size: 0.98rem;
    font-weight: 550;
    letter-spacing: 0.06em;
    background: rgba(10, 12, 18, 0.45);
    will-change: transform;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .see-more-link:hover {
    border-color: rgba(100, 180, 255, 0.65);
    color: rgba(100, 180, 255, 0.95);
    background: rgba(33, 181, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(33, 181, 255, 0.14);
  }

  /* ——— Scroll progress bar ——— */
  .scroll-progress {
    position: fixed;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, rgba(33, 181, 255, 0.75), rgba(100, 180, 255, 1));
    box-shadow: 0 -1px 10px rgba(33, 181, 255, 0.25);
    z-index: 1000;
    /* no transition — driven at 60 fps by RAF */
  }

  /* ——— Tablet ——— */
  @media (max-width: 1024px) {
    .gallery-item,
    .gallery-item.alt {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: minmax(280px, auto);
    }
    .gallery-item.alt .gallery-hero  { order: 0; }
    .gallery-item.alt .gallery-details { order: 0; }

    .gallery-hero { min-height: 280px; }
  }

  /* ——— Mobile: hero-only, single column ——— */
  @media (max-width: 640px) {
    .gallery { gap: 1.6rem; }

    .gallery-item,
    .gallery-item.alt {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(220px, 55vw);
      border-radius: 1rem;
      contain-intrinsic-size: auto 220px;
    }
    .gallery-item.alt .gallery-hero  { order: 0; }

    .gallery-hero { min-height: 220px; }
    .gallery-details { display: none; }

    .overlay-content h3 {
      font-size: 1.15rem;
      margin-bottom: 0.45rem;
    }

    .tag {
      font-size: 0.62rem;
      padding: 0.18rem 0.45rem;
    }

    .scroll-progress { height: 2px; }
  }

  /* ——— Scatterplot section ——— */
  .scatterplot-section {
    margin-top: 2.5rem;
  }
</style>
