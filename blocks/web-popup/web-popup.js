import buildInput from '../../scripts/build-input.js';
import buildButton from '../../scripts/build-button.js';
import CONFIG, { getAPIEndpoint } from '../../scripts/config.js';
import isLoggedIn from '../../scripts/login-utils.js';

const isLogin = isLoggedIn();

const NAME_REGEX = /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*)+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const KEYS = [
  'formHeading', 'nameLabel', 'namePlaceholder', 'nameError',
  'cityLabel', 'cityPlaceholder', 'mobileLabel', 'mobilePlaceholder',
  'mobileError', 'consent', 'submitLabel', 'citiesApiUrl', 'sendOtpApi',
  'verifyOtpApi', 'rsaPublicKey', 'popupDelaySeconds', 'countryCode',
  'otpHeading', 'resendLabel', 'resendTimer', 'otpError', 'otpSubmitLabel',
  'successImage', 'successHeading', 'successDescription', 'successBtnLabel',
];
const SEND_FALLBACK = 'Unable to Send OTP. Please try again.';
const OPT_OUT_FOR_POPUP_KEY = 'optOutForPopup';

function isOptedOutForPopup() {
  try {
    return sessionStorage.getItem(OPT_OUT_FOR_POPUP_KEY);
  } catch (e) {
    return false;
  }
}

function setOptedOutForPopup() {
  try {
    sessionStorage.setItem(OPT_OUT_FOR_POPUP_KEY, 'true');
  } catch (e) {
    console.error(e);
  }
}

let cityListPromise;
let jsEncryptPromise;

function loadCities(url) {
  if (!url) return Promise.resolve([]);
  if (!cityListPromise) {
    cityListPromise = fetch(url)
      .then((res) => res.json())
      .then((data) => data.flatMap(
        (s) => s.cities.map((city) => ({
          label: city,
          city,
          state: s.state,
        })),
      ))
      .catch(() => {
        cityListPromise = undefined;
        return [];
      });
  }

  return cityListPromise;
}

async function fetchCities(query, url) {
  const q = query.trim().toLowerCase();
  if (q?.length < 2) return [];
  const all = await loadCities(url);
  const starts = [];
  const words = [];

  all.forEach((c) => {
    const l = c.label.toLowerCase();
    if (l.startsWith(q)) starts.push(c);
    else if (l.includes(q)) words.push(c);
  });

  const byLabel = (a, b) => a.label.localeCompare(b.label);

  return [
    ...starts.sort(byLabel),
    ...words.sort(byLabel),
  ];
}

function attachAutoComplete(input, options) {
  const { fetchOptions, onSelect } = options;
  let items = [];
  let active = -1;
  let requestId = 0;

  const combo = document.createElement('div');
  combo.className = 'vida-popup-combo';
  input.replaceWith(combo);

  const list = document.createElement('ul');
  list.className = 'vida-popup-options';
  list.id = `${input.id}-listbox`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  combo.append(input, list);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');

  const close = () => {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const highlight = (i) => {
    active = i;
    [...list.children].forEach((li, n) => {
      const on = n === i;
      li.classList.toggle('vida-popup-option--active', on);
      li.setAttribute('aria-selected', String(on));

      if (on) {
        input.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      }
    });
  };

  const choose = (i) => {
    const item = items[i];
    input.value = item.label;
    input.dataset.picked = item.label;
    close();
    onSelect(item);
  };

  const render = () => {
    list.replaceChildren(
      ...items.map((item, i) => {
        const li = document.createElement('li');
        li.id = `${list.id}-${i}`;
        li.className = 'vida-popup-option';
        li.setAttribute('role', 'option');
        li.textContent = item.label;
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          choose(i);
        });
        return li;
      }),
    );
    input.removeAttribute('aria-activedescendant');
    list.hidden = items.length === 0;
    input.setAttribute('aria-expanded', String(items.length > 0));
  };

  input.addEventListener('input', async () => {
    delete input.dataset.picked;
    requestId += 1;
    const id = requestId;
    const results = await fetchOptions(input.value);
    if (id !== requestId) return;
    items = results;
    active = -1;
    render();
  });

  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight((active + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(active <= 0 ? items.length - 1 : active - 1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });

  input.addEventListener('blur', close);
}

