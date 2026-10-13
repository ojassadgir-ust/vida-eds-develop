import { moveInstrumentation } from '../../scripts/scripts.js';

const CONFIG = {
  classes: {
    header: 'vida-blog-header',
    heading: 'vida-blog-heading',
    description: 'vida-blog-description',
    cta: 'vida-blog-cta',
    ctaLink: 'vida-blog-cta-link',
    cards: 'vida-blog-cards',
    card: 'vida-blog-card',
    cardImage: 'vida-blog-card-image',
    cardContent: 'vida-blog-card-content',
    kicker: 'vida-blog-card-kicker',
    title: 'vida-blog-card-title',
    date: 'vida-blog-card-date',
    imageDesktop: 'vida-blog-image-desktop',
    imageTablet: 'vida-blog-image-tablet',
    imageMobile: 'vida-blog-image-mobile',
    dots: 'vida-blog-dots',
    dot: 'vida-blog-dot',
    dotActive: 'vida-blog-dot-active',
  },
  selectors: {
    image: 'img',
    link: 'a[href]',
  },
  rows: {
    heading: 0,
    description: 1,
    cta: 2,
    ctaText: 3,
    carouselPlayTime: 4,
  },
  cardRowsStart: 5,
  imageIndexes: {
    desktop: 0,
    tablet: 1,
    mobile: 2,
  },
  maxImages: 3,
  mobileBreakpoint: 767,
  defaultMobileSlideIndex: 1,
  defaultPlayTime: 0,
};

function createElement(tagName, className) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

function getCell(row, index) {
  return row?.children[index] || null;
}

function getCellText(cell) {
  return cell?.textContent?.replace(/\u00a0/gu, ' ').trim() || '';
}

