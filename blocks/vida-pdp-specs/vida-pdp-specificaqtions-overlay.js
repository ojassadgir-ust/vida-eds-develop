/* eslint-disable no-console */
import { API_OPTIONS, getVx2ContentUrl } from '../../scripts/config.js';

const CONFIG = {
  selectors: {
    block: '.vida-pdp-specs',
    trigger: '.vida-pdp-specs__all-specs',
  },
  classes: {
    overlay: 'vida-specs-overlay',
    dialog: 'vida-specs-overlay__dialog',
    heading: 'vida-specs-overlay__heading',
    close: 'vida-specs-overlay__close',
    tableWrap: 'vida-specs-overlay__table-wrap',
    table: 'vida-specs-overlay__table',
    rowLabel: 'vida-specs-overlay__row-label',
    featureRow: 'vida-specs-overlay__feature-row',
    modelHeader: 'vida-specs-overlay__model-header',
    modelSelect: 'vida-specs-overlay__model-select',
    value: 'vida-specs-overlay__value',
    colors: 'vida-specs-overlay__colors',
    color: 'vida-specs-overlay__color',
    footer: 'vida-specs-overlay__footer',
    download: 'vida-specs-overlay__download',
    compare: 'vida-specs-overlay__compare',
    terms: 'vida-specs-overlay__terms',
    error: 'vida-specs-overlay__error',
    open: 'is-open',
  },
  labels: {
    heading: 'Specifications',
    download: 'Download full specifications',
    compare: 'Compare models',
    terms: 'T&C Applied*',
    loading: 'Loading specifications…',
    error: 'Specifications could not be loaded. Please try again.',
    close: 'Close specifications',
    selectModel: 'Select model',
  },
  desktopColumns: 3,
  mobileColumns: 2,
  breakpoints: {
    mobile: '(max-width: 767px)',
  },
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return normalizeText(value.text ?? value.value ?? value.label ?? value.title ?? '');
  }
  return String(value).trim();
};

const orderedItems = (node) => {
  if (Array.isArray(node)) return node;
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node)
    .filter((key) => /^item\d+$/.test(key))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
    .map((key) => node[key]);
};

const findNode = (node, name) => {
  if (!node || typeof node !== 'object') return null;
  if (node[name] && typeof node[name] === 'object') return node[name];
  return Object.values(node).reduce((found, child) => found || findNode(child, name), null);
};

const makeElement = (tag, className, textContent) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
};

const makeButton = (className, label, textContent = '') => {
  const button = makeElement('button', className, textContent);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  return button;
};

const extractContent = (payload) => {
  const priceAndSpec = payload?.priceandspec || findNode(payload, 'priceandspec') || {};
  const labels = orderedItems(priceAndSpec.specificationLabels)
    .map((item) => ({
      id: normalizeText(item?.id),
      label: normalizeText(item?.label),
    }))
    .filter((item) => item.id && item.label);

  const models = orderedItems(priceAndSpec.specifications)
    .map((item, index) => {
      const dataNode = item?.data;
      const nestedData = orderedItems(dataNode).find((entry) => entry && typeof entry === 'object');
      const values = nestedData || dataNode || {};
      return {
        id: normalizeText(item?.id) || `model-${index + 1}`,
        title: normalizeText(item?.badgeImage || item?.title || item?.name) || `Model ${index + 1}`,
        values,
      };
    })
    .filter((model) => Object.keys(model.values).length);

  if (!labels.length || !models.length) {
    throw new Error('The API response did not contain specificationLabels and specifications.');
  }

  return { labels, models };
};

const getSelectedModelIndexes = (models, isMobile) => {
  const count = Math.min(isMobile ? CONFIG.mobileColumns : CONFIG.desktopColumns, models.length);
  return Array.from({ length: count }, (_, index) => index);
};

const isColorRow = (id, value) => (
  normalizeText(id).toLowerCase() === 'colors'
  && value
  && typeof value === 'object'
);

