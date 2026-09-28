const FOOTER_API = 'https://dev.vidaworld.com/content/experience-fragments/vida/language-masters/en/vida2_0_site/footer-vida-v2-0/home-footer-vida.10.json';

const CLASS_PREFIX = 'vida_footer';

/*
 * This variable is populated from the AEM API
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
 * Convert the AEM FAQ rich-text HTML into sections.
 *
 * The API contains:
 *
 * <p>
 *   <b>Section heading</b>
 *   <br>
 *   <br>
 *   Content
 *   <br>
 *   • Content
 *   <br>
 *   • Content
 * </p>
 *
 * and finally:
 *
 * <h1>
 *   <b>Section heading</b>
 * </h1>
 *
 * <p>
 *   Content
 *   <br>
 *   • Content
 * </p>
 *
 * We preserve the API HTML so that:
 *
 * - line breaks remain
 * - links remain links
 * - linked text can be styled separately
 * - content can be changed from AEM without changing JS
 */
function parseIndiaContent(html) {
  if (!html) {
    return {
      sections: [],
    };
  }

  const parser = new DOMParser();

  const parsedDocument = parser.parseFromString(
    html,
    'text/html',
  );

  const root = parsedDocument.body.firstElementChild
    || parsedDocument.body;

  const sections = [];

  /**
   * Extract heading text from an element.
   */
  function getHeadingText(element) {
    return element.textContent
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get the HTML after the first <b> or <strong>
   * heading from an API paragraph.
   *
   * Example:
   *
   * <p>
   *   <b>Introducing...</b><br><br>
   *   Gear up...
   * </p>
   *
   * becomes:
   *
   * heading:
   * Introducing...
   *
   * content:
   * <br><br>Gear up...
   */
  function getParagraphContent(element) {
    const clone = element.cloneNode(true);

    const heading = clone.querySelector('b, strong');

    if (heading) {
      let nextNode = heading.nextSibling;

      while (nextNode) {
        const followingNode = nextNode.nextSibling;
        const isLineBreak = nextNode.nodeType === Node.ELEMENT_NODE
          && nextNode.tagName.toLowerCase() === 'br';
        const isWhitespace = nextNode.nodeType === Node.TEXT_NODE
          && !nextNode.textContent.trim();

        if (!isLineBreak && !isWhitespace) {
          break;
        }

        nextNode.remove();
        nextNode = followingNode;
      }

      heading.remove();
    }

    return clone.innerHTML.trim();
  }

  /**
   * Create a section from an API <p>.
   */
  function createParagraphSection(element) {
    const heading = element.querySelector('b, strong');

    if (!heading) {
      return null;
    }

    return {
      title: getHeadingText(heading),
      content: getParagraphContent(element),
    };
  }

  /**
   * Walk through the API content in its original order.
   *
   * <hr> elements are intentionally ignored because
   * the existing CSS already provides the section
   * separators.
   */
  Array.from(root.children).forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'p') {
      const section = createParagraphSection(element);

      if (section) {
        sections.push(section);
      }

      return;
    }

    if (/^h[1-6]$/.test(tagName)) {
      const nextElement = element.nextElementSibling;

      const section = {
        title: getHeadingText(element),
        content: '',
      };

      if (
        nextElement
        && nextElement.tagName.toLowerCase() === 'p'
      ) {
        section.content = nextElement.innerHTML.trim();
      }

      sections.push(section);
    }
  });

  return {
    sections,
  };
}

/**
 * Convert AEM footer response into the structure
 * already used by the existing UI.
 */
