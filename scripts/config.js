import { ENV, BASE_URLS } from './env.config.js';

const CONFIG = {
  ENV,
  BASE_URLS,
  API_ENDPOINTS: {
    headerApi:
            '/content/experience-fragments/vida/language-masters/en/vida2_0_site/header-vida-v2-0/master.10.json',
    countrySelectorApi:
            '/content/experience-fragments/vida/language-masters/en/vida2_0_site/country-selector/master.10.json',
    footerApi:
            '/content/experience-fragments/vida/language-masters/en/vida2_0_site/footer-vida-v2-0/home-footer-vida.10.json',
  },
};

/**
 * Builds a full, fetchable API URL from a UE-authored path.
 * Falls back to the block's known default api path in the CONFIG.API_ENDPOINTS
 * When UE hasn't provided one yet (e.g locl dev, when field not authored yet).
 * @param {string} path - path or FULL URL authored on the block's URL field in UE.
 * @param {string} [fallbackKey] - key into CONFIG.API_ENDPOINTS to use if path is empty.
 * @returns [FULL URL of the api endpoint]
 */
const getAPIEndpoint = (path, fallbackKey) => {
  const resolvedPath = path || CONFIG.API_ENDPOINTS[fallbackKey];

  if (!resolvedPath) return null;

  if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) return resolvedPath;

  const origin = CONFIG.BASE_URLS[CONFIG.ENV];
  return `${origin}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
};

export default CONFIG;
export { getAPIEndpoint };
