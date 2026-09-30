/**
 * DIRTE K3 Banner Block
 * Renders responsive banner with heading, logo, image, text, button, and specifications
 */

/**
 * Extract rich text and URL from element
 * @param {Element} element - DOM element
 * @returns {Object} Object with text and url properties
 */
function getRichText(element) {
  if (!element) {
    return {
      text: '',
      url: '',
    };
  }

  const link = element.querySelector('a');
  const text = link?.textContent?.trim() || element.textContent.trim();
  const url = link?.getAttribute('href') || '';

  return { text, url };
}

/**
 * Extract banner fields from children array
 * @param {Array} fields - Array of field elements
 * @returns {Object} Banner fields object
 */
function getBannerFields(fields) {
  return {
    desktopImage: fields[0] || null,
    tabletImage: fields[1] || null,
    mobileImage: fields[2] || null,
    backgroundColor: fields[3] || null,
  };
}

/**
 * Extract content from content block
 * @param {Element} contentElement - Content block element
 * @returns {Object} Content object with heading, logo, subheading, cta
 */
function getContent(contentElement) {
  if (!contentElement) {
    return {
      heading: '',
      logo: null,
      subheading: '',
      cta: { text: '', url: '' },
    };
  }

  const children = Array.from(contentElement.children);

  return {
    heading: children[0]?.textContent?.trim() || '',
    logo: children[1] || null,
    subheading: children[2]?.textContent?.trim() || '',
    cta: getRichText(children[3]),
  };
}

/**
 * Extract specifications from spec blocks
 * @param {Array} specElements - Array of spec elements
 * @returns {Array} Array of { label, value } objects
 */
function getSpecifications(specElements) {
  if (!specElements || specElements.length === 0) {
    return [];
  }

  return specElements
    .map((spec) => {
      const children = Array.from(spec.children);
      return {
        label: children[0]?.textContent?.trim() || '',
        value: children[1]?.textContent?.trim() || '',
      };
    })
    .filter((item) => item.label || item.value);
}

/**
 * Create heading element
 * @param {string} text - Heading text
 * @returns {Element|null} h2 element or null
 */
function createHeading(text) {
  if (!text) {
    return null;
  }

  const heading = document.createElement('h2');
  heading.className = 'dirte-k3-heading';
  heading.textContent = text;

  return heading;
}

/**
 * Create logo wrapper with image
 * @param {Element} logoElement - Logo picture element
 * @returns {Element|null} Logo wrapper div or null
 */
function createLogo(logoElement) {
  if (!logoElement) {
    return null;
  }

  const logoWrapper = document.createElement('div');
  logoWrapper.className = 'dirte-k3-logo-wrapper';

  const img = document.createElement('img');
  img.className = 'dirte-k3-logo';
  img.src = logoElement.querySelector('img')?.src || '';
  img.alt = 'DIRTE K3 Logo';

  logoWrapper.appendChild(img);

  return logoWrapper;
}

/**
 * Create subheading paragraph
 * @param {string} text - Subheading text
 * @returns {Element|null} p element or null
 */
function createSubheading(text) {
  if (!text) {
    return null;
  }

  const subheading = document.createElement('p');
  subheading.className = 'dirte-k3-subheading';
  subheading.textContent = text;

  return subheading;
}

/**
 * Create CTA button/link
 * @param {Object} ctaData - CTA data with text and url
 * @returns {Element|null} a element or null
 */
function createCTA(ctaData) {
  if (!ctaData || !ctaData.text) {
    return null;
  }

  const cta = document.createElement('a');
  cta.className = 'dirte-k3-cta';
  cta.textContent = ctaData.text;
  cta.href = ctaData.url || '#';

  if (!ctaData.url) {
    cta.setAttribute('role', 'button');
    cta.setAttribute('tabindex', '0');
  }

  return cta;
}

/**
 * Create media container with responsive images
 * @param {Element} desktopImage - Desktop image element
 * @param {Element} tabletImage - Tablet image element
 * @param {Element} mobileImage - Mobile image element
 * @returns {Element} Media container div
 */
