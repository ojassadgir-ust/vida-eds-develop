const FOOTER_API = 'https://dev.vidaworld.com/content/experience-fragments/vida/language-masters/en/vida2_0_site/footer-vida-v2-0/home-footer-vida.10.json';

const CLASS_PREFIX = 'vida_footer';

/*
 * This variable is populated from AEM API
 * before the UI is created.
 */
let footerData = null;

/**
 * Convert AEM item0, item1, item2... objects into an array.
 */
function getIndexedItems(object) {
  if (!object || typeof object !== 'object') {
    return [];
  }

  return Object.keys(object)
    .filter((key) => /^item\d+$/.test(key))
    .sort((a, b) => {
      const indexA = Number(a.replace('item', ''));
      const indexB = Number(b.replace('item', ''));

      return indexA - indexB;
    })
    .map((key) => object[key])
    .filter(Boolean);
}

/**
 * Convert AEM URLs into usable URLs.
 *
 * API can return:
 * /content/vida/in/en/...
 * /content/dam/...
 * https://...
 * /
 */
function normalizeUrl(url) {
  if (!url) {
    return '#';
  }

  if (
    url.startsWith('http://')
    || url.startsWith('https://')
    || url.startsWith('mailto:')
    || url.startsWith('tel:')
    || url.startsWith('#')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `https://dev.vidaworld.com${url}`;
  }

  return url;
}

/**
 * Convert the AEM rich HTML FAQ content into
 * the structure already used by the UI.
 */
