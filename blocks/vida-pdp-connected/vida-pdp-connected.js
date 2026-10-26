import { markTracked } from '../../scripts/analytics.js';
import { moveInstrumentation, toWebp } from '../../scripts/scripts.js';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
const DESKTOP_IMAGE_WIDTH = 1300;
const MOBILE_IMAGE_WIDTH = 800;
const PARENT_FIELD_COUNT = 5;

const FIELD_INDEX = {
  desktopImage: 0,
  mobileImage: 1,
  heading: 2,
  subtext: 3,
  button: 4,
};

const getCell = (row) => row?.firstElementChild || row;

const getText = (cell) => cell?.textContent.trim() || '';

const getCardCells = (row) => {
  const cells = [...row.children];
  if (cells.length > 1) return cells;

  const nestedCells = [...(cells[0]?.children || [])];
  return nestedCells.length > 1 ? nestedCells : cells;
};

const createElement = (tagName, className) => {
  const element = document.createElement(tagName);
  element.className = className;
  return element;
};

// Reserve the intrinsic aspect ratio so lazy-loaded images don't shift layout (CLS).
const setDimensions = (element, image) => {
  const width = image?.getAttribute('width');
  const height = image?.getAttribute('height');
  if (width && height) {
    element.setAttribute('width', width);
    element.setAttribute('height', height);
  }
};

const createPicture = (desktopImage, mobileImage) => {
  const fallback = mobileImage || desktopImage;
  if (!fallback) return null;

  const picture = document.createElement('picture');

  if (desktopImage && mobileImage) {
    const source = document.createElement('source');
    source.media = DESKTOP_MEDIA_QUERY;
    source.srcset = toWebp(desktopImage.src, DESKTOP_IMAGE_WIDTH);
    setDimensions(source, desktopImage);
    picture.append(source);
  }

  const img = document.createElement('img');
  const imageWidth = fallback === desktopImage
    ? DESKTOP_IMAGE_WIDTH
    : MOBILE_IMAGE_WIDTH;
  img.src = toWebp(fallback.src, imageWidth);
  img.alt = desktopImage?.alt || mobileImage?.alt || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  setDimensions(img, fallback);
  picture.append(img);

  return picture;
};

const createMedia = (desktopCell, mobileCell) => {
  const picture = createPicture(
    desktopCell?.querySelector('img'),
    mobileCell?.querySelector('img'),
  );
  if (!picture) return null;

  const media = createElement('div', 'vida-pdp-connected-media');
  media.append(picture);
  return media;
};

const createIcon = (cell) => {
  const source = cell?.querySelector('img');
  if (!source?.src) return null;

  const icon = createElement('span', 'vida-pdp-connected-icon');
  const img = document.createElement('img');
  img.src = source.src;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  setDimensions(img, source);
  icon.append(img);
  return icon;
};

const createCard = (row) => {
  const [iconCell, titleCell, descriptionCell] = getCardCells(row);
  const card = document.createElement('li');
  card.className = 'vida-pdp-connected-card';
  moveInstrumentation(row, card);

  const icon = createIcon(iconCell);
  if (icon) card.append(icon);

  const copy = createElement('div', 'vida-pdp-connected-card-copy');

  const titleText = getText(titleCell);
  if (titleText) {
    const title = createElement('h3', 'vida-pdp-connected-card-title');
    title.textContent = titleText;
    moveInstrumentation(titleCell, title);
    copy.append(title);
  }

  const descriptionText = getText(descriptionCell);
  if (descriptionText) {
    const description = createElement('p', 'vida-pdp-connected-card-description');
    description.textContent = descriptionText;
    moveInstrumentation(descriptionCell, description);
    copy.append(description);
  }

  card.append(copy);
  return card;
};

const createCards = (rows) => {
  const cards = rows
    .filter((row) => row.textContent.trim() || row.querySelector('img'))
    .map(createCard);
  if (!cards.length) return null;

  const list = createElement('ul', 'vida-pdp-connected-cards');
  list.append(...cards);
  return list;
};

const createButton = (cell) => {
  const source = cell?.querySelector('a');
  const href = source?.getAttribute('href');
  const label = getText(source);
  if (!href || !label) return null;

  const button = createElement('a', 'vida-pdp-connected-button');
  button.href = href;
  button.textContent = label;
  if (source.title) button.title = source.title;
  moveInstrumentation(cell, button);
  markTracked(button);
  return button;
};

export default function decorate(block) {
  const rows = [...block.children];
  const cardRows = rows.slice(PARENT_FIELD_COUNT);
  const cell = (name) => getCell(rows[FIELD_INDEX[name]]);

  const fragment = document.createDocumentFragment();
  const intro = createElement('div', 'vida-pdp-connected-intro');

  const text = createElement('div', 'vida-pdp-connected-text');
  const headingText = getText(cell('heading'));
  if (headingText) {
    const heading = createElement('h2', 'vida-pdp-connected-heading');
    heading.textContent = headingText;
    moveInstrumentation(cell('heading'), heading);
    text.append(heading);
  }

  const subtextText = getText(cell('subtext'));
  if (subtextText) {
    const subtext = createElement('p', 'vida-pdp-connected-subtext');
    subtext.textContent = subtextText;
    moveInstrumentation(cell('subtext'), subtext);
    text.append(subtext);
  }
  if (text.children.length) intro.append(text);

  const button = createButton(cell('button'));
  if (button) {
    const action = createElement('div', 'vida-pdp-connected-action');
    action.append(button);
    intro.append(action);
  }
  if (intro.children.length) fragment.append(intro);

  const media = createMedia(cell('desktopImage'), cell('mobileImage'));
  const cards = createCards(cardRows);
  const feature = createElement('div', 'vida-pdp-connected-feature');
  if (media) feature.append(media);
  if (cards) feature.append(cards);
  if (feature.children.length) fragment.append(feature);

  block.replaceChildren(fragment);
}
