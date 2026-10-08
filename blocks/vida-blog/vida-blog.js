import { moveInstrumentation } from '../../scripts/scripts.js';

const CONFIG = {
  classes: {
    header: 'vida-blog-header',
    heading: 'vida-blog-heading',
    description: 'vida-blog-description',
    cta: 'vida-blog-cta',
    ctaLink: 'vida-blog-cta-link',
    playTime: 'vida-blog-carousel-play-time',
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
  mobileSlideWidthGap: 48,
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
  return cell?.textContent?.trim() || '';
}

function getCardRows(block) {
  return [...block.children].slice(CONFIG.cardRowsStart);
}

function getImages(imageCell) {
  if (!imageCell) {
    return [];
  }

  return [...imageCell.querySelectorAll(CONFIG.selectors.image)]
    .slice(0, CONFIG.maxImages);
}

function getAuthoringLink(cell) {
  if (!cell) {
    return '';
  }

  const link = cell.querySelector(CONFIG.selectors.link);

  if (link?.href) {
    return link.href;
  }

  return getCellText(cell);
}

function decorateImages(imageCell) {
  const images = getImages(imageCell);

  if (!images.length) {
    return null;
  }

  const imageContainer = createElement(
    'div',
    CONFIG.classes.cardImage,
  );

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

function decorateCard(row) {
  const imageCell = getCell(row, 0);
  const kickerCell = getCell(row, 1);
  const titleCell = getCell(row, 2);
  const dateCell = getCell(row, 3);

  const card = createElement('article', CONFIG.classes.card);

  moveInstrumentation(row, card);

  decorateImages(imageCell);

  if (imageCell) {
    card.append(imageCell);
  }

  const content = createElement(
    'div',
    CONFIG.classes.cardContent,
  );

  if (kickerCell) {
    kickerCell.classList.add(CONFIG.classes.kicker);
    content.append(kickerCell);
  }

  if (titleCell) {
    titleCell.classList.add(CONFIG.classes.title);
    content.append(titleCell);
  }

  if (dateCell) {
    dateCell.classList.add(CONFIG.classes.date);
    content.append(dateCell);
  }

  card.append(content);

  return card;
}

function createHeading(row) {
  const heading = createElement(
    'h2',
    CONFIG.classes.heading,
  );

  moveInstrumentation(row, heading);

  heading.textContent = getCellText(row);

  return heading;
}

function createDescription(row) {
  const description = createElement(
    'p',
    CONFIG.classes.description,
  );

  moveInstrumentation(row, description);

  description.textContent = getCellText(row);

  return description;
}

function createCta(ctaRow, ctaTextRow) {
  const cta = createElement(
    'div',
    CONFIG.classes.cta,
  );

  const link = createElement(
    'a',
    CONFIG.classes.ctaLink,
  );

  const href = getAuthoringLink(ctaRow);
  const label = getCellText(ctaTextRow);

  moveInstrumentation(ctaRow, link);

  if (ctaTextRow) {
    moveInstrumentation(ctaTextRow, link);
  }

  if (href) {
    link.href = href;
  }

  link.textContent = label;

  if (!label) {
    return null;
  }

  cta.append(link);

  return cta;
}

function getPlayTime(row) {
  const value = Number.parseInt(
    getCellText(row),
    10,
  );

  if (!Number.isFinite(value) || value < 0) {
    return CONFIG.defaultPlayTime;
  }

  return value;
}

function getClosestCardIndex(cardsContainer, cards) {
  const containerRect = cardsContainer.getBoundingClientRect();
  const containerCenter = (
    containerRect.left + containerRect.width / 2
  );

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

  const leftPosition = (
    card.offsetLeft
    - ((cardsContainer.clientWidth - card.offsetWidth) / 2)
  );

  cardsContainer.scrollTo({
    left: Math.max(0, leftPosition),
    behavior,
  });
}

function createDots(cardsContainer, cards) {
  if (cards.length <= 1) {
    return null;
  }

  const dots = createElement(
    'div',
    CONFIG.classes.dots,
  );

  cards.forEach((card, index) => {
    const dot = createElement(
      'button',
      CONFIG.classes.dot,
    );

    dot.type = 'button';

    dot.setAttribute(
      'aria-label',
      `Go to blog card ${index + 1}`,
    );

    dot.addEventListener('click', () => {
      scrollToCard(cardsContainer, card);
    });

    dots.append(dot);
  });

  const setActiveDot = (index) => {
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle(
        CONFIG.classes.dotActive,
        dotIndex === index,
      );
    });
  };

  setActiveDot(
    Math.min(
      CONFIG.defaultMobileSlideIndex,
      cards.length - 1,
    ),
  );

  let scrollTimeout;

  cardsContainer.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(scrollTimeout);

      scrollTimeout = window.setTimeout(() => {
        setActiveDot(
          getClosestCardIndex(cardsContainer, cards),
        );
      }, 50);
    },
    { passive: true },
  );

  return dots;
}