function parseIndiaContent(html) {
  if (!html) {
    return {
      intro: {
        title: '',
        paragraph: '',
      },
      performance: {
        paragraph: '',
        description: '',
        items: [],
      },
      convenience: {
        title: '',
        paragraph: '',
        items: [],
      },
    };
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(
    html,
    'text/html',
  );

  const paragraphs = Array.from(
    documentFragment.body.querySelectorAll('p'),
  );

  const headings = Array.from(
    documentFragment.body.querySelectorAll(
      'h1, h2, h3, h4, h5, h6',
    ),
  );

  /*
   * The API content contains:
   *
   * 1. Introducing the VIDA Electric Scooter in India
   * 2. Additional SEO content
   * 3. Ownership content
   * 4. Performance content
   * 5. Make way for VIDA Electric Scooters in India
   *
   * We map the API content into the existing footer UI.
   */

  let introTitle = '';
  let introParagraph = '';

  let performanceParagraph = '';
  let performanceDescription = '';
  const performanceItems = [];

  let convenienceTitle = '';
  let convenienceParagraph = '';
  const convenienceItems = [];

  /*
   * Find the first bold text as the intro title.
   */
  const firstBold = documentFragment.body.querySelector(
    'p b, p strong',
  );

  if (firstBold) {
    introTitle = firstBold.textContent.trim();
  }

  /*
   * First paragraph is the introduction.
   */
  if (paragraphs[0]) {
    const clone = paragraphs[0].cloneNode(true);

    clone
      .querySelectorAll('b, strong')
      .forEach((element) => element.remove());

    introParagraph = clone.textContent
      .replace(/\s+/g, ' ')
      .trim();
  }

  /*
   * Find the paragraph containing
   * "With VIDA, you're in for an unrivalled performance:"
   */
  const performanceIndex = paragraphs.findIndex(
    (paragraph) => paragraph.textContent.includes(
      "With VIDA, you're in for an unrivalled performance",
    ),
  );

  if (performanceIndex !== -1) {
    const performanceParagraphElement = paragraphs[performanceIndex];

    performanceParagraph = performanceParagraphElement.textContent
      .replace(/\s+/g, ' ')
      .trim();

    /*
     * Everything after the performance heading
     * and before the next heading becomes performance data.
     */
    const performanceClone = performanceParagraphElement.cloneNode(true);

    const links = Array.from(
      performanceClone.querySelectorAll('a'),
    );

    links.forEach((link) => {
      const linkText = link.textContent.trim();

      if (linkText) {
        link.replaceWith(document.createTextNode(linkText));
      }
    });

    const performanceText = performanceClone.textContent
      .replace(/\s+/g, ' ')
      .trim();

    /*
     * Remove the heading text from the paragraph.
     */
    performanceDescription = performanceText
      .replace(
        "With VIDA, you're in for an unrivalled performance:",
        '',
      )
      .trim();

    /*
     * Extract bullet-like lines from the original HTML.
     */
    const htmlLines = performanceParagraphElement.innerHTML
      .split(/<br\s*\/?>/i)
      .map((line) => line
        .replace(/<[^>]*>/g, '')
        .replace(/\r?\n/g, ' ')
        .trim())
      .filter(Boolean);

    htmlLines.forEach((line) => {
      if (
        line.startsWith('•')
        || line.includes('142 km')
        || line.includes('Running cost')
        || line.includes('80 km/h')
        || line.includes('0-40 km/h')
        || line.includes('Stay connected')
        || line.includes('18-degree')
        || line.includes('Regenerative')
      ) {
        const cleanItem = line
          .replace(/^•\s*/, '')
          .trim();

        if (cleanItem) {
          performanceItems.push(cleanItem);
        }
      }
    });
  }

  /*
   * Find the convenience SEO heading.
   */
  const convenienceHeading = headings.find(
    (heading) => heading.textContent
      .trim()
      .includes(
        'Make way for VIDA Electric Scooters in India',
      ),
  );

  if (convenienceHeading) {
    convenienceTitle = convenienceHeading.textContent
      .replace(/\s+/g, ' ')
      .trim();

    /*
     * The paragraph immediately following
     * the convenience heading.
     */
    const nextParagraph = convenienceHeading.nextElementSibling;

    if (
      nextParagraph
      && nextParagraph.tagName.toLowerCase() === 'p'
    ) {
      const clone = nextParagraph.cloneNode(true);

      clone
        .querySelectorAll('a')
        .forEach((link) => {
          link.replaceWith(
            document.createTextNode(link.textContent),
          );
        });

      const fullText = clone.textContent
        .replace(/\s+/g, ' ')
        .trim();

      convenienceParagraph = fullText;

      const htmlLines = nextParagraph.innerHTML
        .split(/<br\s*\/?>/i)
        .map((line) => line
          .replace(/<[^>]*>/g, '')
          .replace(/\r?\n/g, ' ')
          .trim())
        .filter(Boolean);

      htmlLines.forEach((line) => {
        if (line.startsWith('•')) {
          const cleanItem = line
            .replace(/^•\s*/, '')
            .trim();

          if (cleanItem) {
            convenienceItems.push(cleanItem);
          }
        }
      });

      /*
       * Remove the first descriptive sentence from
       * the bullet list section.
       */
      const firstBulletIndex = convenienceParagraph.indexOf('•');

      if (firstBulletIndex !== -1) {
        convenienceParagraph = convenienceParagraph
          .substring(0, firstBulletIndex)
          .trim();
      }
    }
  }

  return {
    intro: {
      title: introTitle,
      paragraph: introParagraph,
    },

    performance: {
      paragraph: performanceParagraph,
      description: performanceDescription,
      items: performanceItems,
    },

    convenience: {
      title: convenienceTitle,
      paragraph: convenienceParagraph,
      items: convenienceItems,
    },
  };
}

/**
 * Convert AEM footer response into the existing
 * footerData structure.
 */
function mapFooterData(apiData) {
  const footer = apiData?.['jcr:content']?.root?.footer_copy;

  if (!footer) {
    throw new Error(
      'footer_copy was not found in the AEM API response',
    );
  }

  const indiaContent = parseIndiaContent(
    footer.faqContent,
  );

  /*
   * Navigation
   */
  const navigation = getIndexedItems(
    footer.footeritems,
  ).map((section) => ({
    title: section.title || '',
    ariaLabel: section.title || '',
    items: getIndexedItems(section.contentItem).map(
      (item) => ({
        label: item.label || '',
        href: normalizeUrl(item.navLink),
        newTab: item.newTab === 'true',
      }),
    ),
  }));

  /*
   * Nearby scooters
   */
  const nearbySection = getIndexedItems(footer.footercityitems)[0];

  const nearbyScooters = {
    title: nearbySection?.title || '',
    ariaLabel: nearbySection?.title || '',
    items: getIndexedItems(
      nearbySection?.contentItem,
    ).map((item) => ({
      label: item.label || '',
      href: normalizeUrl(item.navLink),
      newTab: item.newTab === 'true',
    })),
  };

  /*
   * Legal links
   */
  const legal = getIndexedItems(
    footer.termsPolicyItem,
  ).map((item) => ({
    label: item.label || '',
    href: normalizeUrl(item.navLink),
    newTab: item.newTab === 'true',
  }));

  /*
   * Social links
   *
   * The API now supplies the SVG image path,
   * so there is no need for hardcoded SVG paths.
   */
  const social = getIndexedItems(
    footer.socialmediaitems,
  ).map((item) => ({
    name: item.imageAltText || '',
    ariaLabel: item.imageAltText || '',
    href: normalizeUrl(item.link),
    icon: item.image || '',
    newTab: item.newTab === 'true',
  }));

  /*
   * Company details
   */
  const company = {
    office: {
      title: footer.footerAddressLabel || '',
      address: footer.footerAddress || '',
    },

    contact: {
      title: footer.footerContactLabel || '',

      phone: {
        label: `${footer.footerPhoneLabel || 'Phone'}: ${
          footer.footerPhone || ''
        }`,
        href: footer.footerPhone
          ? `tel:${footer.footerPhone}`
          : '#',
      },

      email: {
        label: `${footer.footerEmailLabel || 'E-mail'}: ${
          footer.footerEmail || ''
        }`,
        href: footer.footerEmail
          ? `mailto:${footer.footerEmail}`
          : '#',
      },
    },

    copyright: footer.copyright || '',
  };

  return {
    accessibility: {
      /*
       * These are accessibility attributes used by the
       * frontend and are not available in the API.
       */
      footerLabel: 'VIDA footer',
      socialLabel:
        footer.followUsText || 'Social media links',
      accordionPrefix: 'Toggle',
    },

    brand: {
      logoSrc: normalizeUrl(
        footer.footerLogo || footer.footerLogoMobile,
      ),
      logoAlt: 'VIDA Powered by Hero',
      logoHref: normalizeUrl(footer.footerLink || '/'),
      logoAriaLabel: 'VIDA home',
    },

    indiaSection: {
      title: footer.faqheading || '',
      ariaLabel: footer.faqheading || '',

      intro: indiaContent.intro,

      performance: indiaContent.performance,

      convenience: indiaContent.convenience,
    },

    navigation,

    nearbyScooters,

    legal,

    social,

    company,
  };
}

/**
 * Fetch footer data from AEM.
 *
 * Only ONE API request is made.
 */
async function getFooterData() {
  const response = await fetch(FOOTER_API);

  if (!response.ok) {
    throw new Error(
      `VIDA Footer API error: ${response.status}`,
    );
  }

  const apiData = await response.json();

  return mapFooterData(apiData);
}

function className(name) {
  return `${CLASS_PREFIX}__${name}`;
}

function createElement(tag, classNameValue) {
  const element = document.createElement(tag);

  if (classNameValue) {
    element.className = classNameValue;
  }

  return element;
}

function createLink(item, classNameValue) {
  const link = createElement('a', classNameValue);

  link.href = item.href;
  link.textContent = item.label;

  if (item.newTab) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  return link;
}

function createArrow() {
  const wrapper = createElement(
    'span',
    className('arrow'),
  );

  const svg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  );

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path',
  );

  path.setAttribute('d', 'M6 9l6 6 6-6');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  svg.append(path);
  wrapper.append(svg);

  return wrapper;
}

