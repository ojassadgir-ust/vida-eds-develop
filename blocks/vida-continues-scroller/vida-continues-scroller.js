import { moveInstrumentation } from '../../scripts/scripts.js';

const CONFIG = {
  classes: {
    inner: 'vida-continues-scroller-inner',
    heading: 'vida-continues-scroller-heading',
    track: 'vida-continues-scroller-track',
    slide: 'vida-continues-scroller-slide',
    content: 'vida-continues-scroller-content',
    title: 'vida-continues-scroller-title',
    subtitle: 'vida-continues-scroller-subtitle',
    controls: 'vida-continues-scroller-controls',
    dot: 'vida-continues-scroller-dot',
    active: 'is-active',
  },
  defaults: {
    timespan: 5000,
    minimumTimespan: 1000,
  },
};

const getText = (element) => element?.textContent?.trim() || '';

const getImages = (cell) => [...(cell?.querySelectorAll('picture img, img') || [])]
  .map((image) => ({
    src: image.getAttribute('src') || image.getAttribute('data-src') || '',
    alt: image.getAttribute('alt') || '',
  }));

const getSlideData = (slideBlock) => {
  const cells = [...slideBlock.children];

  const legacyLayout = cells.length >= 5;

  if (cells.length < 3) return null;

  const desktopCell = cells[0];
  const tabletCell = legacyLayout ? cells[1] : null;
  const mobileCell = legacyLayout ? cells[2] : null;
  const titleCell = cells[legacyLayout ? 3 : 1];
  const subtitleCell = cells[legacyLayout ? 4 : 2];
  const responsiveImages = getImages(desktopCell);
  const desktop = responsiveImages[0] || null;
  const tablet = legacyLayout ? getImages(tabletCell)[0] || null : responsiveImages[1] || null;
  const mobile = legacyLayout ? getImages(mobileCell)[0] || null : responsiveImages[2] || null;
  let fallback = desktop;

  if (!fallback?.src) fallback = tablet;
  if (!fallback?.src) fallback = mobile;

  if (!fallback?.src) return null;

  return {
    desktop,
    tablet,
    mobile,
    fallback,
    title: getText(titleCell),
    subtitle: getText(subtitleCell),
    source: slideBlock,
  };
};

const createPicture = (data) => {
  const picture = document.createElement('picture');

  [
    { image: data.mobile, media: '(max-width: 767px)' },
    {
      image: data.tablet,
      media: '(min-width: 768px) and (max-width: 1024px)',
    },
  ].forEach(({ image, media }) => {
    if (!image?.src || image.src === data.fallback.src) return;

    const source = document.createElement('source');
    source.media = media;
    source.srcset = image.src;
    picture.append(source);
  });

  const image = document.createElement('img');
  image.className = 'vida-continues-scroller-image';
  image.src = data.fallback.src;
  image.alt = data.mobile?.alt
    || data.tablet?.alt
    || data.desktop?.alt
    || '';
  image.loading = 'lazy';
  image.decoding = 'async';

  picture.append(image);
  return picture;
};

const createSlide = (data, index, total) => {
  const slide = document.createElement('article');
  slide.className = CONFIG.classes.slide;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${index + 1} of ${total}`);

  slide.append(createPicture(data));

  const content = document.createElement('div');
  content.className = CONFIG.classes.content;

  if (data.title) {
    const title = document.createElement('h3');
    title.className = CONFIG.classes.title;
    title.textContent = data.title;
    content.append(title);
  }

  if (data.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = CONFIG.classes.subtitle;
    subtitle.textContent = data.subtitle;
    content.append(subtitle);
  }

  slide.append(content);
  moveInstrumentation(data.source, slide);

  return slide;
};

const getInterval = (block) => {
  const value = Number.parseInt(block.dataset.timespan, 10);

  if (Number.isFinite(value) && value === 0) return 0;

  if (
    Number.isFinite(value)
    && value >= CONFIG.defaults.minimumTimespan
  ) {
    return value;
  }

  return CONFIG.defaults.timespan;
};

export default function decorate(block) {
  if (block.dataset.decorated === 'true') return;
  block.dataset.decorated = 'true';
  block.classList.add('vida-continues-scroller');

  const children = [...block.children];

  // FIXED: Detect slides by structure (3 or 5 children) instead of class
  const slideBlocks = children.filter((child) => {
    const hasClass = child.classList.contains('vida-continues-scroller-slide');
    const hasBlockName = child.dataset.blockName === 'vida-continues-scroller-slide';
    const hasDataAttr = child.querySelector('[data-slide-title]');
    const hasSlideStructure = child.children.length >= 3; // 3+ children = slide structure

    return hasClass || hasBlockName || hasDataAttr || hasSlideStructure;
  });

  // Filter for rows (heading and timespan)
  const rows = children.filter((child) => (
    child.tagName === 'DIV' && child.children.length === 1
  ));

  const headingRow = rows[0];
  const timespanRow = rows[1];
  const headingText = getText(headingRow);
  const timespan = getInterval({
    dataset: {
      timespan: getText(timespanRow),
    },
  });

  const slideData = slideBlocks
    .map(getSlideData)
    .filter(Boolean);

  if (!slideData.length) {
    block.dataset.empty = 'true';
    return;
  }

  const inner = document.createElement('div');
  inner.className = CONFIG.classes.inner;

  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = CONFIG.classes.heading;
    heading.textContent = headingText;
    inner.append(heading);
  }

  const track = document.createElement('div');
  track.className = CONFIG.classes.track;
  track.setAttribute('aria-label', 'Featured slides');

  const slides = slideData.map((data, index) => (
    createSlide(data, index, slideData.length)
  ));

  slides.forEach((slide) => track.append(slide));
  inner.append(track);

  const controls = document.createElement('div');
  controls.className = CONFIG.classes.controls;
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Slide navigation');

  let activeIndex = 0;
  let timerId;

  const buttons = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.className = CONFIG.classes.dot;
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${index + 1}`);
    controls.append(button);
    return button;
  });

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  const updateControls = () => {
    buttons.forEach((button, index) => {
      const active = index === activeIndex;
      button.classList.toggle(CONFIG.classes.active, active);
      button.setAttribute('aria-current', String(active));
    });
  };

  function goTo(index) {
    activeIndex = (index + slides.length) % slides.length;

    slides[activeIndex].scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: window.matchMedia('(max-width: 767px)').matches
        ? 'center'
        : 'start',
    });

    updateControls();
  }

  const updateActive = () => {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;

    let closest = Infinity;

    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);

      if (distance < closest) {
        closest = distance;
        activeIndex = index;
      }
    });

    updateControls();
  };

  const stopAutoplay = () => {
    if (timerId) window.clearInterval(timerId);
    timerId = undefined;
  };

  function restartAutoplay() {
    stopAutoplay();

    if (
      timespan === 0
      || reducedMotion
      || slides.length < 2
      || document.hidden
    ) {
      return;
    }

    timerId = window.setInterval(() => {
      goTo(activeIndex + 1);
    }, timespan);
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      goTo(index);
      restartAutoplay();
    });
  });

  inner.append(controls);
  block.replaceChildren(inner);

  track.addEventListener('scroll', updateActive, { passive: true });
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', restartAutoplay);
  track.addEventListener('focusin', stopAutoplay);
  track.addEventListener('focusout', restartAutoplay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else restartAutoplay();
  });

  goTo(0);
  restartAutoplay();
}
