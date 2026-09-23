export default function decorate(block) {
  /*
   * =========================================================
   * READ AUTHORED FIELDS
   * =========================================================
   *
   * Expected authoring order:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = Heading
   * 3 = CTA
   *
   * Universal Editor provides the authored fields as rows.
   * We convert those rows into the final App Promo UI.
   */

  const rows = [...block.children];

  /*
   * Get the first element from each authored row.
   * If there is no wrapper, use the row itself.
   */
  const fields = rows.map((row) => row.firstElementChild || row);

  /*
   * =========================================================
   * READ AUTHORED DATA
   * =========================================================
   */

  const desktopImage = fields[0]?.querySelector('img');

  const mobileImage = fields[1]?.querySelector('img');

  const heading = fields[2]?.textContent?.trim() || '';

  const ctaHtml = fields[3]?.innerHTML?.trim() || '';

  /*
   * Keep all component data together.
   *
   * This makes it easier to replace the authored values
   * with API data in the future.
   */
  const appPromoData = {
    desktopImage,
    mobileImage,
    heading,
    ctaHtml,
  };

  /*
   * =========================================================
   * MAIN CONTAINER
   * =========================================================
   */

  const container = document.createElement('div');

  container.className = 'app-promo-container';

  /*
   * =========================================================
   * CONTENT AREA
   * =========================================================
   */

  const content = document.createElement('div');

  content.className = 'app-promo-content';

  /*
   * =========================================================
   * HEADING
   * =========================================================
   */

  if (appPromoData.heading) {
    const headingElement = document.createElement('h2');

    headingElement.className = 'app-promo-heading';

    headingElement.textContent = appPromoData.heading;

    content.append(headingElement);
  }

  /*
   * =========================================================
   * CTA
   * =========================================================
   */

  if (appPromoData.ctaHtml) {
    const ctaWrapper = document.createElement('div');

    ctaWrapper.className = 'app-promo-cta';

    ctaWrapper.innerHTML = appPromoData.ctaHtml;

    const ctaLink = ctaWrapper.querySelector('a');

    if (ctaLink) {
      ctaLink.classList.add('app-promo-button');
    }

    content.append(ctaWrapper);
  }

  /*
   * =========================================================
   * IMAGE AREA
   * =========================================================
   */

  const imageWrapper = document.createElement('div');

  imageWrapper.className = 'app-promo-image';

  const picture = document.createElement('picture');

  /*
   * =========================================================
   * MOBILE IMAGE
   * =========================================================
   */

  if (appPromoData.mobileImage) {
    const mobileSource = document.createElement('source');

    mobileSource.media = '(max-width: 767px)';

    mobileSource.srcset = appPromoData.mobileImage.currentSrc
      || appPromoData.mobileImage.src;

    picture.append(mobileSource);
  }

  /*
   * =========================================================
   * DESKTOP IMAGE
   * =========================================================
   */

  if (appPromoData.desktopImage) {
    const desktopImageElement = appPromoData.desktopImage.cloneNode(true);

    /*
     * Remove authoring dimensions so CSS controls
     * the rendered image size.
     */
    desktopImageElement.removeAttribute('width');
    desktopImageElement.removeAttribute('height');

    desktopImageElement.loading = 'lazy';
    desktopImageElement.decoding = 'async';

    picture.append(desktopImageElement);
  }

  imageWrapper.append(picture);

  /*
   * =========================================================
   * FINAL COMPONENT
   * =========================================================
   */

  container.append(content);
  container.append(imageWrapper);

  /*
   * Replace the original authoring markup
   * with the final rendered component.
   */
  block.replaceChildren(container);
}
