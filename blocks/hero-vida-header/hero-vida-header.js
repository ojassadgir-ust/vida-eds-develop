import buildButton from '../../scripts/build-button.js';
import { getAPIEndpoint } from '../../scripts/config.js';

// ---------------------------------------- //
// - Build functions for Products Submenu - //
// ---------------------------------------- //
function buildProductVehicle(item) {
  const vehicle = document.createElement('a');
  vehicle.className = 'vida-header-vehicle-item';
  vehicle.href = item.link;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'vida-header-vehicle-img';

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.label;
  imageWrap.append(img);

  const vehicleInfo = document.createElement('div');
  vehicleInfo.className = 'vida-header-vehicle-info';

  const nameWrap = document.createElement('div');
  nameWrap.className = 'vida-header-name-wrap';

  const name = document.createElement('span');
  name.className = 'vida-header-vehicle-name';
  name.textContent = item.label;
  nameWrap.append(name);

  if (item.isNew) {
    const newBadge = document.createElement('span');
    newBadge.className = 'vida-header-vehicle-new';
    newBadge.textContent = 'NEW';
    nameWrap.append(newBadge);
  }

  vehicleInfo.append(nameWrap);
  vehicle.append(imageWrap, vehicleInfo);

  return vehicle;
}

function buildProductCategory(category) {
  const categoryEl = document.createElement('div');
  categoryEl.className = 'vida-header-category';

  const catHeader = document.createElement('div');
  catHeader.className = 'vida-header-category-header';

  const title = document.createElement('span');
  title.className = 'vida-header-category-title';
  title.textContent = category.title;
  catHeader.append(title);

  const vehicles = document.createElement('div');
  vehicles.className = 'vida-header-vehicles';
  category.items.forEach((it) => vehicles.append(buildProductVehicle(it)));

  categoryEl.append(catHeader, vehicles);

  return categoryEl;
}

function buildProductsSubmenu(config) {
  const submenu = document.createElement('div');
  submenu.className = 'vida-header-submenu-products-wrap';

  const vehicles = document.createElement('div');
  vehicles.className = 'vida-header-submenu-products';
  config.categories.forEach((category) => vehicles.append(buildProductCategory(category)));

  submenu.append(vehicles);

  return submenu;
}

// ---------------------------------------- //
// - Build functions for Explore Submenu -- //
// ---------------------------------------- //
function buildExploreItem(item, isSideItem) {
  const exploreLink = document.createElement('a');
  exploreLink.className = 'vida-header-explore-item';
  exploreLink.href = item.link;

  const titleRow = document.createElement('div');
  titleRow.className = 'vida-header-title-row';

  const exploreTitle = document.createElement('span');
  exploreTitle.className = isSideItem ? 'vida-header-explore-side-title' : 'vida-header-explore-title';
  exploreTitle.textContent = item.label;
  titleRow.append(exploreTitle);

  if (item.isNew) {
    const newBadge = document.createElement('span');
    newBadge.className = 'vida-header-explore-new';
    newBadge.textContent = 'NEW';
    titleRow.append(newBadge);
  }

  exploreLink.append(titleRow);

  if (item.description) {
    const description = document.createElement('p');
    description.className = 'vida-header-explore-desc';
    description.textContent = item.description;
    exploreLink.append(description);
  }

  return exploreLink;
}

function buildExploreSubmenu(config) {
  const submenu = document.createElement('div');
  submenu.className = 'vida-header-submenu-explore';

  const exploreGrid = document.createElement('div');
  exploreGrid.className = 'vida-header-explore-grid';
  config.exploreItems.forEach((item) => exploreGrid.append(buildExploreItem(item)));
  submenu.append(exploreGrid);

  if (config.rightNav?.length) {
    const side = document.createElement('div');
    side.className = 'vida-header-explore-side';
    config.rightNav.forEach((it) => side.append(buildExploreItem(it, true)));
    submenu.append(side);
  }
  return submenu;
}

// ------------------------------------------- //
// - Build functions for Wiring both Submenu - //
// ------------------------------------------- //
const SUBMENU_BUILDERS = {
  'product-grid': buildProductsSubmenu,
  'explore-links': buildExploreSubmenu,
};

