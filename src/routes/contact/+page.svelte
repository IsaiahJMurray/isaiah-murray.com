<svelte:head>
  <title>Contact · Isaiah Murray</title>
  <meta
    name="description"
    content="Contact Isaiah Murray — email and social links."
  />
</svelte:head>

<script>
  // Optional: point this to a real image in /static (e.g. static/headshot.jpg)
  // Leave null to render the monogram avatar.
  const profileImage = "/faceshot.jpg";

  const links = [
    {
      label: "Email",
      href: "mailto:isaiah.j.murray@gmail.com",
      sub: "isaiah.j.murray@gmail.com",
      icon: "mail"
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/isa-murray/",
      sub: "linkedin.com/in/isa-murray",
      icon: "linkedin"
    },
    {
      label: "GitHub",
      href: "https://github.com/IsaiahJMurray",
      sub: "github.com/IsaiahJMurray",
      icon: "github"
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/isaiah.murray1/",
      sub: "@isaiah.murray1",
      icon: "instagram"
    },
    {
      label: "NuVu Studio",
      href: "https://cambridge.nuvustudio.com/users/isa-murray",
      sub: "cambridge.nuvustudio.com/users/isa-murray",
      icon: "link"
    }
  ];

  const icons = {
    mail: (title) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" role="img">
        <title>${title}</title>
        <path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.3l8 5.2 8-5.2V8H4Zm16 2.7-8 5.2-8-5.2V18h16V10.7Z"/>
      </svg>
    `,
    github: (title) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" role="img">
        <title>${title}</title>
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.33.1-2.76 0 0 .84-.28 2.75 1.05.8-.23 1.65-.34 2.5-.35.85.01 1.7.12 2.5.35 1.9-1.33 2.75-1.05 2.75-1.05.55 1.43.2 2.5.1 2.76.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.58 5.07.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/>
      </svg>
    `,
    linkedin: (title) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" role="img">
        <title>${title}</title>
        <path d="M4.98 3.5A2.48 2.48 0 1 1 5 8.46 2.48 2.48 0 0 1 4.98 3.5ZM3.5 9h3v11h-3V9Zm7 0h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.03 0 3.6 2.03 3.6 4.66V20h-3v-5.27c0-1.26-.02-2.88-1.75-2.88-1.75 0-2.02 1.4-2.02 2.78V20h-3V9Z"/>
      </svg>
    `,
    instagram: (title) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" role="img">
        <title>${title}</title>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 2A2.8 2.8 0 1 0 14.8 12 2.8 2.8 0 0 0 12 9.2ZM17.6 6.8a.8.8 0 1 1-.8.8.8.8 0 0 1 .8-.8Z"/>
      </svg>
    `,
    link: (title) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" role="img">
        <title>${title}</title>
        <path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.4-2.4a1 1 0 1 1 1.4 1.4l-2.4 2.4a1 1 0 0 1-1.4 0ZM8 17a4 4 0 0 1 0-5.66l2-2A4 4 0 0 1 15.66 9a1 1 0 1 1-1.41 1.41 2 2 0 0 0-2.83 0l-2 2A2 2 0 0 0 12.17 15a1 1 0 1 1 1.41 1.41A4 4 0 0 1 8 17Zm8-10a4 4 0 0 1 0 5.66l-2 2A4 4 0 0 1 8.34 15a1 1 0 1 1 1.41-1.41 2 2 0 0 0 2.83 0l2-2A2 2 0 0 0 11.83 9a1 1 0 1 1-1.41-1.41A4 4 0 0 1 16 7Z"/>
      </svg>
    `
  };
</script>

<main class="contact">
  <header class="hero">
    <div class="avatar" aria-hidden="true">
      {#if profileImage}
        <img src={profileImage} alt="Isaiah Murray" />
      {:else}
        <div class="monogram">IM</div>
      {/if}
    </div>

    <div class="heroText">
      <h1 class="title">Contact</h1>
      <p class="subtitle">
        Best for recruiting and collaboration: email or LinkedIn.
        If you’re reaching out about a project, include context and what you’d like to build.
      </p>

      <div class="pills">
        <span class="pill">ECE @ Olin</span>
        <span class="pill">Embedded + Full-stack</span>
        <span class="pill">Hardware systems</span>
      </div>
    </div>
  </header>

  <section class="grid" aria-label="Contact links">
    {#each links as l}
      <a class="card" href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
        <div class="icon">
        {@html icons[l.icon](l.label)}
        </div>

        <div class="content">
          <div class="labelRow">
            <span class="label">{l.label}</span>
            <span class="chev">↗</span>
          </div>
          <div class="sub">{l.sub}</div>
        </div>
      </a>
    {/each}
  </section>
</main>

<style>
  .contact {
    width: auto;
    max-width: 1120px;
    margin: 0 auto;
    padding: 3.5rem 6vw 4.5rem 6vw;
    color: rgba(244, 239, 214, 0.92);
  }

  .hero {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 1.15rem;
    align-items: center;
    margin-bottom: 1.6rem;
  }

  .avatar {
    width: 88px;
    height: 88px;
    border-radius: 1.2rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: radial-gradient(circle at 35% 15%, rgba(90, 209, 255, 0.10), rgba(0, 0, 0, 0) 55%),
      rgba(7, 8, 14, 0.96);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.72);
    display: grid;
    place-items: center;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .monogram {
    font-weight: 780;
    letter-spacing: 0.12em;
    color: rgba(244, 239, 214, 0.9);
  }

  .title {
    margin: 0;
    font-size: clamp(1.9rem, 3vw, 2.4rem);
    font-weight: 780;
    letter-spacing: 0.04em;
  }

  .subtitle {
    margin: 0.35rem 0 0.65rem 0;
    max-width: 54rem;
    font-size: 0.98rem;
    line-height: 1.65;
    color: rgba(244, 239, 214, 0.74);
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .pill {
    font-size: 0.78rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: rgba(18, 21, 29, 0.96);
    border: 1px solid rgba(244, 239, 214, 0.18);
    color: rgba(244, 239, 214, 0.86);
    letter-spacing: 0.04em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.95rem;
  }

  .card {
    text-decoration: none;
    color: inherit;
    display: flex;
    gap: 0.85rem;
    padding: 0.95rem 1rem;
    border-radius: 1.15rem;
    border: 1px solid rgba(255, 255, 255, 0.04);
    background: radial-gradient(circle at 0% 0%, rgba(255,255,255,0.03), transparent 55%),
      rgba(7, 8, 14, 0.96);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.72);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    align-items: center;
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: rgba(90, 209, 255, 0.30);
    box-shadow: 0 26px 55px rgba(0, 0, 0, 0.82);
  }

  .icon :global(svg) {
    width: 22px;
    height: 22px;
    fill: rgba(90, 209, 255, 0.92);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .labelRow {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: baseline;
  }

  .label {
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .chev {
    color: rgba(244, 239, 214, 0.55);
    font-size: 0.9rem;
  }

  .sub {
    color: rgba(244, 239, 214, 0.68);
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 860px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .hero {
      grid-template-columns: 72px minmax(0, 1fr);
    }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 1rem;
    }
  }
</style>
