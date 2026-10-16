import { loadCSS } from '../../scripts/aem.js';

const DEBUG = true;
const MODEL_COLOR = 'vida-pdp-color';
const MODEL_SPEC = 'vida-pdp-spec';

/* eslint-disable no-console */
const debugLog = (label, payload) => {
  if (!DEBUG) return;
  console.groupCollapsed(`[vida-pdp-specs] ${label}`);
  console.log(payload);
  console.groupEnd();
};

const debugError = (label, error) => {
  if (!DEBUG) return;
  console.error(`[vida-pdp-specs] ${label}`, error);
};
/* eslint-enable no-console */

/* ---------- DOM helpers ---------- */

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const findField = (root, prop) => root.querySelector(`[data-aue-prop="${prop}"]`);

const readText = (root, prop) => {
  const node = findField(root, prop);
  return node ? node.textContent.trim() : '';
};

const readHref = (root, prop) => {
  const node = findField(root, prop);
  if (!node) return '';
  const anchor = node.tagName === 'A' ? node : node.querySelector('a');
  return anchor ? anchor.getAttribute('href') || '' : node.textContent.trim();
};

const readImage = (root, prop) => {
  const node = findField(root, prop);
  if (!node) return '';
  const img = node.tagName === 'IMG' ? node : node.querySelector('img');
  return img ? img.getAttribute('src') || '' : '';
};

const parseItems = (root, model, parser) => Array.from(
  root.querySelectorAll(`[data-aue-model="${model}"]`),
  (item) => parser(item),
);

/* ---------- Parsers ---------- */

const parseColor = (item) => ({
  image: readImage(item, 'colorImage'),
  colorName: readText(item, 'colorName'),
  colorCode: readText(item, 'colorCode'),
});

const parseSpec = (item) => ({
  image: readImage(item, 'specImage'),
  title: readText(item, 'specTitle'),
  value: readText(item, 'specValue'),
});

const parseVariant = (row) => ({
  title: readText(row, 'title'),
  tag: readText(row, 'tag'),
  skuId: readText(row, 'skuId'),
  stateApiUrl: readHref(row, 'stateApiUrl'),
  priceApiUrl: readHref(row, 'priceApiUrl'),
  price: {
    heading: readText(row, 'priceHeading'),
    subheading: readText(row, 'priceSubheading'),
    linkName: readText(row, 'priceLinkName'),
    linkUrl: readHref(row, 'priceLinkUrl'),
    breakdown: {
      exShowroom: readText(row, 'exShowroomTitle'),
      pmEDriveSubsidy: readText(row, 'pmEDriveSubsidyTitle'),
      stateSubsidy: readText(row, 'stateSubsidyTitle'),
      currentDiscount: readText(row, 'currentDiscountTitle'),
      effectivePrice: readText(row, 'effectivePriceTitle'),
    },
    note: readText(row, 'priceNote'),
  },
  colors: parseItems(row, MODEL_COLOR, parseColor),
  specifications: parseItems(row, MODEL_SPEC, parseSpec),
  allSpecifications: {
    linkTitle: readText(row, 'specAllLinkTitle'),
    linkName: readText(row, 'specAllLinkName'),
  },
});

/* ---------- API (state + price) ---------- */

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

// Logs the API responses for now. Map them to the DOM once the response shape is known.
const loadVariantApis = async (variant) => {
  try {
    const [state, price] = await Promise.all([
      variant.stateApiUrl ? fetchJson(variant.stateApiUrl) : null,
      variant.priceApiUrl ? fetchJson(variant.priceApiUrl) : null,
    ]);
    debugLog(`APIs for "${variant.title}"`, { state, price });
  } catch (error) {
    debugError(`API failed for "${variant.title}"`, error);
  }
};

/* ---------- Renderers ---------- */

const renderPriceCard = (variant, row) => {
  const card = el('div', 'vida-pdp-specs__price');

  const info = el('div', 'vida-pdp-specs__price-info');
  info.append(el('p', 'vida-pdp-specs__price-heading', variant.price.heading));

  const location = el('p', 'vida-pdp-specs__location');
  location.append(
    el('span', '', variant.price.subheading),
    el('span', 'vida-pdp-specs__location-name', 'Select location'),
  );
  info.append(location);

  if (variant.price.linkName) {
    const link = el('a', 'vida-pdp-specs__link', variant.price.linkName);
    link.href = variant.price.linkUrl || '#';
    info.append(link);
  }

  const value = el('div', 'vida-pdp-specs__price-value');
  value.append(el('span', 'vida-pdp-specs__price-amount', '—'));

  const breakdown = el('details', 'vida-pdp-specs__breakdown');
  breakdown.append(el('summary', '', 'Price breakdown'));
  const list = el('ul', 'vida-pdp-specs__breakdown-list');
  Object.entries(variant.price.breakdown)
    .filter(([, label]) => label)
    .forEach(([, label]) => {
      const item = el('li', 'vida-pdp-specs__breakdown-item');
      item.append(el('span', '', label), el('span', 'vida-pdp-specs__breakdown-value', '—'));
      list.append(item);
    });
  breakdown.append(list);
  value.append(breakdown);

  card.append(info, value);

  // Rich text note: clone the authored child nodes instead of using innerHTML.
  const noteSource = findField(row, 'priceNote');
  if (noteSource) {
    const note = el('div', 'vida-pdp-specs__note');
    note.append(...Array.from(noteSource.childNodes, (node) => node.cloneNode(true)));
    card.append(note);
  }

  return card;
};