const renderColorSwatches = (value, classes) => {
  const wrapper = makeElement('span', classes.colors);
  orderedItems(value).forEach((entry) => {
    const colorCode = normalizeText(entry?.color);
    if (!/^#[\da-f]{3,8}$/i.test(colorCode)) return;
    const swatch = makeElement('span', classes.color);
    swatch.style.setProperty('--spec-swatch-color', colorCode);
    swatch.setAttribute('aria-label', colorCode);
    swatch.setAttribute('title', colorCode);
    wrapper.append(swatch);
  });
  return wrapper;
};

const getModelValue = (model, id) => {
  const value = model?.values?.[id];
  if (isColorRow(id, value)) return value;
  return normalizeText(value) || '—';
};

const buildTable = (content, isMobile, classes) => {
  const selectedIndexes = getSelectedModelIndexes(content.models, isMobile);
  const table = makeElement('table', classes.table);
  table.setAttribute('aria-label', CONFIG.labels.heading);

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  if (!isMobile) headerRow.append(document.createElement('th'));

  const selects = [];
  selectedIndexes.forEach((modelIndex, columnIndex) => {
    const th = makeElement('th', classes.modelHeader);
    const currentModel = content.models[modelIndex];
    const shouldOfferSelect = content.models.length > selectedIndexes.length
      && (isMobile
        ? columnIndex === 1
        : columnIndex >= selectedIndexes.length - 2);
    if (shouldOfferSelect) {
      const select = makeElement('select', classes.modelSelect);
      select.setAttribute('aria-label', `${CONFIG.labels.selectModel} ${columnIndex + 1}`);
      content.models.forEach((model, optionIndex) => {
        const option = makeElement('option', '', model.title);
        option.value = String(optionIndex);
        option.selected = optionIndex === modelIndex;
        select.append(option);
      });
      selects.push({ select, columnIndex });
      th.append(select);
    } else {
      th.textContent = currentModel.title;
    }
    headerRow.append(th);
  });
  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  const renderBody = () => {
    tbody.replaceChildren();
    content.labels.forEach(({ id, label }) => {
      if (isMobile) {
        const featureRow = makeElement('tr', classes.featureRow);
        const featureName = makeElement('th', classes.rowLabel, label);
        featureName.colSpan = selectedIndexes.length;
        featureRow.append(featureName);
        tbody.append(featureRow);
      }

      const row = document.createElement('tr');
      if (!isMobile) row.append(makeElement('th', classes.rowLabel, label));
      selectedIndexes.forEach((modelIndex) => {
        const cell = makeElement('td', classes.value);
        const model = content.models[modelIndex];
        const value = getModelValue(model, id);
        if (isColorRow(id, model.values[id])) {
          cell.append(renderColorSwatches(value, classes));
        } else {
          cell.textContent = value;
        }
        row.append(cell);
      });
      tbody.append(row);
    });
  };
  renderBody();
  table.append(tbody);

  selects.forEach(({ select, columnIndex }) => {
    select.addEventListener('change', () => {
      selectedIndexes[columnIndex] = Number(select.value);
      renderBody();
    });
  });

  return table;
};

const resolveActionUrl = (trigger, block, dataAttribute) => (
  trigger.getAttribute(dataAttribute)
  || block?.getAttribute(dataAttribute)
  || ''
);

const fetchSpecifications = async (apiPath) => {
  const apiUrl = getVx2ContentUrl(apiPath);
  if (!apiUrl) throw new Error('VX2 content API URL is unavailable for this environment.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_OPTIONS.timeoutMs);
  try {
    const response = await fetch(apiUrl, {
      credentials: API_OPTIONS.credentials,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return extractContent(await response.json());
  } finally {
    window.clearTimeout(timeout);
  }
};

const ensureOverlayStyles = () => {
  if (document.getElementById('vida-specs-overlay-styles')) return;
  const stylesheet = document.createElement('link');
  stylesheet.id = 'vida-specs-overlay-styles';
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./vida-pdp-specificaqtions-overlay.css', import.meta.url).href;
  document.head.append(stylesheet);
};

const attachOverlay = (trigger, apiPath) => {
  if (trigger.dataset.vidaSpecsOverlayBound === 'true') return;
  trigger.dataset.vidaSpecsOverlayBound = 'true';
  ensureOverlayStyles();

  const block = trigger.closest(CONFIG.selectors.block);
  let overlayController = null;
  let contentPromise = null;

  trigger.addEventListener('click', async (event) => {
    event.preventDefault();
    trigger.setAttribute('aria-busy', 'true');

    if (!overlayController) {
      const overlay = makeElement('div', CONFIG.classes.overlay);
      overlay.hidden = true;
      const dialog = makeElement('section', CONFIG.classes.dialog);
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'vida-specs-overlay-title');
      const header = makeElement('div', 'vida-specs-overlay__header');
      const heading = makeElement('h2', CONFIG.classes.heading, CONFIG.labels.heading);
      heading.id = 'vida-specs-overlay-title';
      const close = makeButton(CONFIG.classes.close, CONFIG.labels.close, '×');
      const body = makeElement('div', CONFIG.classes.tableWrap);
      const host = makeElement('div', 'vida-specs-overlay__table-host');
      const footer = makeElement('div', CONFIG.classes.footer);
      const downloadUrl = resolveActionUrl(trigger, block, 'data-specifications-pdf-url');
      const compareUrl = resolveActionUrl(trigger, block, 'data-compare-models-url');
      const download = makeElement('a', CONFIG.classes.download, CONFIG.labels.download);
      download.href = downloadUrl || '#';
      if (downloadUrl) {
        download.target = '_blank';
        download.rel = 'noopener noreferrer';
        download.setAttribute('download', '');
      } else {
        download.addEventListener('click', (clickEvent) => {
          clickEvent.preventDefault();
          console.warn('[VIDA][specifications] Configure data-specifications-pdf-url on the trigger or block.');
        });
      }
      const downloadIcon = makeElement('span', 'vida-specs-overlay__download-icon');
      const downloadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      downloadSvg.setAttribute('width', '14');
      downloadSvg.setAttribute('height', '14');
      downloadSvg.setAttribute('viewBox', '0 0 14 14');
      downloadSvg.setAttribute('fill', 'none');
      downloadSvg.setAttribute('aria-hidden', 'true');
      const downloadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      downloadPath.setAttribute('d', [
        'M6.66667 10L2.5 5.83333L3.66667 4.625L5.83333 6.79167V0H7.5V6.79167L',
        '9.66667 4.625L10.8333 5.83333L6.66667 10ZM1.66667 13.3333C1.20833 13.3333',
        ' 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667',
        'V9.16667H1.66667V11.6667H11.6667V9.16667H13.3333V11.6667C13.3333 12.125',
        ' 13.1701 12.5174 12.8438 12.8438C12.5174 13.1701 12.125 13.3333 11.6667',
        ' 13.3333H1.66667Z',
      ].join(''));
      downloadPath.setAttribute('fill', '#1C1B1F');
      downloadSvg.append(downloadPath);
      downloadIcon.append(downloadSvg);
      download.append(downloadIcon);
      const compare = makeElement('a', CONFIG.classes.compare, CONFIG.labels.compare);
      compare.href = compareUrl || '#';
      if (!compareUrl) {
        compare.addEventListener('click', (clickEvent) => {
          clickEvent.preventDefault();
          console.warn('[VIDA][specifications] Configure data-compare-models-url on the trigger or block.');
        });
      }
      footer.append(download, compare, makeElement('span', CONFIG.classes.terms, CONFIG.labels.terms));
      header.append(heading, close);
      body.append(host);
      dialog.append(header, body, footer);
      overlay.append(dialog);
      document.body.append(overlay);

      const closeOverlay = () => {
        overlay.hidden = true;
        overlay.classList.remove(CONFIG.classes.open);
        document.body.classList.remove('vida-specs-overlay-open');
        trigger.focus();
      };
      close.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', (clickEvent) => {
        if (clickEvent.target === overlay) closeOverlay();
      });
      document.addEventListener('keydown', (keyEvent) => {
        if (keyEvent.key === 'Escape' && !overlay.hidden) closeOverlay();
      });

      overlayController = {
        open: () => {
          overlay.hidden = false;
          overlay.classList.add(CONFIG.classes.open);
          document.body.classList.add('vida-specs-overlay-open');
          close.focus();
        },
        render: (content) => {
          const isMobile = window.matchMedia(CONFIG.breakpoints.mobile).matches;
          host.replaceChildren(buildTable(content, isMobile, CONFIG.classes));
        },
      };
    }

    try {
      if (!contentPromise) contentPromise = fetchSpecifications(apiPath);
      overlayController.open();
      const loading = makeElement('p', CONFIG.classes.error, CONFIG.labels.loading);
      const host = document.querySelector(`.${CONFIG.classes.overlay} .vida-specs-overlay__table-host`);
      if (host) host.replaceChildren(loading);
      const content = await contentPromise;
      overlayController.render(content);
    } catch (error) {
      contentPromise = null;
      const host = document.querySelector(`.${CONFIG.classes.overlay} .vida-specs-overlay__table-host`);
      if (host) {
        host.replaceChildren(makeElement('p', CONFIG.classes.error, CONFIG.labels.error));
      }
      console.error('[VIDA][specifications] Failed to load specifications API:', error);
    } finally {
      trigger.removeAttribute('aria-busy');
    }
  });
};

const initialise = () => {
  document.querySelectorAll(CONFIG.selectors.trigger).forEach(attachOverlay);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialise, { once: true });
} else {
  initialise();
}

export default attachOverlay;
