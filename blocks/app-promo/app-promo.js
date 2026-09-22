export default function decorate(block) {
  /*
   * ==========================================
   * FIND THE AUTHORED APP PROMO ROW
   * ==========================================
   *
   * In the current EDS DOM, the block contains
   * some empty rows followed by one row that
   * contains the 4 authored fields.
   *
   * We find the row that contains at least
   * 4 children instead of depending on a
   * hardcoded row number.
   */

  const rows = [...block.children];

  const authoredRow = rows.find((row) => row.children.length >= 4);

  if (!authoredRow) {
    return;
  }

  /*
   * The authored row contains:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = Heading
   * 3 = CTA
   */

  const fields = [...authoredRow.children];

  /*
   * ==========================================
   * READ AUTHORED DATA
   * ==========================================
   */

  const desktopImage = fields[0]?.querySelector('img');
  const mobileImage = fields[1]?.querySelector('img');

  const heading = fields[2]?.textContent?.trim() || '';

  const ctaHtml = fields[3]?.innerHTML?.trim() || '';

  /*
   * Keep all component data together.
   *
   * This makes it easier to replace these
   * values with API data in the future.
   */

  const appPromoData = {
    desktopImage,
    mobileImage,
    heading,
    ctaHtml,
  };

  /*
   * ==========================================
   * MAIN CONTAINER
   * ==========================================
   */

  const container = document.createElement('div');

  container.className = 'app-promo-container';

  /*
   * ==========================================
   * HEADING + CTA
   * ==========================================
   */

  const content = document.createElement('div');

  content.className = 'app-promo-content';

  /*
   * Heading
   */

  if (appPromoData.heading) {
    const headingElement = document.createElement('h2');

    headingElement.className = 'app-promo-heading';

    headingElement.textContent = appPromoData.heading;

    content.append(headingElement);
  }

  /*
   * CTA
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
   * ==========================================
   * IMAGE AREA
   * ==========================================
   */

  const imageWrapper = document.createElement('div');

  imageWrapper.className = 'app-promo-image';

  const picture = document.createElement('picture');

  /*
   * Mobile image
   */

  if (appPromoData.mobileImage) {
    const mobileSource = document.createElement('source');

    mobileSource.media = '(max-width: 767px)';

    mobileSource.srcset = appPromoData.mobileImage.currentSrc || appPromoData.mobileImage.src;

    picture.append(mobileSource);
  }

  /*
   * Desktop image
   */

  if (appPromoData.desktopImage) {
    const desktopImageElement = appPromoData.desktopImage.cloneNode(true);

    desktopImageElement.removeAttribute('width');
    desktopImageElement.removeAttribute('height');

    desktopImageElement.loading = 'lazy';
    desktopImageElement.decoding = 'async';

    picture.append(desktopImageElement);
  }

  imageWrapper.append(picture);

  /*
   * ==========================================
   * FINAL COMPONENT
   * ==========================================
   */

  container.append(content);
  container.append(imageWrapper);

  /*
   * Replace the original EDS authoring rows
   * with the final component.
   */

  block.replaceChildren(container);
}
