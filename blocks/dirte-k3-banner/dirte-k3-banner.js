function getRichText(element) {
  if (!element) {
    return { text: '', url: '' };
  }
  const link = element.querySelector('a');
  const text = link?.textContent?.trim() || element.textContent.trim();
  const url = link?.getAttribute('href') || '';
  return { text, url };
}

function getBannerFields(fields) {
  return {
    desktopImage: fields[0] || null,
    tabletImage: fields[1] || null,
    mobileImage: fields[2] || null,
    backgroundColor: fields[3] || null,
  };
}

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
  img.loading = 'lazy';
  img.decoding = 'async';
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
  cta.className = 'dirte-k3-cta';
  cta.textContent = ctaData.text;
  cta.href = ctaData.url || '#';
  if (!ctaData.url) {
    cta.setAttribute('role', 'button');
    cta.setAttribute('tabindex', '0');
  }
  return cta;
}

function resolvePicture(...candidates) {
  const source = candidates.find((el) => el?.querySelector('picture'));
  return source ? source.querySelector('picture').cloneNode(true) : null;
}

function addPicture(media, picture, className) {
  if (!picture) {
    return;
  }
  picture.classList.add(className);
  const img = picture.querySelector('img');
  if (img) {
    img.loading = 'lazy';
    img.decoding = 'async';
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', 'DIRTE K3 Electric Dirt Bike');
    }
  }
  media.appendChild(picture);
}

function createMedia(desktopImage, tabletImage, mobileImage) {
  const media = document.createElement('div');
  media.className = 'dirte-k3-media';

  addPicture(
    media,
    resolvePicture(desktopImage, tabletImage, mobileImage),
    'dirte-k3-desktop-picture',
  );
  addPicture(
    media,
    resolvePicture(tabletImage, desktopImage, mobileImage),
    'dirte-k3-tablet-picture',
  );
  addPicture(
    media,
    resolvePicture(mobileImage, desktopImage, tabletImage),
    'dirte-k3-mobile-picture',
  );

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

  const isAuthor = window?.origin !== undefined && window?.origin.includes('author');

  if (isAuthor) {
    return;
  }

  const children = Array.from(block.children);
  const bannerFields = getBannerFields(children.slice(0, 4));
  const contentBlock = children[4];
  const content = getContent(contentBlock);
  const specElements = children.slice(5);
  const specifications = getSpecifications(specElements);

  if (bannerFields.backgroundColor) {
    const bgColor = bannerFields.backgroundColor.textContent?.trim();
    if (bgColor && /^#[0-9A-F]{6}$/i.test(bgColor)) {
      block.style.setProperty('--dirte-k3-bg', bgColor);
    }
  }

  const textWrapper = document.createElement('div');
  textWrapper.className = 'dirte-k3-text';
  const heading = createHeading(content.heading);
  if (heading) textWrapper.appendChild(heading);
  const logo = createLogo(content.logo);
  if (logo) textWrapper.appendChild(logo);

  const subheading = createSubheading(content.subheading);
  const media = createMedia(
    bannerFields.desktopImage,
    bannerFields.tabletImage,
    bannerFields.mobileImage,
  );
  const cta = createCTA(content.cta);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'dirte-k3-content-wrapper';
  contentWrapper.appendChild(textWrapper);
  contentWrapper.appendChild(media);
  if (subheading) contentWrapper.appendChild(subheading);
  if (cta) contentWrapper.appendChild(cta);

  const divider = createDivider();
  const specificationsElement = createSpecifications(specifications);

  contentWrapper.appendChild(divider);
  if (specificationsElement) contentWrapper.appendChild(specificationsElement);

  block.replaceChildren(contentWrapper);
}
