/* Must match the breakpoint used in performance-ride-experience.css */
const DESKTOP_MQ = '(min-width: 900px)';
const MOBILE_MQ = '(max-width: 899px)';
const DEFAULT_TIMEOUT_SECONDS = 0; // 0 = no auto scroll unless an author sets a timeout
const DRAG_THRESHOLD = 40; // px a mouse drag must travel to move to the next / previous card

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

function getText(cell) {
  return cell?.textContent.trim() || '';
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

function describeImage(img) {
  if (!img) return null;
  const raw = img.getAttribute('src');
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

/**
 * Builds ONE <picture>: desktop image from 900px up, mobile image below.
 * Right-sized srcsets keep the payload (and Lighthouse) happy.
 */
function buildPicture(desktopCell, mobileCell, opts) {
  const {
    alt, eager, desktopWidths, mobileWidths, desktopSizes, mobileSizes,
  } = opts;

  const desktopImg = desktopCell?.querySelector('img');
  const mobileImg = mobileCell?.querySelector('img');
  const desktop = describeImage(desktopImg) || describeImage(mobileImg);
  const mobile = describeImage(mobileImg) || describeImage(desktopImg);
  if (!desktop || !mobile) return null;

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
      media: DESKTOP_MQ,
      sizes: desktopSizes,
      type: 'image/webp',
      srcset: toSrcset(desktop.base, desktopWidths, 'webply'),
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
      sizes: mobileSizes,
      type: 'image/webp',
      srcset: toSrcset(mobile.base, mobileWidths, 'webply'),
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

/* ------------------------------------------------------------------ */
/* Mobile carousel: swipe (native), mouse drag, keyboard, auto scroll  */
/* ------------------------------------------------------------------ */

function setupCarousel(track, seconds) {
  const cards = [...track.children];
  if (!cards.length) return;

  const mobile = window.matchMedia(MOBILE_MQ);
  const desktop = window.matchMedia(DESKTOP_MQ);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const positions = () => cards.map((c) => c.offsetLeft - cards[0].offsetLeft);
  const nearestIndex = (left) => {
    const pos = positions();
    return pos.reduce(
      (best, p, i) => (Math.abs(p - left) < Math.abs(pos[best] - left) ? i : best),
      0,
    );
  };
  const goTo = (index) => {
    const pos = positions();
    const i = Math.max(0, Math.min(cards.length - 1, index));
    track.scrollTo({ left: pos[i], behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };

  /* keyboard access (mobile only) */
  const syncA11y = () => {
    if (mobile.matches) track.setAttribute('tabindex', '0');
    else track.removeAttribute('tabindex');
  };
  syncA11y();
  mobile.addEventListener('change', syncA11y);

  track.addEventListener('keydown', (e) => {
    if (!mobile.matches) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(nearestIndex(track.scrollLeft) + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(nearestIndex(track.scrollLeft) - 1);
    }
  });

  /* mouse drag (touch already scrolls natively) */
  let dragId = null;
  let dragStartX = 0;
  let dragStartLeft = 0;

  track.addEventListener('pointerdown', (e) => {
    if (!mobile.matches || e.pointerType !== 'mouse' || e.button !== 0) return;
    dragId = e.pointerId;
    dragStartX = e.clientX;
    dragStartLeft = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId) return;
    track.scrollLeft = dragStartLeft - (e.clientX - dragStartX);
  });

  const endDrag = (e) => {
    if (e.pointerId !== dragId) return;
    const moved = dragStartX - e.clientX;
    const start = nearestIndex(dragStartLeft);
    dragId = null;
    if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);

    let target = start;
    if (moved > DRAG_THRESHOLD) target = start + 1;
    else if (moved < -DRAG_THRESHOLD) target = start - 1;
    goTo(target);
    // re-enable scroll snapping once the settle animation has finished
    setTimeout(() => track.classList.remove('is-dragging'), 400);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('lostpointercapture', endDrag);

  /* auto scroll: mobile only, only when a timeout was authored */
  if (cards.length < 2 || seconds <= 0) return;

  let timer = null;
  let inView = false;
  let interacting = false;

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  const next = () => {
    const { scrollLeft, clientWidth, scrollWidth } = track;
    const current = nearestIndex(scrollLeft);
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    goTo(atEnd || current >= cards.length - 1 ? 0 : current + 1);
  };

  const update = () => {
    stop();
    const canRun = inView && !interacting && !document.hidden
      && !desktop.matches && !reducedMotion.matches;
    if (canRun) timer = setInterval(next, seconds * 1000);
  };

  const pause = () => { interacting = true; update(); };
  const resume = () => { interacting = false; update(); };

  ['touchstart', 'mouseenter', 'focusin'].forEach((evt) => track.addEventListener(evt, pause, { passive: true }));
  ['touchend', 'touchcancel', 'mouseleave', 'focusout'].forEach((evt) => track.addEventListener(evt, resume, { passive: true }));

  desktop.addEventListener('change', update);
  reducedMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);

  new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    update();
  }, { threshold: 0.4 }).observe(track);
}

/* ------------------------------------------------------------------ */
/* Decorate                                                            */
/*                                                                     */
/* Parent rows (1 cell each):                                          */
/*   DA  : heading | desktopImage | desktopImageAlt | mobileImage | timeout */
/*   xwalk (alt collapsed into the image): heading | desktopImage | mobileImage | timeout */
/* Card rows:                                                          */
/*   DA  : desktopImage | alt | mobileImage | title | subtext          */
/*   xwalk: desktopImage | mobileImage | title | subtext               */
/* ------------------------------------------------------------------ */

export default function decorate(block) {
  const rows = [...block.children];
  let parentCount = rows.findIndex((row) => row.children.length > 1);
  if (parentCount === -1) parentCount = rows.length;
  if (parentCount === 0) parentCount = 5;

  const parentRows = rows.slice(0, parentCount);
  const cardRows = rows.slice(parentCount);

  let headingRow;
  let desktopRow;
  let altRow;
  let mobileRow;
  let timeoutRow;
  if (parentRows.length >= 5) {
    [headingRow, desktopRow, altRow, mobileRow, timeoutRow] = parentRows;
  } else {
    [headingRow, desktopRow, mobileRow, timeoutRow] = parentRows;
  }
  const cellOf = (row) => row?.firstElementChild;

  const isFirstSection = block.closest('.section') === document.querySelector('main .section');

  /* heading: desktop reads "Ride Experience", mobile reads "Riding Experience" */
  const heading = document.createElement('h2');
  heading.className = 'performance-ride-experience-heading';
  const headingText = getText(cellOf(headingRow));
  const desktopHeading = document.createElement('span');
  desktopHeading.className = 'performance-ride-experience-heading-desktop';
  desktopHeading.textContent = headingText;
  const mobileHeading = document.createElement('span');
  mobileHeading.className = 'performance-ride-experience-heading-mobile';
  mobileHeading.textContent = headingText.replace(/\bRide(?=\s+Experience\b)/u, 'Riding');
  heading.append(desktopHeading, mobileHeading);
  if (cellOf(headingRow)) {
    moveInstrumentation(cellOf(headingRow).firstElementChild || cellOf(headingRow), heading);
  }

  /* big image */
  const hero = document.createElement('div');
  hero.className = 'performance-ride-experience-hero';
  const heroPicture = buildPicture(cellOf(desktopRow), cellOf(mobileRow), {
    alt: getText(cellOf(altRow)),
    eager: isFirstSection,
    desktopWidths: [900, 1400, 2000],
    mobileWidths: [400, 800, 1200],
    desktopSizes: '(min-width: 1442px) 1314px, calc(100vw - 128px)',
    mobileSizes: 'min(408px, calc(100vw - 32px))',
  });
  if (heroPicture) hero.append(heroPicture);

  /* cards */
  const track = document.createElement('ul');
  track.className = 'performance-ride-experience-cards';
  track.setAttribute('aria-label', headingText || 'Performance and ride experience');

  cardRows.forEach((row) => {
    const cells = [...row.children];
    let desktopCell;
    let altCell;
    let mobileCell;
    let titleCell;
    let textCell;
    if (cells.length >= 5) {
      [desktopCell, altCell, mobileCell, titleCell, textCell] = cells;
    } else {
      [desktopCell, mobileCell, titleCell, textCell] = cells;
    }

    const li = document.createElement('li');
    li.className = 'performance-ride-experience-card';
    moveInstrumentation(row, li);

    const picture = buildPicture(desktopCell, mobileCell, {
      alt: getText(altCell),
      eager: false,
      desktopWidths: [450, 900],
      mobileWidths: [400, 800, 1100],
      desktopSizes: '(min-width: 1442px) 422px, calc((100vw - 176px) / 3)',
      mobileSizes: 'min(366px, calc(100vw - 74px))',
    });
    if (picture) {
      const media = document.createElement('div');
      media.className = 'performance-ride-experience-card-media';
      media.append(picture);
      li.append(media);
    }

    const body = document.createElement('div');
    body.className = 'performance-ride-experience-card-body';

    const title = getText(titleCell);
    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'performance-ride-experience-card-title';
      h3.textContent = title;
      if (titleCell?.firstElementChild) moveInstrumentation(titleCell.firstElementChild, h3);
      body.append(h3);
    }

    const text = getText(textCell);
    if (text) {
      const p = document.createElement('p');
      p.className = 'performance-ride-experience-card-text';
      p.textContent = text;
      if (textCell?.firstElementChild) moveInstrumentation(textCell.firstElementChild, p);
      body.append(p);
    }

    li.append(body);
    track.append(li);
  });

  block.replaceChildren(heading, hero, track);

  const parsed = parseFloat(getText(cellOf(timeoutRow)));
  setupCarousel(track, Number.isNaN(parsed) ? DEFAULT_TIMEOUT_SECONDS : parsed);
}
