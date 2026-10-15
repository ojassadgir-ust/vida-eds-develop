const CONFIG = {
  classes: {
    block: 'vida-pdp-specs',
    heading: 'vida-pdp-specs__heading',
    tabs: 'vida-pdp-specs__tabs',
    tab: 'vida-pdp-specs__tab',
    tag: 'vida-pdp-specs__tag',
    pricePanel: 'vida-pdp-specs__price-panel',
    priceCopy: 'vida-pdp-specs__price-copy',
    priceTitle: 'vida-pdp-specs__price-title',
    cityTrigger: 'vida-pdp-specs__city-trigger',
    cityPopover: 'vida-pdp-specs__city-popover',
    citySearch: 'vida-pdp-specs__city-search',
    cityList: 'vida-pdp-specs__city-list',
    cityOption: 'vida-pdp-specs__city-option',
    priceSubtitle: 'vida-pdp-specs__price-subtitle',
    dealership: 'vida-pdp-specs__dealership',
    priceCard: 'vida-pdp-specs__price-card',
    priceValue: 'vida-pdp-specs__price-value',
    tooltipTrigger: 'vida-pdp-specs__tooltip-trigger',
    tooltip: 'vida-pdp-specs__tooltip',
    breakdown: 'vida-pdp-specs__breakdown',
    breakdownRow: 'vida-pdp-specs__breakdown-row',
    modelImage: 'vida-pdp-specs__model-image',
    colorPicker: 'vida-pdp-specs__color-picker',
    colorName: 'vida-pdp-specs__color-name',
    swatches: 'vida-pdp-specs__swatches',
    swatch: 'vida-pdp-specs__swatch',
    specs: 'vida-pdp-specs__specs',
    spec: 'vida-pdp-specs__spec',
    specIcon: 'vida-pdp-specs__spec-icon',
    specCopy: 'vida-pdp-specs__spec-copy',
    specTitle: 'vida-pdp-specs__spec-title',
    specValue: 'vida-pdp-specs__spec-value',
    viewSpecs: 'vida-pdp-specs__view-specs',
    hidden: 'is-hidden',
    active: 'is-active',
  },
  selectors: {
    rows: ':scope > div',
    cityApiDefault: 'https://www.vidaworld.com/content/dam/vida/config/city-master.json',
    priceApiDefault: 'https://www.vidaworld.com/content/vida/in/en/vx2-go-electric-scooter/jcr:content.detailed-Product-Price.{city}.a1WTZ000000PK1x2AG.a24TZ000008Lod7YAC.json',
    mobileBreakpoint: 767,
    maxCities: 6,
  },
  labels: {
    breakdownTitle: 'Price Breakdown',
    note: '*Note - Effective price after applicable offers & subsidies. **Note - State subsidy reimbursement can be collected from the State directly.',
    priceFallback: 'Price unavailable',
  },
  apiKeys: {
    price: ['effective_onroad_price', 'effective_price', 'price'],
    exShowroom: ['ex_showroom_price', 'taxable_exshowroom_price'],
    pmEDrive: ['pmedrive_subsidy_amount', 'fame_subsidy_amount', 'emps_subsidy_amount'],
    stateSubsidy: ['state_subsidy_amount', 'state_subsidy'],
    discount: ['discount_amount'],
  },
};

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const slugify = (value = '') => normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const asUrl = (value) => {
  const url = normalizeText(value);
  return url || '#';
};
const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '' || value === '-') return '—';
  const numericValue = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(numericValue)) return String(value);
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(numericValue)}`;
};
const firstUsableValue = (source, keys) => {
  const key = keys.find((candidate) => source?.[candidate] !== undefined
    && source[candidate] !== null && source[candidate] !== '' && source[candidate] !== '-');
  return key ? source[key] : null;
};
const isImageUrl = (value) => /^(https?:|\/|\.\/|\.\.\/)/i.test(normalizeText(value));
const getImageValue = (cell) => {
  if (!cell) return '';
  const image = cell.querySelector('picture img, img');
  if (image) return image.getAttribute('src') || image.getAttribute('data-src') || '';
  const anchor = cell.querySelector('a[href]');
  if (anchor && isImageUrl(anchor.getAttribute('href'))) return anchor.getAttribute('href');
  const text = normalizeText(cell.textContent);
  return isImageUrl(text) ? text : '';
};
const getLinkValue = (cell) => {
  if (!cell) return '';
  const link = cell.querySelector('a[href]');
  return link?.getAttribute('href') || normalizeText(cell.textContent);
};
const getFieldValue = (cell) => normalizeText(cell?.textContent || '');
const readRows = (block) => [...block.children].filter((child) => child.tagName === 'DIV');

function readColors(root) {
  const colors = [];
  readRows(root).forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = slugify(cells[0].textContent);
    if (label === 'color-option' || label === 'color') {
      const color = {
        colorName: '', colorHex: '#1e6b9a', desktopImage: '', tabletImage: '', mobileImage: '',
      };
      readRows(cells[1]).forEach((colorRow) => {
        const colorCells = [...colorRow.children];
        if (colorCells.length < 2) return;
        const key = slugify(colorCells[0].textContent);
        if (key === 'color-name') color.colorName = getFieldValue(colorCells[1]);
        if (key === 'color-hex' || key === 'color-swatch-hex-value') {
          color.colorHex = getFieldValue(colorCells[1]) || color.colorHex;
        }
        if (key === 'desktop-model-image') color.desktopImage = getImageValue(colorCells[1]);
        if (key === 'tablet-model-image') color.tabletImage = getImageValue(colorCells[1]);
        if (key === 'mobile-model-image') color.mobileImage = getImageValue(colorCells[1]);
      });
      if (color.colorName || color.desktopImage || color.mobileImage || color.tabletImage) {
        colors.push(color);
      }
    } else if (cells.length >= 5) {
      colors.push({
        colorName: getFieldValue(cells[0]),
        colorHex: getFieldValue(cells[1]) || '#1e6b9a',
        desktopImage: getImageValue(cells[2]),
        tabletImage: getImageValue(cells[3]),
        mobileImage: getImageValue(cells[4]),
      });
    }
  });
  return colors;
}

function readSpecifications(root) {
  const specifications = [];
  readRows(root).forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = slugify(cells[0].textContent);
    if (label === 'specification' || label === 'specification-item') {
      const spec = { specImage: '', specTitle: '', specSubtitle: '' };
      readRows(cells[1]).forEach((specRow) => {
        const specCells = [...specRow.children];
        if (specCells.length < 2) return;
        const key = slugify(specCells[0].textContent);
        if (key === 'specification-icon-image' || key === 'spec-image') spec.specImage = getImageValue(specCells[1]);
        if (key === 'specification-title' || key === 'spec-title') spec.specTitle = getFieldValue(specCells[1]);
        if (key === 'specification-value' || key === 'spec-subtitle') spec.specSubtitle = getFieldValue(specCells[1]);
      });
      if (spec.specTitle || spec.specSubtitle || spec.specImage) specifications.push(spec);
    } else if (cells.length >= 3) {
      specifications.push({
        specImage: getImageValue(cells[0]),
        specTitle: getFieldValue(cells[1]),
        specSubtitle: getFieldValue(cells[2]),
      });
    }
  });
  return specifications;
}

function readVariant(root, index) {
  const variant = {
    modelName: '',
    modelTag: '',
    modelTitle: '',
    cityApiUrl: CONFIG.selectors.cityApiDefault,
    priceApiUrlTemplate: CONFIG.selectors.priceApiDefault,
    modelSubtitle: '',
    dealershipLinkName: 'View Dealerships',
    dealershipLink: '#',
    defaultCity: 'Delhi',
    priceExShowroomText: 'Ex. Showroom',
    pricePmEDriveText: 'PM E-Drive Subsidy',
    priceStateSubsidyText: 'State Subsidy',
    priceDiscountText: 'Current Discounts',
    priceEffectiveText: 'Effective Price',
    priceNotes: '',
    colors: [],
    specifications: [],
    viewSpecificationsLabel: 'View all Specifications',
    viewSpecificationsLink: '#',
  };
  const fieldMap = {
    'model-name': 'modelName',
    'model-tag': 'modelTag',
    'model-title': 'modelTitle',
    'city-api-url': 'cityApiUrl',
    'price-api-url-template': 'priceApiUrlTemplate',
    'model-subtitle': 'modelSubtitle',
    'dealership-link-name': 'dealershipLinkName',
    'dealership-link': 'dealershipLink',
    'default-city': 'defaultCity',
    'price-ex-showroom-text': 'priceExShowroomText',
    'price-pm-e-drive-text': 'pricePmEDriveText',
    'price-state-subsidy-text': 'priceStateSubsidyText',
    'price-discount-text': 'priceDiscountText',
    'price-effective-text': 'priceEffectiveText',
    'price-notes': 'priceNotes',
    'view-specifications-label': 'viewSpecificationsLabel',
    'view-specifications-link': 'viewSpecificationsLink',
  };
  const rows = readRows(root);
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = slugify(cells[0].textContent);
    const target = fieldMap[label];
    if (target) {
      const value = target.toLowerCase().includes('link')
        ? getLinkValue(cells[1])
        : getFieldValue(cells[1]);
      if (value) variant[target] = value;
    }
    if (label === 'colors' || label.includes('color-option')) {
      variant.colors.push(...readColors(cells[1]));
    }
    if (label === 'specifications' || label.includes('specification')) {
      variant.specifications.push(...readSpecifications(cells[1]));
    }
  });
  if (!variant.modelName) variant.modelName = `Model ${index + 1}`;
  variant.cityApiUrl ||= CONFIG.selectors.cityApiDefault;
  variant.priceApiUrlTemplate ||= CONFIG.selectors.priceApiDefault;
  variant.defaultCity ||= 'Delhi';
  return variant;
}

function readAuthoringData(block) {
  const rows = readRows(block);
  const data = { mainTitle: '', variants: [] };

  rows.forEach((row, rowIndex) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = slugify(cells[0].textContent);
    const valueCell = cells[1];
    const value = getFieldValue(valueCell);

    if (label.includes('main-page-title') || label === 'maintitle' || label === 'main-title') {
      data.mainTitle = value;
      return;
    }

    if (label.includes('model-variant') || label === 'variants' || label === 'model') {
      const variant = readVariant(valueCell, rowIndex);
      if (variant.modelName || variant.modelTitle || variant.colors.length
        || variant.specifications.length) data.variants.push(variant);
    }
  });

  if (!data.variants.length) {
    const variant = readVariant(block, 0);
    if (variant.modelName || variant.modelTitle || variant.colors.length
      || variant.specifications.length) data.variants.push(variant);
  }
  return data;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function createImage(src, alt, className) {
  const image = createElement('img', className);
  image.alt = alt || '';
  image.loading = 'lazy';
  image.decoding = 'async';
  if (src) image.src = src;
  return image;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json();
}

function createVariantUI(variant, index) {
  const root = createElement('section', 'vida-pdp-specs__variant');
  root.dataset.variantIndex = String(index);
  const state = {
    city: variant.defaultCity || 'Delhi', cities: [], priceData: null, colorIndex: 0,
  };

  const pricePanel = createElement('div', CONFIG.classes.pricePanel);
  const priceCopy = createElement('div', CONFIG.classes.priceCopy);
  const priceTitle = createElement('h2', CONFIG.classes.priceTitle);
  const titleText = normalizeText(variant.modelTitle || `Your ${variant.modelName} Price in`);
  const titleParts = titleText.split('{city}');
  priceTitle.append(document.createTextNode(titleParts[0]));
  const cityWrap = createElement('span', 'vida-pdp-specs__city-wrap');
  const cityTrigger = createElement('button', CONFIG.classes.cityTrigger, state.city);
  cityTrigger.type = 'button';
  cityTrigger.setAttribute('aria-haspopup', 'listbox');
  cityTrigger.setAttribute('aria-expanded', 'false');
  cityTrigger.innerHTML += ' <span class="vida-pdp-specs__chevron" aria-hidden="true"></span>';
  cityWrap.append(cityTrigger);
  priceTitle.append(cityWrap, document.createTextNode(titleParts[1] || ''));

  const cityPopover = createElement('div', CONFIG.classes.cityPopover);
  cityPopover.hidden = true;
  const citySearch = createElement('input', CONFIG.classes.citySearch);
  citySearch.type = 'search';
  citySearch.placeholder = 'Search city';
  citySearch.setAttribute('aria-label', 'Search city');
  const cityList = createElement('div', CONFIG.classes.cityList);
  cityList.setAttribute('role', 'listbox');
  cityPopover.append(citySearch, cityList);

  const subtitle = createElement('p', CONFIG.classes.priceSubtitle, variant.modelSubtitle);
  const dealership = createElement('a', CONFIG.classes.dealership, variant.dealershipLinkName || 'View Dealerships');
  dealership.href = asUrl(variant.dealershipLink);
  const priceCard = createElement('div', CONFIG.classes.priceCard);
  const priceValue = createElement('strong', CONFIG.classes.priceValue, CONFIG.labels.priceFallback);
  const tooltipTrigger = createElement('button', CONFIG.classes.tooltipTrigger, 'i');
  tooltipTrigger.type = 'button';
  tooltipTrigger.setAttribute('aria-label', 'Show price breakdown');
  tooltipTrigger.setAttribute('aria-expanded', 'false');
  const tooltip = createElement('div', CONFIG.classes.tooltip);
  tooltip.hidden = true;
  const tooltipHeading = createElement('div', 'vida-pdp-specs__tooltip-heading', CONFIG.labels.breakdownTitle);
  const closeTooltip = createElement('button', 'vida-pdp-specs__tooltip-close', '×');
  closeTooltip.type = 'button';
  closeTooltip.setAttribute('aria-label', 'Close price breakdown');
  tooltipHeading.append(closeTooltip);
  const breakdown = createElement('div', CONFIG.classes.breakdown);
  const breakdownRows = [
    [variant.priceExShowroomText, 'exShowroom'], [variant.pricePmEDriveText, 'pmEDrive'],
    [variant.priceStateSubsidyText, 'stateSubsidy'], [variant.priceDiscountText, 'discount'],
    [variant.priceEffectiveText, 'effective'],
  ];
  breakdownRows.forEach(([label, key]) => {
    const row = createElement('div', CONFIG.classes.breakdownRow);
    row.dataset.priceKey = key;
    row.append(createElement('span', '', label || key), createElement('strong', '', '—'));
    breakdown.append(row);
  });
  const notes = createElement('div', 'vida-pdp-specs__price-notes');
  if (variant.priceNotes) notes.innerHTML = variant.priceNotes;
  else notes.textContent = CONFIG.labels.note;
  tooltip.append(tooltipHeading, breakdown, notes);
  priceCard.append(priceValue, tooltipTrigger, tooltip);
  priceCopy.append(priceTitle, subtitle, dealership, cityPopover);
  pricePanel.append(priceCopy, priceCard);

  const imageStage = createElement('div', 'vida-pdp-specs__image-stage');
  const modelImage = createElement('img', CONFIG.classes.modelImage);
  modelImage.alt = variant.modelName;
  modelImage.loading = 'lazy';
  modelImage.decoding = 'async';
  imageStage.append(modelImage);
  const colorPicker = createElement('div', CONFIG.classes.colorPicker);
  const colorName = createElement('div', CONFIG.classes.colorName);
  colorName.hidden = true;
  const swatches = createElement('div', CONFIG.classes.swatches);
  colorPicker.append(colorName, swatches);

  const specs = createElement('div', CONFIG.classes.specs);
  const specItems = (variant.specifications || []).map((spec) => {
    const item = createElement('div', CONFIG.classes.spec);
    if (spec.specImage) {
      item.append(createImage(spec.specImage, spec.specTitle, CONFIG.classes.specIcon));
    }
    const copy = createElement('div', CONFIG.classes.specCopy);
    copy.append(
      createElement('div', CONFIG.classes.specTitle, spec.specTitle),
      createElement('div', CONFIG.classes.specValue, spec.specSubtitle),
    );
    item.append(copy);
    return item;
  });
  specs.append(...specItems);
  const viewSpecs = createElement(
    'a',
    CONFIG.classes.viewSpecs,
    variant.viewSpecificationsLabel || 'View all Specifications',
  );
  viewSpecs.href = asUrl(variant.viewSpecificationsLink);
  viewSpecs.append(createElement('span', 'vida-pdp-specs__view-chevron', '›'));

  root.append(pricePanel, imageStage, colorPicker, specs, viewSpecs);

  async function loadPrice() {
    const template = variant.priceApiUrlTemplate || CONFIG.selectors.priceApiDefault;
    const url = template.replaceAll('{city}', encodeURIComponent(state.city));
    priceValue.textContent = 'Loading…';
    try {
      state.priceData = await fetchJson(url);
      const data = state.priceData;
      const effective = firstUsableValue(data, CONFIG.apiKeys.price);
      priceValue.textContent = effective
        ? `${formatCurrency(effective)}/-`
        : CONFIG.labels.priceFallback;
      const values = {
        exShowroom: firstUsableValue(data, CONFIG.apiKeys.exShowroom),
        pmEDrive: firstUsableValue(data, CONFIG.apiKeys.pmEDrive),
        stateSubsidy: firstUsableValue(data, CONFIG.apiKeys.stateSubsidy),
        discount: firstUsableValue(data, CONFIG.apiKeys.discount),
        effective,
      };
      breakdown.querySelectorAll('[data-price-key]').forEach((row) => {
        const value = values[row.dataset.priceKey];
        row.lastElementChild.textContent = value === null || value === undefined
          ? '—'
          : formatCurrency(value);
        row.hidden = value === null || value === undefined;
      });
    } catch (error) {
      priceValue.textContent = CONFIG.labels.priceFallback;
    }
  }

  const updateCity = (city) => {
    state.city = city;
    cityTrigger.childNodes[0].textContent = city;
    [...cityList.children].forEach((option) => option.classList.toggle(
      CONFIG.classes.active,
      option.dataset.city === city,
    ));
    cityPopover.hidden = true;
    cityTrigger.setAttribute('aria-expanded', 'false');
    loadPrice();
  };

  const renderCities = (query = '') => {
    const normalizedQuery = query.toLowerCase();
    const filtered = state.cities
      .filter((city) => city.cityName.toLowerCase().includes(normalizedQuery))
      .slice(0, CONFIG.selectors.maxCities);
    cityList.replaceChildren();
    filtered.forEach((city) => {
      const option = createElement('button', CONFIG.classes.cityOption, city.cityName);
      option.type = 'button';
      option.dataset.city = city.cityName;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(city.cityName === state.city));
      option.classList.toggle(CONFIG.classes.active, city.cityName === state.city);
      option.addEventListener('click', () => updateCity(city.cityName));
      cityList.append(option);
    });
    if (!filtered.length) cityList.append(createElement('p', 'vida-pdp-specs__city-empty', 'No cities found'));
  };

  const loadCities = async () => {
    const url = variant.cityApiUrl || CONFIG.selectors.cityApiDefault;
    try {
      const response = await fetchJson(url);
      state.cities = (Array.isArray(response) ? response : response.data || [])
        .filter((city) => city?.cityName)
        .sort((a, b) => a.cityName.localeCompare(b.cityName));
      cityList.replaceChildren();
      const defaultCity = state.cities.find(
        (city) => city.cityName.toLowerCase() === state.city.toLowerCase(),
      );
      if (!defaultCity && state.cities.length) state.city = 'Delhi';
      cityTrigger.childNodes[0].textContent = state.city;
    } catch (error) {
      cityList.replaceChildren(createElement('p', 'vida-pdp-specs__city-empty', 'Unable to load cities'));
    }
    loadPrice();
  };

  const renderColors = () => {
    swatches.replaceChildren();
    const colors = variant.colors || [];
    if (!colors.length) {
      modelImage.hidden = true;
      colorPicker.hidden = true;
      return;
    }
    modelImage.hidden = false;
    colorPicker.hidden = false;
    const selected = colors[state.colorIndex] || colors[0];
    const responsiveImage = () => {
      const mobile = window.matchMedia(`(max-width: ${CONFIG.selectors.mobileBreakpoint}px)`).matches;
      const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1024px)').matches;
      return (mobile && selected.mobileImage) || (tablet && selected.tabletImage)
      || selected.desktopImage || selected.tabletImage || selected.mobileImage;
    };
    const imageSrc = responsiveImage();
    if (imageSrc) modelImage.src = imageSrc;
    modelImage.alt = `${variant.modelName} ${selected.colorName}`.trim();
    colorName.textContent = selected.colorName || '';
    colorName.hidden = !selected.colorName;
    colors.forEach((color, colorIndex) => {
      const swatch = createElement('button', CONFIG.classes.swatch);
      swatch.type = 'button';
      swatch.style.setProperty('--swatch-color', color.colorHex || '#1e6b9a');
      swatch.setAttribute('aria-label', color.colorName || `Color ${colorIndex + 1}`);
      swatch.setAttribute('aria-pressed', String(colorIndex === state.colorIndex));
      swatch.classList.toggle(CONFIG.classes.active, colorIndex === state.colorIndex);
      swatch.addEventListener('mouseenter', () => {
        colorName.textContent = color.colorName || '';
        colorName.hidden = !color.colorName;
      });
      swatch.addEventListener('focus', () => {
        colorName.textContent = color.colorName || '';
        colorName.hidden = !color.colorName;
      });
      swatch.addEventListener('click', () => {
        state.colorIndex = colorIndex;
        renderColors();
      });
      swatches.append(swatch);
    });
  };

  cityTrigger.addEventListener('click', () => {
    const isOpen = !cityPopover.hidden;
    cityPopover.hidden = isOpen;
    cityTrigger.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) citySearch.focus();
  });
  citySearch.addEventListener('input', () => {
    const query = citySearch.value.trim();
    renderCities(query.length >= 2 ? query : '');
    if (query.length < 2) cityList.replaceChildren();
  });
  tooltipTrigger.addEventListener('click', () => {
    tooltip.hidden = !tooltip.hidden;
    tooltipTrigger.setAttribute('aria-expanded', String(!tooltip.hidden));
  });
  closeTooltip.addEventListener('click', () => {
    tooltip.hidden = true;
    tooltipTrigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', (event) => {
    if (!cityWrap.contains(event.target) && !cityPopover.contains(event.target)) {
      cityPopover.hidden = true;
      cityTrigger.setAttribute('aria-expanded', 'false');
    }
    if (!priceCard.contains(event.target)) {
      tooltip.hidden = true;
      tooltipTrigger.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', renderColors, { passive: true });
  renderColors();
  loadCities();
  return { root, variant };
}

export default function decorate(block) {
  block.classList.add(CONFIG.classes.block);
  const authoringData = readAuthoringData(block);
  const { variants } = authoringData;
  block.replaceChildren();

  const heading = createElement('h1', CONFIG.classes.heading, authoringData.mainTitle);
  if (authoringData.mainTitle) block.append(heading);
  if (!variants.length) {
    block.append(createElement(
      'p',
      'vida-pdp-specs__authoring-help',
      'No model variants were detected. In the Universal Editor, add a Model variant, then add colors and specifications inside it.',
    ));
    return;
  }

  const tabs = createElement('div', CONFIG.classes.tabs);
  tabs.setAttribute('role', 'tablist');
  const variantUIs = variants.map((variant, index) => createVariantUI(variant, index));
  variantUIs.forEach(({ variant, root }, index) => {
    const tab = createElement('button', CONFIG.classes.tab);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.textContent = variant.modelName;
    if (variant.modelTag) tab.append(createElement('span', CONFIG.classes.tag, variant.modelTag));
    tab.addEventListener('click', () => {
      variantUIs.forEach((item, itemIndex) => {
        item.root.hidden = itemIndex !== index;
        const currentTab = tabs.children[itemIndex];
        currentTab.classList.toggle(CONFIG.classes.active, itemIndex === index);
        currentTab.setAttribute('aria-selected', String(itemIndex === index));
      });
    });
    tabs.append(tab);
    root.hidden = index !== 0;
    root.classList.toggle(CONFIG.classes.active, index === 0);
    block.append(root);
  });
  block.insertBefore(tabs, block.children[heading ? 1 : 0]);
  tabs.children[0]?.classList.add(CONFIG.classes.active);
}