function initializeMobileCarousel(
  cardsContainer,
  cards,
  dots,
  playTime,
) {
  if (!cards.length) {
    return () => {};
  }

  const mobileQuery = window.matchMedia(
    `(max-width: ${CONFIG.mobileBreakpoint}px)`,
  );

  let timerId = null;

  const getCurrentIndex = () => getClosestCardIndex(
    cardsContainer,
    cards,
  );

  const goToNextCard = () => {
    const currentIndex = getCurrentIndex();
    const nextIndex = (
      currentIndex + 1
    ) % cards.length;

    scrollToCard(
      cardsContainer,
      cards[nextIndex],
    );
  };

  const startAutoplay = () => {
    window.clearInterval(timerId);

    if (
      !mobileQuery.matches
      || playTime <= 0
      || cards.length <= 1
    ) {
      return;
    }

    timerId = window.setInterval(
      goToNextCard,
      playTime,
    );
  };

  const stopAutoplay = () => {
    window.clearInterval(timerId);
    timerId = null;
  };

  const setInitialMobileSlide = () => {
    if (!mobileQuery.matches || cards.length <= 1) {
      return;
    }

    const initialIndex = Math.min(
      CONFIG.defaultMobileSlideIndex,
      cards.length - 1,
    );

    window.requestAnimationFrame(() => {
      scrollToCard(
        cardsContainer,
        cards[initialIndex],
        'auto',
      );

      if (dots) {
        [...dots.children].forEach((dot, index) => {
          dot.classList.toggle(
            CONFIG.classes.dotActive,
            index === initialIndex,
          );
        });
      }
    });
  };

  const handleViewportChange = () => {
    if (mobileQuery.matches) {
      setInitialMobileSlide();
      startAutoplay();
    } else {
      stopAutoplay();
      cardsContainer.scrollTo({
        left: 0,
        behavior: 'auto',
      });
    }
  };

  cardsContainer.addEventListener('pointerdown', stopAutoplay);

  cardsContainer.addEventListener('touchend', () => {
    startAutoplay();
  });

  cardsContainer.addEventListener('mouseenter', stopAutoplay);
  cardsContainer.addEventListener('mouseleave', startAutoplay);

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener(
      'change',
      handleViewportChange,
    );
  } else {
    mobileQuery.addListener(handleViewportChange);
  }

  handleViewportChange();

  return () => {
    stopAutoplay();

    if (typeof mobileQuery.removeEventListener === 'function') {
      mobileQuery.removeEventListener(
        'change',
        handleViewportChange,
      );
    } else {
      mobileQuery.removeListener(handleViewportChange);
    }
  };
}

function decorateHeader(block) {
  const headingRow = getCell(
    block,
    CONFIG.rows.heading,
  );

  const descriptionRow = getCell(
    block,
    CONFIG.rows.description,
  );

  const ctaRow = getCell(
    block,
    CONFIG.rows.cta,
  );

  const ctaTextRow = getCell(
    block,
    CONFIG.rows.ctaText,
  );

  const playTimeRow = getCell(
    block,
    CONFIG.rows.carouselPlayTime,
  );

  const header = createElement(
    'div',
    CONFIG.classes.header,
  );

  if (headingRow) {
    header.append(createHeading(headingRow));
  }

  if (descriptionRow) {
    header.append(createDescription(descriptionRow));
  }

  const cta = createCta(
    ctaRow,
    ctaTextRow,
  );

  if (cta) {
    header.append(cta);
  }

  const playTime = getPlayTime(playTimeRow);

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

  const {
    header,
    playTime,
  } = decorateHeader(block);

  const cardsContainer = createElement(
    'div',
    CONFIG.classes.cards,
  );

  const cards = getCardRows(block).map(
    decorateCard,
  );

  cards.forEach((card) => {
    cardsContainer.append(card);
  });

  const dots = createDots(
    cardsContainer,
    cards,
  );

  block.replaceChildren(
    header,
    cardsContainer,
  );

  if (dots) {
    block.append(dots);
  }

  initializeMobileCarousel(
    cardsContainer,
    cards,
    dots,
    playTime,
  );
}
