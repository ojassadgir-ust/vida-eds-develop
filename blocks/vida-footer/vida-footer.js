export default function decorate(block) {
  const footer = document.createElement('footer');
  footer.className = 'vida-footer';

  footer.innerHTML = `
      <div class="vida-footer-container">
  
        <div class="vida-footer-top">
          <h2>VIDA Electric Scooters in India</h2>
          <button class="vida-footer-toggle" type="button" aria-label="Toggle footer">
            +
          </button>
        </div>
  
        <div class="vida-footer-divider"></div>
  
        <div class="vida-footer-main">
  
          <div class="vida-footer-brand">
  
            <div class="vida-footer-logos">
              <div class="vida-logo">VIDA</div>
  
              <div class="hero-logo">
                <span>Powered by</span>
                <strong>▸Hero</strong>
              </div>
            </div>
  
            <address>
              Hero MotoCorp Limited,<br>
              The Grand Plaza, Plot No.2,<br>
              Nelson Mandela Road, Vasant Kunj,<br>
              Phase - II, New Delhi - 110070
            </address>
  
            <a class="footer-contact" href="tel:18002668432">
              18002668432
            </a>
  
            <a
              class="footer-contact"
              href="mailto:response@support.vidaworld.com"
            >
              response@support.vidaworld.com
            </a>
  
            <div class="vida-footer-social">
              <p>Follow us</p>
  
              <div class="social-icons">
                <a href="#" aria-label="Facebook">
                  <span>f</span>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <span>in</span>
                </a>
                <a href="#" aria-label="X">
                  <span>𝕏</span>
                </a>
                <a href="#" aria-label="YouTube">
                  <span>▶</span>
                </a>
                <a href="#" aria-label="Instagram">
                  <span>◎</span>
                </a>
              </div>
            </div>
  
          </div>
  
          <div class="vida-footer-navigation">
  
            <div class="footer-column">
              <h3>Try</h3>
              <a href="#">V2 Pro</a>
              <a href="#">V2 Plus</a>
              <a href="#">V2 Lite</a>
              <a href="#">Book Test Ride</a>
              <a href="#">Dealers Locator</a>
            </div>
  
            <div class="footer-column">
              <h3>Buy</h3>
              <a href="#">Reserve @ ₹499</a>
              <a href="#">Buy a VIDA</a>
              <a href="#">Subscriptions</a>
              <a href="#">Savings Calculator</a>
              <a href="#">Offers</a>
            </div>
  
            <div class="footer-column">
              <h3>Love</h3>
              <a href="#">Make Way</a>
              <a href="#">Blogs</a>
              <a href="#">Vida Community</a>
            </div>
  
            <div class="footer-column">
              <h3>Explore</h3>
              <a href="#">Accessories</a>
              <a href="#">Charging Network</a>
              <a href="#">Charging Locator</a>
              <a href="#">Service</a>
              <a href="#">Battery+</a>
              <a href="#">FAQs</a>
            </div>
  
            <div class="footer-column">
              <h3>Support</h3>
              <a href="#">About Us</a>
              <a href="#">Contact Us</a>
            </div>
  
          </div>
        </div>
  
        <div class="vida-footer-locations">
          <a href="#">Electric Scooter in Chennai</a>
          <a href="#">Electric Scooter in Pune</a>
          <a href="#">Electric Scooter in Delhi</a>
          <a href="#">Electric Scooter in Mumbai</a>
          <a href="#">Electric Scooter in Bengaluru</a>
        </div>
  
        <div class="vida-footer-divider footer-bottom-divider"></div>
  
        <div class="vida-footer-bottom">
  
          <div class="footer-legal">
            <a href="#">Terms Of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Sitemap</a>
          </div>
  
          <div class="footer-copyright">
            ©2023-2024 VIDA World
          </div>
  
        </div>
  
      </div>
    `;

  block.replaceChildren(footer);

  const toggle = footer.querySelector('.vida-footer-toggle');
  const main = footer.querySelector('.vida-footer-main');

  if (toggle && main) {
    toggle.addEventListener('click', () => {
      const collapsed = main.classList.toggle('is-collapsed');
      toggle.textContent = collapsed ? '+' : '−';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }
}
