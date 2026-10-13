import { getVidaID, getVidaLocation, isLoggedIn } from './login-utils.js';

export const isUniversalEditor = () => window.self !== window.top || document.documentElement.classList.contains('adobe-ue-edit');

window.digitalData = window.digitalData || [];

export function trackEvent(event, data = {}) {
  if (isUniversalEditor()) return;
  window.digitalData.push({ event, ...data });
}

const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';

const constructMetaDetails = () => ({
  pageName: getMeta('pageName') || document.title,
  pageCategory: getMeta('pageCategory'),
  language: getMeta('language'),
  country: getMeta('country'),
});

export function getBasePayload() {
  const {
    pageName, pageCategory, country, language,
  } = constructMetaDetails();
  const {
    accountID, custNum, leadID, opportunityID,
  } = getVidaID();
  const {
    pinCode, city, state, selectedCountry,
  } = getVidaLocation();
  const { href: url } = window.location;
  const platform = 'Web';

  const getLoggedInStatus = isLoggedIn() ? 'logged-in' : 'logged-out';

  const pageViewPayload = {
    page: {
      pageInfo: {
        pageName,
        pageCategory,
        url,
        country,
        language,
        journeyName: pageCategory,
        platform,
      },
    },
    user: {
      userInfo: {
        status: getLoggedInStatus,
        accountID,
        leadID,
        opportunityID,
        custNum,
      },
    },
    location: {
      pinCode,
      city,
      state,
      country: selectedCountry,
    },
    // This needs to be populated once we start working on the PDP pages
    productDetails: {
      modelVariant: '',
      modelColor: '',
      productID: '',
    },
  };

  return pageViewPayload;
}

export function trackPageView() {
  trackEvent('pageView', getBasePayload());
}

export function trackCtaClick({
  ctaText, href = '', extra = {}, eventName,
}) {
  let clickURL = '';
  let ctaLocation = '';

  try {
    const url = new URL(href, window.location.href);
    if (/^https?:$/.test(url.protocol)) {
      if (url.hostname !== window.location.hostname) clickURL = url.href;
      else ctaLocation = url.pathname + url.search;
    }
    if (url.origin !== window.location.origin) clickURL = url.href;
  } catch (e) {
    throw new Error(`Invalid CTA href: ${href}`, { cause: e });
  }

  trackEvent(eventName || 'ctaButtonClick', {
    ...getBasePayload(),
    linkDetails: { ctaText, ctaLocation, clickURL },
    ...extra,
  });
}

export function initCtaTracking() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-is-tracked]');
    if (!el) return;
    let extra = {};
    try {
      extra = JSON.parse(el.dataset.trackExtra || '{}');
    } catch (err) {
      throw new Error('Invalid data-track-extra on tracked element', { cause: err });
    }
    trackCtaClick({
      ctaText: el.textContent.trim(), href: el.href, extra, eventName: el.dataset.trackEvent,
    });
  });
}

export function markTracked(el, { event, ...extras } = {}) {
  el.dataset.isTracked = 'true';
  if (event) el.dataset.trackEvent = event;
  if (Object.keys(extras).length) el.dataset.trackExtra = JSON.stringify(extras);
  return el;
}

export function trackPopop(event, extra = {}) {
  trackEvent(
    event,
    {
      ...getBasePayload(),
      ...extra,
      formDetails: {
        formType: 'Lead Pop-Up',
      },
    },
  );
}
