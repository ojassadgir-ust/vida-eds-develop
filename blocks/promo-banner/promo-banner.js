function resolvePicture(...candidates) {
  const source = candidates.find((el) => el?.querySelector('picture'));
  return source ? source.querySelector('picture').cloneNode(true) : null;
}

function addPicture(media, picture, className, isPriorityImage) {
  if (!picture) {
    return;
  }
  picture.classList.add(className);
  const img = picture.querySelector('img');
  if (img) {
    img.loading = isPriorityImage ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (isPriorityImage) {
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

function formatHeading(heading, variant) {
  const textNodes = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node = textNodes.nextNode();
  while (node) {
    nodes.push(node);
    node = textNodes.nextNode();
  }

  nodes.forEach((textNode) => {
    if (!textNode.textContent.includes('\u2028')) {
      return;
    }
    const fragment = document.createDocumentFragment();
    const parts = textNode.textContent.split('\u2028');
    parts.forEach((part, index) => {
      if (part) {
        fragment.append(document.createTextNode(part));
      }
      if (index < parts.length - 1) {
        fragment.append(document.createElement('br'));
      }
    });
    textNode.replaceWith(fragment);
  });

  const updatedTextNodes = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  let withNode = updatedTextNodes.nextNode();
  let withIndex = -1;
  while (withNode && withIndex === -1) {
    const match = /\bwith\b/i.exec(withNode.textContent);
    if (match) {
      withIndex = match.index;
      break;
    }
    withNode = updatedTextNodes.nextNode();
  }

  if (withNode && withIndex >= 0) {
    const range = document.createRange();
    range.setStart(withNode, withIndex);
    range.setEnd(heading, heading.childNodes.length);
    range.deleteContents();
  } else {
    const tokenNodes = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    let tokenNode = tokenNodes.nextNode();
    while (tokenNode) {
      const tokenIndex = tokenNode.textContent.indexOf('{{variant}}');
      if (tokenIndex >= 0) {
        const range = document.createRange();
        range.setStart(tokenNode, tokenIndex);
        range.setEnd(tokenNode, tokenIndex + '{{variant}}'.length);
        range.deleteContents();
        break;
      }
      tokenNode = tokenNodes.nextNode();
    }
  }

  const variantNode = document.createElement('span');
  variantNode.className = 'promo-banner-variant';
  variantNode.textContent = variant;
  heading.append(document.createElement('br'), document.createTextNode('WITH '), variantNode);
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
  const [headingField, subheadingField, variantField] = Array.from(textRow?.children || []);
  const desktopImage = desktopImageRow?.firstElementChild || null;
  const tabletImage = tabletImageRow?.firstElementChild || null;
  const mobileImage = mobileImageRow?.firstElementChild || null;
  const variant = variantField?.textContent.trim() || '';

  const media = createMedia(desktopImage, tabletImage, mobileImage);

  const textWrapper = document.createElement('div');
  textWrapper.className = 'promo-banner-text';

  const heading = createRichText(headingField, 'h2', 'promo-banner-heading');
  if (heading) {
    formatHeading(heading, variant);
    textWrapper.appendChild(heading);
  }

  const subheading = createRichText(subheadingField, 'p', 'promo-banner-subheading');
  if (subheading) {
    textWrapper.appendChild(subheading);
  }

  block.replaceChildren(media, textWrapper);
}
