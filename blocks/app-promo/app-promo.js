export default function decorate(block) {
  const isAuthor = window?.origin !== undefined && window?.origin.includes('author');

  if (isAuthor) {
    return;
  }

  /**
   * Block + Child Structure:
   *
   * Main Block (rows 0-3):
   *   0 = Desktop Image
   *   1 = Tablet Image
   *   2 = Mobile Image
   *   3 = Background Color
   *
   * Child Item (rows 4-5):
   *   4 = Heading
   *   5 = CTA
   */
  const rows = [...block.children];

  const fields = rows.map(
    (row) => row.firstElementChild || row,
  );

  const desktopImage = fields[0]?.querySelector('img');
  const tabletImage = fields[1]?.querySelector('img');
  const mobileImage = fields[2]?.querySelector('img');
  const bgColor = fields[3]?.textContent?.trim() || '';

  const heading = fields[4]?.textContent?.trim() || '';
  const ctaHtml = fields[5]?.innerHTML?.trim() || '';

  if (bgColor) {
    block.style.setProperty(
      '--app-promo-bg',
      bgColor,
    );
  }

  const container = document.createElement('div');

  container.className = 'app-promo-inner';

  const content = document.createElement('div');

  content.className = 'app-promo-content';

  if (heading) {
    const headingEl = document.createElement('h2');

    headingEl.className = 'app-promo-heading';
    headingEl.textContent = heading;

    content.append(headingEl);
  }

  if (ctaHtml) {
    const ctaWrapper = document.createElement('div');

    ctaWrapper.className = 'app-promo-cta';
    ctaWrapper.innerHTML = ctaHtml;

    const ctaLink = ctaWrapper.querySelector('a');

    if (ctaLink) {
      ctaLink.classList.add('app-promo-button');
    }

    content.append(ctaWrapper);
  }

  const imageWrapper = document.createElement('div');

  imageWrapper.className = 'app-promo-image';

  const picture = document.createElement('picture');

  if (mobileImage) {
    const source = document.createElement('source');

    source.media = '(max-width: 767px)';
    source.srcset = mobileImage.currentSrc
      || mobileImage.src;

    picture.append(source);
  }

  if (tabletImage) {
    const source = document.createElement('source');

    source.media = '(min-width: 768px) and (max-width: 1023px)';
    source.srcset = tabletImage.currentSrc
      || tabletImage.src;

    picture.append(source);
  }

  if (desktopImage) {
    const img = desktopImage.cloneNode(true);

    img.removeAttribute('width');
    img.removeAttribute('height');
    img.loading = 'lazy';
    img.decoding = 'async';

    picture.append(img);
  }

  imageWrapper.append(picture);

  container.append(content);
  container.append(imageWrapper);

  block.replaceChildren(container);
}
