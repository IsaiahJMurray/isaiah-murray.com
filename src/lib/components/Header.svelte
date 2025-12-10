<script>
  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  import logo from '$lib/favicon_light.png';
</script>

<header class="header-container">
  <nav class="navigation-bar">
    <a href="/" class="brand" on:click={closeMenu}>
      <img src={logo} alt="Isaiah Murray Logo" class="logo" />
    </a>

    <!-- Mobile menu button -->
    <button
      class="menu-toggle"
      type="button"
      aria-label="Toggle navigation"
      aria-expanded={menuOpen}
      on:click={toggleMenu}
    >
      <span class:open={menuOpen}></span>
      <span class:open={menuOpen}></span>
    </button>

    <!-- Desktop / mobile nav -->
    <ul class="nav-links" class:open={menuOpen}>
      <li><a href="/projects" on:click={closeMenu}>Projects</a></li>
      <li><a href="/resume" on:click={closeMenu}>Resume</a></li>
      <li><a href="/contact" on:click={closeMenu}>Contact</a></li>
    </ul>
  </nav>
</header>

<style>
  .header-container {
    background-color: #03030200;
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0px;
    height: 3.25em;
    position: relative;
    z-index: 20;
  }

  .navigation-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 4em;
    margin: 0 1em 0 0.5em;
  }

  .brand {
    height: 100%;
    text-decoration: none;
    display: flex;
    align-items: center;
    border: none;
  }

  .brand img {
    height: 2em;
    aspect-ratio: 1;
    transition: filter 0.18s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  }

  .brand img:hover {
    filter: brightness(0.5);
  }

  .name-title {
    color: #fefef9;
    font: 700 1.25rem Inter, system-ui, -apple-system, BlinkMacSystemFont,
      sans-serif;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .nav-links {
    display: flex;
    gap: 20px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-links li a {
    color: #fefef9;
    font: 400 0.95rem Inter, sans-serif;
    text-decoration: none;
    transition: color 0.18s ease-in-out, transform 0.18s ease-in-out;
  }

  .nav-links li a:hover {
    color: #ca9679;
    transform: scale(1.05);
  }

  /* --- Mobile styles --- */
  .menu-toggle {
    display: none;
    position: relative;
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid rgba(254, 254, 249, 0);
    border-radius: 999px;
    background: rgba(3, 3, 2, 0);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .menu-toggle span {
    position: absolute;
    width: 1.1rem;
    height: 2px;
    border-radius: 999px;
    background: #fefef9;
    transition: transform 0.18s ease, opacity 0.18s ease, top 0.18s ease;
  }

  .menu-toggle span:first-child {
    top: 0.95rem;
  }

  .menu-toggle span:last-child {
    top: 1.25rem;
  }

  .menu-toggle span.open:first-child {
    transform: rotate(45deg);
    top: 1.1rem;
  }

  .menu-toggle span.open:last-child {
    transform: rotate(-45deg);
    top: 1.1rem;
  }

  @media (max-width: 768px) {
    .header-container {
      padding: 0px;
      height: 3rem;
    }

    .navigation-bar {
      align-items: center;
    }

    .menu-toggle {
      display: inline-flex;
    }

    .nav-links {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      margin-top: 0.35rem;
      padding: 0.6rem 1.1rem 0.9rem;
      background: rgba(5, 6, 8, 0);
      border-bottom: 1px solid rgba(254, 254, 249, 0);
      border-top: 1px solid rgba(254, 254, 249, 0);
      flex-direction: column;
      gap: 0.5rem;
      transform-origin: top;
      transform: scaleY(0.8);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .nav-links.open {
      opacity: 1;
      transform: scaleY(1);
      pointer-events: auto;
    }

    .nav-links li a {
      font-size: 0.9rem;
      padding: 0.15rem 0;
    }
  }
</style>
