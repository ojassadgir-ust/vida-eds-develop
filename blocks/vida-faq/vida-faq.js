import { moveInstrumentation } from '../../scripts/scripts.js';

const CONFIG = {
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
    toggleExpanded: 'vida-faq-toggle-expanded',
  },
  visibleCount: 6,
  labels: {
    viewMore: 'View more',
    viewLess: 'View less',
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

function getCellText(cell) {
  return cell?.textContent?.replace(/\u00a0/gu, ' ').trim() || '';
}

function getItemCells(row) {
  const cells = [...row.children];

  if (cells.length > 1) {
    return cells;
  }

  const nestedRow = [...row.querySelectorAll('div')].find((element) => (
    element.children.length > 1
    && [...element.children].every((child) => child.tagName === 'DIV')
  ));

  return nestedRow ? [...nestedRow.children] : cells;
}

function createArrow(className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  path.setAttribute('d', 'M24 12L16 20L8 12');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  svg.append(path);

  return svg;
}

function createItem(row, id) {
  const [questionCell, answerCell] = getItemCells(row);
  const question = getCellText(questionCell);
  const answerHTML = answerCell?.innerHTML.trim() || '';

  if (!question) {
    return null;
  }

  const item = createElement('li', CONFIG.classes.item);
  const trigger = createElement('button', CONFIG.classes.trigger);
  const title = createElement('span', CONFIG.classes.question);
  const panel = createElement('div', CONFIG.classes.panel);
  const answer = createElement('div', CONFIG.classes.answer);

  moveInstrumentation(row, item);

  title.textContent = question;

  trigger.type = 'button';
  trigger.id = `${id}-trigger`;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `${id}-panel`);
  trigger.append(title, createArrow(CONFIG.classes.arrow));

  panel.id = `${id}-panel`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', trigger.id);
  panel.hidden = true;

  answer.innerHTML = answerHTML;
  panel.append(answer);

  trigger.addEventListener('click', () => {
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    trigger.setAttribute('aria-expanded', String(!isExpanded));
    panel.hidden = isExpanded;
  });

  item.append(trigger, panel);

  return item;
}

function createToggle(items, list) {
  const toggle = createElement('button', CONFIG.classes.toggle);
  const label = createElement('span', CONFIG.classes.toggleLabel);

  label.textContent = CONFIG.labels.viewMore;

  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  toggle.append(label, createArrow(CONFIG.classes.arrow));

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    items.slice(CONFIG.visibleCount).forEach((item) => {
      item.hidden = isExpanded;
    });

    toggle.setAttribute('aria-expanded', String(!isExpanded));
    toggle.classList.toggle(CONFIG.classes.toggleExpanded, !isExpanded);
    label.textContent = isExpanded
      ? CONFIG.labels.viewMore
      : CONFIG.labels.viewLess;
  });

  return toggle;
}

export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  const headingRow = firstRow?.children.length === 1
    && getItemCells(firstRow).length === 1
    ? firstRow
    : null;
  const itemRows = rows.filter((row) => row !== headingRow);

  blockCount += 1;

  const blockId = `vida-faq-${blockCount}`;
  const headingText = getCellText(headingRow);

  const items = itemRows
    .map((row, index) => createItem(row, `${blockId}-${index}`))
    .filter(Boolean);

  block.replaceChildren();

  if (headingText) {
    const header = createElement('div', CONFIG.classes.header);
    const heading = createElement('h2', CONFIG.classes.heading);

    moveInstrumentation(headingRow, heading);
    heading.textContent = headingText;
    header.append(heading);
    block.append(header);
  }

  if (!items.length) {
    return;
  }

  const list = createElement('ul', CONFIG.classes.list);

  list.id = `${blockId}-list`;
  items.forEach((item, index) => {
    item.hidden = index >= CONFIG.visibleCount;
  });
  list.append(...items);
  block.append(list);

  if (items.length > CONFIG.visibleCount) {
    block.append(createToggle(items, list));
  }
}
