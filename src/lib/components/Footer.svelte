<svelte:head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</svelte:head>

<section class="footer-container">
  <nav class="footer-nav">
    <a href="https://www.linkedin.com/in/isa-murray/" aria-label="LinkedIn" class="social-link fab fa-linkedin"></a>
    <a href="https://github.com/IsaiahJMurray" aria-label="Github" class="social-link fab fa-github"></a>
    <a href="https://www.instagram.com/isaiah.murray1/" aria-label="Instagram" class="social-link fab fa-instagram"></a>
    <a href="mailto:isaiah.j.murray@gmail.com" aria-label="Email" class="social-link fas fa-envelope"></a>
    <a href="https://cambridge.nuvustudio.com/users/isa-murray" aria-label="Profile" class="social-link fas fa-user"></a>
  </nav>
</section>

<style>
  a {
    color: #FDF6D6;
  }

  .footer-container {
    background-color: #030302;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    height: 50px;
    font-family: 'Arial', sans-serif; /* Ensure font renders correctly */
    position: relative;
  }

  .footer-nav {
    display: flex;
    gap: 20px;
  }

  .social-link {
    color: #FDF6D6;
    font-size: 32px;
    text-decoration: none;
    transition: all 0.3s;
  }

  .social-link:hover {
    color: #FDF6D6;
    scale: 1.1;
  }

  .build-info {
    color: #030302; /* Same color as the background */
    transition: color 0.3s;
  }

  .footer-container:hover .build-info {
    color: #FDF6D6; /* Show text when hovered */
  }

  @media (max-width: 991px) {
    .footer-container {
      padding-right: 20px;
      justify-content: space-between;
    }

    .footer-nav {
      flex-wrap: wrap;
    }
  }
</style>