function buildFields(config) {
  const cityField = buildInput({
    id: 'popup-city',
    label: config.cityLabel,
    placeholder: config.cityPlaceholder,
    required: true,
  });
  return [
    {
      key: 'name',
      field: buildInput({
        id: 'popup-name',
        label: config.nameLabel,
        placeholder: config.namePlaceholder,
        required: true,
        autocomplete: 'name',
      }),
      errorText: config.nameError,
      isValid: (v) => NAME_REGEX.test(v.trim()),
    },
    {
      key: 'city',
      field: cityField,
      isValid: (v) => v === cityField.input.dataset.picked,
    },
    {
      key: 'mobile',
      field: buildInput({
        id: 'popup-mobile',
        label: config.mobileLabel,
        placeholder: config.mobilePlaceholder,
        type: 'tel',
        inputMode: 'numeric',
        maxLength: 10,
        autocomplete: 'tel-national',
        required: true,
      }),
      errorText: config.mobileError,
      sanitize: (v) => v.replace(/\D/g, ''),
      isValid: (v) => MOBILE_REGEX.test(v),
    },
  ];
}

function buildConsentCheckbox(content) {
  const label = document.createElement('label');
  label.className = 'vida-popup-consent';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = 'consent';
  input.className = 'vida-popup-consent-checkbox';

  const text = document.createElement('div');
  text.className = 'vida-popup-consent-text';
  text.innerHTML = content || '';

  label.append(input, text);

  return { label, input };
}

function loadJsEncrypt() {
  if (window.JSEncrypt) return Promise.resolve();

  if (!jsEncryptPromise) {
    jsEncryptPromise = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = `${window.hlx.codeBasePath}scripts/jsencrypt.min.js`;
      s.onload = ok;
      s.onerror = () => {
        jsEncryptPromise = undefined;
        fail(new Error('JSEncrypt load failed'));
      };
      document.head.append(s);
    });
  }

  return jsEncryptPromise;
}