function createAccordionButton(section, id) {
  const button = createElement(
    'button',
    className('accordion-trigger'),
  );

  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');

  button.setAttribute(
    'aria-controls',
    `vida-footer-panel-${id}`,
  );

  button.setAttribute(
    'aria-label',
    `${footerData.accessibility.accordionPrefix} ${section.ariaLabel}`,
  );

  const title = createElement(
    'span',
    className('accordion-title'),
  );

  title.textContent = section.title;

  button.append(title, createArrow());

  return button;
}

function setupAccordion(button, panel) {
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    const nextState = !isExpanded;

    button.setAttribute(
      'aria-expanded',
      String(nextState),
    );

    panel.hidden = !nextState;
  });
}

function createIndiaPanel() {
  const panel = createElement(
    'div',
    className('india-panel'),
  );

  panel.id = 'vida-footer-panel-india';

  const introTitle = createElement(
    'h4',
    className('india-subtitle'),
  );

  introTitle.textContent = footerData.indiaSection.intro.title;

  const introParagraph = createElement(
    'p',
    className('india-text'),
  );

  introParagraph.textContent = footerData.indiaSection.intro.paragraph;

  const performanceParagraph = createElement(
    'p',
    className('india-text'),
  );

  performanceParagraph.textContent = footerData.indiaSection.performance.paragraph;

  const performanceDescription = createElement(
    'p',
    className('india-text'),
  );

  performanceDescription.textContent = footerData.indiaSection.performance.description;

  const performanceList = createElement(
    'ul',
    className('india-list'),
  );

  footerData.indiaSection.performance.items.forEach(
    (item) => {
      const listItem = createElement(
        'li',
        className('india-list-item'),
      );

      listItem.textContent = item;

      performanceList.append(listItem);
    },
  );

  const convenienceTitle = createElement(
    'h4',
    className('india-subtitle'),
  );

  convenienceTitle.textContent = footerData.indiaSection.convenience.title;

  const convenienceParagraph = createElement(
    'p',
    className('india-text'),
  );

  convenienceParagraph.textContent = footerData.indiaSection.convenience.paragraph;

  const convenienceList = createElement(
    'ul',
    className('india-list'),
  );

  footerData.indiaSection.convenience.items.forEach(
    (item) => {
      const listItem = createElement(
        'li',
        className('india-list-item'),
      );

      listItem.textContent = item;

      convenienceList.append(listItem);
    },
  );

  panel.append(
    introTitle,
    introParagraph,
    performanceParagraph,
    performanceDescription,
    performanceList,
    convenienceTitle,
    convenienceParagraph,
    convenienceList,
  );

  return panel;
}