function buildSubmenu(key, config) {
  const submenu = document.createElement('div');
  submenu.className = 'vida-header-submenu';
  submenu.id = `vida-submenu-${key}`;
  submenu.dataset.panel = key;
  submenu.hidden = true;

  const content = document.createElement('div');
  content.className = 'vida-header-submenu-content';

  const submenuBuilder = SUBMENU_BUILDERS[config.type];
  if (submenuBuilder) content.append(submenuBuilder(config));

  submenu.append(content);

  return submenu;
}

// --------------------------------------------------------- //
// - Helper functions to normalise header content from API - //
// --------------------------------------------------------- //
const isTrue = (v) => v === 'true' || v === true;

// API stores lists as {item0: {...}, item1: {...}, item2: {...}....}
// This function converts that converts each nodes to array elements
function toArray(node) {
  if (!node) return [];

  return Object.keys(node)
    .filter((k) => k.indexOf('item') === 0)
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
    .map((k) => node[k]);
}

// Get the exact absolute asset path from the relative url in the api
function assetUrl(path, origin) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return encodeURI(path);
  return origin + encodeURI(path);
}

// page url starts with /content/vida/{country}/{locale}/ so we remove it
// to get the right relative url
function pageUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http://') || path.startsWith('https://')) return encodeURI(path);

  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'content') return path;

  const rest = parts.slice(4);
  return rest.length ? `/${rest.join('/')}` : '/';
}

// removes the literal \r\n if present in text string
const clean = (s) => {
  if (!s) return '';

  return s.split('\\r\\n').join(' ').split('\r\n').join(' ')
    .trim();
};

// The main adapter function
function normaliseHeaderJson(json, origin) {
  const headerJSON = json['jcr:content'].root.newheader_copy_copy;
  const asset = (p) => assetUrl(p, origin);

  return {
    logo: {
      src: asset(headerJSON.logo),
      alt: headerJSON.logoAlt,
      link: pageUrl(headerJSON.logoLink),
    },
    navItems: [
      { label: headerJSON.products, key: 'products' },
      { label: headerJSON.explore, key: 'explore' },
    ],
    actions: {
      testRide: { label: headerJSON.testRideLabel, link: pageUrl(headerJSON.testRideLink) },
      cta: { label: headerJSON.buyNowLabel, link: pageUrl(headerJSON.buyNowLink) },
      country: { label: headerJSON.countryName, flagSrc: asset(headerJSON.countryFlagUrl) },
      terms: { label: headerJSON.terms, link: pageUrl(headerJSON.termsLink) },
      privacy: { label: headerJSON.privacy, link: pageUrl(headerJSON.privacyLink) },
    },
    labels: {
      mobileProducts: headerJSON.mobileProducts,
      mobileExplore: headerJSON.mobileExplore,
      myAccount: headerJSON.myAccount,
      toggleMobileMenuAriaLabel: headerJSON.toggleMobileMenuAriaLabel,
      closeMobileMenuAriaLabel: headerJSON.closeMobileMenuAriaLabel,
      closeMenuAlt: headerJSON.closeMenuAlt,
    },
    submenus: {
      products: {
        type: 'product-grid',
        categories: toArray(headerJSON.vehicleModel).map((series) => ({
          title: series.variantName,
          items: toArray(series.vehicles).slice(0, 3).map((vehicle) => ({
            label: vehicle.name,
            link: pageUrl(vehicle.link),
            image: asset(vehicle.image),
            isNew: isTrue(vehicle.isNew),
          })),
        })),
      },
      explore: {
        type: 'explore-links',
        exploreItems: toArray(headerJSON.exploreItems).map((item) => ({
          label: item.name,
          link: pageUrl(item.link),
          description: clean(item.description),
          isNew: isTrue(item.isNew),
        })),
        rightNav: toArray(headerJSON.exploreRightNav).map((item) => ({
          label: item.name,
          link: pageUrl(item.link),
        })),
      },
    },
    countries: toArray(headerJSON.countries).map((country) => ({
      name: country.name,
      flag: asset(country.flag),
      link: country.redirectionUrl,
    })),
    icons: {
      chevronClose: asset(headerJSON.chevronIcon),
      chevronOpen: asset(headerJSON.chevronIconOpen),
      hamburgerIconClose: asset(headerJSON.closeHamburger),
    },
  };
}

// ----------------------------------- //
// - Build functions for Main header - //
// ----------------------------------- //
function buildLogo(logo) {
  const div = document.createElement('div');
  div.className = 'vida-header-logo';

  const logoLink = document.createElement('a');
  logoLink.href = logo.link;

  const logoImg = document.createElement('img');
  logoImg.src = logo.src;
  logoImg.alt = logo.alt;

  logoLink.append(logoImg);
  div.append(logoLink);

  return div;
}