async function encryptValue(value, publicKey) {
  await loadJsEncrypt();
  const encryptor = new window.JSEncrypt();
  encryptor.setPublicKey(publicKey.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const output = encryptor.encrypt(value);
  if (!output) throw new Error('Encryption failed');
  return output;
}

function protect(value, key) {
  return key ? encryptValue(value, key) : value;
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);

  return {
    fname: parts[0],
    lname: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function getUtmParams() {
  const output = {};
  new URLSearchParams(window.location.search).forEach((v, k) => {
    if (k.toLowerCase().startsWith('utm_')) {
      output[k] = v;
    }
  });

  return output;
}

async function callOtpApi(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const resJson = await res.json();
  return resJson.data || {};
}

async function sendOtp(config, mobile) {
  const sendOtpApi = getAPIEndpoint(config.sendOtpApi, CONFIG.API_ENDPOINTS.sendOtpPostApi);
  try {
    const data = await callOtpApi(sendOtpApi, {
      action: 'sendOtp',
      country_code: config.countryCode || '+91',
      is_login: isLogin,
      mobile_number: await protect(mobile, config.rasPublicKey),
      sub_source: 'web-popup',
    });

    const res = data.SendOtp || {};

    if (res.status_code === 200) {
      return {
        ok: true,
        sfId: res.SF_ID,
        customerExist: res.customer_exist,
      };
    }

    return {
      ok: false,
      message: res.message || SEND_FALLBACK,
    };
  } catch (e) {
    return { ok: false, message: SEND_FALLBACK };
  }
}

async function verifyOtp(config, state, code) {
  try {
    const { details } = state;
    const key = config.rasPublicKey;
    const verifyOtpApi = getAPIEndpoint(config.verifyOtpApi, CONFIG.API_ENDPOINTS.verifyOtpPostApi);

    const payload = {
      action: 'verifyOtp',
      SF_ID: state.sfId,
      is_login: isLogin,
      ...splitName(details.name),
      country_code: config.countryCode || '+91',
      customer_state: details.state,
      customer_city: details.city,
      mobile_number: await protect(details.mobile, key),
      otp: await protect(code, key),
      whatsapp_consent: false,
      sub_source: 'web_popup',
      customer_exist: state.customerExist,
      is_teaser_lead: true,
      utm_params: getUtmParams(),
    };
    const data = await callOtpApi(verifyOtpApi, payload);

    const res = data.VerifyOtp || {};
    if (res.status_code === 200) return { ok: true };
    return { ok: false, message: res.message };
  } catch (e) {
    return { ok: false };
  }
}

function formatTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');

  return `${m}:${s}`;
}

function renderDetails(body, dialog, config, onSubmit) {
  const title = document.createElement('h2');
  title.className = 'vida-popup-title';
  title.id = 'popup-title';
  title.textContent = config.formHeading || '';
  dialog.setAttribute('aria-labelledby', title.id);

  const form = document.createElement('form');
  form.className = 'vida-popup-form';
  form.noValidate = true;

  const fields = buildFields(config);
  const consent = buildConsentCheckbox(config.consent);

  const submit = buildButton({
    label: config.submitLabel,
    type: 'submit',
  });
  submit.classList.add('vida-popup-submit');
  submit.disabled = true;

  const isFormValid = () => consent.input.checked && fields.every(
    (f) => f.isValid(f.field.input.value),
  );

  const updateSubmit = () => {
    submit.disabled = !isFormValid();
  };

  let selectedCity = null;
  const city = fields.find(
    (f) => f.key === 'city',
  ).field;

  const citiesApiUrl = getAPIEndpoint(config.citiesApiUrl, CONFIG.API_ENDPOINTS.testRideCitiesApi);

  attachAutoComplete(city.input, {
    fetchOptions: (q) => fetchCities(q, citiesApiUrl),
    onSelect: (item) => {
      selectedCity = item;
      city.clearError();
      updateSubmit();
    },
  });

  fields.forEach((f) => {
    const { input, setError, clearError } = f.field;
    input.addEventListener('input', () => {
      if (f.sanitize) {
        input.value = f.sanitize(input.value);
      }
      if (f.isValid(input.value)) clearError();
      updateSubmit();
    });

    input.addEventListener('blur', () => {
      if (f.isValid(input.value)) clearError();
      else if (f.errorText) setError(f.errorText);
    });
  });

  consent.input.addEventListener('change', updateSubmit);

  const mobile = fields.find((f) => f.key === 'mobile').field;
  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !isFormValid()) return;
    busy = true;
    submit.disabled = true;

    const result = await onSubmit({
      ...Object.fromEntries(fields.map((f) => [
        f.key,
        f.field.input.value.trim(),
      ])),
      city: selectedCity.city,
      state: selectedCity.state,
    });

    busy = false;
    if (result && !result.ok) {
      mobile.setError(result.message);
    }
    updateSubmit();
  });

  form.append(
    ...fields.map((f) => f.field.wrapper),
    consent.label,
    submit,
  );

  body.replaceChildren(title, form);
}