function mapFooterData(apiData) {
  const footer = apiData?.['jcr:content']?.root?.footer_copy;

  if (!footer) {
    throw new Error(
      'footer_copy was not found in the AEM API response',
    );
  }

  const indiaContent = parseIndiaContent(footer.faqContent);

  /*
   * Main footer navigation.
   */
  const navigation = getIndexedItems(
    footer.footeritems,
  ).map((section) => ({
    title: section.title || '',
    ariaLabel: section.title || '',

    items: getIndexedItems(
      section.contentItem,
    ).map((item) => ({
      label: item.label || '',
      href: normalizeUrl(item.navLink),
      newTab: item.newTab === 'true',
    })),
  }));

  /*
   * Electric Scooters Near You.
   */
  const nearbySection = getIndexedItems(
    footer.footercityitems,
  )[0];

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
   * Legal links.
   */
  const legal = getIndexedItems(
    footer.termsPolicyItem,
  ).map((item) => ({
    label: item.label || '',
    href: normalizeUrl(item.navLink),
    newTab: item.newTab === 'true',
  }));

  /*
   * Social links.
   *
   * Icon paths come directly from AEM.
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
   * Company details.
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
      footerLabel: 'VIDA footer',

      socialLabel:
        footer.followUsText
        || 'Social media links',

      accordionPrefix: 'Toggle',
    },

    brand: {
      logoSrc: normalizeUrl(
        footer.footerLogo
        || footer.footerLogoMobile,
      ),

      logoAlt: 'VIDA Powered by Hero',

      logoHref: normalizeUrl(
        footer.footerLink || '/',
      ),

      logoAriaLabel: 'VIDA home',
    },

    /*
     * India accordion content comes completely
     * from faqContent in the AEM API.
     */
    indiaSection: {
      title: footer.faqheading || '',
      ariaLabel: footer.faqheading || '',
      sections: indiaContent.sections,
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

function createElement(
  tag,
  classNameValue,
) {
  const element = document.createElement(tag);

  if (classNameValue) {
    element.className = classNameValue;
  }

  return element;
}

function createLink(
  item,
  classNameValue,
) {
  const link = createElement(
    'a',
    classNameValue,
  );

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

  svg.setAttribute(
    'viewBox',
    '0 0 24 24',
  );

  svg.setAttribute(
    'aria-hidden',
    'true',
  );

  svg.setAttribute(
    'focusable',
    'false',
  );

  const path = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path',
  );

  path.setAttribute(
    'd',
    'M6 9l6 6 6-6',
  );

  path.setAttribute(
    'fill',
    'none',
  );

  path.setAttribute(
    'stroke',
    'currentColor',
  );

  path.setAttribute(
    'stroke-width',
    '2',
  );

  path.setAttribute(
    'stroke-linecap',
    'round',
  );

  path.setAttribute(
    'stroke-linejoin',
    'round',
  );

  svg.append(path);
  wrapper.append(svg);

  return wrapper;
}

function createAccordionButton(
  section,
  id,
) {
  const button = createElement(
    'button',
    className('accordion-trigger'),
  );

  button.type = 'button';

  button.setAttribute(
    'aria-expanded',
    'false',
  );

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

  button.append(
    title,
    createArrow(),
  );

  return button;
}

function setupAccordion(
  button,
  panel,
) {
  button.addEventListener(
    'click',
    () => {
      const isExpanded = button.getAttribute(
        'aria-expanded',
      ) === 'true';

      const nextState = !isExpanded;

      button.setAttribute(
        'aria-expanded',
        String(nextState),
      );

      panel.hidden = !nextState;
    },
  );
}

/**
 * Create the India accordion content.
 *
 * Important:
 * The API content is inserted as rich HTML so
 * API-provided anchors remain actual links.
 *
 * This gives us:
 *
 * Heading
 * Content
 * ----------------
 *
 * Heading
 * Content
 * ----------------
 *
 * exactly according to the API structure.
 */
function createIndiaPanel() {
  const panel = createElement(
    'div',
    className('india-panel'),
  );

  panel.id = 'vida-footer-panel-india';

  footerData.indiaSection.sections
    .forEach((section) => {
      /*
       * Section heading.
       */
      if (section.title) {
        const title = createElement(
          'h4',
          className(
            'india-subtitle',
          ),
        );

        title.textContent = section.title;

        panel.append(title);
      }

      /*
       * Section content.
       *
       * innerHTML is intentional here because
       * the API provides rich HTML and links.
       */
      if (section.content) {
        const content = createElement(
          'p',
          className('india-text'),
        );

        content.innerHTML = section.content;

        panel.append(content);
      }
    });

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

  setupAccordion(
    button,
    panel,
  );

  wrapper.append(
    button,
    panel,
  );

  return wrapper;
}

function createNavigationSection(
  section,
  id,
) {
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
    className(
      'accordion-panel',
    ),
  );

  panel.id = `vida-footer-panel-${id}`;

  /*
   * All mobile navigation sections
   * are closed initially.
   */
  panel.hidden = true;

  section.items.forEach(
    (item) => {
      panel.append(
        createLink(
          item,
          className(
            'accordion-link',
          ),
        ),
      );
    },
  );

  setupAccordion(
    button,
    panel,
  );

  wrapper.append(
    button,
    panel,
  );

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
    className(
      'desktop-navigation',
    ),
  );

  const brand = createElement(
    'div',
    className('desktop-brand'),
  );

  brand.append(
    createBrand(),
  );

  const navigation = createElement(
    'div',
    className('navigation'),
  );

  footerData.navigation.forEach(
    (section) => {
      const column = createElement(
        'section',
        className(
          'nav-column',
        ),
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

      section.items.forEach(
        (item) => {
          const listItem = createElement(
            'li',
            className('nav-item'),
          );

          listItem.append(
            createLink(
              item,
              className(
                'nav-link',
              ),
            ),
          );

          list.append(
            listItem,
          );
        },
      );

      column.append(
        heading,
        list,
      );

      navigation.append(
        column,
      );
    },
  );

  wrapper.append(
    brand,
    navigation,
  );

  return wrapper;
}