function normalizeText(text) {
  return text
    .replace(/\u00a0/gu, ' ')
    .replace(/\]\s*\(\s*about:blank\s*\)/giu, ' ')
    .replace(/\babout:blank\b/giu, ' ')
    .replace(/[[\]()]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function normalizeCtaUrl(value) {
  let url = value?.trim().replace(/\u00a0/gu, ' ') || '';

  url = url.replace(/^[<"'`\s]+|[>"'`,;\s]+$/gu, '');

  if (
    !url
    || /^about:blank$/iu.test(url)
    || /^javascript:/iu.test(url)
  ) {
    return '';
  }

  if (/^(?:https?:\/\/|mailto:|tel:|#)/iu.test(url)) {
    return url;
  }

  if (/^\/(?!\/)/u.test(url)) {
    return url;
  }

  if (/^(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#][^\s]*)?$/iu.test(url)) {
    return `https://${url}`;
  }

  return '';
}

function extractCtaData(cell) {
  if (!cell) {
    return {
      href: '',
      label: '',
    };
  }

  const rawText = getCellText(cell);
  const cleanedText = normalizeText(rawText);
  const anchor = cell.querySelector(CONFIG.selectors.link);

  let href = normalizeCtaUrl(anchor?.getAttribute('href') || '');

  const urlPattern = /(?:https?:\/\/[^\s<>()\]]+|\/(?!\/)[^\s<>()\]]*|(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#][^\s<>()\]]*)?)/iu;
  const urlMatch = cleanedText.match(urlPattern);

  if (!href && urlMatch) {
    href = normalizeCtaUrl(urlMatch[0]);
  }

  let label = cleanedText;

  if (urlMatch && normalizeCtaUrl(urlMatch[0])) {
    label = label.replace(urlMatch[0], ' ');
  }

  label = normalizeText(label);

  if (!label && anchor) {
    const anchorText = normalizeText(getCellText(anchor));
    const anchorTextUrl = normalizeCtaUrl(anchorText);

    if (!anchorTextUrl) {
      label = anchorText;
    }
  }

  return {
    href,
    label,
  };
}

function isNumericOnly(text) {
  return /^\d+$/u.test(text?.trim() || '');
}

function getImages(imageCell) {
  if (!imageCell) {
    return [];
  }

  return [...imageCell.querySelectorAll(CONFIG.selectors.image)]
    .slice(0, CONFIG.maxImages);
}

function getCardRows(block) {
  return [...block.children].slice(CONFIG.cardRowsStart);
}

function decorateImages(imageCell) {
  const images = getImages(imageCell);

  if (!images.length) {
    return null;
  }

  const imageContainer = createElement('div', CONFIG.classes.cardImage);

  images.forEach((image, index) => {
    const imageClass = {
      [CONFIG.imageIndexes.desktop]: CONFIG.classes.imageDesktop,
      [CONFIG.imageIndexes.tablet]: CONFIG.classes.imageTablet,
      [CONFIG.imageIndexes.mobile]: CONFIG.classes.imageMobile,
    }[index];

    if (imageClass) {
      image.classList.add(imageClass);
    }

    imageContainer.append(image);
  });

  imageCell.replaceChildren(imageContainer);

  return imageContainer;
}

function createCardTextElement(tagName, className, text) {
  const element = createElement(tagName, className);
  element.textContent = text;

  return element;
}

function decorateCard(row) {
  const imageCell = getCell(row, 0);
  const kickerCell = getCell(row, 1);
  const titleCell = getCell(row, 2);
  const dateCell = getCell(row, 3);
  const card = createElement('article', CONFIG.classes.card);

  moveInstrumentation(row, card);

  if (imageCell) {
    decorateImages(imageCell);
    card.append(imageCell);
  }

  const content = createElement('div', CONFIG.classes.cardContent);
  const kickerText = getCellText(kickerCell);
  const titleText = getCellText(titleCell);
  const dateText = getCellText(dateCell);

  if (kickerText) {
    content.append(
      createCardTextElement('p', CONFIG.classes.kicker, kickerText),
    );
  }

  if (titleText) {
    content.append(
      createCardTextElement('h3', CONFIG.classes.title, titleText),
    );
  }

  if (dateText) {
    content.append(
      createCardTextElement('p', CONFIG.classes.date, dateText),
    );
  }

  card.append(content);

  return card;
}

function createHeading(row) {
  const heading = createElement('h2', CONFIG.classes.heading);
  heading.textContent = getCellText(row);

  return heading;
}

function createDescription(row) {
  const description = createElement('p', CONFIG.classes.description);
  description.textContent = getCellText(row);

  return description;
}

function createCta(href, label) {
  if (!href || !label) {
    return null;
  }

  const cta = createElement('div', CONFIG.classes.cta);
  const link = createElement('a', CONFIG.classes.ctaLink);

  link.href = href;
  link.textContent = label;

  cta.append(link);

  return cta;
}

function getPlayTime(row) {
  const text = getCellText(row);

  if (!isNumericOnly(text)) {
    return CONFIG.defaultPlayTime;
  }

  const value = Number(text);

  if (!Number.isFinite(value) || value <= 0) {
    return CONFIG.defaultPlayTime;
  }

  return value;
}

function getClosestCardIndex(cardsContainer, cards) {
  const containerRect = cardsContainer.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(cardCenter - containerCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function scrollToCard(cardsContainer, card, behavior = 'smooth') {
  if (!card) {
    return;
  }

  const containerRect = cardsContainer.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const targetLeft = cardsContainer.scrollLeft
    + cardRect.left
    - containerRect.left
    - (cardsContainer.clientWidth - cardRect.width) / 2;
  const maxScrollLeft = cardsContainer.scrollWidth - cardsContainer.clientWidth;

  cardsContainer.scrollTo({
    left: Math.min(maxScrollLeft, Math.max(0, targetLeft)),
    behavior,
  });
}

function updateActiveDot(dots, index) {
  if (!dots) {
    return;
  }

  [...dots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle(CONFIG.classes.dotActive, dotIndex === index);
  });
}

function createDots(cardsContainer, cards) {
  if (cards.length <= 1) {
    return null;
  }

  const dots = createElement('div', CONFIG.classes.dots);

  cards.forEach((card, index) => {
    const dot = createElement('button', CONFIG.classes.dot);

    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to blog card ${index + 1}`);

    dot.addEventListener('click', () => {
      scrollToCard(cardsContainer, card);
      updateActiveDot(dots, index);
    });

    dots.append(dot);
  });

  updateActiveDot(
    dots,
    Math.min(CONFIG.defaultMobileSlideIndex, cards.length - 1),
  );

  let scrollTimeout;

  cardsContainer.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(scrollTimeout);

      scrollTimeout = window.setTimeout(() => {
        updateActiveDot(dots, getClosestCardIndex(cardsContainer, cards));
      }, 50);
    },
    {
      passive: true,
    },
  );

  return dots;
}

function initializeMobileCarousel(cardsContainer, cards, dots, playTime) {
  if (!cards.length) {
    return;
  }

  const mobileQuery = window.matchMedia(
    `(max-width: ${CONFIG.mobileBreakpoint}px)`,
  );

  let timerId = null;

  const getCurrentIndex = () => getClosestCardIndex(cardsContainer, cards);

  const goToNextCard = () => {
    const currentIndex = getCurrentIndex();
    const nextIndex = (currentIndex + 1) % cards.length;

    scrollToCard(cardsContainer, cards[nextIndex]);
    updateActiveDot(dots, nextIndex);
  };

  const stopAutoplay = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (!mobileQuery.matches || playTime <= 0 || cards.length <= 1) {
      return;
    }

    timerId = window.setInterval(goToNextCard, playTime);
  };

  const setInitialMobileSlide = () => {
    if (!mobileQuery.matches || cards.length <= 1) {
      return;
    }

    const initialIndex = Math.min(
      CONFIG.defaultMobileSlideIndex,
      cards.length - 1,
    );

    scrollToCard(cardsContainer, cards[initialIndex], 'auto');
    updateActiveDot(dots, initialIndex);
  };

  const handleViewportChange = () => {
    stopAutoplay();

    if (mobileQuery.matches) {
      setInitialMobileSlide();

      window.requestAnimationFrame(() => {
        startAutoplay();
      });
    } else {
      cardsContainer.scrollTo({
        left: 0,
        behavior: 'auto',
      });
    }
  };

  cardsContainer.addEventListener('pointerdown', stopAutoplay);
  cardsContainer.addEventListener('touchend', startAutoplay);
  cardsContainer.addEventListener('mouseenter', stopAutoplay);
  cardsContainer.addEventListener('mouseleave', startAutoplay);

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleViewportChange);
  } else {
    mobileQuery.addListener(handleViewportChange);
  }

  handleViewportChange();
}

function decorateHeader(block) {
  const headingRow = getCell(block, CONFIG.rows.heading);
  const descriptionRow = getCell(block, CONFIG.rows.description);
  const row2 = getCell(block, CONFIG.rows.cta);
  const row3 = getCell(block, CONFIG.rows.ctaText);
  const row4 = getCell(block, CONFIG.rows.carouselPlayTime);

  const text2 = getCellText(row2);
  const text3 = getCellText(row3);
  const text4 = getCellText(row4);

  const row2Data = extractCtaData(row2);
  const row3Data = extractCtaData(row3);

  let ctaLink = row2Data.href;
  let ctaLabel = row2Data.label;
  let playTimeRow = null;

  /*
   * Supported authoring layouts:
   * 1. Row 2 contains URL and label together; row 3 contains play time.
   * 2. Row 2 contains URL; row 3 contains label; row 4 contains play time.
   */
  if (isNumericOnly(text3)) {
    playTimeRow = row3;
  } else if (isNumericOnly(text4)) {
    playTimeRow = row4;
  }

  if (!ctaLabel && text3 && !isNumericOnly(text3)) {
    ctaLabel = row3Data.label || text3;
  }

  if (!ctaLink && row3Data.href) {
    ctaLink = row3Data.href;

    if (!ctaLabel && text2) {
      ctaLabel = row2Data.label || normalizeText(text2);
    }
  }

  const playTime = getPlayTime(playTimeRow);

  const header = createElement('div', CONFIG.classes.header);

  if (headingRow) {
    header.append(createHeading(headingRow));
  }

  if (descriptionRow) {
    header.append(createDescription(descriptionRow));
  }

  const cta = createCta(ctaLink, ctaLabel);

  if (cta) {
    header.append(cta);
  }

  return {
    header,
    playTime,
  };
}

export default function decorate(block) {
  const rows = [...block.children];

  if (rows.length < CONFIG.cardRowsStart) {
    return;
  }

  const { header, playTime } = decorateHeader(block);
  const cardsContainer = createElement('div', CONFIG.classes.cards);
  const cards = getCardRows(block).map(decorateCard);

  cards.forEach((card) => {
    cardsContainer.append(card);
  });

  const dots = createDots(cardsContainer, cards);

  block.replaceChildren(header, cardsContainer);

  if (dots) {
    block.append(dots);
  }

  initializeMobileCarousel(cardsContainer, cards, dots, playTime);
}