function renderOtp(body, dialog, config, state, handlers) {
  const title = document.createElement('h2');
  title.className = 'vida-popup-title-otp';
  title.id = 'popup-title';
  title.textContent = config.otpHeading || 'Enter the OTP you received';
  dialog.setAttribute('aria-labelledby', title.id);

  const form = document.createElement('form');
  form.className = 'vida-popup-form-otp';
  form.noValidate = true;

  const group = document.createElement('div');
  group.className = 'vida-popup-otp-boxes';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-labelledby', title.id);

  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => {
    const box = document.createElement('input');
    box.className = 'vida-popup-otp-box';
    box.type = 'text';
    box.inputMode = 'numeric';
    box.autocomplete = i === 0 ? 'one-time-code' : 'off';
    box.setAttribute('aria-label', `Digit ${i + 1}`);

    return box;
  });

  group.append(...boxes);

  const error = document.createElement('p');
  error.className = 'vida-popup-otp-error';
  error.id = 'popup-otp-error';
  error.hidden = true;
  error.setAttribute('role', 'alert');

  const actions = document.createElement('div');
  actions.className = 'vida-popup-otp-actions';

  const resend = document.createElement('button');
  resend.type = 'button';
  resend.className = 'vida-popup-otp-resend';
  const resendText = document.createElement('span');
  resendText.textContent = 'Resend';
  const timerText = document.createElement('span');
  timerText.className = 'vida-popup-otp-timer';
  resend.append(resendText, timerText);
  actions.append(resend);

  const submit = buildButton({ label: config.otpSubmitLabel || 'Submit', type: 'submit' });
  submit.classList.add('vida-popup-submit');
  submit.disabled = true;

  const getCode = () => boxes.map((b) => b.value).join('');

  const showError = (message) => {
    error.textContent = message;
    error.hidden = false;
    group.setAttribute('aria-describedby', error.id);
    boxes.forEach((b) => {
      b.setAttribute('aria-invalid', true);
    });
  };

  const clearError = () => {
    error.textContent = '';
    error.hidden = true;
    group.removeAttribute('aria-describedby');
    boxes.forEach((b) => {
      b.removeAttribute('aria-invalid');
    });
  };

  const update = () => {
    submit.disabled = getCode().length !== OTP_LENGTH || !error.hidden;
  };

  const fill = (start, digits) => {
    digits.split('').forEach((d, n) => {
      if (boxes[start + n]) {
        boxes[start + n].value = d;
      }
    });
    const next = Math.min(start + digits.length, OTP_LENGTH - 1);
    boxes[next].focus();
  };

  const total = Number(config.resendTimer) || 30;
  let left = 0;
  let timerId;

  const renderTimer = () => {
    resend.disabled = left > 0;
    timerText.textContent = left > 0 ? formatTimer(left) : '';
  };

  const startTimer = () => {
    clearInterval(timerId);
    left = total;
    renderTimer();
    timerId = setInterval(() => {
      left -= 1;
      renderTimer();
      if (left <= 0) clearInterval(timerId);
    }, 1000);
  };
  state.cleanup = () => clearInterval(timerId);

  boxes.forEach((box, i) => {
    box.addEventListener('focus', () => {
      box.select();
    });

    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      box.value = '';
      if (digits) fill(i, digits);
      clearError();
      update();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].value = '';
        boxes[i - 1].focus();
        clearError();
        update();
      } else if (e.key === 'ArrowLeft' && i > 0) {
        boxes[i - 1].focus();
      } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
        boxes[i + 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH - i);
      if (digits) fill(i, digits);
      clearError();
      update();
    });
  });

  let busy = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || submit.disabled) return;
    busy = true;
    submit.disabled = true;
    const result = await handlers.onVerify(getCode());
    busy = false;
    if (!result.ok) {
      showError(result.message || config.otpError || 'OTP Error');
      update();
    }
  });

  resend.addEventListener('click', async () => {
    if (left > 0) return;
    boxes.forEach((b) => {
      b.value = '';
    });
    clearError();
    update();
    startTimer();
    boxes[0].focus();
    const result = await handlers.onResend();
    if (!result.ok && result.message) {
      showError(result.message);
    }
  });

  form.append(group, error, actions, submit);
  body.replaceChildren(title, form);
  startTimer();
  boxes[0].focus();
}

