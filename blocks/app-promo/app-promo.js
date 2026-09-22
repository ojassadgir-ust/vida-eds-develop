export default function decorate(block) {
  /*
   * Expected authoring order:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = Title
   * 3 = CTA Label
   * 4 = CTA Link
   */

  const rows = [...block.children];

  const desktopImageRow = rows[0];
  const mobileImageRow = rows[1];
  const titleRow = rows[2];
  const ctaLabelRow = rows[3];
  const ctaLinkRow = rows[4];

  /*
   * Get authored images.
   */

  const desktopImage = desktopImageRow?.querySelector('img');
  const mobileImage = mobileImageRow?.querySelector('img');

  /*
   * Get authored text values.
   */

  const title = titleRow?.textContent.trim()
    || 'Do more with our Connected App';

  const ctaLabel = ctaLabelRow?.textContent.trim()
    || 'Explore App';

  /*
   * CTA link.
   *
   * Depending on how the value is authored,
   * it may be available as an <a> or as text.
   */

  const ctaLinkElement = ctaLinkRow?.querySelector('a');

  const ctaLink = ctaLinkElement?.href
    || ctaLinkRow?.textContent.trim()
    || '#';

  /*
   * ==========================================
   * CREATE RESPONSIVE IMAGE
   * ==========================================
   */

  const picture = document.createElement('picture');

  /*
   * Mobile image
   */

  if (mobileImage?.src) {
    const mobileSource = document.createElement('source');

    mobileSource.media = '(max-width: 767px)';
    mobileSource.srcset = mobileImage.src;

    picture.append(mobileSource);
  }

  /*
   * Desktop image
   */

  if (desktopImage?.src) {
    const image = document.createElement('img');

    image.src = desktopImage.src;

    image.alt = desktopImage.alt
      || '';

    /*
     * Banner is likely above the fold.
     */
    image.loading = 'eager';
    image.fetchPriority = 'high';

    picture.append(image);
  }

  /*
   * ==========================================
   * IMAGE CONTAINER
   * ==========================================
   */

  const media = document.createElement('div');

  media.className = 'app-promo__media';

  media.append(picture);

  /*
   * ==========================================
   * CONTENT OVER IMAGE
   * ==========================================
   */

  const content = document.createElement('div');

  content.className = 'app-promo__content';

  /*
   * Title
   */

  const heading = document.createElement('h2');

  heading.className = 'app-promo__title';

  heading.textContent = title;

  /*
   * CTA
   *
   * <a> is used because this is a navigation link.
   */

  const cta = document.createElement('a');

  cta.className = 'app-promo__button';

  cta.href = ctaLink;

  cta.textContent = ctaLabel;

  /*
   * Add title and CTA.
   */

  content.append(
    heading,
    cta,
  );

  /*
   * ==========================================
   * FINAL BLOCK
   * ==========================================
   */

  block.replaceChildren(
    media,
    content,
  );
}
