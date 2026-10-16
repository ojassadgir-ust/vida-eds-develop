function resolvePicture(...candidates) {
  const source = candidates.find((el) => el?.querySelector('picture'));
  return source ? source.querySelector('picture').cloneNode(true) : null;
}

function addPicture(media, picture, className, eager) {
  if (!picture) {
    return;
  }
  picture.classList.add(className);
  const img = picture.querySelector('img');
  if (img) {
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (eager) {
      img.fetchPriority = 'high';
    }
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', '');
    }
  }
  media.appendChild(picture);
}

// One picture per breakpoint; CSS shows only the matching variant at a time.
function createMedia(desktopImage, tabletImage, mobileImage) {
  const media = document.createElement('div');
  media.className = 'promo-banner-media';
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;

  addPicture(
    media,
    resolvePicture(desktopImage, tabletImage, mobileImage),
    'promo-banner-desktop-picture',
    isDesktop,
  );
  addPicture(
    media,
    resolvePicture(tabletImage, desktopImage, mobileImage),
    'promo-banner-tablet-picture',
    isTablet,
  );
  addPicture(
    media,
    resolvePicture(mobileImage, desktopImage, tabletImage),
    'promo-banner-mobile-picture',
    !isDesktop && !isTablet,
  );

  return media;
}

function formatPromoHeading(heading) {
  const finalEmphasis = [...heading.querySelectorAll('strong')]
    .find((element) => element.textContent.trim().startsWith('VX2 PLUS'));
  if (!finalEmphasis || !heading.textContent.includes('\u2028')) {
    return;
  }

  const lines = [];
  let line = document.createElement('span');
  line.className = 'promo-banner-heading-line';
  lines.push(line);

  [...heading.childNodes].forEach((node) => {
    if (node === finalEmphasis) {
      const previousText = line.lastChild;
      if (previousText?.nodeType === Node.TEXT_NODE
        && /\bwith\s*$/i.test(previousText.textContent)) {
        previousText.textContent = previousText.textContent.replace(/\bwith\s*$/i, '');
        line = document.createElement('span');
        line.className = 'promo-banner-heading-line';
        line.append('WITH ', node);
        lines.push(line);
      } else {
        line.append(node);
      }
      return;
    }

    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.includes('\u2028')) {
      line.append(node);
      return;
    }

    node.textContent.split('\u2028').forEach((part, index, parts) => {
      if (part) {
        line.append(document.createTextNode(part));
      }
      if (index < parts.length - 1) {
        line = document.createElement('span');
        line.className = 'promo-banner-heading-line';
        lines.push(line);
      }
    });
  });

  heading.replaceChildren(...lines);
}

// Clones the authored rich text's inline markup (e.g. <strong> for bold words)
// into a fresh heading/paragraph element, so Universal Editor's own wrapping
// <p> doesn't end up invalidly nested inside our <h2>.
function createRichText(field, tagName, className) {
  if (!field) {
    return null;
  }
  const source = field.querySelector('p') || field;
  if (!source.textContent.trim()) {
    return null;
  }
  const el = document.createElement(tagName);
  el.className = className;
  el.innerHTML = source.innerHTML;
  return el;
}

export default function decorate(block) {
  if (!block) {
    return;
  }

  // Universal Editor renders authoring fields itself; skip our markup there.
  if (window.origin?.includes('author')) {
    return;
  }

  const children = Array.from(block.children);
  const [desktopImageRow, tabletImageRow, mobileImageRow, textRow] = children;
  const [headingField, subheadingField] = Array.from(textRow?.children || []);
  const desktopImage = desktopImageRow?.firstElementChild || null;
  const tabletImage = tabletImageRow?.firstElementChild || null;
  const mobileImage = mobileImageRow?.firstElementChild || null;

  const media = createMedia(desktopImage, tabletImage, mobileImage);

  const textWrapper = document.createElement('div');
  textWrapper.className = 'promo-banner-text';

  const heading = createRichText(headingField, 'h2', 'promo-banner-heading');
  if (heading) {
    formatPromoHeading(heading);
    textWrapper.appendChild(heading);
  }

  const subheading = createRichText(subheadingField, 'p', 'promo-banner-subheading');
  if (subheading) {
    textWrapper.appendChild(subheading);
  }

  block.replaceChildren(media, textWrapper);
}
