import { ENV, BASE_URLS, ANALYTICS_URL } from './env.config.js';

const VX2_CONTENT_PATH = [
  '/content/vida/language-masters/en/vx2-plus-colors-specifications/',
  'jcr:content/root/container/container.10.json',
].join('');
const CITY_MASTER_PATH = '/content/dam/vida/config/city-master.json.gzip';
const PRICE_MASTER_PATH = '/content/dam/vida/config/price-master.json.gzip';
const DETAILED_PRICE_PATH = '/content/vida/in/en/vx2-plus-electric-scooter/jcr:content.detailed-Product-Price';

/*
 * API options shared by vida-pdp-specs.
 *
 * CORS note:
 * `credentials: 'include'` does not bypass CORS. For cross-origin credentials,
 * the API must return Access-Control-Allow-Credentials: true and an
 * Access-Control-Allow-Origin header containing the exact page origin (not *).
 * Do not use mode: 'no-cors' for JSON APIs: it creates an opaque response that
 * JavaScript cannot read or parse.
 */
const API_OPTIONS = {
  // Change to 'include' only when the API uses cookies and supports credentialed CORS.
  credentials: 'include',
  timeoutMs: 10000,
  retries: 1,
};

const CONFIG = {
  ENV,
  BASE_URLS,
  API_ENDPOINTS: {
    headerApi: '/content/experience-fragments/vida/language-masters/en/vida2_0_site/header-vida-v2-0/master.10.json',
    countrySelectorApi: [
      '/content/experience-fragments/vida/language-masters/en/vida2_0_site/',
      'country-selector/master.10.json',
    ].join(''),
    footerApi: [
      '/content/experience-fragments/vida/language-masters/en/vida2_0_site/footer-vida-v2-0/',
      'home-footer-vida.10.json',
    ].join(''),
    testRideCitiesApi: '/content/dam/vida/config/availableTestRideCities.INDIA.json',
    sendOtpPostApi: '/content/vida/in/en/sf-master/jcr:content.vida-commerce.json',
    verifyOtpPostApi: '/content/vida/in/en/sf-master/jcr:content.vida-commerce.json',
    vx2ContentApi: VX2_CONTENT_PATH,
    cityMasterApi: CITY_MASTER_PATH,
    priceMasterApi: PRICE_MASTER_PATH,
  },
  ANALYTICS_URL,
};

/**
 * Resolves a relative API path against the origin configured for the active
 * environment. Full URLs are returned unchanged.
 *
 * @param {string} path - A relative API path or an absolute URL.
 * @param {string} [fallbackKey] - Optional key in CONFIG.API_ENDPOINTS.
 * @returns {string|null} The fully qualified API URL, or null when unresolved.
 */
const getAPIEndpoint = (path, fallbackKey) => {
  const resolvedPath = path || CONFIG.API_ENDPOINTS[fallbackKey];
  if (!resolvedPath) return null;

  if (/^https?:\/\//i.test(resolvedPath)) return resolvedPath;

  const origin = CONFIG.BASE_URLS?.[CONFIG.ENV];
  if (!origin) return null;

  return `${String(origin).replace(/\/+$/, '')}/${String(resolvedPath).replace(/^\/+/, '')}`;
};

/**
 * Returns the full city-master URL for the current environment.
 * @returns {string|null}
 */
const getCityMasterUrl = () => getAPIEndpoint(CITY_MASTER_PATH, 'cityMasterApi');

/**
 * Returns the full price-master URL for the current environment.
 * @returns {string|null}
 */
const getPriceMasterUrl = () => getAPIEndpoint(PRICE_MASTER_PATH, 'priceMasterApi');

/**
 * Builds the detailed price endpoint for a city and variant.
 * @param {string} cityName - City name from the city master, e.g. "Delhi".
 * @param {string} itemSfId - Item Salesforce ID.
 * @param {string} variantSfId - Variant Salesforce ID.
 * @returns {string|null}
 */
const getDetailedPriceUrl = (cityName, itemSfId, variantSfId) => {
  const city = String(cityName || '').trim();
  if (!city || !itemSfId || !variantSfId) return null;

  const path = `${[
    DETAILED_PRICE_PATH,
    encodeURIComponent(city),
    encodeURIComponent(itemSfId),
    encodeURIComponent(variantSfId),
  ].join('.')}.json`;
  return getAPIEndpoint(path);
};

/**
 * Returns the full VX2 content endpoint for the current environment.
 * The endpoint is shared across tabs; the selected model's specification values
 * are resolved from its item in priceandspec.specifications.
 * @returns {string|null}
 */
const getVx2ContentUrl = () => getAPIEndpoint(VX2_CONTENT_PATH, 'vx2ContentApi');

export default CONFIG;
export {
  API_OPTIONS,
  getAPIEndpoint,
  getCityMasterUrl,
  getPriceMasterUrl,
  getDetailedPriceUrl,
  getVx2ContentUrl,
};
