const CONFIG = {
  classes: {
    block: 'fast-charging',
    overlay: 'fast-charging-overlay',
    media: 'fast-charging-media',
    contentWrapper: 'fast-charging-content-wrapper',
    content: 'fast-charging-content',
    heading: 'fast-charging-heading',
    subheading: 'fast-charging-subheading',
    richtext: 'fast-charging-richtext',
    cta: 'fast-charging-cta',
  },
  attributes: {
    desktopImage: '--fast-charging-desktop-image',
    mobileImage: '--fast-charging-mobile-image',
  },
};

const getImageSource = (cell) => {
  if (!cell) {
    return '';
  }

  const image = cell.querySelector('img');

  return image?.currentSrc || image?.src || '';
};

const getCellText = (cell) => {
  if (!cell) {
    return '';
  }

  return cell.textContent.trim();
};

const getCellHTML = (cell) => {
  if (!cell) {
    return '';
  }

  return cell.innerHTML.trim();
};

const getCtaLink = (cell) => {
  if (!cell) {
    return '';
  }

  const link = cell.querySelector('a');

  if (link?.href) {
    return link.href;
  }

  return getCellText(cell);
};

const getCtaText = (cell) => {
  if (!cell) {
    return '';
  }

  const link = cell.querySelector('a');

  if (link) {
    return link.textContent.trim();
  }

  return getCellText(cell);
};

const createElement = (tagName, className) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
};

const setBackgroundImages = (
  block,
  desktopImage,
  mobileImage,
) => {
  if (desktopImage) {
    block.style.setProperty(
      CONFIG.attributes.desktopImage,
      `url("${desktopImage}")`,
    );
  }

  if (mobileImage) {
    block.style.setProperty(
      CONFIG.attributes.mobileImage,
      `url("${mobileImage}")`,
    );
  }
};

const createContent = (cells) => {
  const contentCell = cells[2];

  if (!contentCell) {
    return createElement(
      'div',
      CONFIG.classes.content,
    );
  }

  const contentFields = Array.from(contentCell.children);

  const headingValue = getCellText(contentFields[0]);
  const subheadingValue = getCellText(contentFields[1]);
  const richtextValue = getCellHTML(contentFields[2]);

  const content = createElement(
    'div',
    CONFIG.classes.content,
  );

  if (headingValue) {
    const heading = createElement(
      'h2',
      CONFIG.classes.heading,
    );

    heading.textContent = headingValue;
    content.append(heading);
  }

  if (subheadingValue) {
    const subheading = createElement(
      'p',
      CONFIG.classes.subheading,
    );

    subheading.textContent = subheadingValue;
    content.append(subheading);
  }

  if (richtextValue) {
    const richtext = createElement(
      'div',
      CONFIG.classes.richtext,
    );

    richtext.innerHTML = richtextValue;
    content.append(richtext);
  }

  return content;
};

const createCta = (cells) => {
  const ctaCell = cells[3];

  if (!ctaCell) {
    return null;
  }

  const ctaFields = Array.from(ctaCell.children);

  const ctaText = getCtaText(ctaFields[0]);
  const ctaLink = getCtaLink(ctaFields[1])
    || getCtaLink(ctaFields[0]);

  if (!ctaText || !ctaLink) {
    return null;
  }

  const cta = createElement(
    'a',
    CONFIG.classes.cta,
  );

  cta.href = ctaLink;
  cta.textContent = ctaText;

  return cta;
};

const createMedia = () => createElement(
  'div',
  CONFIG.classes.media,
);

export default function decorate(block) {
  const cells = Array.from(block.children);

  const desktopImage = getImageSource(cells[0]);
  const mobileImage = getImageSource(cells[1]);

  setBackgroundImages(
    block,
    desktopImage,
    mobileImage,
  );

  const overlay = createElement(
    'div',
    CONFIG.classes.overlay,
  );

  const media = createMedia();

  const contentWrapper = createElement(
    'div',
    CONFIG.classes.contentWrapper,
  );

  const content = createContent(cells);
  const cta = createCta(cells);

  contentWrapper.append(content);

  if (cta) {
    contentWrapper.append(cta);
  }

  overlay.append(media);
  overlay.append(contentWrapper);

  block.replaceChildren(overlay);

  block.classList.add(CONFIG.classes.block);
}
