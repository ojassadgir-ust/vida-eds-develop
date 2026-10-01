export default function decorate(block) {
  if (window?.origin?.includes('author')) {
    return;
  }

  const rows = [...block.children];
  const fields = rows.map((row) => row.firstElementChild || row);

  const desktopImage = fields[0]?.querySelector('img');
  const tabletImage = fields[1]?.querySelector('img');
  const mobileImage = fields[2]?.querySelector('img');

  let heading = '';
  let ctaHtml = '';

  if (fields[3]) {
    const contentRow = rows[3];
    const children = [...contentRow.children];

    if (children.length >= 2) {
      heading = children[0]?.textContent?.trim() || '';
      ctaHtml = children[1]?.innerHTML?.trim() || '';
    } else {
      heading = fields[3]?.textContent?.trim() || '';
      ctaHtml = fields[4]?.innerHTML?.trim() || '';
    }
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
    } else {
      const text = ctaWrapper.textContent?.trim();
      if (text) {
        const buttonLink = document.createElement('a');
        buttonLink.className = 'app-promo-button';
        buttonLink.href = '#';
        buttonLink.textContent = text;
        ctaWrapper.replaceChildren(buttonLink);
      }
    }
    content.append(ctaWrapper);
  }

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'app-promo-image';

  const picture = document.createElement('picture');

  if (mobileImage) {
    const source = document.createElement('source');
    source.media = '(max-width: 767px)';
    source.srcset = mobileImage.currentSrc || mobileImage.src;
    picture.append(source);
  }

  if (tabletImage) {
    const source = document.createElement('source');
    source.media = '(min-width: 768px) and (max-width: 1023px)';
    source.srcset = tabletImage.currentSrc || tabletImage.src;
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
