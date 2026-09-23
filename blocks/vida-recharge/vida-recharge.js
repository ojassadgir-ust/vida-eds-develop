const CONFIG = {
  fields: {
    groups: {
      images: 0,
      content: 1,
      cta: 2,
    },

    images: {
      desktop: 0,
      mobile: 1,
    },

    content: {
      heading: 0,
      subheading: 1,
      richContent: 2,
    },

    cta: {
      link: 0,
      text: 1,
    },
  },

  classes: {
    container: 'vida-recharge-container',
    background: 'vida-recharge-background',
    desktopImage: 'vida-recharge-image-desktop',
    mobileImage: 'vida-recharge-image-mobile',
    content: 'vida-recharge-content',
    heading: 'vida-recharge-heading',
    subheading: 'vida-recharge-subheading',
    richContent: 'vida-recharge-rich-content',
    cta: 'vida-recharge-cta',
  },

  selectors: {
    picture: 'picture',
    image: 'img',
    link: 'a',
  },
};

const getRows = (element) => (
  element ? [...element.children] : []
);

const getCell = (rows, index) => (
  rows[index]?.firstElementChild || null
);

const getText = (rows, index) => (
  getCell(rows, index)?.textContent.trim() || ''
);

const getImage = (rows, index) => {
  const cell = getCell(rows, index);

  return (
    cell?.querySelector(CONFIG.selectors.picture)
    || cell?.querySelector(CONFIG.selectors.image)
    || null
  );
};

const getLink = (cell) => (
  cell?.querySelector(CONFIG.selectors.link) || null
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

const createRichContent = (cell) => {
  if (!cell || !cell.textContent.trim()) {
    return null;
  }

  const richContent = cell.cloneNode(true);

  richContent.classList.add(CONFIG.classes.richContent);

  return richContent;
};

const createCta = (linkCell, text) => {
  const link = getLink(linkCell);
  const href = link?.getAttribute('href') || linkCell?.textContent.trim() || '';

  if (!href || !text) {
    return null;
  }

  const cta = document.createElement('a');

  cta.className = CONFIG.classes.cta;
  cta.href = href;
  cta.textContent = text;

  return cta;
};

export default function decorate(block) {
  const blockRows = getRows(block);

  const imagesGroup = getCell(
    blockRows,
    CONFIG.fields.groups.images,
  );

  const contentGroup = getCell(
    blockRows,
    CONFIG.fields.groups.content,
  );

  const ctaGroup = getCell(
    blockRows,
    CONFIG.fields.groups.cta,
  );

  const imageRows = getRows(imagesGroup);
  const contentRows = getRows(contentGroup);
  const ctaRows = getRows(ctaGroup);

  const desktopImage = cloneImage(
    getImage(imageRows, CONFIG.fields.images.desktop),
    CONFIG.classes.desktopImage,
  );

  const mobileImage = cloneImage(
    getImage(imageRows, CONFIG.fields.images.mobile),
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
    getText(contentRows, CONFIG.fields.content.heading),
  );

  const subheading = createSubheading(
    getText(contentRows, CONFIG.fields.content.subheading),
  );

  const richContent = createRichContent(
    getCell(contentRows, CONFIG.fields.content.richContent),
  );

  const cta = createCta(
    getCell(ctaRows, CONFIG.fields.cta.link),
    getText(ctaRows, CONFIG.fields.cta.text),
  );

  [
    heading,
    subheading,
    richContent,
    cta,
  ].forEach((element) => {
    if (element) {
      content.append(element);
    }
  });

  const container = document.createElement('div');

  container.className = CONFIG.classes.container;

  container.append(
    background,
    content,
  );

  block.replaceChildren(container);
}
