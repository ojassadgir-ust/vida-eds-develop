/**
 * vida-pdp-specs block
 * Debug version: parses the authored tree and renders it as JSON
 * so you can verify every field value before building the UI.
 */

const DEBUG = true;

const getEl = (root, prop) => root.querySelector(`[data-aue-prop="${prop}"]`);

const text = (root, prop) => {
  const el = getEl(root, prop);
  return el ? el.textContent.trim() : '';
};

const html = (root, prop) => {
  const el = getEl(root, prop);
  return el ? el.innerHTML.trim() : '';
};

const href = (root, prop) => {
  const a = root.querySelector(`[data-aue-prop="${prop}"] a, a[data-aue-prop="${prop}"]`);
  return a ? a.getAttribute('href') : '';
};

const src = (root, prop) => {
  const img = root.querySelector(`[data-aue-prop="${prop}"] img, img[data-aue-prop="${prop}"]`);
  return img ? img.getAttribute('src') : '';
};

const items = (root, model, parser) => Array.from(
  root.querySelectorAll(`[data-aue-model="${model}"]`),
).map(parser);

const parseColor = (el) => ({
  image: src(el, 'colorImage'),
  colorName: text(el, 'colorName'),
  colorCode: text(el, 'colorCode'),
});

const parseSpec = (el) => ({
  image: src(el, 'specImage'),
  title: text(el, 'specTitle'),
  value: text(el, 'specValue'),
});

const parseVariant = (el) => ({
  title: text(el, 'title'),
  tag: text(el, 'tag'),
  skuId: text(el, 'skuId'),
  price: {
    heading: text(el, 'priceHeading'),
    subheading: text(el, 'priceSubheading'),
    linkName: text(el, 'priceLinkName'),
    linkUrl: href(el, 'priceLinkUrl') || text(el, 'priceLinkUrl'),
    breakdown: {
      exShowroomTitle: text(el, 'exShowroomTitle'),
      pmEDriveSubsidyTitle: text(el, 'pmEDriveSubsidyTitle'),
      stateSubsidyTitle: text(el, 'stateSubsidyTitle'),
      currentDiscountTitle: text(el, 'currentDiscountTitle'),
      effectivePriceTitle: text(el, 'effectivePriceTitle'),
    },
    note: html(el, 'priceNote'),
  },
  colors: items(el, 'vida-pdp-color', parseColor),
  specifications: items(el, 'vida-pdp-spec', parseSpec),
  allSpecifications: {
    linkTitle: text(el, 'specAllLinkTitle'),
    linkName: text(el, 'specAllLinkName'),
  },
});

const renderDebug = (block, data) => {
  block.querySelector('.vida-pdp-specs-debug')?.remove();

  const pre = document.createElement('pre');
  pre.className = 'vida-pdp-specs-debug';
  pre.style.cssText = 'white-space:pre-wrap;font-size:12px;background:#f4f4f4;padding:12px;';
  pre.textContent = JSON.stringify(data, null, 2);
  block.append(pre);
};

export default function decorate(block) {
  const variantEls = Array.from(block.children);

  const data = {
    pageTitle: text(block, 'pageTitle'),
    variantCount: variantEls.length,
    variants: variantEls.map(parseVariant),
  };

  block.dataset.variantCount = String(variantEls.length);

  if (DEBUG) {
    renderDebug(block, data);
  }

  return data;
}