function renderSuccess(body, dialog, config) {
  const wrap = document.createElement('div');
  wrap.className = 'vida-popup-success';

  if (config.successImage) {
    const icon = document.createElement('div');
    icon.className = 'vida-popup-success-icon';
    const pic = config.successImage;
    const img = pic.querySelector('img');
    if (img) img.alt = 'OTP Verify Success';
    icon.append(pic);
    wrap.append(icon);
  }

  const title = document.createElement('h2');
  title.className = 'vida-popup-title vida-popup-title-success';
  title.id = 'popup-title';
  title.textContent = config.successHeading || 'Thank you for sharing your contact details with us.';
  dialog.setAttribute('aria-labelledby', title.id);

  const text = document.createElement('p');
  text.className = 'vida-popup-success-text';
  text.textContent = config.successDescription || 'Someone from the call center team will get in touch with you soon.';

  const done = buildButton({
    label: config.successBtnLabel || 'Continue',
    type: 'button',
  });
  done.classList.add('vida-popup-submit');
  done.addEventListener('click', () => {
    dialog.close();
  });

  wrap.append(title, text, done);
  body.replaceChildren(wrap);
}

function readCell(cell, key) {
  if (key === 'consent') {
    return cell.innerHTML.trim();
  }

  if (key === 'successImage') {
    return cell.querySelector('picture');
  }

  return cell.textContent.trim();
}

function readConfig(block) {
  const config = {};
  [...block.children].forEach((row, i) => {
    const key = KEYS[i];
    const cell = row.firstElementChild;
    if (!key || !cell) return;
    config[key] = readCell(cell, key);
  });

  return config;
}

function buildPopupDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'vida-popup';

  const card = document.createElement('div');
  card.className = 'vida-popup-card';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'vida-popup-close';
  close.setAttribute('aria-label', 'Close');
  close.addEventListener('click', () => dialog.close());

  const body = document.createElement('div');
  body.className = 'vida-popup-body';

  card.append(close, body);
  dialog.append(card);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  return { dialog, body, close };
}

function openPopup(dialog) {
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}

export default function decorate(block) {
  if (isLogin || isOptedOutForPopup()) {
    block.textContent = '';
    return;
  }

  const config = readConfig(block);
  const { dialog, body } = buildPopupDialog();

  const state = {};

  let generation = 0;

  function showScreen(name) {
    if (state.cleanup) state.cleanup();
    state.cleanup = null;

    dialog.classList.toggle('vida-popup-on-success', name === 'success');
    if (name === 'success') {
      renderSuccess(body, dialog, config);
      return;
    }

    if (name === 'otp') {
      renderOtp(body, dialog, config, state, {
        onVerify: async (code) => {
          const gen = generation;
          const result = await verifyOtp(config, state, code);

          if (gen !== generation) {
            return { ok: true };
          }
          if (!result.ok) return result;
          showScreen('success');
          return { ok: true };
        },
        onResend: async () => {
          const result = await sendOtp(config, state.details.mobile);
          if (result.ok) {
            state.sfId = result.sfId;
            state.customerExist = result.customerExist;
          }

          return result;
        },
        onChangeNumber: () => { showScreen('details'); },
      });
      return;
    }

    renderDetails(body, dialog, config, async (data) => {
      const gen = generation;
      const result = await sendOtp(config, data.mobile);

      if (gen !== generation) {
        return { ok: true };
      }
      if (!result.ok) return result;

      state.details = data;
      state.sfId = result.sfId;
      state.customerExist = result.customerExist;
      showScreen('otp');
      return { ok: true };
    });
  }

  dialog.addEventListener('close', () => {
    setOptedOutForPopup();
    generation += 1;
    delete state.details;
    showScreen('details');
  });

  showScreen('details');

  block.textContent = '';
  block.append(dialog);

  const ueEditing = document.documentElement.classList.contains('adobe-ue-editing');

  if (ueEditing) return;

  const delay = Number(config.popupDelaySeconds) || 10;

  setTimeout(() => {
    if (isLogin || isOptedOutForPopup()) return;
    if (document.querySelector('dialog[open]')) return;

    openPopup(dialog);
  }, delay * 1000);
}
