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
    mediaContainer: 'vida-continues-scroller-media',
    videoContainer: 'vida-continues-scroller-video',
  },
  defaults: {
    scrollTime: 5000,
    minimumScrollTime: 1000,
  },
};

const getText = (element) => element?.textContent?.trim() || '';

const getMediaFromCell = (cell) => {
  if (!cell) return { image: null, video: null };

  // Check for video
  const videoElement = cell.querySelector('video source, video');
  if (videoElement) {
    const src = videoElement.getAttribute('src')
      || videoElement.querySelector('source')?.getAttribute('src');
    if (src) {
      return {
        video: {
          src,
          type: videoElement.getAttribute('type') || 'video/mp4',
        },
        image: null,
      };
    }
  }

  // Check for image
  const imgElement = cell.querySelector('img');
  if (imgElement) {
    return {
      image: {
        src: imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || '',
        alt: imgElement.getAttribute('alt') || '',
      },
      video: null,
    };
  }

  // Check for picture element
  const pictureElement = cell.querySelector('picture');
  if (pictureElement) {
    const img = pictureElement.querySelector('img');
    if (img) {
      return {
        image: {
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || '',
        },
        video: null,
      };
    }
  }

  return { image: null, video: null };
};

const getSlideData = (slideBlock) => {
  const cells = [...slideBlock.children];

  if (cells.length < 5) return null;

  const desktopCell = cells[0];
  const tabletCell = cells[1];
  const mobileCell = cells[2];
  const titleCell = cells[3];
  const subtitleCell = cells[4];

  const desktopMedia = getMediaFromCell(desktopCell);
  const tabletMedia = getMediaFromCell(tabletCell);
  const mobileMedia = getMediaFromCell(mobileCell);

  // Determine fallback (prefer video if available)
  let fallback = desktopMedia.video || desktopMedia.image;
  if (!fallback) fallback = tabletMedia.video || tabletMedia.image;
  if (!fallback) fallback = mobileMedia.video || mobileMedia.image;

  if (!fallback) return null;

  return {
    desktop: desktopMedia,
    tablet: tabletMedia,
    mobile: mobileMedia,
    fallback,
    title: getText(titleCell),
    subtitle: getText(subtitleCell),
    source: slideBlock,
  };
};

const createPictureElement = (desktopMedia, tabletMedia, mobileMedia, fallback) => {
  const container = document.createElement('div');
  container.className = CONFIG.classes.mediaContainer;

  // Create picture for images only
  if (fallback?.image) {
    const picture = document.createElement('picture');

    // Add responsive image sources
    const sources = [
      { media: '(max-width: 767px)', mediaData: mobileMedia },
      { media: '(min-width: 768px) and (max-width: 1024px)', mediaData: tabletMedia },
      { media: '(min-width: 1025px)', mediaData: desktopMedia },
    ];

    sources.forEach(({ media, mediaData }) => {
      if (mediaData.image && mediaData.image.src) {
        const source = document.createElement('source');
        source.media = media;
        source.srcset = mediaData.image.src;
        picture.append(source);
      }
    });

    const img = document.createElement('img');
    img.className = 'vida-continues-scroller-image';
    img.src = fallback.image.src;
    img.alt = fallback.image.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';

    picture.append(img);
    container.append(picture);
  } else if (fallback?.video) {
    // Create video element
    const video = document.createElement('video');
    video.className = 'vida-continues-scroller-image';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    const source = document.createElement('source');
    source.src = fallback.video.src;
    source.type = fallback.video.type;
    video.append(source);

    container.append(video);
  }

  return container;
};

const createSlide = (data, index, total) => {
  const slide = document.createElement('article');
  slide.className = CONFIG.classes.slide;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${index + 1} of ${total}`);

  slide.append(createPictureElement(data.desktop, data.tablet, data.mobile, data.fallback));

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

const getScrollTime = (text) => {
  const value = Number.parseInt(text, 10);

  if (Number.isFinite(value) && value === 0) return 0;

  if (Number.isFinite(value) && value >= CONFIG.defaults.minimumScrollTime) {
    return value;
  }

  return CONFIG.defaults.scrollTime;
};

export default function decorate(block) {
  if (block.dataset.decorated === 'true') return;
  block.dataset.decorated = 'true';
  block.classList.add('vida-continues-scroller');

  const children = [...block.children];

  // Detect slides by structure
  const slideBlocks = children.filter((child) => {
    const hasClass = child.classList.contains('vida-continues-scroller-slide');
    const hasBlockName = child.dataset.blockName === 'vida-continues-scroller-slide';
    const hasDataAttr = child.querySelector('[data-slide-title]');
    const hasSlideStructure = child.children.length >= 3;

    return hasClass || hasBlockName || hasDataAttr || hasSlideStructure;
  });

  // Filter for rows
  const rows = children.filter((child) => (
    child.tagName === 'DIV' && child.children.length === 1
  ));

  const headingRow = rows[0];
  const scrollTimeRow = rows[1];
  const headingText = getText(headingRow);
  const scrollTime = getScrollTime(getText(scrollTimeRow));

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
  let scrollTimer;

  const buttons = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.className = CONFIG.classes.dot;
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${index + 1}`);
    controls.append(button);
    return button;
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateControls = () => {
    buttons.forEach((button, index) => {
      const active = index === activeIndex;
      button.classList.toggle(CONFIG.classes.active, active);
      button.setAttribute('aria-current', String(active));
    });
  };

  const stopScrollTimer = () => {
    if (scrollTimer) {
      window.clearTimeout(scrollTimer);
      scrollTimer = undefined;
    }
  };

  const startScrollTimer = () => {
    stopScrollTimer();

    if (scrollTime === 0 || reducedMotion || slides.length < 2 || document.hidden) {
      return;
    }

    scrollTimer = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      slides[activeIndex].scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: window.matchMedia('(max-width: 767px)').matches ? 'center' : 'start',
      });
      updateControls();
      startScrollTimer(); // Restart timer for next slide
    }, scrollTime);
  };

  function goTo(index) {
    activeIndex = (index + slides.length) % slides.length;

    slides[activeIndex].scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: window.matchMedia('(max-width: 767px)').matches ? 'center' : 'start',
    });

    updateControls();
    startScrollTimer();
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

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      goTo(index);
    });
  });

  inner.append(controls);
  block.replaceChildren(inner);

  track.addEventListener('scroll', () => {
    updateActive();
    stopScrollTimer();
    startScrollTimer();
  }, { passive: true });

  track.addEventListener('mouseenter', stopScrollTimer);
  track.addEventListener('mouseleave', startScrollTimer);
  track.addEventListener('focusin', stopScrollTimer);
  track.addEventListener('focusout', startScrollTimer);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopScrollTimer();
    else startScrollTimer();
  });

  goTo(0);
}