function createMobileNavigation() {
  const wrapper = createElement(
    'div',
    className(
      'mobile-navigation',
    ),
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

  footerData.nearbyScooters.items
    .forEach((item) => {
      const listItem = createElement(
        'li',
        className(
          'nearby-item',
        ),
      );

      listItem.append(
        createLink(
          item,
          className(
            'nearby-link',
          ),
        ),
      );

      list.append(
        listItem,
      );
    });

  wrapper.append(
    heading,
    list,
  );

  return wrapper;
}

function createLegalSection() {
  const wrapper = createElement(
    'nav',
    className('legal'),
  );

  footerData.legal.forEach(
    (item) => {
      wrapper.append(
        createLink(
          item,
          className(
            'legal-link',
          ),
        ),
      );
    },
  );

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

  footerData.social.forEach(
    (social) => {
      const link = createElement(
        'a',
        className(
          'social-link',
        ),
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
        `${className(
          'social-icon',
        )} ${className(
          'social-icon--api',
        )}`,
      );

      const image = createElement(
        'img',
        className(
          'social-image',
        ),
      );

      image.src = normalizeUrl(
        social.icon,
      );

      image.alt = '';

      image.width = 18;
      image.height = 18;

      image.loading = 'lazy';
      image.decoding = 'async';

      icon.append(image);
      link.append(icon);
      wrapper.append(link);
    },
  );

  return wrapper;
}

function createCompanyDetails() {
  const wrapper = createElement(
    'div',
    className('company'),
  );

  const office = createElement(
    'div',
    className(
      'company-item',
    ),
  );

  const officeTitle = createElement(
    'p',
    className(
      'company-title',
    ),
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
    className(
      'company-item',
    ),
  );

  const contactTitle = createElement(
    'p',
    className(
      'company-title',
    ),
  );

  contactTitle.textContent = footerData.company.contact.title;

  const phone = createElement(
    'a',
    className(
      'contact-link',
    ),
  );

  phone.href = footerData.company.contact.phone.href;

  phone.textContent = footerData.company.contact.phone.label;

  const email = createElement(
    'a',
    className(
      'contact-link',
    ),
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
    className(
      'legal-social',
    ),
  );

  wrapper.append(
    createLegalSection(),
    createSocialSection(),
  );

  return wrapper;
}

export default async function decorate(
  block,
) {
  try {
    /*
     * ONE API CALL
     *
     * AEM API
     *   ↓
     * mapFooterData()
     *   ↓
     * footerData
     *   ↓
     * Existing UI
     */
    footerData = await getFooterData();

    console.log(
      'VIDA Footer data loaded from AEM:',
      footerData,
    );

    block.replaceChildren();

    block.classList.add(
      CLASS_PREFIX,
    );

    block.setAttribute(
      'aria-label',
      footerData.accessibility.footerLabel,
    );

    const container = createElement(
      'div',
      className('container'),
    );

    /*
     * Footer order:
     *
     * 1. India accordion
     * 2. Desktop navigation
     * 3. Mobile navigation
     * 4. Nearby
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
      className(
        'mobile-brand',
      ),
    );

    mobileBrand.append(
      createBrand(),
    );

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

    block.append(
      container,
    );
  } catch (error) {
    console.error(
      'VIDA Footer failed to load:',
      error,
    );

    block.replaceChildren();
  }
}
