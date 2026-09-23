const CONFIG = {
  fields: {
    desktopImage: 0,
    mobileImage: 1,
    heading: 2,
    subheading: 3,
    richText: 4,
    cta: 5,
    ctaLink: 6,
  },

  classes: {
    container: 'vida-recharge-container',
    background: 'vida-recharge-background',
    desktopImage: 'vida-recharge-image-desktop',
    mobileImage: 'vida-recharge-image-mobile',
    content: 'vida-recharge-content',
    heading: 'vida-recharge-heading',
    subheading: 'vida-recharge-subheading',
    richText: 'vida-recharge-rich-text',
    cta: 'vida-recharge-cta',
  },

  selectors: {
    row: ':scope > div',
    cell: ':scope > div',
    picture: 'picture',
    image: 'img',
    link: 'a',
  },
};

const getRows = (block) => [...block.querySelectorAll(CONFIG.selectors.row)];

const getCell = (rows, index) => (
  rows[index]?.querySelector(CONFIG.selectors.cell)
);

const getText = (rows, index) => (
  getCell(rows, index)?.textContent.trim() || ''
);

const getImage = (rows, index) => (
  getCell(rows, index)?.querySelector(CONFIG.selectors.picture)
  || getCell(rows, index)?.querySelector(CONFIG.selectors.image)
);

const getLink = (rows, index) => (
  getCell(rows, index)?.querySelector(CONFIG.selectors.link)
);

const cloneImage = (source, className) => {
  if (!source) {
    return null;
  }

  const image = source.cloneNode(true);
  image.classList.add(className);

  return image;
};

const createHeading = (text) => {
  if (!text) {
    return null;
  }

  const heading = document.createElement('h2');
  heading.className = CONFIG.classes.heading;
  heading.textContent = text;

  return heading;
};

const createSubheading = (text) => {
  if (!text) {
    return null;
  }

  const subheading = document.createElement('p');
  subheading.className = CONFIG.classes.subheading;
  subheading.textContent = text;

  return subheading;
};

const createRichText = (cell) => {
  if (!cell?.innerHTML.trim()) {
    return null;
  }

  const richText = document.createElement('div');
  richText.className = CONFIG.classes.richText;
  richText.innerHTML = cell.innerHTML;

  return richText;
};

const createCta = (text, link) => {
  const href = link?.getAttribute('href');

  if (!text || !href) {
    return null;
  }

  const cta = document.createElement('a');

  cta.className = CONFIG.classes.cta;
  cta.href = href;
  cta.textContent = text;

  return cta;
};

export default function decorate(block) {
  const rows = getRows(block);

  const desktopImage = cloneImage(
    getImage(rows, CONFIG.fields.desktopImage),
    CONFIG.classes.desktopImage,
  );

  const mobileImage = cloneImage(
    getImage(rows, CONFIG.fields.mobileImage),
    CONFIG.classes.mobileImage,
  );

  const background = document.createElement('div');
  background.className = CONFIG.classes.background;

  if (desktopImage) {
    background.append(desktopImage);
  }

  if (mobileImage) {
    background.append(mobileImage);
  }

  const content = document.createElement('div');
  content.className = CONFIG.classes.content;

  const heading = createHeading(
    getText(rows, CONFIG.fields.heading),
  );

  const subheading = createSubheading(
    getText(rows, CONFIG.fields.subheading),
  );

  const richText = createRichText(
    getCell(rows, CONFIG.fields.richText),
  );

  const cta = createCta(
    getText(rows, CONFIG.fields.cta),
    getLink(rows, CONFIG.fields.ctaLink),
  );

  [heading, subheading, richText, cta].forEach((element) => {
    if (element) {
      content.append(element);
    }
  });

  const container = document.createElement('div');
  container.className = CONFIG.classes.container;

  container.append(background, content);

  block.replaceChildren(container);
}
