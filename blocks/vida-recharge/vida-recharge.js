const CONFIG = {
  blockClass: 'vida-recharge',
  overlayClass: 'vida-recharge-overlay',
  contentClass: 'vida-recharge-content',
  headingClass: 'vida-recharge-heading',
  subheadingClass: 'vida-recharge-subheading',
  richTextClass: 'vida-recharge-rich-text',
  ctaClass: 'vida-recharge-cta',
  mobileImageClass: 'vida-recharge-mobile-image',
  mobilePictureClass: 'vida-recharge-mobile-picture',
  mobileBreakpoint: '(max-width: 767px)',
};

const getChildren = (element) => (
  element ? Array.from(element.children) : []
);

const getText = (element) => (
  element ? element.textContent.trim() : ''
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

const createHeading = (field) => {
  const text = getText(field);

  if (!text) {
    return null;
  }

  const heading = document.createElement('h2');

  heading.className = CONFIG.headingClass;
  heading.textContent = text;

  return heading;
};

const createSubheading = (field) => {
  const text = getText(field);

  if (!text) {
    return null;
  }

  const subheading = document.createElement('div');

  subheading.className = CONFIG.subheadingClass;
  subheading.textContent = text;

  return subheading;
};

const createRichText = (field) => {
  if (!field || !getText(field)) {
    return null;
  }

  const richText = document.createElement('div');

  richText.className = CONFIG.richTextClass;

  Array.from(field.childNodes).forEach((node) => {
    richText.append(node.cloneNode(true));
  });

  return richText;
};

const createCta = (ctaField, ctaTextField) => {
  const link = ctaField
    ? ctaField.querySelector('a[href]')
    : null;

  const label = getText(ctaTextField);

  if (!link || !label) {
    return null;
  }

  const href = link.getAttribute('href');

  if (!href) {
    return null;
  }

  const cta = document.createElement('a');

  cta.className = CONFIG.ctaClass;
  cta.href = href;
  cta.textContent = label;
  cta.setAttribute('aria-label', label);

  return cta;
};

const createMobileImage = (mobileImage, heading) => {
  if (!mobileImage) {
    return null;
  }

  const picture = document.createElement('picture');

  picture.className = CONFIG.mobilePictureClass;

  const image = mobileImage.cloneNode(true);

  image.className = CONFIG.mobileImageClass;
  image.alt = image.alt || heading;
  image.loading = 'eager';
  image.decoding = 'async';

  picture.append(image);

  return picture;
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

  /*
   * Media group
   *
   * 0 = Desktop image
   * 1 = Mobile image
   */
  const desktopImage = getImage(mediaFields[0]);
  const mobileImage = getImage(mediaFields[1]);

  /*
   * Content group
   *
   * 0 = Heading
   * 1 = Subheading
   * 2 = Rich text
   * 3 = CTA link
   * 4 = CTA text
   */
  const headingField = contentFields[0] || null;
  const subheadingField = contentFields[1] || null;
  const richTextField = contentFields[2] || null;
  const ctaField = contentFields[3] || null;
  const ctaTextField = contentFields[4] || null;

  const heading = getText(headingField);

  setBackgroundImages(
    block,
    desktopImage,
    mobileImage,
  );

  const overlay = document.createElement('div');

  overlay.className = CONFIG.overlayClass;

  const content = document.createElement('div');

  content.className = CONFIG.contentClass;

  const headingElement = createHeading(headingField);
  const subheadingElement = createSubheading(subheadingField);
  const richTextElement = createRichText(richTextField);
  const ctaElement = createCta(
    ctaField,
    ctaTextField,
  );

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

  overlay.append(content);

  /*
   * Mobile image is intentionally created only for
   * the mobile layout.
   *
   * It is NOT used as the desktop right-side image.
   */
  const mobileImageElement = createMobileImage(
    mobileImage,
    heading,
  );

  if (mobileImageElement) {
    block.append(mobileImageElement);
  }

  block.append(overlay);

  /*
   * Remove the original authored cells after their
   * values have been read.
   */
  block.querySelectorAll(':scope > div').forEach((element) => {
    if (
      element !== overlay
      && !element.classList.contains(CONFIG.mobilePictureClass)
    ) {
      element.remove();
    }
  });
}
