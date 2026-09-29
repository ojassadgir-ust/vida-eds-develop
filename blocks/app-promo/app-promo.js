export default function decorate(block) {
  const isAuthor = window?.origin !== undefined && window?.origin.includes('author');

  if (isAuthor) {
    return;
  }

  /**
   * 4-Field Structure:
   *
   * 0 = Background Color
   * 1 = Heading
   * 2 = CTA
   * 3 = Images (desktop, tablet, mobile)
   */
  const rows = [...block.children];

  const fields = rows.map(
    (row) => row.firstElementChild || row,
  );

  const bgColor = fields[0]?.textContent?.trim() || '';
  const heading = fields[1]?.textContent?.trim() || '';
  const ctaHtml = fields[2]?.innerHTML?.trim() || '';

  const images = fields[3]?.querySelectorAll('img') || [];
  const desktopImage = images[0] || null;
  const tabletImage = images[1] || null;
  const mobileImage = images[2] || null;

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