function createIndiaSection() {
  const wrapper = createElement(
    'section',
    className('india'),
  );

  const button = createAccordionButton(
    footerData.indiaSection,
    'india',
  );

  const panel = createIndiaPanel();

  panel.hidden = true;

  button.setAttribute(
    'aria-expanded',
    'false',
  );

  setupAccordion(button, panel);

  wrapper.append(button, panel);

  return wrapper;
}

function createNavigationSection(section, id) {
  const wrapper = createElement(
    'section',
    className('accordion'),
  );

  const button = createAccordionButton(
    section,
    id,
  );

  const panel = createElement(
    'div',
    className('accordion-panel'),
  );

  panel.id = `vida-footer-panel-${id}`;

  /*
   * All mobile navigation sections are closed
   * when the footer initially loads.
   */
  panel.hidden = true;

  section.items.forEach((item) => {
    panel.append(
      createLink(
        item,
        className('accordion-link'),
      ),
    );
  });

  setupAccordion(button, panel);

  wrapper.append(button, panel);

  return wrapper;
}

function createBrand() {
  const link = createElement(
    'a',
    className('brand-link'),
  );

  link.href = footerData.brand.logoHref;

  link.setAttribute(
    'aria-label',
    footerData.brand.logoAriaLabel,
  );

  const image = createElement(
    'img',
    className('logo'),
  );

  image.src = footerData.brand.logoSrc;
  image.alt = footerData.brand.logoAlt;

  image.width = 130;
  image.height = 48;

  image.loading = 'lazy';
  image.decoding = 'async';

  link.append(image);

  return link;
}

function createDesktopNavigation() {
  const wrapper = createElement(
    'div',
    className('desktop-navigation'),
  );

  const brand = createElement(
    'div',
    className('desktop-brand'),
  );

  brand.append(createBrand());

  const navigation = createElement(
    'div',
    className('navigation'),
  );

  footerData.navigation.forEach((section) => {
    const column = createElement(
      'section',
      className('nav-column'),
    );

    const heading = createElement(
      'h3',
      className('nav-title'),
    );

    heading.textContent = section.title;

    const list = createElement(
      'ul',
      className('nav-list'),
    );

    section.items.forEach((item) => {
      const listItem = createElement(
        'li',
        className('nav-item'),
      );

      listItem.append(
        createLink(
          item,
          className('nav-link'),
        ),
      );

      list.append(listItem);
    });

    column.append(heading, list);
    navigation.append(column);
  });

  wrapper.append(brand, navigation);

  return wrapper;
}

function createMobileNavigation() {
  const wrapper = createElement(
    'div',
    className('mobile-navigation'),
  );

  footerData.navigation.forEach(
    (section, index) => {
      wrapper.append(
        createNavigationSection(
          section,
          `navigation-${index}`,
        ),
      );
    },
  );

  wrapper.append(
    createNavigationSection(
      footerData.nearbyScooters,
      'nearby-mobile',
    ),
  );

  return wrapper;
}

function createNearbySection() {
  const wrapper = createElement(
    'section',
    className('nearby'),
  );

  const heading = createElement(
    'h3',
    className('nearby-title'),
  );

  heading.textContent = footerData.nearbyScooters.title;

  const list = createElement(
    'ul',
    className('nearby-list'),
  );

  footerData.nearbyScooters.items.forEach(
    (item) => {
      const listItem = createElement(
        'li',
        className('nearby-item'),
      );

      listItem.append(
        createLink(
          item,
          className('nearby-link'),
        ),
      );

      list.append(listItem);
    },
  );

  wrapper.append(heading, list);

  return wrapper;
}