function buildNav(items, icons) {
  const nav = document.createElement('nav');
  nav.className = 'vida-header-nav';

  const navList = document.createElement('ul');
  navList.className = 'vida-header-nav-list';

  items.forEach((item) => {
    const navItem = document.createElement('li');
    navItem.className = 'vida-header-nav-item';

    const navDropdownTrigger = document.createElement('button');
    navDropdownTrigger.type = 'button';
    navDropdownTrigger.className = 'vida-header-nav-link';
    navDropdownTrigger.setAttribute('aria-expanded', 'false');
    navDropdownTrigger.dataset.dropdownTrigger = item.key;
    navDropdownTrigger.setAttribute('aria-controls', `vida-submenu-${item.key}`);
    navDropdownTrigger.setAttribute('aria-haspopup', 'true');

    const navLinkLabel = document.createElement('span');
    navLinkLabel.className = 'vida-header-nav-link-label';
    navLinkLabel.textContent = item.label;

    const navLinkChevron = document.createElement('img');
    navLinkChevron.src = icons.chevronClose;
    navLinkChevron.alt = '';
    navLinkChevron.className = 'vida-header-nav-link-chevron'; // TODO: Create common styles
    navLinkChevron.setAttribute('aria-hidden', 'true');

    navDropdownTrigger.append(navLinkLabel, navLinkChevron);

    navItem.append(navDropdownTrigger);
    navList.append(navItem);
  });

  nav.append(navList);
  return nav;
}

function buildHeaderActions(actions, labels, icons) {
  const div = document.createElement('div');
  div.className = 'vida-header-header-actions';

  const testRideLink = document.createElement('a');
  testRideLink.href = actions.testRide.link;
  testRideLink.className = 'vida-header-top-link';
  testRideLink.textContent = actions.testRide.label;

  const buyCtaBtn = buildButton({
    label: actions.cta.label,
    href: actions.cta.link,
    variant: 'primary',
    size: 'sm',
  });

  const countrySelector = document.createElement('button');
  countrySelector.type = 'button';
  countrySelector.className = 'vida-header-country-selector';
  countrySelector.setAttribute('aria-label', `Selected country: ${actions.country.label}. Change country`);

  const countryFlagImg = document.createElement('img');
  countryFlagImg.src = actions.country.flagSrc;
  countryFlagImg.alt = '';
  countryFlagImg.className = 'vida-header-country-flag-item';

  const chevronImg = document.createElement('img');
  chevronImg.src = icons.chevronClose;
  chevronImg.alt = '';
  chevronImg.className = 'vida-header-country-selector-chevron';
  chevronImg.setAttribute('aria-hidden', 'true');

  const menuTrigger = document.createElement('button');
  menuTrigger.type = 'button';
  menuTrigger.className = 'vida-header-menu-trigger';
  menuTrigger.setAttribute('aria-expanded', false);
  menuTrigger.setAttribute('aria-controls', 'vida-mobile-menu');
  menuTrigger.setAttribute('aria-label', labels?.toggleMobileMenuAriaLabel || 'Open Menu');

  menuTrigger.innerHTML = `
    <span class="vida-header-menu-trigger-bar"></span>
    <span class="vida-header-menu-trigger-bar"></span>
    <span class="vida-header-menu-trigger-bar"></span>
    <span class="vida-header-menu-trigger-bar"></span>
  `;

  countrySelector.append(countryFlagImg, chevronImg);
  div.append(testRideLink, buyCtaBtn, countrySelector, menuTrigger);

  return div;
}

function setOpenDropdown(header, key, icons) {
  header.querySelectorAll('[data-dropdown-trigger').forEach((trigger) => {
    const isOpen = trigger.dataset.dropdownTrigger === key;
    trigger.setAttribute('aria-expanded', String(isOpen));
    const chevron = trigger.querySelector('.vida-header-nav-link-chevron');
    if (chevron) chevron.src = isOpen ? icons.chevronOpen : icons.chevronClose;
  });

  header.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== key;
  });
}

