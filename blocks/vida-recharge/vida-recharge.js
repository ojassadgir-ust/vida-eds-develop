const CONFIG = {
  blockClass: 'vida-recharge',
  cardClass: 'vida-recharge-card',
  contentClass: 'vida-recharge-content',
  headingClass: 'vida-recharge-heading',
  subheadingClass: 'vida-recharge-subheading',
  richTextClass: 'vida-recharge-rich-text',
  ctaClass: 'vida-recharge-cta',
  mediaClass: 'vida-recharge-media',
  pictureClass: 'vida-recharge-picture',
  imageClass: 'vida-recharge-image',
  mobileBreakpoint: '(max-width: 767px)',
};

const getText = (element) => (
  element ? element.textContent.trim() : ''
);

const getChildren = (element) => (
  element ? Array.from(element.children) : []
);

const getImage = (element) => (
  element ? element.querySelector('img') : null
);

const getImageSource = (image) => {
  if (!image) {
    return '';
  }

  return image.currentSrc || image.src || '';
};

const createPicture = (desktopImage, mobileImage, heading) => {
  const sourceImage = desktopImage || mobileImage;

  if (!sourceImage) {
    return null;
  }

  const picture = document.createElement('picture');

  picture.className = CONFIG.pictureClass;

  const mobileSource = getImageSource(mobileImage);

  if (mobileSource) {
    const source = document.createElement('source');

    source.media = CONFIG.mobileBreakpoint;
    source.srcset = mobileSource;

    picture.append(source);
  }

  const image = sourceImage.cloneNode(true);

  image.className = CONFIG.imageClass;
  image.alt = image.alt || heading;
  image.loading = 'eager';
  image.decoding = 'async';

  picture.append(image);

  return picture;
};

const setBackgroundImages = (block, desktopImage, mobileImage) => {
  const desktopSource = getImageSource(desktopImage);
  const mobileSource = getImageSource(mobileImage) || desktopSource;

  if (desktopSource) {
    block.style.setProperty(
      '--vida-recharge-desktop-background',
      `url("${desktopSource}")`,
    );
  }

  if (mobileSource) {
    block.style.setProperty(
      '--vida-recharge-mobile-background',
      `url("${mobileSource}")`,
    );
  }
};

const createHeading = (source) => {
  const text = getText(source);

  if (!text) {
    return null;
  }

  const heading = document.createElement('h2');

  heading.className = CONFIG.headingClass;
  heading.textContent = text;

  return heading;
};

const createSubheading = (source) => {
  const text = getText(source);

  if (!text) {
    return null;
  }

  const subheading = document.createElement('div');

  subheading.className = CONFIG.subheadingClass;
  subheading.textContent = text;

  return subheading;
};

const createRichText = (source) => {
  if (!source || !getText(source)) {
    return null;
  }

  const richText = document.createElement('div');

  richText.className = CONFIG.richTextClass;

  Array.from(source.childNodes).forEach((node) => {
    richText.append(node.cloneNode(true));
  });

  return richText;
};

const createCta = (source) => {
  if (!source) {
    return null;
  }

  const link = source.querySelector('a[href]');

  if (!link) {
    return null;
  }

  const href = link.getAttribute('href');
  const label = getText(link);

  if (!href || !label) {
    return null;
  }

  const cta = document.createElement('a');

  cta.className = CONFIG.ctaClass;
  cta.href = href;
  cta.textContent = label;
  cta.setAttribute('aria-label', label);

  return cta;
};

export default function decorate(block) {
  block.classList.add(CONFIG.blockClass);

  const groups = getChildren(block);

  const mediaGroup = groups[0] || null;
  const contentGroup = groups[1] || null;

  if (!mediaGroup || !contentGroup) {
    return;
  }

  const mediaFields = getChildren(mediaGroup);
  const contentFields = getChildren(contentGroup);

  const desktopImage = getImage(mediaFields[0]);
  const mobileImage = getImage(mediaFields[1]);

  const headingField = contentFields[0] || null;
  const subheadingField = contentFields[1] || null;
  const richTextField = contentFields[2] || null;
  const ctaField = contentFields[3] || null;

  const heading = getText(headingField);

  setBackgroundImages(
    block,
    desktopImage,
    mobileImage,
  );

  const card = document.createElement('div');

  card.className = CONFIG.cardClass;

  const content = document.createElement('div');

  content.className = CONFIG.contentClass;

  const headingElement = createHeading(headingField);
  const subheadingElement = createSubheading(subheadingField);
  const richTextElement = createRichText(richTextField);
  const ctaElement = createCta(ctaField);

  if (headingElement) {
    content.append(headingElement);
  }

  if (subheadingElement) {
    content.append(subheadingElement);
  }

  if (richTextElement) {
    content.append(richTextElement);
  }

  if (ctaElement) {
    content.append(ctaElement);
  }

  const media = document.createElement('div');

  media.className = CONFIG.mediaClass;

  const picture = createPicture(
    desktopImage,
    mobileImage,
    heading,
  );

  if (picture) {
    media.append(picture);
  }

  card.append(content);
  card.append(media);

  block.replaceChildren(card);
}
