const CONFIG = Object.freeze({
  contentRowCount: 3,

  contentRows: Object.freeze({
    heading: 0,
    description: 1,
    cta: 2,
  }),

  cardCellCount: 4,

  classNames: Object.freeze({
    content: 'vida-blog-content',
    heading: 'vida-blog-heading',
    description: 'vida-blog-description',
    cta: 'vida-blog-cta',
    ctaLink: 'vida-blog-cta-link',
    cards: 'vida-blog-cards',
    card: 'vida-blog-card',
    image: 'vida-blog-card-image',
    kicker: 'vida-blog-card-kicker',
    title: 'vida-blog-card-title',
    date: 'vida-blog-card-date',
    dots: 'vida-blog-dots',
    dot: 'vida-blog-dot',
    active: 'is-active',
  }),
});

function getContentCell(row) {
  return row?.firstElementChild?.firstElementChild
    ?? row?.firstElementChild
    ?? row;
}

function decorateHeader(block, rows) {
  const content = document.createElement('div');

  content.className = CONFIG.classNames.content;

  rows.forEach((row, index) => {
    row.classList.add(`vida-blog-row-${index}`);
    content.append(row);
  });

  block.prepend(content);

  const headingCell = getContentCell(
    rows[CONFIG.contentRows.heading],
  );

  const descriptionCell = getContentCell(
    rows[CONFIG.contentRows.description],
  );

  const ctaCell = getContentCell(
    rows[CONFIG.contentRows.cta],
  );

  headingCell?.classList.add(CONFIG.classNames.heading);
  descriptionCell?.classList.add(CONFIG.classNames.description);
  ctaCell?.classList.add(CONFIG.classNames.cta);

  const cta = ctaCell?.querySelector('a');

  cta?.classList.add(CONFIG.classNames.ctaLink);
}

function decorateCard(row) {
  if (row.children.length !== CONFIG.cardCellCount) {
    return null;
  }

  const [
    imageCell,
    kickerCell,
    titleCell,
    dateCell,
  ] = row.children;

  row.classList.add(CONFIG.classNames.card);

  imageCell.classList.add(CONFIG.classNames.image);
  kickerCell.classList.add(CONFIG.classNames.kicker);
  titleCell.classList.add(CONFIG.classNames.title);
  dateCell.classList.add(CONFIG.classNames.date);

  const image = imageCell.querySelector('img');

  if (image) {
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = image.alt || titleCell.textContent.trim();
  }

  return row;
}

function updateDots(cards, dots) {
  const cardCount = cards.length;

  if (!cardCount) {
    return;
  }

  const cardScroller = cards[0].parentElement;
  const { scrollLeft } = cardScroller;
  const cardWidth = cards[0].getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(cardScroller).gap) || 0;

  const activeIndex = Math.min(
    cardCount - 1,
    Math.max(
      0,
      Math.round(scrollLeft / (cardWidth + gap)),
    ),
  );

  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;

    dot.classList.toggle(
      CONFIG.classNames.active,
      isActive,
    );

    dot.setAttribute(
      'aria-current',
      isActive ? 'true' : 'false',
    );
  });
}

function createDots(block, cards, cardScroller) {
  const dots = document.createElement('div');

  dots.className = CONFIG.classNames.dots;

  const heading = block
    .querySelector(`.${CONFIG.classNames.heading}`)
    ?.textContent.trim();

  if (heading) {
    dots.setAttribute('aria-label', heading);
  }

  const dotElements = cards.map((card, index) => {
    const dot = document.createElement('button');

    dot.type = 'button';
    dot.className = CONFIG.classNames.dot;

    const cardTitle = card
      .querySelector(`.${CONFIG.classNames.title}`)
      ?.textContent.trim();

    if (cardTitle) {
      dot.setAttribute('aria-label', cardTitle);
    }

    dot.setAttribute(
      'aria-current',
      index === 0 ? 'true' : 'false',
    );

    dot.addEventListener('click', () => {
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });

    dots.append(dot);

    return dot;
  });

  block.append(dots);

  cardScroller.addEventListener(
    'scroll',
    () => updateDots(cards, dotElements),
    { passive: true },
  );

  window.addEventListener(
    'resize',
    () => updateDots(cards, dotElements),
  );
}

export default function decorate(block) {
  const rows = Array.from(block.children);

  const contentRows = rows.slice(
    0,
    CONFIG.contentRowCount,
  );

  const cardRows = rows.slice(
    CONFIG.contentRowCount,
  );

  const cards = cardRows
    .map(decorateCard)
    .filter(Boolean);

  if (!cards.length) {
    return;
  }

  decorateHeader(block, contentRows);

  const cardScroller = document.createElement('div');

  cardScroller.className = CONFIG.classNames.cards;

  cards.forEach((card) => {
    cardScroller.append(card);
  });

  block.append(cardScroller);

  createDots(
    block,
    cards,
    cardScroller,
  );
}
