import toWebp from "../../scripts/to-webp.js";

const CONFIG = {
  classes: {
    block: 'vida-removable-battery',
    overlay: 'vida-removable-battery-overlay',
    media: 'vida-removable-battery-media',
    contentWrapper: 'vida-removable-battery-content-wrapper',
    content: 'vida-removable-battery-content',
    heading: 'vida-removable-battery-heading',
    headingSpecial: 'vida-removable-battery-heading-special',
    subheading: 'vida-removable-battery-subheading',
    subheadingSpaced: 'vida-removable-battery-subheading-spaced',
    richtext: 'vida-removable-battery-richtext',
    cta: 'vida-removable-battery-cta',
  },
  attributes: {
    desktopImage: '--vida-removable-battery-desktop-image',
    mobileImage: '--vida-removable-battery-mobile-image',
    tabletImage: '--vida-removable-battery-tablet-image',
  },
};

const getImageSource = (cell, width) => {
  if (!cell) {
    return '';
  }

  const image = cell.querySelector('img');

  return image ? toWebp(image.src, width) : '';
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
  tabletImage,
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

  if (tabletImage) {
    block.style.setProperty(
      CONFIG.attributes.tabletImage,
      `url("${tabletImage}")`,
    );
  }
};

const getContentFields = (contentCell) => {
  if (!contentCell) {
    return [];
  }

  const fields = Array.from(contentCell.children);

  if (fields.length > 1) {
    return fields;
  }

  const firstField = fields[0];

  if (!firstField) {
    return [];
  }

  const nestedFields = Array.from(firstField.children);

  if (nestedFields.length > 1) {
    return nestedFields;
  }

  return fields;
};

const createHeadingContent = (heading, value) => {
  Array.from(value).forEach((character) => {
    const isSpecialCharacter = /[^a-zA-Z0-9\s]/u.test(character);

    if (isSpecialCharacter) {
      const specialCharacter = document.createElement('span');

      specialCharacter.className = CONFIG.classes.headingSpecial;
      specialCharacter.textContent = character;

      heading.append(specialCharacter);
    } else {
      heading.append(document.createTextNode(character));
    }
  });
};

const hasMoreThanFiveWords = (value) => {
  const words = value.trim().split(/\s+/u);

  return words.length > 6;
};

const createContent = (cells, contentIndex) => {
  const content = createElement(
    'div',
    CONFIG.classes.content,
  );

  const contentCell = cells[contentIndex];

  if (!contentCell) {
    return content;
  }

  const contentFields = getContentFields(contentCell);

  if (contentFields[0]) {
    const headingValue = getCellText(contentFields[0]);

    if (headingValue) {
      const heading = createElement(
        'h2',
        CONFIG.classes.heading,
      );

      createHeadingContent(heading, headingValue);
      content.append(heading);
    }
  }

  if (contentFields[1]) {
    const subheadingValue = getCellText(contentFields[1]);

    if (subheadingValue) {
      const subheading = createElement(
        'p',
        CONFIG.classes.subheading,
      );

      if (hasMoreThanFiveWords(subheadingValue)) {
        subheading.classList.add(
          CONFIG.classes.subheadingSpaced,
        );
      }

      subheading.textContent = subheadingValue;
      content.append(subheading);
    }
  }

  if (contentFields[2]) {
    const richtextValue = getCellHTML(contentFields[2]);

    if (richtextValue) {
      const richtext = createElement(
        'div',
        CONFIG.classes.richtext,
      );

      richtext.innerHTML = richtextValue;
      content.append(richtext);
    }
  }

  return content;
};

const getCtaFields = (ctaCell) => {
  if (!ctaCell) {
    return [];
  }

  const fields = Array.from(ctaCell.children);

  if (fields.length > 1) {
    return fields;
  }

  const firstField = fields[0];

  if (!firstField) {
    return [];
  }

  const nestedFields = Array.from(firstField.children);

  if (nestedFields.length > 1) {
    return nestedFields;
  }

  return fields;
};

const createCta = (cells, ctaIndex) => {
  const ctaCell = cells[ctaIndex];

  if (!ctaCell) {
    return null;
  }

  const ctaFields = getCtaFields(ctaCell);

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

  const desktopImage = getImageSource(cells[0], 2000);
  const mobileImage = getImageSource(cells[1], 750);
  const hasTabletImageField = cells.length >= 5;
  const tabletImage = hasTabletImageField ? getImageSource(cells[2], 1024) : '';
  const contentIndex = hasTabletImageField ? 3 : 2;
  const ctaIndex = hasTabletImageField ? 4 : 3;

  setBackgroundImages(
    block,
    desktopImage,
    mobileImage,
    tabletImage,
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

  const content = createContent(cells, contentIndex);
  const cta = createCta(cells, ctaIndex);

  contentWrapper.append(content);

  if (cta) {
    contentWrapper.append(cta);
  }

  overlay.append(media);
  overlay.append(contentWrapper);

  block.replaceChildren(overlay);

  block.classList.add(CONFIG.classes.block);
}
