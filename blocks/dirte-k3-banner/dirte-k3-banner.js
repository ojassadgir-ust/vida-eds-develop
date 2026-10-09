/**
 * DIRTE K3 Banner block.
 * Builds a responsive banner (heading, logo, image, subheading, CTA, specifications)
 * from the authored rows.
 */

import toWebp from '../../scripts/to-webp.js';

function getRichText(element) {
  if (!element) {
    return { text: '', url: '' };
  }
  const link = element.querySelector('a');
  const text = link?.textContent?.trim() || element.textContent.trim();
  const url = link?.getAttribute('href') || '';
  return { text, url };
}

// Row order: desktop image, tablet image, mobile image.
function getBannerFields(fields) {
  return {
    desktopImage: fields[0] || null,
    tabletImage: fields[1] || null,
    mobileImage: fields[2] || null,
  };
}

// Row order: heading, logo, subheading, CTA.
function getContent(contentElement) {
  if (!contentElement) {
    return {
      heading: '', logo: null, subheading: '', cta: { text: '', url: '' },
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

function createHeading(text) {
  if (!text) return null;
  const heading = document.createElement('h2');
  heading.className = 'dirte-k3-heading';
  heading.textContent = text;
  return heading;
}

function createLogo(logoElement) {
  if (!logoElement) return null;
  const logoWrapper = document.createElement('div');
  logoWrapper.className = 'dirte-k3-logo-wrapper';
  const img = document.createElement('img');
  img.className = 'dirte-k3-logo';
  img.src = logoElement.querySelector('img')?.src || '';
  img.alt = 'DIRTE K3 Logo';
  logoWrapper.appendChild(img);
  return logoWrapper;
}

function createSubheading(text) {
  if (!text) return null;
  const subheading = document.createElement('p');
  subheading.className = 'dirte-k3-subheading';
  subheading.textContent = text;
  return subheading;
}

function createCTA(ctaData) {
  if (!ctaData || !ctaData.text) return null;
  const cta = document.createElement('a');
  cta.className = 'dirte-k3-cta button button-primary button-md';
  cta.textContent = ctaData.text;
  cta.href = ctaData.url || '#';
  if (!ctaData.url) {
    cta.setAttribute('role', 'button');
    cta.setAttribute('tabindex', '0');
  }
  return cta;
}

// One picture per breakpoint; CSS shows only the matching variant at a time.
const MEDIA_VARIANTS = [
  { size: 'desktop', label: 'Desktop View' },
  { size: 'tablet', label: 'Tablet View' },
  { size: 'mobile', label: 'Mobile View' },
];

const MEDIA_WIDTHS = { desktop: 2000, tablet: 1024, mobile: 750 };

function createMedia(desktopImage, tabletImage, mobileImage) {
  const imagesBySize = { desktop: desktopImage, tablet: tabletImage, mobile: mobileImage };
  const media = document.createElement('div');
  media.className = 'dirte-k3-media';

  MEDIA_VARIANTS.forEach(({ size, label }) => {
    const picture = document.createElement('picture');
    picture.className = `dirte-k3-${size}-picture`;

    const img = document.createElement('img');
    img.className = `dirte-k3-${size}-image`;
    img.loading = 'lazy';
    img.src = toWebp(imagesBySize[size]?.querySelector('img')?.src || '', MEDIA_WIDTHS[size]);
    img.alt = `DIRTE K3 Electric Dirt Bike - ${label}`;

    picture.appendChild(img);
    media.appendChild(picture);
  });

  return media;
}

function createDivider() {
  const divider = document.createElement('div');
  divider.className = 'dirte-k3-divider';
  return divider;
}

function createSpecifications(specs) {
  if (!specs || specs.length === 0) return null;
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

export default function decorate(block) {
  if (!block) {
    return;
  }

  // Universal Editor renders authoring fields itself; skip our markup there.
  if (window.origin?.includes('author')) {
    return;
  }

  const children = Array.from(block.children);

  // Row order: desktop/tablet/mobile images, content, specifications.
  const bannerFields = getBannerFields(children.slice(0, 3));
  const content = getContent(children[3]);
  const specifications = getSpecifications(children.slice(4));

  const textWrapper = document.createElement('div');
  textWrapper.className = 'dirte-k3-text';
  const heading = createHeading(content.heading);
  if (heading) textWrapper.appendChild(heading);
  const logo = createLogo(content.logo);
  if (logo) textWrapper.appendChild(logo);

  const subheading = createSubheading(content.subheading);
  const descriptionAction = document.createElement('div');
  descriptionAction.className = 'dirte-k3-description-action';
  if (subheading) descriptionAction.appendChild(subheading);
  const media = createMedia(
    bannerFields.desktopImage,
    bannerFields.tabletImage,
    bannerFields.mobileImage,
  );
  const cta = createCTA(content.cta);
  if (cta) descriptionAction.appendChild(cta);

  // Order: intro -> media -> description and CTA -> specifications.
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'dirte-k3-content-wrapper';
  contentWrapper.appendChild(textWrapper);
  contentWrapper.appendChild(media);
  if (descriptionAction.childElementCount) contentWrapper.appendChild(descriptionAction);

  const divider = createDivider();
  const specificationsElement = createSpecifications(specifications);
  const specificationsWrapper = document.createElement('div');
  specificationsWrapper.className = 'dirte-k3-specifications-wrapper';
  specificationsWrapper.appendChild(divider);
  if (specificationsElement) specificationsWrapper.appendChild(specificationsElement);

  contentWrapper.appendChild(specificationsWrapper);
  block.replaceChildren(contentWrapper);
}
