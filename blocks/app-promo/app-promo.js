export default function decorate(block) {
  const isAuthor = window?.origin !== undefined
    && window.origin.includes('author');

  if (isAuthor) {
    return;
  }

  const rows = [...block.children];

  if (rows.length < 4) {
    return;
  }

  /*
   * Read authorable values once.
   * Keeping these values in one object makes it easier
   * to replace EDS data with API data in the future.
   */
  const appPromoData = {
    desktopImage: rows[0]?.querySelector('picture, img'),
    mobileImage: rows[1]?.querySelector('picture, img'),
    heading: rows[2]?.textContent?.trim() || '',
    cta: rows[3]?.innerHTML?.trim() || '',
  };

  block.textContent = '';

  const picture = document.createElement('picture');

  /*
   * Mobile image
   */
  if (appPromoData.mobileImage) {
    const mobileSource = document.createElement('source');

    mobileSource.media = '(max-width: 767px)';
    mobileSource.srcset = appPromoData.mobileImage.currentSrc
      || appPromoData.mobileImage.src;

    picture.append(mobileSource);
  }

  /*
   * Desktop image
   */
  if (appPromoData.desktopImage) {
    const desktopImage = appPromoData.desktopImage.cloneNode(true);

    desktopImage.loading = 'lazy';
    desktopImage.decoding = 'async';

    picture.append(desktopImage);
  }

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'app-promo-image';

  imageWrapper.append(picture);

  /*
   * Content
   */
  const content = document.createElement('div');
  content.className = 'app-promo-content';

  /*
   * Heading
   */
  if (appPromoData.heading) {
    const heading = document.createElement('h2');

    heading.className = 'app-promo-heading';
    heading.textContent = appPromoData.heading;

    content.append(heading);
  }

  /*
   * CTA
   *
   * CTA is rich text so the author can provide:
   *
   * <a href="/example">Explore more</a>
   */
  if (appPromoData.cta) {
    const ctaWrapper = document.createElement('div');

    ctaWrapper.className = 'app-promo-cta';
    ctaWrapper.innerHTML = appPromoData.cta;

    const ctaLink = ctaWrapper.querySelector('a');

    if (ctaLink) {
      ctaLink.classList.add('app-promo-button');

      /*
       * External links open in a new tab.
       */
      if (
        ctaLink.hostname
        && ctaLink.hostname !== window.location.hostname
      ) {
        ctaLink.target = '_blank';
        ctaLink.rel = 'noopener noreferrer';
      }
    }

    content.append(ctaWrapper);
  }

  block.append(imageWrapper);
  block.append(content);
}
