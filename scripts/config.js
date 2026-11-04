import { ENV, BASE_URLS, ANALYTICS_URL } from './env.config.js';

const VX2_CONTENT_PATH = [
  '/content/vida/language-masters/en/vx2-plus-colors-specifications/',
  'jcr:content/root/container/container.10.json',
].join('');
const CITY_MASTER_PATH = '/content/dam/vida/config/city-master.json.gzip';
const PRICE_MASTER_PATH = '/content/dam/vida/config/price-master.json.gzip';
const DETAILED_PRICE_PATH = '/content/vida/in/en/vx2-plus-electric-scooter/jcr:content.detailed-Product-Price';
const USE_PRODUCTION_PRICE_MASTER = false;
const API_OPTIONS = {
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
const getCityMasterUrl = (path = CITY_MASTER_PATH) => getAPIEndpoint(path, 'cityMasterApi');

/**
 * Returns the full price-master URL for the current environment.
 * @returns {string|null}
 */
const getPriceMasterUrl = (path = PRICE_MASTER_PATH) => {
  if (USE_PRODUCTION_PRICE_MASTER) {
    if (/^https?:\/\//i.test(path)) return path;
    const origin = BASE_URLS.prod;
    return `${String(origin).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
  }
  return getAPIEndpoint(path, 'priceMasterApi');
};

/**
 * Builds the detailed price endpoint for a city and variant.
 * @param {string} cityName - City name from the city master, e.g. "Delhi".
 * @param {string} itemSfId - Item Salesforce ID.
 * @param {string} variantSfId - Variant Salesforce ID.
 * @returns {string|null}
 */
const getDetailedPriceUrl = (cityName, itemSfId, variantSfId, endpoint = DETAILED_PRICE_PATH) => {
  const city = String(cityName || '').trim();
  if (!city || !itemSfId || !variantSfId) return null;

  const path = `${String(endpoint).replace(/\.+$/, '')}.${[
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
const getVx2ContentUrl = (path = VX2_CONTENT_PATH) => getAPIEndpoint(path, 'vx2ContentApi');

export default CONFIG;
export {
  API_OPTIONS,
  getAPIEndpoint,
  getCityMasterUrl,
  getPriceMasterUrl,
  getDetailedPriceUrl,
  getVx2ContentUrl,
  VX2_CONTENT_PATH,
  CITY_MASTER_PATH,
  PRICE_MASTER_PATH,
  DETAILED_PRICE_PATH,
};
