function getText(element) {
  return element?.textContent?.trim() || '';
}

function getImage(element) {
  return element?.querySelector('img') || null;
}

function getRichText(element) {
  if (!element) {
    return {
      text: '',
      url: '',
    };
  }

  const link = element.querySelector('a');

  return {
    text: link?.textContent?.trim() || element.textContent.trim(),
    url: link?.getAttribute('href') || '',
  };
}

function getContentBlock(block) {
  return [...block.children].find((child) => child.classList.contains('dirte-k3-content'));
}

function getContent(contentBlock) {
  if (!contentBlock) {
    return {
      heading: '',
      logo: null,
      subheading: '',
      cta: {
        text: '',
        url: '',
      },
    };
  }

  const fields = [...contentBlock.children];

  return {
    heading: getText(fields[0]),
    logo: getImage(fields[1]),
    subheading: getText(fields[2]),
    cta: getRichText(fields[3]),
  };
}

function getBannerFields(block) {
  const fields = [...block.children].filter(
    (child) => !child.classList.contains('dirte-k3-content')
      && !child.classList.contains('dirte-k3-specification'),
  );

  return {
    desktopImage: getImage(fields[0]),
    mobileImage: getImage(fields[1]),
    bgColor: getText(fields[2]),
  };
}

function getSpecifications(block) {
  return [...block.children]
    .filter((child) => child.classList.contains('dirte-k3-specification'))
    .map((item) => {
      const fields = [...item.children];

      return {
        label: getText(fields[0]),
        value: getText(fields[1]),
      };
    })
    .filter((item) => item.label || item.value);
}

function createHeading(value) {
  if (!value) {
    return null;
  }

  const heading = document.createElement('h2');

  heading.className = 'dirte-k3-heading';
  heading.textContent = value;

  return heading;
}

function createLogo(image) {
  if (!image) {
    return null;
  }

  const wrapper = document.createElement('div');

  wrapper.className = 'dirte-k3-logo-wrapper';

  const logo = image.cloneNode(true);

  logo.className = 'dirte-k3-logo';

  wrapper.append(logo);

  return wrapper;
}

function createSubheading(value) {
  if (!value) {
    return null;
  }

  const subheading = document.createElement('div');

  subheading.className = 'dirte-k3-subheading';

  subheading.innerHTML = value;

  return subheading;
}

function createCTA(cta) {
  if (!cta.text) {
    return null;
  }

  const link = document.createElement('a');

  link.className = 'dirte-k3-cta';
  link.textContent = cta.text;

  if (cta.url) {
    link.href = cta.url;
  }

  return link;
}

function createSpecification(specification) {
  const item = document.createElement('div');

  item.className = 'dirte-k3-spec';

  const label = document.createElement('div');

  label.className = 'dirte-k3-spec-label';
  label.textContent = specification.label;

  const value = document.createElement('div');

  value.className = 'dirte-k3-spec-value';
  value.textContent = specification.value;

  item.append(label, value);

  return item;
}

function createSpecifications(specifications) {
  const container = document.createElement('div');

  container.className = 'dirte-k3-specifications';

  specifications.forEach((specification) => {
    container.append(
      createSpecification(specification),
    );
  });

  return container;
}

function createMedia(desktopImage, mobileImage) {
  const media = document.createElement('div');

  media.className = 'dirte-k3-media';

  if (desktopImage) {
    const desktopPicture = document.createElement('picture');

    const desktopImg = desktopImage.cloneNode(true);

    desktopImg.className = 'dirte-k3-desktop-image';
    desktopImg.loading = 'eager';
    desktopImg.fetchPriority = 'high';

    desktopPicture.append(desktopImg);

    media.append(desktopPicture);
  }

  if (mobileImage) {
    const mobilePicture = document.createElement('picture');

    const mobileImg = mobileImage.cloneNode(true);

    mobileImg.className = 'dirte-k3-mobile-image';
    mobileImg.loading = 'eager';

    mobilePicture.append(mobileImg);

    media.append(mobilePicture);
  }

  return media;
}

export default function decorate(block) {
  const contentBlock = getContentBlock(block);

  const content = getContent(contentBlock);

  const bannerFields = getBannerFields(block);

  const specifications = getSpecifications(block);

  const contentArea = document.createElement('div');

  contentArea.className = 'dirte-k3-text';

  const heading = createHeading(content.heading);

  if (heading) {
    contentArea.append(heading);
  }

  const logo = createLogo(content.logo);

  if (logo) {
    contentArea.append(logo);
  }

  const subheading = createSubheading(content.subheading);

  if (subheading) {
    contentArea.append(subheading);
  }

  const cta = createCTA(content.cta);

  if (cta) {
    contentArea.append(cta);
  }

  contentArea.append(
    createSpecifications(specifications),
  );

  const media = createMedia(
    bannerFields.desktopImage,
    bannerFields.mobileImage,
  );

  const contentWrapper = document.createElement('div');

  contentWrapper.className = 'dirte-k3-content-wrapper';

  contentWrapper.append(
    contentArea,
    media,
  );

  const divider = document.createElement('div');

  divider.className = 'dirte-k3-divider';

  block.replaceChildren(
    contentWrapper,
    divider,
  );

  if (/^#[0-9a-fA-F]{3,8}$/.test(bannerFields.bgColor)) {
    block.style.setProperty(
      '--dirte-k3-bg',
      bannerFields.bgColor,
    );
  }
}
