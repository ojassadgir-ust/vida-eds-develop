/* Must match the breakpoint used in pdp-removable-batteries.css */
const DESKTOP_MQ = '(min-width: 1024px)';

/* Local copy so the block never breaks if scripts.js does not export it */
function moveInstrumentation(from, to) {
  if (!from || !to) return;
  [...from.attributes]
    .filter(({ name }) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'))
    .forEach(({ name, value }) => {
      to.setAttribute(name, value);
      from.removeAttribute(name);
    });
}

const getText = (cell) => cell?.textContent.trim() || '';

function describeImage(img) {
  const raw = img?.getAttribute('src');
  if (!raw) return null;
  const url = new URL(raw, window.location.href);
  const sameOrigin = url.origin === window.location.origin;
  const ext = url.pathname.split('.').pop().toLowerCase();
  const optimizable = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
    && (sameOrigin || /media_/.test(url.pathname));
  return {
    raw: img.currentSrc || url.href,
    base: sameOrigin ? url.pathname : `${url.origin}${url.pathname}`,
    ext,
    optimizable,
  };
}

const toSrcset = (base, widths, format) => widths
  .map((w) => `${base}?width=${w}&format=${format}&optimize=medium ${w}w`)
  .join(', ');

/** One <picture>: desktop image from 1024px up, mobile image below. */
function buildPicture(desktopCell, mobileCell, alt, eager) {
  const desktopImg = desktopCell?.querySelector('img');
  const mobileImg = mobileCell?.querySelector('img');
  const desktop = describeImage(desktopImg) || describeImage(mobileImg);
  const mobile = describeImage(mobileImg) || describeImage(desktopImg);
  if (!desktop || !mobile) return null;

  const desktopWidths = [900, 1400, 2000];
  const mobileWidths = [440, 880, 1200];
  const desktopSizes = 'min(55.556vw, 800px)';
  const mobileSizes = 'min(100vw, 440px)';

  const picture = document.createElement('picture');
  const addSource = ({
    media, sizes, srcset, type,
  }) => {
    const source = document.createElement('source');
    if (type) source.type = type;
    if (media) source.media = media;
    if (sizes) source.sizes = sizes;
    source.srcset = srcset;
    picture.append(source);
  };

  if (desktop.optimizable) {
    addSource({
      media: DESKTOP_MQ, sizes: desktopSizes, type: 'image/webp', srcset: toSrcset(desktop.base, desktopWidths, 'webply'),
    });
    addSource({
      media: DESKTOP_MQ,
      sizes: desktopSizes,
      srcset: toSrcset(desktop.base, desktopWidths, desktop.ext),
    });
  } else {
    addSource({ media: DESKTOP_MQ, srcset: desktop.raw });
  }

  const img = document.createElement('img');
  img.alt = alt || desktopImg?.alt || mobileImg?.alt || '';
  img.decoding = 'async';
  img.draggable = false;
  img.loading = eager ? 'eager' : 'lazy';
  if (eager) img.fetchPriority = 'high';

  if (mobile.optimizable) {
    addSource({
      sizes: mobileSizes, type: 'image/webp', srcset: toSrcset(mobile.base, mobileWidths, 'webply'),
    });
    img.sizes = mobileSizes;
    img.srcset = toSrcset(mobile.base, mobileWidths, mobile.ext);
    img.src = `${mobile.base}?width=${mobileWidths[mobileWidths.length - 1]}&format=${mobile.ext}&optimize=medium`;
  } else {
    img.src = mobile.raw;
  }

  if (desktopImg) moveInstrumentation(desktopImg, img);
  picture.append(img);
  return picture;
}

function buildIcon(cell) {
  const src = describeImage(cell?.querySelector('img'));
  if (!src) return null;
  const img = document.createElement('img');
  img.alt = ''; // decorative: the card title carries the meaning
  img.width = 24;
  img.height = 24;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = src.optimizable ? `${src.base}?width=96&format=webply&optimize=medium` : src.raw;
  const original = cell.querySelector('img');
  moveInstrumentation(original, img);
  return img;
}

/*
* Parent rows (1 cell each)
*   DA   (7): mobileImage | desktopImage | desktopImageAlt | heading | subheading |
*             ctaLabel | ctaLink
*   xwalk(6): mobileImage | desktopImage | heading | subheading | ctaLabel | ctaLink
*             (alt collapses into the image)
* Card rows (3 cells): title | description | icon
*/
export default function decorate(block) {
  const rows = [...block.children];
  let parentCount = rows.findIndex((row) => row.children.length > 1);
  if (parentCount === -1) parentCount = rows.length;
  if (parentCount === 0) parentCount = 7;

  const parentRows = rows.slice(0, parentCount);
  const cardRows = rows.slice(parentCount);

  let mobileRow;
  let desktopRow;
  let altRow;
  let headingRow;
  let subRow;
  let ctaLabelRow;
  let ctaLinkRow;
  if (parentRows.length >= 7) {
    [mobileRow, desktopRow, altRow, headingRow, subRow, ctaLabelRow, ctaLinkRow] = parentRows;
  } else {
    [mobileRow, desktopRow, headingRow, subRow, ctaLabelRow, ctaLinkRow] = parentRows;
  }
  const cellOf = (row) => row?.firstElementChild;

  const isFirstSection = block.closest('.section') === document.querySelector('main .section');

  const inner = document.createElement('div');
  inner.className = 'pdp-removable-batteries-inner';

  /* heading + subheading */
  const heading = document.createElement('h2');
  heading.className = 'pdp-removable-batteries-heading';
  heading.textContent = getText(cellOf(headingRow));
  if (cellOf(headingRow)) {
    moveInstrumentation(cellOf(headingRow).firstElementChild || cellOf(headingRow), heading);
  }

  const sub = document.createElement('p');
  sub.className = 'pdp-removable-batteries-subheading';
  sub.textContent = getText(cellOf(subRow));
  if (cellOf(subRow)) {
    moveInstrumentation(cellOf(subRow).firstElementChild || cellOf(subRow), sub);
  }

  inner.append(heading);
  if (sub.textContent) inner.append(sub);

  /* image (mobile: overlaps the text, desktop: in the right grid column) */
  const picture = buildPicture(
    cellOf(desktopRow),
    cellOf(mobileRow),
    getText(cellOf(altRow)),
    isFirstSection,
  );
  if (picture) {
    const media = document.createElement('div');
    media.className = 'pdp-removable-batteries-media';
    media.append(picture);
    inner.append(media);
  }

  /* cards */
  const list = document.createElement('ul');
  list.className = 'pdp-removable-batteries-cards';
  cardRows.forEach((row) => {
    const [titleCell, descCell, iconCell] = [...row.children];
    const li = document.createElement('li');
    li.className = 'pdp-removable-batteries-card';
    moveInstrumentation(row, li);

    const icon = buildIcon(iconCell);
    const iconWrap = document.createElement('span');
    iconWrap.className = 'pdp-removable-batteries-card-icon';
    if (icon) iconWrap.append(icon);

    const divider = document.createElement('span');
    divider.className = 'pdp-removable-batteries-card-divider';
    divider.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'pdp-removable-batteries-card-body';

    const title = getText(titleCell);
    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'pdp-removable-batteries-card-title';
      h3.textContent = title;
      if (titleCell.firstElementChild) moveInstrumentation(titleCell.firstElementChild, h3);
      body.append(h3);
    }
    const desc = getText(descCell);
    if (desc) {
      const p = document.createElement('p');
      p.className = 'pdp-removable-batteries-card-text';
      p.textContent = desc;
      if (descCell.firstElementChild) moveInstrumentation(descCell.firstElementChild, p);
      body.append(p);
    }

    li.append(iconWrap, divider, body);
    list.append(li);
  });
  if (list.children.length) inner.append(list);

  /* CTA */
  const label = getText(cellOf(ctaLabelRow));
  const linkEl = cellOf(ctaLinkRow)?.querySelector('a');
  const href = linkEl?.getAttribute('href') || getText(cellOf(ctaLinkRow));
  if (label && href) {
    const cta = document.createElement('a');
    cta.className = 'button button-primary button-sm pdp-removable-batteries-cta';
    cta.href = href;
    cta.textContent = label;
    if (linkEl) moveInstrumentation(linkEl, cta);
    inner.append(cta);
  }

  block.replaceChildren(inner);
}
