<svelte:head>
  <title>Contact · Isaiah Murray</title>
  <meta
    name="description"
    content="Contact Isaiah Murray — email and social links."
  />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Contact · Isaiah Murray" />
  <meta property="og:description" content="Contact Isaiah Murray — email and social links." />
  <meta property="og:url" content="https://isaiah-murray.com/contact" />
  <meta property="og:image" content="https://isaiah-murray.com/faceshot.jpg" />
  <meta property="og:site_name" content="Isaiah Murray" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Contact · Isaiah Murray" />
  <meta name="twitter:description" content="Contact Isaiah Murray — email and social links." />
  <meta name="twitter:image" content="https://isaiah-murray.com/faceshot.jpg" />
</svelte:head>

<script>
  import CopyEmail from '$lib/chamber/CopyEmail.svelte';

  const links = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/isa-murray/', sub: 'linkedin.com/in/isa-murray', external: true },
    { label: 'GitHub', href: 'https://github.com/IsaiahJMurray', sub: 'github.com/IsaiahJMurray', external: true },
    { label: 'Instagram', href: 'https://www.instagram.com/isaiah.murray1/', sub: '@isaiah.murray1', external: true },
    { label: 'NuVu Studio', href: 'https://cambridge.nuvustudio.com/users/isa-murray', sub: 'cambridge.nuvustudio.com/users/isa-murray', external: true },
    { label: 'Resume', href: '/resume', sub: 'isaiah-murray.com/resume', external: false }
  ];
</script>

<main id="main">
  <section class="wrap head" data-build="Contact" aria-labelledby="h1-contact">
    <h1 id="h1-contact">Contact</h1>
    <p class="lede">
      Best for recruiting and collaboration: email or LinkedIn.
      If you’re reaching out about a project, include context and what you’d like to build.
    </p>
    <div class="email"><CopyEmail /></div>
  </section>

  <section class="wrap section" data-build="Links" aria-labelledby="h-links">
    <h2 id="h-links" class="visually-hidden">Links</h2>
    <ul class="links">
      {#each links as l}
        <li>
          <span class="lbl">{l.label}</span>
          <a class="mono" href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'me noreferrer' : undefined}>{l.sub}</a>
        </li>
      {/each}
    </ul>
  </section>
</main>

<style>
  .head { padding-top: var(--s7); padding-bottom: var(--s8); }
  h1 { font-size: clamp(41px, 7vw, 72px); font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
  .lede { margin-top: var(--s4); font-size: var(--t-lg); line-height: 1.45; max-width: 46ch; }
  .email { margin-top: var(--s7); min-width: 0; }

  .links { list-style: none; margin: 0; padding: 0; max-width: 820px; }
  .links li {
    display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 9fr); gap: var(--s1) var(--s6);
    align-items: baseline; padding: var(--s3) 0; border-bottom: 1px solid var(--rule);
  }
  .links li:first-child { padding-top: 0; }
  .lbl { color: var(--ink-2); font-size: var(--t-sm); }
  .links a { font-size: var(--t-md); min-width: 0; overflow-wrap: anywhere; }
  @media (max-width: 600px) {
    .head { padding-top: var(--s5); padding-bottom: var(--s7); }
    .links li { grid-template-columns: minmax(0, 1fr); }
    .links a { font-size: var(--t-sm); }
  }
</style>
