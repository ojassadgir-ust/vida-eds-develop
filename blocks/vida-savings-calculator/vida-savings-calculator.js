const BLOCK = 'vida-savings-calculator';
const NBSP = ' ';

// Row order must match the field order of the model in _vida-savings-calculator.json
const FIELDS = [
  'heading', 'description',
  'sliderLabel', 'sliderMin', 'sliderMax', 'sliderDefault', 'sliderUnit',
  'sliderLeftLabel', 'sliderRightLabel', 'sliderColor',
  'petrolLabel', 'evLabel', 'savingsLabel', 'assumptionLabel', 'assumptionDetails',
  'daysPerYear', 'petrolMileage', 'petrolFuelCost', 'evRange', 'evCostPerUnit',
  'currencySymbol', 'currencyLocale',
];

const RICH_FIELDS = ['description', 'petrolLabel', 'evLabel', 'assumptionDetails'];

// Used when an author leaves a numeric field empty or enters something unusable
const DEFAULTS = {
  sliderMin: 0,
  sliderMax: 100,
  sliderDefault: 15,
  daysPerYear: 365,
  petrolMileage: 40,
  petrolFuelCost: 100,
  evRange: 35,
  evCostPerUnit: 10,
  currencyLocale: 'en-IN',
};

let instanceCount = 0;

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
};

const readConfig = (block) => {
  const config = {};

  Array.from(block.children).forEach((row, index) => {
    const key = FIELDS[index];
    const cell = row.firstElementChild;

    if (!key || !cell) {
      return;
    }

    config[key] = RICH_FIELDS.includes(key) ? cell : cell.textContent.trim();
  });

  return config;
};

const toNumber = (value, fallback) => {
  const number = parseFloat(String(value ?? '').replace(/,/g, ''));

  return Number.isFinite(number) ? number : fallback;
};

const resolveSettings = (config) => {
  const number = (key) => toNumber(config[key], DEFAULTS[key]);
  const positive = (key) => {
    const value = number(key);

    return value > 0 ? value : DEFAULTS[key];
  };
  const nonNegative = (key) => {
    const value = number(key);

    return value >= 0 ? value : DEFAULTS[key];
  };

  let min = number('sliderMin');
  let max = number('sliderMax');

  if (max <= min) {
    min = DEFAULTS.sliderMin;
    max = DEFAULTS.sliderMax;
  }

  const unit = config.sliderUnit || '';

  return {
    min,
    max,
    unit,
    initial: Math.min(Math.max(number('sliderDefault'), min), max),
    leftLabel: config.sliderLeftLabel || `${min}${unit && `${NBSP}${unit}`}`,
    rightLabel: config.sliderRightLabel || `${max}${unit && `${NBSP}${unit}`}`,
    daysPerYear: positive('daysPerYear'),
    petrolMileage: positive('petrolMileage'),
    petrolFuelCost: nonNegative('petrolFuelCost'),
    evRange: positive('evRange'),
    evCostPerUnit: nonNegative('evCostPerUnit'),
  };
};

const createCurrencyFormatter = (symbol, locale) => {
  const options = { maximumFractionDigits: 0 };
  let numberFormat;

  try {
    numberFormat = new Intl.NumberFormat(locale || DEFAULTS.currencyLocale, options);
  } catch (e) {
    numberFormat = new Intl.NumberFormat(DEFAULTS.currencyLocale, options);
  }

  return (amount) => {
    const digits = numberFormat
      .formatToParts(Math.abs(amount))
      .map(({ type, value }) => (type === 'group' ? NBSP : value))
      .join('');

    return `${amount < 0 ? '-' : ''}${symbol}${digits}`;
  };
};

const calculateCosts = (distance, settings) => {
  const yearlyDistance = distance * settings.daysPerYear;
  const petrol = Math.round(
    (yearlyDistance / settings.petrolMileage) * settings.petrolFuelCost,
  );
  const electric = Math.round(
    (yearlyDistance / settings.evRange) * settings.evCostPerUnit,
  );

  return { petrol, electric, savings: petrol - electric };
};

// Authored rich text is moved rather than re-parsed so its markup is kept as authored
const appendRichText = (parent, cell) => {
  if (!cell || !cell.textContent.trim()) {
    return false;
  }

  parent.append(...cell.childNodes);

  return true;
};

