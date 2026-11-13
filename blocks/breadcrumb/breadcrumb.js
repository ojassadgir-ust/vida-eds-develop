import { moveInstrumentation } from '../../scripts/scripts.js';

function getInstrumentedField(row) {
  if (row?.matches('[data-aue-prop], [data-richtext-prop]')) return row;
  return row?.querySelector('[data-aue-prop], [data-richtext-prop]');
}

function moveFieldInstrumentation(row, target) {
  const field = getInstrumentedField(row);
  if (field) moveInstrumentation(field, target);
}

function buildLinkItem(textRow, urlRow, position) {
  const text = textRow?.textContent.trim();
  if (!text && !getInstrumentedField(textRow)) return null;

  const li = document.createElement('li');
  li.className = 'breadcrumb-item';

  const link = urlRow?.querySelector('a');
  const anchor = document.createElement('a');
  anchor.className = 'breadcrumb-item-link';
  anchor.href = link?.href || '#';
  anchor.textContent = text;

  moveFieldInstrumentation(textRow, anchor);
  if (urlRow) moveFieldInstrumentation(urlRow, li);

  li.append(anchor);

  const meta = document.createElement('meta');
  meta.setAttribute('content', String(position));
  li.append(meta);

  return li;
}

function buildActiveItem(textRow, position) {
  const text = textRow?.textContent.trim();
  if (!text && !getInstrumentedField(textRow)) return null;

  const li = document.createElement('li');
  li.className = 'breadcrumb-item breadcrumb-item--active';
  li.setAttribute('aria-current', 'page');

  const span = document.createElement('span');
  span.className = 'breadcrumb-item-text';
  span.textContent = text;
  moveFieldInstrumentation(textRow, span);

  li.append(span);

  const meta = document.createElement('meta');
  meta.setAttribute('content', String(position));
  li.append(meta);

  return li;
}

export default function decorate(block) {
  const [text1Row, url1Row, text2Row] = [...block.children];

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  const firstItem = buildLinkItem(text1Row, url1Row, 1);
  const secondItem = buildActiveItem(text2Row, 2);

  [firstItem, secondItem].filter(Boolean).forEach((item) => ol.append(item));

  nav.append(ol);
  block.replaceChildren(nav);
}