function wireDropdowns(header, icons) {
  let closeTimer;
  const CLOSE_DELAY = 150;

  const openNow = (k) => {
    clearTimeout(closeTimer);
    setOpenDropdown(header, k, icons);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => setOpenDropdown(header, null, icons), CLOSE_DELAY);
  };

  header.querySelectorAll('[data-dropdown-trigger]').forEach((trigger) => {
    trigger.addEventListener('mouseenter', () => openNow(trigger.dataset.dropdownTrigger));
    trigger.addEventListener('mouseleave', scheduleClose);

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      openNow(isOpen ? null : trigger.dataset.dropdownTrigger);
    });
  });

  header.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
    panel.addEventListener('mouseleave', scheduleClose);
  });

  header.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    const open = header.querySelector('[data-dropdown-trigger][aria-expanded="true"]');
    if (!open) return;

    setOpenDropdown(header, null, icons);
    open.focus();
  });
}

function buildMobileMenuAccordionItem(series, chevronSrc) {
  const item = document.createElement('div');
  item.className = 'vida-mobile-menu-accordion-item';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'vida-mobile-menu-accordion-trigger';
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'vida-mobile-menu-accordion-label';
  label.textContent = series.title;

  const chevron = document.createElement('img');
  chevron.src = chevronSrc;
  chevron.alt = '';
  chevron.className = 'vida-mobile-menu-accordion-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  trigger.append(label, chevron);

  const panel = document.createElement('ul');
  panel.className = 'vida-mobile-menu-accordion-panel';
  panel.hidden = true;

  series.items.forEach((vehicle) => {
    const li = document.createElement('li');
    li.className = 'vida-mobile-menu-list';
    const a = document.createElement('a');
    a.href = vehicle.link;
    a.textContent = vehicle.label;
    a.className = 'vida-mobile-menu-link';

    if (vehicle.isNew === 'true') {
      const badge = document.createElement('span');
      badge.className = 'vida-mobile-menu-badge';
      badge.textContent = 'NEW';
      a.append(badge);
    }

    li.append(a);
    panel.append(li);
  });

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  });

  item.append(trigger, panel);

  return item;
}

function buildMobileMenuFlatList(items, listClass) {
  const ul = document.createElement('ul');
  ul.className = listClass;
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'vida-mobile-menu-list';
    const a = document.createElement('a');
    a.href = item.link;
    a.textContent = item.label;
    a.className = 'vida-mobile-menu-link-explore';
    if (item.isNew === 'true') {
      const badge = document.createElement('span');
      badge.className = 'vida-mobile-menu-badge';
      badge.textContent = 'NEW';
      a.append(badge);
    }

    li.append(a);
    ul.append(li);
  });

  return ul;
}

function createDivider() {
  const divider = document.createElement('hr');
  divider.className = 'vida-mobile-menu-divider';

  return divider;
}

