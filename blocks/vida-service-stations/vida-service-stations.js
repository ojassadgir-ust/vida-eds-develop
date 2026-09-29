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
  classes: {
    container: 'vida-service-stations-container',
    overlay: 'vida-service-stations-overlay',
    content: 'vida-service-stations-content',
    heading: 'vida-service-stations-heading',
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

const getCell = (rows, index) => rows[index]?.firstElementChild || null;

const getGroupFields = (rows, groupIndex) => {
  const groupCell = getCell(rows, groupIndex);

  if (!groupCell) {
    return [];
  }

  return [...groupCell.children].map((row) => row.firstElementChild || row);
};

const getText = (cell) => cell?.textContent.trim() || '';

const getRichText = (cell) => (
  cell?.firstElementChild?.innerHTML.trim() || cell?.innerHTML.trim() || ''
);

const getLink = (cell) => cell?.querySelector('a') || null;

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
    heading.textContent = headingText;
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

const createActionLink = (fields, labelIndex, urlIndex, className) => {
  const label = getText(fields[labelIndex]);
  const href = getHref(fields[urlIndex]);

  if (!label || !href) {
    return null;
  }

  const link = createElement('a', className);
  link.href = href;
  link.textContent = label;
  return link;
};

const createActions = (fields) => {
  const actions = createElement('div', CONFIG.classes.actions);
  const cta = createActionLink(
    fields,
    CONFIG.fields.ctaLabel,
    CONFIG.fields.ctaLink,
    CONFIG.classes.cta,
  );
  const external = createActionLink(
    fields,
    CONFIG.fields.externalLabel,
    CONFIG.fields.externalUrl,
    CONFIG.classes.external,
  );

  if (cta) {
    actions.append(cta);
  }

  if (external) {
    const arrow = createElement('span', CONFIG.classes.externalArrow);
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '\u2192';
    external.append(arrow);
    actions.append(external);
  }

  return actions.childElementCount ? actions : null;
};

const createMedia = (imageFields) => {
  const desktopPicture = imageFields[CONFIG.fields.desktopImage]?.querySelector('picture');
  const mobilePicture = imageFields[CONFIG.fields.mobileImage]?.querySelector('picture');
  const desktopImage = desktopPicture?.querySelector('img')
    || imageFields[CONFIG.fields.desktopImage]?.querySelector('img');
  const mobileImage = mobilePicture?.querySelector('img')
    || imageFields[CONFIG.fields.mobileImage]?.querySelector('img');

  if (!desktopImage && !mobileImage) {
    return null;
  }

  const media = createElement('div', CONFIG.classes.media);
  const picture = createElement('picture', CONFIG.classes.picture);

  if (mobileImage && desktopImage) {
    const source = document.createElement('source');
    source.media = '(max-width: 1023px)';
    source.srcset = mobileImage.currentSrc || mobileImage.src;
    picture.append(source);
  }

  const image = (desktopImage || mobileImage).cloneNode(true);
  image.className = CONFIG.classes.image;
  image.alt = image.alt || 'VIDA service station';
  picture.append(image);
  media.append(picture);

  return media;
};

export default function decorate(block) {
  const rows = getRows(block);
  const imageFields = getGroupFields(rows, CONFIG.groups.images);
  const contentFields = getGroupFields(rows, CONFIG.groups.content);
  const linkFields = getGroupFields(rows, CONFIG.groups.links);
  const overlay = createElement('div', CONFIG.classes.overlay);
  const content = createContent(contentFields);
  const actions = createActions(linkFields);
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
