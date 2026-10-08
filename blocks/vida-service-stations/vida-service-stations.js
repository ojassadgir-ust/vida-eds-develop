import { ENV, BASE_URLS } from '../../scripts/env.config.js';

const CONFIG = {
  groups: {
    images: 0,
    content: 1,
    links: 2,
  },
  fields: {
    desktopImage: 0,
    mobileImage: 1,
    heading: 0,
    subheading: 1,
    richText: 2,
    ctaLabel: 0,
    ctaLink: 1,
    externalLabel: 2,
    externalUrl: 3,
  },
  fieldCounts: {
    images: 2,
    content: 3,
    links: 4,
  },
  flatFieldStarts: {
    images: 0,
    content: 2,
    links: 5,
  },
  content: {
    headingAccent: '+',
    imageAlt: 'VIDA service station',
    mobileImageMedia: '(max-width: 1023px)',
    externalArrowSrc: new URL(
      '/content/dam/vida2-0/home-page/desktop/IconRight.svg',
      BASE_URLS[ENV] || 'https://dev.vidaworld.com',
    ).href,
    emptyCtaHref: '#',
  },
  classes: {
    container: 'vida-service-stations-container',
    overlay: 'vida-service-stations-overlay',
    content: 'vida-service-stations-content',
    heading: 'vida-service-stations-heading',
    headingAccent: 'vida-service-stations-heading-accent',
    subheading: 'vida-service-stations-subheading',
    richText: 'vida-service-stations-rich-text',
    actions: 'vida-service-stations-actions',
    cta: 'vida-service-stations-cta',
    external: 'vida-service-stations-external',
    externalArrow: 'vida-service-stations-external-arrow',
    media: 'vida-service-stations-media',
    picture: 'vida-service-stations-picture',
    image: 'vida-service-stations-image',
  },
};

const getRows = (element) => (element ? [...element.children] : []);

const unwrapFieldCell = (row) => {
  let cell = row?.firstElementChild || row || null;

  while (
    cell
    && cell.children.length === 1
    && !cell.matches('picture, img')
    && !cell.firstElementChild.matches('picture, img')
  ) {
    cell = cell.firstElementChild;
  }

  return cell;
};

const findFieldRows = (group, expectedCount) => {
  const pending = [group];

  while (pending.length) {
    const current = pending.shift();
    const children = getRows(current);

    if (children.length === expectedCount) {
      return children.map(unwrapFieldCell);
    }

    pending.push(...children);
  }

  return [];
};

const getGroupFields = (rows, groupIndex, groupName) => {
  const expectedCount = CONFIG.fieldCounts[groupName];
  const flatStart = CONFIG.flatFieldStarts[groupName];

  if (rows.length >= flatStart + expectedCount && rows.length !== 3) {
    return rows
      .slice(flatStart, flatStart + expectedCount)
      .map(unwrapFieldCell);
  }

  const group = rows[groupIndex];

  if (!group) {
    return [];
  }

  const groupCell = group.firstElementChild || group;
  const fieldRows = findFieldRows(groupCell, expectedCount);

  return fieldRows.length
    ? fieldRows
    : getRows(groupCell).map(unwrapFieldCell);
};

const getText = (cell) => cell?.textContent.trim() || '';

const getRichText = (cell) => cell?.innerHTML.trim() || '';

const getLink = (cell) => (
  cell?.matches('a') ? cell : cell?.querySelector('a') || null
);

const getHref = (cell) => getLink(cell)?.getAttribute('href') || getText(cell);

const createElement = (tagName, className) => {
  const element = document.createElement(tagName);
  element.className = className;
  return element;
};

const createContent = (fields) => {
  const content = createElement('div', CONFIG.classes.content);
  const headingText = getText(fields[CONFIG.fields.heading]);
  const subheadingText = getText(fields[CONFIG.fields.subheading]);
  const richTextHtml = getRichText(fields[CONFIG.fields.richText]);

  if (headingText) {
    const heading = createElement('h2', CONFIG.classes.heading);

    if (headingText.endsWith(CONFIG.content.headingAccent)) {
      const headingLabel = headingText.slice(0, -CONFIG.content.headingAccent.length);
      const accent = createElement('span', CONFIG.classes.headingAccent);
      accent.textContent = CONFIG.content.headingAccent;
      heading.append(document.createTextNode(headingLabel), accent);
    } else {
      heading.textContent = headingText;
    }

    content.append(heading);
  }

  if (subheadingText) {
    const subheading = createElement('p', CONFIG.classes.subheading);
    subheading.textContent = subheadingText;
    content.append(subheading);
  }

  if (richTextHtml) {
    const richText = createElement('div', CONFIG.classes.richText);
    richText.innerHTML = richTextHtml;
    content.append(richText);
  }

  return content;
};