const renderGallery = (variant) => {
  const gallery = el('div', 'vida-pdp-specs__gallery');
  const colors = variant.colors.filter((color) => color.image || color.colorCode);

  const image = el('img', 'vida-pdp-specs__image');
  image.alt = variant.title || 'Product image';
  image.loading = 'lazy';

  const label = el('p', 'vida-pdp-specs__color-label', colors[0] ? colors[0].colorName : '');
  const swatches = el('div', 'vida-pdp-specs__swatches');
  const buttons = [];

  const setColor = (index) => {
    const color = colors[index];
    if (!color) return;
    if (color.image) image.src = color.image;
    label.textContent = color.colorName;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  };

  colors.forEach((color, index) => {
    const button = el('button', 'vida-pdp-specs__swatch');
    button.type = 'button';
    button.title = color.colorName;
    button.setAttribute('aria-label', color.colorName);
    button.style.backgroundColor = color.colorCode;
    button.addEventListener('click', () => setColor(index));
    buttons.push(button);
    swatches.append(button);
  });

  if (colors.length) setColor(0);

  gallery.append(image, label, swatches);
  return gallery;
};

const renderSpecs = (variant) => {
  const wrap = el('div', 'vida-pdp-specs__specs');
  const list = el('ul', 'vida-pdp-specs__spec-list');

  variant.specifications.forEach((spec) => {
    const item = el('li', 'vida-pdp-specs__spec');
    if (spec.image) {
      const icon = el('img', 'vida-pdp-specs__spec-icon');
      icon.src = spec.image;
      icon.alt = '';
      icon.loading = 'lazy';
      item.append(icon);
    }
    const text = el('div', 'vida-pdp-specs__spec-text');
    text.append(
      el('span', 'vida-pdp-specs__spec-title', spec.title),
      el('span', 'vida-pdp-specs__spec-value', spec.value),
    );
    item.append(text);
    list.append(item);
  });

  wrap.append(list);

  if (variant.allSpecifications.linkName) {
    const button = el('button', 'vida-pdp-specs__all-link', variant.allSpecifications.linkName);
    button.type = 'button';
    button.title = variant.allSpecifications.linkTitle;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const expanded = list.classList.toggle('is-expanded');
      button.setAttribute('aria-expanded', String(expanded));
    });
    wrap.append(button);
  }

  return wrap;
};

const renderPanel = (variant, row, index) => {
  const panel = el('section', 'vida-pdp-specs__panel');
  panel.id = `vida-pdp-panel-${index}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `vida-pdp-tab-${index}`);
  panel.append(
    renderPriceCard(variant, row),
    renderGallery(variant),
    renderSpecs(variant),
  );
  return panel;
};

/* ---------- Entry point ---------- */

export default function decorate(block) {
  loadCSS(new URL('./vida-pdp-specs.css', import.meta.url).href);

  const titleEl = findField(block, 'pageTitle');
  const pageTitle = titleEl ? titleEl.textContent.trim() : '';

  // Every block child except the row holding the page title is a product variant.
  const variantRows = Array.from(block.children)
    .filter((row) => !(titleEl && row.contains(titleEl)));

  const variants = variantRows.map((row) => ({ row, data: parseVariant(row) }));

  debugLog(`parsed ${variants.length} variant(s)`, {
    pageTitle,
    variantCount: variants.length,
    variants: variants.map((v) => v.data),
  });

  if (!variants.length) {
    block.replaceChildren();
    return;
  }

  const container = el('div', 'vida-pdp-specs__container');
  if (pageTitle) container.append(el('h2', 'vida-pdp-specs__title', pageTitle));

  const tabs = el('div', 'vida-pdp-specs__tabs');
  tabs.setAttribute('role', 'tablist');

  const tabButtons = [];
  const panels = [];

  const selectTab = (index) => {
    tabButtons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  };

  variants.forEach(({ row, data }, index) => {
    const tab = el('button', 'vida-pdp-specs__tab');
    tab.type = 'button';
    tab.id = `vida-pdp-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `vida-pdp-panel-${index}`);
    tab.append(el('span', '', data.title));
    if (data.tag) tab.append(el('span', 'vida-pdp-specs__tag', data.tag));
    tab.addEventListener('click', () => selectTab(index));

    tabButtons.push(tab);
    tabs.append(tab);
    panels.push(renderPanel(data, row, index));
  });

  selectTab(0);
  container.append(tabs, ...panels);
  block.replaceChildren(container);

  variants.forEach(({ data }) => loadVariantApis(data));
}