function createLegalSection() {
  const wrapper = createElement(
    'nav',
    className('legal'),
  );

  footerData.legal.forEach((item) => {
    wrapper.append(
      createLink(
        item,
        className('legal-link'),
      ),
    );
  });

  return wrapper;
}

function createSocialSection() {
  const wrapper = createElement(
    'nav',
    className('social'),
  );

  wrapper.setAttribute(
    'aria-label',
    footerData.accessibility.socialLabel,
  );

  footerData.social.forEach((social) => {
    const link = createElement(
      'a',
      className('social-link'),
    );

    link.href = social.href;

    if (social.newTab !== false) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    link.setAttribute(
      'aria-label',
      social.ariaLabel,
    );

    const icon = createElement(
      'span',
      `${className('social-icon')} ${className(
        'social-icon--api',
      )}`,
    );

    /*
     * Social icon comes directly from AEM API.
     */
    const image = createElement(
      'img',
      className('social-image'),
    );

    image.src = normalizeUrl(social.icon);
    image.alt = '';
    image.width = 18;
    image.height = 18;
    image.loading = 'lazy';
    image.decoding = 'async';

    icon.append(image);
    link.append(icon);
    wrapper.append(link);
  });

  return wrapper;
}

function createCompanyDetails() {
  const wrapper = createElement(
    'div',
    className('company'),
  );

  const office = createElement(
    'div',
    className('company-item'),
  );

  const officeTitle = createElement(
    'p',
    className('company-title'),
  );

  officeTitle.textContent = footerData.company.office.title;

  const officeAddress = createElement(
    'address',
    className('address'),
  );

  officeAddress.textContent = footerData.company.office.address;

  office.append(
    officeTitle,
    officeAddress,
  );

  const contact = createElement(
    'div',
    className('company-item'),
  );

  const contactTitle = createElement(
    'p',
    className('company-title'),
  );

  contactTitle.textContent = footerData.company.contact.title;

  const phone = createElement(
    'a',
    className('contact-link'),
  );

  phone.href = footerData.company.contact.phone.href;

  phone.textContent = footerData.company.contact.phone.label;

  const email = createElement(
    'a',
    className('contact-link'),
  );

  email.href = footerData.company.contact.email.href;

  email.textContent = footerData.company.contact.email.label;

  contact.append(
    contactTitle,
    phone,
    email,
  );

  const copyright = createElement(
    'p',
    className('copyright'),
  );

  copyright.textContent = footerData.company.copyright;

  wrapper.append(
    office,
    contact,
    copyright,
  );

  return wrapper;
}

function createLegalSocial() {
  const wrapper = createElement(
    'div',
    className('legal-social'),
  );

  wrapper.append(
    createLegalSection(),
    createSocialSection(),
  );

  return wrapper;
}

export default async function decorate(block) {
  try {
    /*
     * ONE API CALL
     *
     * AEM response
     *      ↓
     * mapFooterData()
     *      ↓
     * footerData
     *      ↓
     * existing UI functions
     */
    footerData = await getFooterData();

    console.log(
      'VIDA Footer data loaded from AEM:',
      footerData,
    );

    block.replaceChildren();

    block.classList.add(CLASS_PREFIX);

    block.setAttribute(
      'aria-label',
      footerData.accessibility.footerLabel,
    );

    const container = createElement(
      'div',
      className('container'),
    );

    /*
     * IMPORTANT ORDER
     *
     * 1. India accordion
     * 2. Desktop navigation
     * 3. Mobile navigation
     * 4. Desktop nearby
     * 5. Legal + social
     * 6. Mobile logo
     * 7. Company details
     */
    const indiaSection = createIndiaSection();

    const desktopNavigation = createDesktopNavigation();

    const mobileNavigation = createMobileNavigation();

    const nearby = createNearbySection();

    const legalSocial = createLegalSocial();

    const mobileBrand = createElement(
      'div',
      className('mobile-brand'),
    );

    mobileBrand.append(createBrand());

    const company = createCompanyDetails();

    container.append(
      indiaSection,
      desktopNavigation,
      mobileNavigation,
      nearby,
      legalSocial,
      mobileBrand,
      company,
    );

    block.append(container);
  } catch (error) {
    console.error(
      'VIDA Footer failed to load:',
      error,
    );

    /*
     * Keep the block empty if the API fails.
     * No hardcoded footer content is used.
     */
    block.replaceChildren();
  }
}
