import CONFIG, { getAPIEndpoint } from '../../scripts/config.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const CONFIG_FAQ = {
  classes: {
    header: 'vida-faq-header',
    heading: 'vida-faq-heading',
    list: 'vida-faq-list',
    item: 'vida-faq-item',
    trigger: 'vida-faq-trigger',
    question: 'vida-faq-question',
    arrow: 'vida-faq-arrow',
    panel: 'vida-faq-panel',
    answer: 'vida-faq-answer',
    toggle: 'vida-faq-toggle',
    toggleLabel: 'vida-faq-toggle-label',
  },
  visibleCount: 6,
  defaultHeading: 'Frequently Asked Questions',
  labels: {
    viewMore: 'View more',
    viewLess: 'View less',
  },
  /* chevron-down (collapsed) / chevron-up (expanded) */
  icons: {
    down: 'M24 12L16 20L8 12',
    up: 'M8 20L16 12L24 20',
  },
};

let blockCount = 0;

function createElement(tagName, className) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

/**
 * AEM returns text with HTML entities (&nbsp;, &amp; ...).
 * Decode them so they can be safely set with textContent.
 */
function decodeText(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');

  return doc.body.textContent.replace(/\s+/gu, ' ').trim();
}

/**
 * Convert AEM item0, item1, item2... objects into an array.
 */
function getIndexedItems(object) {
  if (!object || typeof object !== 'object') {
    return [];
  }

  return Object.keys(object)
    .filter((key) => /^item\d+$/u.test(key))
    .sort((a, b) => Number(a.replace('item', '')) - Number(b.replace('item', '')))
    .map((key) => object[key])
    .filter(Boolean);
}

/**
 * Find the FAQ component node anywhere inside the page JSON.
 * The node is the one that owns a `questions` object.
 */
function findFaqNode(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (node.questions && typeof node.questions === 'object') {
    return node;
  }

  const children = Object.values(node).filter((value) => value && typeof value === 'object');

  for (let i = 0; i < children.length; i += 1) {
    const found = findFaqNode(children[i]);

    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Turn an AEM relative url (/content/...) into a usable url.
 */
function normalizeUrl(url) {
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${CONFIG.BASE_URLS[CONFIG.ENV]}${url}`;
  }

  return url;
}

/**
 * Answers are authored rich text (<br>, <b>, <a>...).
 * The markup is kept, but anything executable is removed.
 */
function sanitizeAnswer(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');

  doc.querySelectorAll('script, style, iframe, object, embed, link, meta, form')
    .forEach((element) => element.remove());

  doc.body.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isScriptUrl = /^\s*javascript:/iu.test(attribute.value);

      if (name.startsWith('on') || (['href', 'src'].includes(name) && isScriptUrl)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  doc.body.querySelectorAll('a[href]').forEach((link) => {
    link.setAttribute('href', normalizeUrl(link.getAttribute('href')));
  });

  return doc.body.innerHTML.trim();
}

/**
 * Fetch the AEM page JSON and map it to { heading, showMoreText, items }.
 * Only ONE API request is made.
 */
async function getFaqData(endpoint) {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`VIDA FAQ API error: ${response.status}`);
  }

  const apiData = await response.json();
  const faqNode = findFaqNode(apiData);

  if (!faqNode) {
    return { heading: '', showMoreText: '', items: [] };
  }

  const items = getIndexedItems(faqNode.questions)
    .map((item) => ({
      question: decodeText(item.question),
      answer: sanitizeAnswer(item.answer),
    }))
    .filter((item) => item.question);

  return {
    heading: decodeText(faqNode.heading),
    showMoreText: decodeText(faqNode.showMoreText),
    items,
  };
}

function createArrow(className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const path = document.createElementNS(SVG_NS, 'path');

  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  path.setAttribute('d', CONFIG_FAQ.icons.down);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  svg.append(path);

  return svg;
}

function setArrowState(arrow, isExpanded) {
  arrow
    .querySelector('path')
    .setAttribute('d', isExpanded ? CONFIG_FAQ.icons.up : CONFIG_FAQ.icons.down);
}

function createItem({ question, answer }, id) {
  const item = createElement('li', CONFIG_FAQ.classes.item);
  const trigger = createElement('button', CONFIG_FAQ.classes.trigger);
  const title = createElement('span', CONFIG_FAQ.classes.question);
  const arrow = createArrow(CONFIG_FAQ.classes.arrow);
  const panel = createElement('div', CONFIG_FAQ.classes.panel);
  const answerElement = createElement('div', CONFIG_FAQ.classes.answer);

  title.textContent = question;

  trigger.type = 'button';
  trigger.id = `${id}-trigger`;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `${id}-panel`);
  trigger.append(title, arrow);

  panel.id = `${id}-panel`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', trigger.id);
  panel.hidden = true;

  answerElement.innerHTML = answer;
  panel.append(answerElement);

  trigger.addEventListener('click', () => {
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    trigger.setAttribute('aria-expanded', String(!isExpanded));
    panel.hidden = isExpanded;
    setArrowState(arrow, !isExpanded);
  });

  item.append(trigger, panel);

  return item;
}

function createToggle(items, list, viewMoreText) {
  const toggle = createElement('button', CONFIG_FAQ.classes.toggle);
  const label = createElement('span', CONFIG_FAQ.classes.toggleLabel);
  const arrow = createArrow(CONFIG_FAQ.classes.arrow);

  label.textContent = viewMoreText;

  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  toggle.append(label, arrow);

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    items.slice(CONFIG_FAQ.visibleCount).forEach((item) => {
      item.hidden = isExpanded;
    });

    toggle.setAttribute('aria-expanded', String(!isExpanded));
    setArrowState(arrow, !isExpanded);
    label.textContent = isExpanded ? viewMoreText : CONFIG_FAQ.labels.viewLess;
  });

  return toggle;
}

/**
 * loads and decorates the block
 *
 * The only authored value is the AEM FAQ API endpoint (first row).
 * Heading, questions, answers and the "view more" label come from the API.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const endpointRow = block.firstElementChild;
  const rawPath = endpointRow?.textContent?.trim();

  endpointRow?.remove();

  const endpoint = getAPIEndpoint(rawPath, 'faqApi');

  if (!endpoint) {
    return;
  }

  let data;

  try {
    data = await getFaqData(endpoint);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return;
  }

  if (!data.items.length) {
    return;
  }

  blockCount += 1;

  const blockId = `vida-faq-${blockCount}`;
  const header = createElement('div', CONFIG_FAQ.classes.header);
  const heading = createElement('h2', CONFIG_FAQ.classes.heading);
  const list = createElement('ul', CONFIG_FAQ.classes.list);
  const items = data.items.map((item, index) => createItem(item, `${blockId}-${index}`));

  heading.textContent = data.heading || CONFIG_FAQ.defaultHeading;
  header.append(heading);

  list.id = `${blockId}-list`;
  items.forEach((item, index) => {
    item.hidden = index >= CONFIG_FAQ.visibleCount;
  });
  list.append(...items);

  block.replaceChildren(header, list);

  if (items.length > CONFIG_FAQ.visibleCount) {
    block.append(createToggle(items, list, data.showMoreText || CONFIG_FAQ.labels.viewMore));
  }
}