function createMedia(desktopImage, tabletImage, mobileImage) {
  const media = document.createElement('div');
  media.className = 'dirte-k3-media';

  // Desktop picture
  const desktopPicture = document.createElement('picture');
  desktopPicture.className = 'dirte-k3-desktop-picture';
  const desktopImg = document.createElement('img');
  desktopImg.className = 'dirte-k3-desktop-image';
  desktopImg.src = desktopImage?.querySelector('img')?.src || '';
  desktopImg.alt = 'DIRTE K3 Electric Dirt Bike - Desktop View';
  desktopPicture.appendChild(desktopImg);

  // Tablet picture
  const tabletPicture = document.createElement('picture');
  tabletPicture.className = 'dirte-k3-tablet-picture';
  const tabletImg = document.createElement('img');
  tabletImg.className = 'dirte-k3-tablet-image';
  tabletImg.src = tabletImage?.querySelector('img')?.src || '';
  tabletImg.alt = 'DIRTE K3 Electric Dirt Bike - Tablet View';
  tabletPicture.appendChild(tabletImg);

  // Mobile picture
  const mobilePicture = document.createElement('picture');
  mobilePicture.className = 'dirte-k3-mobile-picture';
  const mobileImg = document.createElement('img');
  mobileImg.className = 'dirte-k3-mobile-image';
  mobileImg.src = mobileImage?.querySelector('img')?.src || '';
  mobileImg.alt = 'DIRTE K3 Electric Dirt Bike - Mobile View';
  mobilePicture.appendChild(mobileImg);

  media.appendChild(desktopPicture);
  media.appendChild(tabletPicture);
  media.appendChild(mobilePicture);

  return media;
}

/**
 * Create divider element
 * @returns {Element} Divider div
 */
function createDivider() {
  const divider = document.createElement('div');
  divider.className = 'dirte-k3-divider';

  return divider;
}

/**
 * Create specifications container
 * @param {Array} specs - Array of specification objects
 * @returns {Element|null} Specifications container or null
 */
function createSpecifications(specs) {
  if (!specs || specs.length === 0) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'dirte-k3-specifications';

  specs.forEach((spec) => {
    const specDiv = document.createElement('div');
    specDiv.className = 'dirte-k3-spec';

    const label = document.createElement('div');
    label.className = 'dirte-k3-spec-label';
    label.textContent = spec.label;

    const value = document.createElement('div');
    value.className = 'dirte-k3-spec-value';
    value.textContent = spec.value;

    specDiv.appendChild(label);
    specDiv.appendChild(value);

    container.appendChild(specDiv);
  });

  return container;
}

/**
 * Main decorate function - transforms EDS content into banner
 * @param {Element} block - The banner block element
 */
export default function decorate(block) {
  if (!block) {
    return;
  }

  // Skip in author mode
  if (window.origin && window.origin.includes('author')) {
    return;
  }

  const children = Array.from(block.children);

  // Extract banner fields (images and background color)
  const bannerFields = getBannerFields(children.slice(0, 4));

  // Extract content block (heading, logo, subheading, CTA)
  const contentBlock = children[4];
  const content = getContent(contentBlock);

  // Extract specifications
  const specElements = children.slice(5);
  const specifications = getSpecifications(specElements);

  // Set background color if provided
  if (bannerFields.backgroundColor) {
    const bgColor = bannerFields.backgroundColor.textContent?.trim();
    if (bgColor && /^#[0-9A-F]{6}$/i.test(bgColor)) {
      block.style.setProperty('--dirte-k3-bg', bgColor);
    }
  }

  // Create text wrapper (heading, logo ONLY - no subheading)
  const textWrapper = document.createElement('div');
  textWrapper.className = 'dirte-k3-text';

  const heading = createHeading(content.heading);
  if (heading) {
    textWrapper.appendChild(heading);
  }

  const logo = createLogo(content.logo);
  if (logo) {
    textWrapper.appendChild(logo);
  }

  // Create subheading (SEPARATE - for reordering on tablet)
  const subheading = createSubheading(content.subheading);

  // Create media container (all responsive images)
  const media = createMedia(
    bannerFields.desktopImage,
    bannerFields.tabletImage,
    bannerFields.mobileImage,
  );

  // Create CTA button
  const cta = createCTA(content.cta);

  // Create content wrapper
  // Order: text (heading, logo) → media (image) → subheading (text) → button
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'dirte-k3-content-wrapper';

  contentWrapper.appendChild(textWrapper);
  contentWrapper.appendChild(media);

  if (subheading) {
    contentWrapper.appendChild(subheading);
  }

  if (cta) {
    contentWrapper.appendChild(cta);
  }

  // Create divider
  const divider = createDivider();

  // Create specifications
  const specificationsElement = createSpecifications(specifications);

  // Build final structure
  block.replaceChildren(contentWrapper);

  if (divider) {
    block.appendChild(divider);
  }

  if (specificationsElement) {
    block.appendChild(specificationsElement);
  }
}
