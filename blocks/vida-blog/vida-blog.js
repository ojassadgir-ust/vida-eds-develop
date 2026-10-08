import { moveInstrumentation } from '../../scripts/scripts.js';

const CONFIG = {
  classes: {
    header: 'vida-blog-header',
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
    link: 'a',
  },
  cardRowsStart: 3,
  imageIndexes: {
    desktop: 0,
    tablet: 1,
    mobile: 2,
  },
  maxImages: 3,
};

function createElement(tagName, className) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

function getCardRows(block) {
  return [...block.children].slice(CONFIG.cardRowsStart);
}

function getCell(row, index) {
  return row.children[index] || null;
}

function getImages(imageCell) {
  if (!imageCell) {
    return [];
  }

  return [...imageCell.querySelectorAll(CONFIG.selectors.image)]
    .slice(0, CONFIG.maxImages);
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
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    });

    dots.append(dot);
  });

  const firstDot = dots.firstElementChild;

  if (firstDot) {
    firstDot.classList.add(CONFIG.classes.dotActive);
  }

  const updateActiveDot = () => {
    const containerLeft = cardsContainer.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        card.getBoundingClientRect().left - containerLeft,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    [...dots.children].forEach((dot, index) => {
      dot.classList.toggle(
        CONFIG.classes.dotActive,
        index === closestIndex,
      );
    });
  };

  cardsContainer.addEventListener(
    'scroll',
    updateActiveDot,
    { passive: true },
  );

  return dots;
}

export default function decorate(block) {
  const rows = [...block.children];

  if (rows.length < CONFIG.cardRowsStart) {
    return;
  }

  const header = createElement(
    'div',
    CONFIG.classes.header,
  );

  const headingRow = rows[0];
  const descriptionRow = rows[1];
  const ctaRow = rows[2];

  if (headingRow) {
    header.append(headingRow);
  }

  if (descriptionRow) {
    header.append(descriptionRow);
  }

  if (ctaRow) {
    header.append(ctaRow);
  }

  const cardsContainer = createElement(
    'div',
    CONFIG.classes.cards,
  );

  const cards = getCardRows(block).map(decorateCard);

  cards.forEach((card) => {
    cardsContainer.append(card);
  });

  const dots = createDots(cardsContainer, cards);

  block.replaceChildren(header, cardsContainer);

  if (dots) {
    block.append(dots);
  }
}