function buildMobileMenu(data) {
  const {
    actions, submenus, icons, labels,
  } = data;

  const { products, explore } = submenus;

  const overlay = document.createElement('div');
  overlay.id = 'vida-mobile-menu';
  overlay.className = 'vida-header-mobile-menu';

  const topRow = document.createElement('div');
  topRow.className = 'vida-mobile-menu-top';

  const currentCountry = actions.country;
  const countryFlag = document.createElement('img');
  countryFlag.src = currentCountry.flagSrc;
  countryFlag.alt = currentCountry.label;
  countryFlag.className = 'vida-mobile-menu-country-flag';

  const countryLabel = document.createElement('span');
  countryLabel.className = 'vida-mobile-menu-country-label';
  countryLabel.textContent = currentCountry.label;

  const chevronImg = document.createElement('img');
  chevronImg.src = icons.chevronClose;
  chevronImg.alt = '';
  chevronImg.className = 'vida-mobile-country-label-chevron';
  chevronImg.setAttribute('aria-hidden', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'vida-mobile-menu-close';
  closeBtn.setAttribute('aria-label', labels.closeMobileMenuAriaLabel);
  const closeIcon = document.createElement('img');
  closeIcon.src = icons.hamburgerIconClose;
  closeIcon.alt = labels.closeMenuAlt;
  closeIcon.setAttribute('aria-hidden', 'true');
  closeBtn.append(closeIcon);

  topRow.append(countryFlag, countryLabel, chevronImg, closeBtn);

  const body = document.createElement('div');
  body.className = 'vida-mobile-menu-body';

  const productsHeading = document.createElement('p');
  productsHeading.className = 'vida-mobile-menu-section-title';
  productsHeading.textContent = labels.mobileProducts;

  const productsAccordion = document.createElement('div');
  productsAccordion.className = 'vida-mobile-menu-accordion';
  products.categories.forEach((category) => {
    productsAccordion.append(buildMobileMenuAccordionItem(category, icons.chevronClose));
  });

  const exploreHeading = document.createElement('p');
  exploreHeading.className = 'vida-mobile-menu-section-title';
  exploreHeading.textContent = labels.mobileExplore;

  const exploreList = buildMobileMenuFlatList(explore.exploreItems, 'vida-mobile-menu-list');

  const accountHeading = document.createElement('p');
  accountHeading.className = 'vida-mobile-menu-section-title';
  accountHeading.textContent = labels.myAccount;

  const accountList = buildMobileMenuFlatList(explore.rightNav, 'vida-mobile-menu-list');

  const legal = document.createElement('div');
  legal.className = 'vida-mobile-menu-legal';
  const termsLink = document.createElement('a');
  termsLink.href = actions.terms.link;
  termsLink.textContent = actions.terms.label;
  const privacyLink = document.createElement('a');
  privacyLink.href = actions.privacy.link;
  privacyLink.textContent = actions.privacy.label;
  legal.append(termsLink, privacyLink);

  body.append(
    productsHeading,
    productsAccordion,
    createDivider(),
    exploreHeading,
    exploreList,
    createDivider(),
    accountHeading,
    accountList,
    createDivider(),
    legal,
  );

  const footer = document.createElement('div');
  footer.className = 'vida-mobile-menu-footer';

  const footerTestRide = buildButton({
    label: actions.testRide.label,
    href: actions.testRide.link,
    variant: 'secondary',
    size: 'sm',
  });

  const footerBuyCta = buildButton({
    label: actions.cta.label,
    href: actions.cta.link,
    variant: 'primary',
    size: 'sm',
  });

  footer.append(footerTestRide, footerBuyCta);
  overlay.append(topRow, body, footer);

  return overlay;
}

function setMobileMenuOpen(trigger, overlay, isOpen) {
  trigger.setAttribute('aria-expanded', String(isOpen));
  overlay.classList.toggle('vida-mobile-menu-open', isOpen);
  document.body.classList.toggle('vida-mobile-menu-open', isOpen);
}

function buildHeader(data) {
  const wrapper = document.createElement('div');
  wrapper.className = 'vida-header-wrapper';

  const header = document.createElement('header');
  header.className = 'vida-header';

  const container = document.createElement('div');
  container.className = 'vida-header-container';

  container.append(
    buildLogo(data.logo),
    buildNav(data.navItems, data.icons),
    buildHeaderActions(data.actions, data.labels, data.icons),
  );

  header.append(container);

  Object.entries(data.submenus || {}).forEach(([key, config]) => {
    header.append(buildSubmenu(key, config));
  });

  wireDropdowns(header, data.icons);

  const mobileMenuOverlay = buildMobileMenu(data);
  header.append(mobileMenuOverlay);

  const menuTrigger = header.querySelector('.vida-header-menu-trigger');
  menuTrigger.addEventListener('click', () => {
    const isOpen = menuTrigger.getAttribute('aria-expanded') === 'true';
    setMobileMenuOpen(menuTrigger, mobileMenuOverlay, !isOpen);
  });

  mobileMenuOverlay.querySelector('.vida-mobile-menu-close')
    .addEventListener('click', () => setMobileMenuOpen(menuTrigger, mobileMenuOverlay, false));

  wrapper.append(header);

  return wrapper;
}

// --------------------------------------------------------- //
// --------------- Mobile menu --------------- //
// --------------------------------------------------------- //

// --------------------------------------------------------- //
// ---------------- Final decorate function ---------------- //
// --------------------------------------------------------- //
export default async function decorate(block) {
  const endpointRow = block.firstElementChild;
  const rawPath = endpointRow?.textContent?.trim();
  endpointRow?.remove();

  const endpoint = getAPIEndpoint(rawPath, 'headerApi');

  if (!endpoint) return;

  let headerRawData;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Header API ${response.status}`);
    headerRawData = await response.json();
  } catch (error) {
    console.error('Failed to load header data', error);
    return;
  }

  const { origin } = new URL(endpoint);
  const normalisedHeaderData = normaliseHeaderJson(headerRawData, origin);

  block.textContent = '';
  block.append(buildHeader(normalisedHeaderData));
}