const createSlider = (config, settings, onChange) => {
  const id = `${BLOCK}-slider-${instanceCount}`;
  const wrapper = createElement('div', `${BLOCK}__slider`);
  const heading = createElement('div', `${BLOCK}__slider-heading`);
  const value = createElement('span', `${BLOCK}__slider-value`);
  const input = createElement('input', `${BLOCK}__slider-input`);

  if (config.sliderLabel) {
    const title = createElement('span', `${BLOCK}__slider-title`, config.sliderLabel);

    title.id = `${id}-title`;
    input.setAttribute('aria-labelledby', title.id);
    heading.append(title, ' ');
  } else {
    input.setAttribute('aria-label', settings.unit || 'Value');
  }

  // The input announces its own value, so the visual copy is hidden from assistive tech
  value.setAttribute('aria-hidden', 'true');
  heading.append(value);

  input.type = 'range';
  input.id = id;
  input.min = settings.min;
  input.max = settings.max;
  input.step = 1;
  input.value = settings.initial;

  const update = () => {
    const current = Number(input.value);
    const progress = (current - settings.min) / (settings.max - settings.min);

    input.style.setProperty('--slider-progress', progress);
    input.setAttribute('aria-valuetext', `${current} ${settings.unit}`.trim());
    value.textContent = `${current}${settings.unit}`;
    onChange(current);
  };

  input.addEventListener('input', update);
  wrapper.append(heading, input);

  if (settings.leftLabel || settings.rightLabel) {
    const scale = createElement('div', `${BLOCK}__slider-scale`);

    scale.append(
      createElement('span', `${BLOCK}__slider-limit`, settings.leftLabel),
      createElement('span', `${BLOCK}__slider-limit`, settings.rightLabel),
    );
    wrapper.append(scale);
  }

  return { element: wrapper, update };
};

const createRow = (modifier) => {
  const row = createElement('div', `${BLOCK}__row ${BLOCK}__row--${modifier}`);
  const term = createElement('dt', `${BLOCK}__row-label`);
  const description = createElement('dd', `${BLOCK}__row-value`);

  row.append(term, description);

  return { row, term, description };
};

const createResults = (config) => {
  const element = createElement('div', `${BLOCK}__results`);
  const costs = createElement('dl', `${BLOCK}__costs`);
  const savings = createElement('dl', `${BLOCK}__savings`);
  const petrol = createRow('petrol');
  const electric = createRow('ev');
  const saved = createRow('savings');

  appendRichText(petrol.term, config.petrolLabel);
  appendRichText(electric.term, config.evLabel);
  saved.term.textContent = config.savingsLabel || '';
  saved.description.setAttribute('aria-live', 'polite');

  costs.append(petrol.row, electric.row);
  savings.append(saved.row);
  element.append(costs, savings);

  return {
    element,
    update: (values) => {
      petrol.description.textContent = values.petrol;
      electric.description.textContent = values.electric;
      saved.description.textContent = values.savings;
    },
  };
};

const createAssumptions = (config) => {
  const element = createElement('div', `${BLOCK}__assumptions`);
  const hasLabel = Boolean(config.assumptionLabel);

  if (hasLabel) {
    element.append(createElement('strong', `${BLOCK}__assumptions-label`, config.assumptionLabel));
  }

  const details = createElement('div', `${BLOCK}__assumptions-details`);
  const hasDetails = appendRichText(details, config.assumptionDetails);

  if (hasDetails) {
    element.append(details);
  }

  return hasLabel || hasDetails ? element : null;
};

export default function decorate(block) {
  instanceCount += 1;

  const config = readConfig(block);
  const settings = resolveSettings(config);
  const formatCurrency = createCurrencyFormatter(
    config.currencySymbol || '',
    config.currencyLocale,
  );

  if (config.sliderColor && CSS.supports('color', config.sliderColor)) {
    block.style.setProperty('--savings-calculator-color', config.sliderColor);
  }

  const results = createResults(config);
  const slider = createSlider(config, settings, (distance) => {
    const costs = calculateCosts(distance, settings);

    results.update({
      petrol: formatCurrency(costs.petrol),
      electric: formatCurrency(costs.electric),
      savings: formatCurrency(costs.savings),
    });
  });

  const calculator = createElement('div', `${BLOCK}__calculator`);
  const inputs = createElement('div', `${BLOCK}__inputs`);
  const description = createElement('div', `${BLOCK}__description`);

  if (appendRichText(description, config.description)) {
    inputs.append(description);
  }

  inputs.append(slider.element);
  calculator.append(inputs, results.element);

  const assumptions = createAssumptions(config);

  if (assumptions) {
    calculator.append(assumptions);
  }

  const content = [];

  if (config.heading) {
    content.push(createElement('h2', `${BLOCK}__heading`, config.heading));
  }

  content.push(calculator);
  block.replaceChildren(...content);

  slider.update();
}
