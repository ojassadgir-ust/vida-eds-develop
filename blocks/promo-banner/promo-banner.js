function resolvePicture(...candidates) {
  const source = candidates.find((el) => el?.querySelector('picture'));
  return source ? source.querySelector('picture').cloneNode(true) : null;
}

function addPicture(media, picture, className) {
  if (!picture) {
    return;
  }
  picture.classList.add(className);
  const img = picture.querySelector('img');
  if (img) {
    img.loading = 'lazy';
    img.decoding = 'async';
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

  addPicture(
    media,
    resolvePicture(desktopImage, tabletImage, mobileImage),
    'promo-banner-desktop-picture',
  );
  addPicture(
    media,
    resolvePicture(tabletImage, desktopImage, mobileImage),
    'promo-banner-tablet-picture',
  );
  addPicture(
    media,
    resolvePicture(mobileImage, desktopImage, tabletImage),
    'promo-banner-mobile-picture',
  );

  return media;
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
    textWrapper.appendChild(heading);
  }

  const subheading = createRichText(subheadingField, 'p', 'promo-banner-subheading');
  if (subheading) {
    textWrapper.appendChild(subheading);
  }

  block.replaceChildren(media, textWrapper);
}
