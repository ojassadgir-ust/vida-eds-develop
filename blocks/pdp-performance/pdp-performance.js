import { moveInstrumentation } from '../../scripts/scripts.js';

/* Must match the breakpoint used in performance-ride-experience.css */
const DESKTOP_MQ = '(min-width: 900px)';
const DEFAULT_TIMEOUT_SECONDS = 5;

/**
 * Builds ONE <picture> that serves the desktop image from 900px up
 * and the mobile image below that. Falls back to whichever image exists.
 */
function buildPicture(desktopCell, mobileCell, { desktopWidth, mobileWidth }) {
  const desktopImg = desktopCell?.querySelector('img');
  const mobileImg = mobileCell?.querySelector('img');
  const primary = desktopImg || mobileImg;
  if (!primary) return null;

  const desktopSrc = (desktopImg || mobileImg).getAttribute('src');
  const mobileSrc = (mobileImg || desktopImg).getAttribute('src');

  const parse = (src) => {
    const { pathname } = new URL(src, window.location.href);
    return { pathname, ext: pathname.split('.').pop() };
  };
  const desktop = parse(desktopSrc);
  const mobile = parse(mobileSrc);

  const picture = document.createElement('picture');

  const addSource = ({ pathname, ext }, width, media, webp) => {
    const source = document.createElement('source');
    if (webp) source.type = 'image/webp';
    if (media) source.media = media;
    const format = webp ? 'webply' : ext;
    source.srcset = `${pathname}?width=${width}&format=${format}&optimize=medium`;
    picture.append(source);
  };

  addSource(desktop, desktopWidth, DESKTOP_MQ, true);
  addSource(desktop, desktopWidth, DESKTOP_MQ, false);
  addSource(mobile, mobileWidth, null, true);

  const img = document.createElement('img');
  img.src = `${mobile.pathname}?width=${mobileWidth}&format=${mobile.ext}&optimize=medium`;
  img.alt = desktopImg?.alt || mobileImg?.alt || '';
  img.loading = 'lazy';
  if (desktopImg) moveInstrumentation(desktopImg, img);
  picture.append(img);

  return picture;
}

function getText(cell) {
  return cell?.textContent.trim() || '';
}

/**
 * Auto-scroll for the MOBILE carousel only.
 * - runs only below the desktop breakpoint
 * - only while the carousel is on screen and the tab is visible
 * - pauses while the user touches / hovers / focuses inside it
 * - disabled for prefers-reduced-motion or when timeout is 0
 */
function setupAutoScroll(track, seconds) {
  const cards = [...track.children];
  if (cards.length < 2 || seconds <= 0) return;

  const desktop = window.matchMedia(DESKTOP_MQ);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let timer = null;
  let inView = false;
  let interacting = false;

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  const next = () => {
    const positions = cards.map((c) => c.offsetLeft - cards[0].offsetLeft);
    const { scrollLeft, clientWidth, scrollWidth } = track;
    const current = positions.reduce(
      (best, pos, i) => (
        Math.abs(pos - scrollLeft) < Math.abs(positions[best] - scrollLeft) ? i : best
      ),
      0,
    );
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    const target = atEnd || current >= cards.length - 1 ? 0 : current + 1;
    track.scrollTo({ left: positions[target], behavior: 'smooth' });
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

/**
 * Authored structure (xwalk) – parent fields come first, then one row per card:
 *   row 1: heading
 *   row 2: desktop hero image
 *   row 3: mobile hero image
 *   row 4: mobile carousel timeout (seconds)
 *   row 5+: card -> [desktop image | mobile image | title | subtext]
 */
export default function decorate(block) {
  const [headingRow, desktopRow, mobileRow, timeoutRow, ...cardRows] = [...block.children];
  const cellOf = (row) => row?.firstElementChild;

  /* heading */
  const heading = document.createElement('h2');
  heading.className = 'pre-heading';
  heading.textContent = getText(cellOf(headingRow));
  if (cellOf(headingRow)) {
    moveInstrumentation(cellOf(headingRow).firstElementChild || cellOf(headingRow), heading);
  }

  /* hero image */
  const hero = document.createElement('div');
  hero.className = 'pre-hero';
  const heroPicture = buildPicture(cellOf(desktopRow), cellOf(mobileRow), {
    desktopWidth: 2000,
    mobileWidth: 1200,
  });
  if (heroPicture) hero.append(heroPicture);

  /* cards */
  const track = document.createElement('ul');
  track.className = 'pre-cards';

  cardRows.forEach((row) => {
    const [desktopCell, mobileCell, titleCell, textCell] = [...row.children];

    const li = document.createElement('li');
    li.className = 'pre-card';
    moveInstrumentation(row, li);

    const picture = buildPicture(desktopCell, mobileCell, { desktopWidth: 900, mobileWidth: 1100 });
    if (picture) {
      const media = document.createElement('div');
      media.className = 'pre-card-media';
      media.append(picture);
      li.append(media);
    }

    const body = document.createElement('div');
    body.className = 'pre-card-body';

    const title = getText(titleCell);
    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'pre-card-title';
      h3.textContent = title;
      if (titleCell?.firstElementChild) moveInstrumentation(titleCell.firstElementChild, h3);
      body.append(h3);
    }

    const text = getText(textCell);
    if (text) {
      const p = document.createElement('p');
      p.className = 'pre-card-text';
      p.textContent = text;
      if (textCell?.firstElementChild) moveInstrumentation(textCell.firstElementChild, p);
      body.append(p);
    }

    li.append(body);
    track.append(li);
  });

  block.replaceChildren(heading, hero, track);

  /* mobile-only carousel behaviour */
  const parsed = parseFloat(getText(cellOf(timeoutRow)));
  const seconds = Number.isNaN(parsed) ? DEFAULT_TIMEOUT_SECONDS : parsed;
  setupAutoScroll(track, seconds);
}
