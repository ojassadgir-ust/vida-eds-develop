import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import { initCtaTracking, isUniversalEditor, trackPageView } from './analytics.js';
import { ANALYTICS_URL, ENV } from './env.config.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

export function toWebp(src, width) {
  const url = new URL(src, window.location.href);
  if (!url.pathname.includes('/media_')) return src;
  url.searchParams.set('format', 'webply');
  url.searchParams.set('width', width);
  return url.href;
}

function preloadPdpRemovableBatteriesHero(section) {
  const block = section?.querySelector('.pdp-removable-batteries');
  if (!block) return;

  const rows = [...block.children];
  const mobileImage = rows[0]?.querySelector('img');
  const desktopImage = rows[1]?.querySelector('img') || mobileImage;
  const mobileSource = mobileImage || desktopImage;
  if (!mobileSource) return;

  const createUrl = (image, width) => {
    const url = new URL(image.getAttribute('src'), window.location.href);
    if (!url.pathname.includes('/media_')) return null;
    url.search = `?width=${width}&format=webply&optimize=medium`;
    return url.href;
  };

  const preload = (image, media, sizes, widths) => {
    const fallback = createUrl(image, widths[0]);
    if (!fallback) return;

    const candidates = widths.map((width) => {
      const url = createUrl(image, width);
      return url && `${url} ${width}w`;
    }).filter(Boolean);
    if (!candidates.length) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.media = media;
    link.href = fallback;
    link.setAttribute('imagesrcset', candidates.join(', '));
    link.setAttribute('imagesizes', sizes);
    link.fetchPriority = 'high';
    document.head.append(link);
  };

  preload(
    mobileSource,
    '(max-width: 767px)',
    'min(100vw, 440px)',
    [440, 880, 1200],
  );
  preload(
    desktopImage,
    '(min-width: 768px)',
    'min(55.556vw, 800px)',
    [900, 1400, 2000],
  );
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  trackPageView();
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    preloadPdpRemovableBatteriesHero(main.querySelector('.section'));
    decorateMain(main);
    loadHeader(doc.querySelector('header'));
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

function loadLaunch() {
  if (isUniversalEditor()) return;
  const script = document.createElement('script');
  script.src = ANALYTICS_URL[ENV];
  script.async = true;
  document.head.append(script);
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/common-components.css`);
  loadFonts();
  initCtaTracking();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  window.setTimeout(loadLaunch, 5000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
