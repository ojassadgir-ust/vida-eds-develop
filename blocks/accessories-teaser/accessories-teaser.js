import { markTracked } from '../../scripts/analytics.js';
import { moveInstrumentation, toWebp } from '../../scripts/scripts.js';

const BLOCK = 'accessories-teaser';

// Must match the media query used for the layout in accessories-teaser.css
const DESKTOP_MEDIA = '(min-width: 768px)';
const DESKTOP_IMAGE_WIDTH = 1000;
const MOBILE_IMAGE_WIDTH = 800;

const createElement = (tagName, className) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
};

/**
 * The block's own fields are single-cell rows (heading, cta link, cta icon). Rows are matched
 * by content rather than position so an empty field does not shift the others.
 */
const readBlockFields = (rows) => {
  const fields = {};

  rows.forEach((row) => {
    const cell = row.firstElementChild;

    if (!cell) {
      return;
    }

    if (cell.querySelector('img')) {
      fields.icon = fields.icon || cell;
    } else if (cell.querySelector('a')) {
      fields.cta = fields.cta || cell;
    } else if (cell.textContent.trim()) {
      fields.heading = fields.heading || cell;
    }
  });

  return fields;
};

const buildPicture = (desktopCell, mobileCell) => {
  const desktopImage = desktopCell?.querySelector('img');
  const mobileImage = mobileCell?.querySelector('img');
  const fallback = mobileImage || desktopImage;

  if (!fallback) {
    return null;
  }

  const picture = document.createElement('picture');

  if (desktopImage && mobileImage) {
    const source = document.createElement('source');

    source.media = DESKTOP_MEDIA;
    source.srcset = toWebp(desktopImage.src, DESKTOP_IMAGE_WIDTH);
    picture.append(source);
  }

  // The card title already names the accessory, so the image is decorative
  const image = createElement('img', `${BLOCK}-image`);

  image.src = toWebp(
    fallback.src,
    fallback === desktopImage ? DESKTOP_IMAGE_WIDTH : MOBILE_IMAGE_WIDTH,
  );
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  moveInstrumentation(fallback, image);
  picture.append(image);

  return picture;
};

const buildCard = (row) => {
  const [titleCell, descriptionCell, desktopCell, mobileCell] = row.children;
  const card = createElement('li', `${BLOCK}-card`);

  moveInstrumentation(row, card);

  const picture = buildPicture(desktopCell, mobileCell);

  if (picture) {
    const media = createElement('div', `${BLOCK}-media`);

    media.append(picture);
    card.append(media);
  }

  const content = createElement('div', `${BLOCK}-content`);
  const titleText = titleCell?.textContent.trim();

  if (titleText) {
    const title = createElement('h3', `${BLOCK}-title`);

    title.textContent = titleText;
    moveInstrumentation(titleCell, title);
    content.append(title);
  }

  if (descriptionCell?.textContent.trim()) {
    const description = createElement('div', `${BLOCK}-description`);

    description.append(...descriptionCell.childNodes);
    moveInstrumentation(descriptionCell, description);
    content.append(description);
  }

  if (content.hasChildNodes()) {
    card.append(content);
  }

  return card;
};

const buildCta = (ctaCell, iconCell) => {
  const anchor = ctaCell?.querySelector('a');
  const label = anchor?.textContent.trim();
  const href = anchor?.getAttribute('href');

  if (!label || !href) {
    return null;
  }

  const cta = createElement('a', `${BLOCK}-cta`);
  const text = createElement('span', `${BLOCK}-cta-text`);

  cta.href = href;
  text.textContent = label;
  cta.append(text);
  moveInstrumentation(ctaCell, cta);

  const authoredIcon = iconCell?.querySelector('img');

  if (authoredIcon) {
    // Used as authored: toWebp would break SVG icons
    const icon = createElement('img', `${BLOCK}-cta-icon`);

    icon.src = authoredIcon.src;
    icon.alt = '';
    icon.loading = 'lazy';
    moveInstrumentation(authoredIcon, icon);
    cta.append(icon);
  }

  return markTracked(cta);
};

export default function decorate(block) {
  const rows = [...block.children];
  const cardRows = rows.filter((row) => row.children.length > 1);
  const fields = readBlockFields(rows.filter((row) => row.children.length <= 1));
  const content = [];

  const headingText = fields.heading?.textContent.trim();

  if (headingText) {
    const heading = createElement('h2', `${BLOCK}-heading`);

    heading.textContent = headingText;
    moveInstrumentation(fields.heading, heading);
    content.push(heading);
  }

  if (cardRows.length) {
    const list = createElement('ul', `${BLOCK}-list`);

    list.append(...cardRows.map(buildCard));
    content.push(list);
  }

  const cta = buildCta(fields.cta, fields.icon);

  if (cta) {
    content.push(cta);
  }

  block.replaceChildren(...content);
}