const createActionLink = (
  fields,
  labelIndex,
  urlIndex,
  className,
  fallbackLink = null,
  renderWithoutHref = false,
) => {
  const labelCell = fields[labelIndex];
  const urlCell = fields[urlIndex];
  const urlLink = getLink(urlCell);
  const labelLink = getLink(labelCell);
  const label = getText(labelCell)
    || getText(urlLink)
    || getText(fallbackLink);
  const href = getHref(urlCell)
    || labelLink?.getAttribute('href')
    || fallbackLink?.getAttribute('href')
    || '';

  if (!label || (!href && !renderWithoutHref)) {
    return null;
  }

  const link = createElement('a', className);
  link.href = href || CONFIG.content.emptyCtaHref;
  link.textContent = label;
  return link;
};

const createActions = (fields, linksGroup) => {
  const actions = createElement('div', CONFIG.classes.actions);
  const authoredLinks = [...(linksGroup?.querySelectorAll('a[href]') || [])];
  const cta = createActionLink(
    fields,
    CONFIG.fields.ctaLabel,
    CONFIG.fields.ctaLink,
    CONFIG.classes.cta,
    authoredLinks[0],
    true,
  );
  const external = createActionLink(
    fields,
    CONFIG.fields.externalLabel,
    CONFIG.fields.externalUrl,
    CONFIG.classes.external,
    authoredLinks[1],
  );

  if (cta) {
    actions.append(cta);
  }

  if (external) {
    const arrow = createElement('img', CONFIG.classes.externalArrow);
    arrow.src = CONFIG.content.externalArrowSrc;
    arrow.alt = '';
    arrow.setAttribute('aria-hidden', 'true');
    external.append(arrow);
    actions.append(external);
  }

  return actions.childElementCount ? actions : null;
};

const createMedia = (imageFields) => {
  const desktopField = imageFields[CONFIG.fields.desktopImage];
  const mobileField = imageFields[CONFIG.fields.mobileImage];
  const desktopPicture = desktopField?.matches('picture')
    ? desktopField
    : desktopField?.querySelector('picture');
  const mobilePicture = mobileField?.matches('picture')
    ? mobileField
    : mobileField?.querySelector('picture');
  const desktopImage = desktopPicture?.querySelector('img')
    || (desktopField?.matches('img') ? desktopField : desktopField?.querySelector('img'));
  const mobileImage = mobilePicture?.querySelector('img')
    || (mobileField?.matches('img') ? mobileField : mobileField?.querySelector('img'));

  if (!desktopImage && !mobileImage) {
    return null;
  }

  const media = createElement('div', CONFIG.classes.media);
  const picture = createElement('picture', CONFIG.classes.picture);

  if (mobileImage && desktopImage) {
    const source = document.createElement('source');
    source.media = CONFIG.content.mobileImageMedia;
    source.srcset = mobileImage.currentSrc || mobileImage.src;
    picture.append(source);
  }

  const image = (desktopImage || mobileImage).cloneNode(true);
  image.className = CONFIG.classes.image;
  image.alt = image.alt || CONFIG.content.imageAlt;
  picture.append(image);
  media.append(picture);

  return media;
};

export default function decorate(block) {
  const rows = getRows(block);
  const imageFields = getGroupFields(rows, CONFIG.groups.images, 'images');
  const contentFields = getGroupFields(rows, CONFIG.groups.content, 'content');
  const linkFields = getGroupFields(rows, CONFIG.groups.links, 'links');
  const linksGroup = rows[CONFIG.groups.links]?.firstElementChild
    || rows[CONFIG.groups.links];
  const overlay = createElement('div', CONFIG.classes.overlay);
  const content = createContent(contentFields);
  const actions = createActions(linkFields, linksGroup);
  const media = createMedia(imageFields);

  if (actions) {
    content.append(actions);
  }

  overlay.append(content);

  if (media) {
    overlay.append(media);
  }

  const container = createElement('div', CONFIG.classes.container);
  container.append(overlay);
  block.replaceChildren(container);
}
