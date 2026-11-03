/* eslint-disable no-console */
/*
 * VIDA PDP Specs block: city, price, colors, specs and images
 * AEM Edge Delivery Services block: blocks/vida-pdp-specs/vida-pdp-specs.js
 *
 * CITY         getCityMasterUrl() in scripts/config.js. Selected city: getSelectedCity(block).
 *              Event 'vida-pdp-city-change' on the block, event.detail = selected city.
 * PRICE        1) detailed price  2) price master (fallback)  3) static price in BLOCK.
 * CONTENT      getVx2ContentUrl() in scripts/config.js. Colours (desktop and mobile
 *              images, colour codes), specs (labels and values by id), price labels, notes.
 * API          Every request goes through fetchApi(): timeout, retry on network/5xx,
 *              typed errors (auth, html, empty, parse, timeout, network, http), and a log.
 *              Credentials and timeout come from API_OPTIONS in scripts/config.js.
 *
 * Debug: on when ENV !== 'prod', or on prod with ?vidaDebug in the URL. ?vidaApiDebug prints payload diagnostics.
 * Console handle (debug only): window.vidaPdpDebug
 *   apiLog()  apiTable()  contentIssues()  content()  colors()  specRows()
 *   images()  price()  priceUrls()  selectedCity()  selectedColor()  dump()  refreshPrice()
 *
 * TODO(auth): when the auth city-master URL is ready, update getCityMasterUrl() in
 *             scripts/config.js. No change is needed in this file.
 */
import CONFIG, {
  API_OPTIONS,
  getAPIEndpoint,
  getCityMasterUrl,
  getPriceMasterUrl,
  getDetailedPriceUrl,
  getVx2ContentUrl,
} from '../../scripts/config.js';
import attachSpecsOverlay from './vida-pdp-specificaqtions-overlay.js';


/* ============================================================
 * ENVIRONMENT + DEBUG
 * ============================================================ */
const { ENV } = CONFIG;
const DEBUG = ENV !== 'prod'
  || new URLSearchParams(window.location.search).has('vidaDebug')
  || new URLSearchParams(window.location.search).has('vidaApiDebug');


/*
 * API payload debugging:
 * 1. Set this to true to print the raw response text and parsed JSON for every API.
 * 2. Set it back to false before committing/releasing.
 * API diagnostics in the normal apiLog remain available whenever DEBUG is enabled.
 */
const DEBUG_API_RESPONSE = new URLSearchParams(window.location.search).has('vidaApiDebug');


/* Keep production endpoints switchable without changing UI or specification mapping. */
const PRICE_API_CONFIG = {
  useProductionApis: true,
  productionOrigin: 'https://www.vidaworld.com',
  cityMasterPath: '/content/dam/vida/config/city-master.json.gzip',
  priceMasterPath: '/content/dam/vida/config/price-master.json.gzip',
  detailedPricePath: '/content/vida/in/en/vx2-plus-electric-scooter/jcr:content.detailed-Product-Price',
};


const getCityApiUrl = () => (PRICE_API_CONFIG.useProductionApis
  ? `${PRICE_API_CONFIG.productionOrigin}${PRICE_API_CONFIG.cityMasterPath}`
  : getCityMasterUrl());
const getPriceMasterApiUrl = () => (PRICE_API_CONFIG.useProductionApis
  ? `${PRICE_API_CONFIG.productionOrigin}${PRICE_API_CONFIG.priceMasterPath}`
  : getPriceMasterUrl());
const getDetailedPriceApiUrl = (cityName, itemSfId, variantSfId) => {
  if (!cityName || !itemSfId || !variantSfId) return null;
  if (!PRICE_API_CONFIG.useProductionApis) {
    return getDetailedPriceUrl(cityName, itemSfId, variantSfId);
  }
  return `${PRICE_API_CONFIG.productionOrigin}${PRICE_API_CONFIG.detailedPricePath}.${encodeURIComponent(cityName)}.${encodeURIComponent(itemSfId)}.${encodeURIComponent(variantSfId)}.json`;
};


const LOG_TAG = `[VIDA][pdp-specs][${ENV}]`;


const debugLog = (...args) => { if (DEBUG) console.log(LOG_TAG, ...args); };
const debugWarn = (...args) => { if (DEBUG) console.warn(LOG_TAG, ...args); };


/* ============================================================
 * BLOCK CONFIG
 * Hardcoded values live here. Colours, specs and price labels come from the API.
 * ============================================================ */
const BLOCK = {
  classes: {
    root: 'vida-pdp-specs',
    title: 'vida-pdp-specs__title',
    tabs: 'vida-pdp-specs__tabs',
    tab: 'vida-pdp-specs__tab',
    newTag: 'vida-pdp-specs__new-tag',
    pricePanel: 'vida-pdp-specs__price-panel',
    priceCopy: 'vida-pdp-specs__price-copy',
    priceTitle: 'vida-pdp-specs__price-title',
    cityTrigger: 'vida-pdp-specs__city-trigger',
    cityPopover: 'vida-pdp-specs__city-popover',
    citySearch: 'vida-pdp-specs__city-search',
    cityCount: 'vida-pdp-specs__city-count',
    cityList: 'vida-pdp-specs__city-list',
    cityOption: 'vida-pdp-specs__city-option',
    cityOptionState: 'vida-pdp-specs__city-option-state',
    dealership: 'vida-pdp-specs__dealership',
    priceCard: 'vida-pdp-specs__price-card',
    priceValue: 'vida-pdp-specs__price-value',
    infoButton: 'vida-pdp-specs__info-button',
    pricePopover: 'vida-pdp-specs__price-popover',
    productMedia: 'vida-pdp-specs__product-media',
    productImage: 'vida-pdp-specs__product-image',
    colorPicker: 'vida-pdp-specs__color-picker',
    swatches: 'vida-pdp-specs__swatches',
    swatch: 'vida-pdp-specs__swatch',
    specs: 'vida-pdp-specs__specs',
    spec: 'vida-pdp-specs__spec',
    specIcon: 'vida-pdp-specs__spec-icon',
    specCopy: 'vida-pdp-specs__spec-copy',
    specTitle: 'vida-pdp-specs__spec-title',
    specValue: 'vida-pdp-specs__spec-value',
    allSpecs: 'vida-pdp-specs__all-specs',
    arrow: 'vida-pdp-specs__arrow',
    selected: 'is-selected',
    active: 'is-active',
  },
  city: {
    defaultCity: 'Delhi', // REPLACE if the default should change
    listMaxHeight: '320px', // list scrolls inside this height
    changeEvent: 'vida-pdp-city-change',
  },
  labels: {
    pageTitle: 'Vida VX2 Plus does it all',
    new: 'NEW',
    subtitle: 'Select your location to see the most accurate on-road starting price.',
    dealership: 'View Dealerships',
    viewSpecs: 'View all Specifications',
    priceBreakdown: '',
    effectivePrice: '',
    showroom: '',
    pmDrive: '',
    stateSubsidy: '',
    discounts: '',
    note: '',
    subsidyNote: '',
    searchCity: 'Search city',
    noCities: 'No cities match your search.',
    loadError: 'City list is temporarily unavailable.',
  },
  content: {
    specSetId: 'plus', // which entry of priceandspec.specifications to read values from
    mobileQuery: '(max-width: 767px)', // imageMob is used at or below this width
    // Spec rows shown under the price. icon is a key of BLOCK.icons.
    // id is the spec id in the API. Title and value come from the API.
    specRows: [
      {
        icon: 'range',
        id: 'idcRange',
        aliases: ['idcRange', 'IDC Range'],
      },
      {
        icon: 'charger',
        id: 'fastChargerTime',
        aliases: ['fastChargerTime', 'fastChargingTime', 'Fast Charger Time (0-80%)'],
      },
      {
        icon: 'plug',
        id: 'acChargingTime',
        aliases: ['acChargingTime', 'AC Charging Time (20-80%)'],
      },
      {
        icon: 'battery',
        id: 'batteryCapacity',
        aliases: ['batteryCapacity', 'Battery Capacity'],
      },
    ],
  },
  defaults: {
    model: 'plus44',
    // itemSfId and variantSfId are the price lookup keys. REPLACE the plus34 values
    // with the real ids when they are available. Without them, the static price is shown.
    models: [
      {
        id: 'plus44',
        label: 'Plus 4.4',
        isNew: true,
        itemSfId: '',
        variantSfId: '',
        price: '',
      },
      {
        id: 'plus34',
        label: 'Plus 3.4',
        isNew: false,
        itemSfId: '',
        variantSfId: '',
        price: '',
      },
    ],
    cityPriceFallback: '',
    dealershipUrl: '#dealerships',
    specificationsUrl: '#specifications',
  },
  icons: {
    range: '<svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M27.4929 17.875C27.378 17.9397 27.2516 17.9811 27.1207 17.9968C26.9898 18.0125 26.8572 18.0021 26.7303 17.9663C26.6034 17.9306 26.4849 17.8701 26.3815 17.7883C26.2781 17.7066 26.1919 17.6052 26.1279 17.49L17.4179 2H15.0029V3C15.0029 3.26522 14.8975 3.51957 14.71 3.70711C14.5224 3.89464 14.2681 4 14.0029 4C13.7376 4 13.4833 3.89464 13.2958 3.70711C13.1082 3.51957 13.0029 3.26522 13.0029 3V2H10.5879L1.87786 17.49C1.7479 17.7221 1.53108 17.893 1.2751 17.9652C1.01911 18.0374 0.744925 18.005 0.51286 17.875C0.280796 17.745 0.109861 17.5282 0.0376598 17.2722C-0.0345417 17.0162 -0.00209557 16.7421 0.127861 16.51L8.29286 2H1.00286C0.737644 2 0.48329 1.89464 0.295754 1.70711C0.108217 1.51957 0.00286051 1.26522 0.00286051 1C0.00286051 0.734784 0.108217 0.48043 0.295754 0.292893C0.48329 0.105357 0.737644 0 1.00286 0H27.0029C27.2681 0 27.5224 0.105357 27.71 0.292893C27.8975 0.48043 28.0029 0.734784 28.0029 1C28.0029 1.26522 27.8975 1.51957 27.71 1.70711C27.5224 1.89464 27.2681 2 27.0029 2H19.7129L27.8779 16.51C27.9426 16.6248 27.984 16.7513 27.9997 16.8822C28.0153 17.013 28.005 17.1457 27.9692 17.2726C27.9334 17.3994 27.8729 17.5179 27.7912 17.6213C27.7094 17.7247 27.608 17.8109 27.4929 17.875ZM14.0029 7C13.7376 7 13.4833 7.10536 13.2958 7.29289C13.1082 7.48043 13.0029 7.73478 13.0029 8V10C13.0029 10.2652 13.1082 10.5196 13.2958 10.7071C13.4833 10.8946 13.7376 11 14.0029 11C14.2681 11 14.5224 10.8946 14.71 10.7071C14.8975 10.5196 15.0029 10.2652 15.0029 10V8C15.0029 7.73478 14.8975 7.48043 14.71 7.29289C14.5224 7.10536 14.2681 7 14.0029 7ZM14.0029 14C13.7376 14 13.4833 14.1054 13.2958 14.2929C13.1082 14.4804 13.0029 14.7348 13.0029 15V17C13.0029 17.2652 13.1082 17.5196 13.2958 17.7071C13.4833 17.8946 13.7376 18 14.0029 18C14.2681 18 14.5224 17.8946 14.71 17.7071C14.8975 17.5196 15.0029 17.2652 15.0029 17V15C15.0029 14.7348 14.8975 14.4804 14.71 14.2929C14.5224 14.1054 14.2681 14 14.0029 14Z" fill="#FF5310"/></svg>',
    charger: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">'+
    '<path d="M26.9718 14.7662C26.934 14.606 26.8571 14.4575 26.7481 14.3341C26.639 14.2107 26.5012 14.1161 26.3468 14.0587L19.1456 11.3575L20.9781 2.19124C21.0196 1.97827 20.9907 1.75758 20.8957 1.56247C20.8008 1.36736 20.645 1.20842 20.4518 1.10964C20.2586 1.01086 20.0385 0.977594 19.8248 1.01486C19.611 1.05213 19.4152 1.15791 19.2668 1.31624L5.26684 16.3162C5.15313 16.4361 5.07088 16.5822 5.02742 16.7415C4.98396 16.9009 4.98065 17.0685 5.0178 17.2295C5.05494 17.3904 5.13137 17.5397 5.24027 17.6639C5.34916 17.7881 5.48713 17.8834 5.64184 17.9412L12.8456 20.6425L11.0181 29.7987C10.9766 30.0117 11.0055 30.2324 11.1004 30.4275C11.1954 30.6226 11.3512 30.7816 11.5444 30.8803C11.7376 30.9791 11.9576 31.0124 12.1714 30.9751C12.3851 30.9379 12.581 30.8321 12.7293 30.6737L26.7293 15.6737C26.841 15.5539 26.9215 15.4085 26.9638 15.2502C27.0061 15.092 27.0088 14.9258 26.9718 14.7662ZM13.6693 26.745L14.9781 20.1975C15.0249 19.9653 14.9878 19.724 14.8734 19.5166C14.7589 19.3092 14.5745 19.1491 14.3531 19.065L7.74809 16.5837L18.3256 5.25124L17.0181 11.7987C16.9712 12.031 17.0084 12.2723 17.1228 12.4797C17.2373 12.6871 17.4217 12.8471 17.6431 12.9312L24.2431 15.4062L13.6693 26.745Z" fill="#FF5310"/></svg>',
    plug: '<svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M25 6H19V1C19 0.734784 18.8946 0.48043 18.7071 0.292893C18.5196 0.105357 18.2652 0 18 0C17.7348 0 17.4804 0.105357 17.2929 0.292893C17.1054 0.48043 17 0.734784 17 1V6H9V1C9 0.734784 8.89464 0.48043 8.70711 0.292893C8.51957 0.105357 8.26522 0 8 0C7.73478 0 7.48043 0.105357 7.29289 0.292893C7.10536 0.48043 7 0.734784 7 1V6H1.06875C0.285 6 0 6.5975 0 7C0 7.26522 0.105357 7.51957 0.292893 7.70711C0.48043 7.89464 0.734784 8 1 8H3V19C3 20.3261 3.52678 21.5979 4.46447 22.5355C5.40215 23.4732 6.67392 24 8 24H12V29C12 29.2652 12.1054 29.5196 12.2929 29.7071C12.4804 29.8946 12.7348 30 13 30C13.2652 30 13.5196 29.8946 13.7071 29.7071C13.8946 29.5196 14 29.2652 14 29V24H18C19.3261 24 20.5979 23.4732 21.5355 22.5355C22.4732 21.5979 23 20.3261 23 19V8H25C25.2652 8 25.5196 7.89464 25.7071 7.70711C25.8946 7.51957 26 7.26522 26 7C26 6.73478 25.8946 6.48043 25.7071 6.29289C25.5196 6.10536 25.2652 6 25 6ZM18 22H8C7.20435 22 6.44129 21.6839 5.87868 21.1213C5.31607 20.5587 5 19.7956 5 19V8H21V19C21 19.7956 20.6839 20.5587 20.1213 21.1213C19.5587 21.6839 18.7956 22 18 22ZM15.8225 14.43C15.9145 14.5629 15.9729 14.7162 15.9927 14.8766C16.0126 15.0371 15.9932 15.1999 15.9363 15.3512L14.4363 19.3512C14.3431 19.5999 14.155 19.8013 13.9133 19.9113C13.6716 20.0212 13.3961 20.0307 13.1475 19.9375C12.8989 19.8443 12.6974 19.6562 12.5875 19.4145C12.4775 19.1729 12.4681 18.8974 12.5612 18.6488L13.5613 16H11C10.8384 16 10.6792 15.9608 10.5361 15.8859C10.3929 15.8109 10.2701 15.7023 10.1781 15.5695C10.086 15.4367 10.0276 15.2836 10.0076 15.1232C9.98774 14.9628 10.007 14.8 10.0638 14.6488L11.5638 10.6488C11.6569 10.4001 11.845 10.1987 12.0867 10.0887C12.3284 9.97877 12.6039 9.96934 12.8525 10.0625C13.1011 10.1557 13.3026 10.3438 13.4125 10.5855C13.5225 10.8271 13.5319 11.1026 13.4387 11.3512L12.4388 14H15C15.1616 13.9999 15.3209 14.0389 15.4642 14.1138C15.6074 14.1887 15.7304 14.2972 15.8225 14.43Z" fill="#FF5310"/></svg>',
    battery: '<svg width="18" height="31" viewBox="0 0 18 31" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M11.8512 16.4737C11.941 16.6188 11.9921 16.7845 11.9998 16.9549C12.0075 17.1254 11.9714 17.2949 11.895 17.4475L9.895 21.4475C9.77632 21.6849 9.5682 21.8654 9.31643 21.9493C9.06466 22.0332 8.78987 22.0137 8.5525 21.895C8.31513 21.7763 8.13463 21.5682 8.05071 21.3164C7.96679 21.0647 7.98632 20.7899 8.105 20.5525L9.3825 18H7C6.82946 18.0001 6.66171 17.9566 6.51272 17.8736C6.36372 17.7907 6.23843 17.671 6.14874 17.5259C6.05905 17.3808 6.00795 17.2153 6.00029 17.0449C5.99264 16.8745 6.02868 16.705 6.105 16.5525L8.105 12.5525C8.22368 12.3151 8.4318 12.1346 8.68357 12.0507C8.93534 11.9668 9.21013 11.9863 9.4475 12.105C9.68487 12.2237 9.86537 12.4318 9.94929 12.6836C10.0332 12.9353 10.0137 13.2101 9.895 13.4475L8.6175 16H11C11.1705 15.9998 11.3382 16.0433 11.4872 16.1262C11.6362 16.2091 11.7615 16.3288 11.8512 16.4737ZM5 2H13C13.2652 2 13.5196 1.89464 13.7071 1.70711C13.8946 1.51957 14 1.26522 14 1C14 0.734784 13.8946 0.48043 13.7071 0.292893C13.5196 0.105357 13.2652 0 13 0L5 0C4.73478 0 4.48043 0.105357 4.29289 0.292893C4.10536 0.48043 4 0.734784 4 1C4 1.26522 4.10536 1.51957 4.29289 1.70711C4.48043 1.89464 4.73478 2 5 2ZM18 7V28C18 28.7956 17.6839 29.5587 17.1213 30.1213C16.5587 30.6839 15.7956 31 15 31H3C2.20435 31 1.44129 30.6839 0.87868 30.1213C0.316071 29.5587 0 28.7956 0 28V7C0 6.20435 0.316071 5.44129 0.87868 4.87868C1.44129 4.31607 2.20435 4 3 4H15C15.7956 4 16.5587 4.31607 17.1213 4.87868C17.6839 5.44129 18 6.20435 18 7ZM16 7C16 6.73478 15.8946 6.48043 15.7071 6.29289C15.5196 6.10536 15.2652 6 15 6H3C2.73478 6 2.48043 6.10536 2.29289 6.29289C2.10536 6.48043 2 6.73478 2 7V28C2 28.2652 2.10536 28.5196 2.29289 28.7071C2.48043 28.8946 2.73478 29 3 29H15C15.2652 29 15.5196 28.8946 15.7071 28.7071C15.8946 28.5196 16 28.2652 16 28V7Z" fill="#FF5310"/></svg>',
    info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
+'<path d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM12 20.25C10.3683 20.25 8.77326 19.7661 7.41655 18.8596C6.05984 17.9531 5.00242 16.6646 4.378 15.1571C3.75358 13.6496 3.5902 11.9908 3.90853 10.3905C4.22685 8.79016 5.01259 7.32015 6.16637 6.16637C7.32016 5.01259 8.79017 4.22685 10.3905 3.90852C11.9909 3.59019 13.6497 3.75357 15.1571 4.37799C16.6646 5.00242 17.9531 6.05984 18.8596 7.41655C19.7661 8.77325 20.25 10.3683 20.25 12C20.2475 14.1873 19.3775 16.2843 17.8309 17.8309C16.2843 19.3775 14.1873 20.2475 12 20.25ZM13.5 16.5C13.5 16.6989 13.421 16.8897 13.2803 17.0303C13.1397 17.171 12.9489 17.25 12.75 17.25C12.3522 17.25 11.9706 17.092 11.6893 16.8107C11.408 16.5294 11.25 16.1478 11.25 15.75V12C11.0511 12 10.8603 11.921 10.7197 11.7803C10.579 11.6397 10.5 11.4489 10.5 11.25C10.5 11.0511 10.579 10.8603 10.7197 10.7197C10.8603 10.579 11.0511 10.5 11.25 10.5C11.6478 10.5 12.0294 10.658 12.3107 10.9393C12.592 11.2206 12.75 11.6022 12.75 12V15.75C12.9489 15.75 13.1397 15.829 13.2803 15.9697C13.421 16.1103 13.5 16.3011 13.5 16.5ZM10.5 7.875C10.5 7.6525 10.566 7.43499 10.6896 7.24998C10.8132 7.06498 10.9889 6.92078 11.1945 6.83564C11.4001 6.75049 11.6263 6.72821 11.8445 6.77162C12.0627 6.81502 12.2632 6.92217 12.4205 7.0795C12.5778 7.23684 12.685 7.43729 12.7284 7.65552C12.7718 7.87375 12.7495 8.09995 12.6644 8.30552C12.5792 8.51109 12.435 8.68679 12.25 8.8104C12.065 8.93402 11.8475 9 11.625 9C11.3266 9 11.0405 8.88147 10.8295 8.6705C10.6185 8.45952 10.5 8.17337 10.5 7.875Z" fill="#A7A6A6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5" /></svg>',
    chevronDown: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
+'<path d="M20.0312 9.53063L12.5312 17.0306C12.4616 17.1004 12.3788 17.1557 12.2878 17.1934C12.1967 17.2312 12.0992 17.2506 12.0006 17.2506C11.902 17.2506 11.8044 17.2312 11.7134 17.1934C11.6223 17.1557 11.5396 17.1004 11.47 17.0306L3.96997 9.53063C3.86496 9.42573 3.79343 9.29204 3.76444 9.14648C3.73546 9.00092 3.75031 8.85002 3.80712 8.71291C3.86394 8.57579 3.96016 8.45861 4.0836 8.37621C4.20705 8.29381 4.35217 8.24988 4.50059 8.25H19.5006C19.649 8.24988 19.7941 8.29381 19.9176 8.37621C20.041 8.45861 20.1372 8.57579 20.1941 8.71291C20.2509 8.85002 20.2657 9.00092 20.2367 9.14648C20.2078 9.29204 20.1362 9.42573 20.0312 9.53063Z" fill="#FF5310"/></svg>',
  },
};


/* ============================================================
 * API LAYER (defensive)
 * Every request goes through fetchApi(). Each attempt is logged to apiLog.
 * ============================================================ */
const API_LOG_LIMIT = 30;
const apiLog = [];


class ApiError extends Error {
  constructor(message, kind, status = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}


const recordApi = (entry) => {
  apiLog.push(entry);
  if (apiLog.length > API_LOG_LIMIT) apiLog.shift();
  debugLog('api', entry);
};


const AUTH_HINT = 'The server refused the request without credentials. Check the dispatcher/ACL '
  + 'for this path, or API_OPTIONS.credentials in config.js.';


/* ---- Byte-level helpers: gzip, zip, plain JSON ---- */
const isGzipBytes = (bytes) => bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
const isZipBytes = (bytes) => bytes.length >= 4
  && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;


/* Runs a DecompressionStream ('gzip' or 'deflate-raw') over bytes. */
const runDecompression = async (bytes, format) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new ApiError('DecompressionStream is not supported in this browser', 'config');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};


/*
 * Minimal ZIP reader. Finds the central directory through the end-of-central-directory
 * record, then extracts the first entry. Supports stored (0) and deflate (8) entries.
 * ZIP64 archives are not supported.
 */
const unzipFirstEntry = async (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);


  let eocd = -1;
  const lowest = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= lowest; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ApiError('ZIP end-of-central-directory record not found', 'parse');


  const entryCount = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (entryCount < 1) throw new ApiError('ZIP archive has no entries', 'empty');
  if (view.getUint32(cdOffset, true) !== 0x02014b50) {
    throw new ApiError('ZIP central directory header is invalid', 'parse');
  }


  const method = view.getUint16(cdOffset + 10, true);
  const compressedSize = view.getUint32(cdOffset + 20, true);
  const localOffset = view.getUint32(cdOffset + 42, true);


  if (view.getUint32(localOffset, true) !== 0x04034b50) {
    throw new ApiError('ZIP local file header is invalid', 'parse');
  }
  const localNameLength = view.getUint16(localOffset + 26, true);
  const localExtraLength = view.getUint16(localOffset + 28, true);
  const dataStart = localOffset + 30 + localNameLength + localExtraLength;
  const data = bytes.subarray(dataStart, dataStart + compressedSize);


  if (method === 0) return data;
  if (method === 8) return runDecompression(data, 'deflate-raw');
  throw new ApiError(`Unsupported ZIP compression method ${method}`, 'parse');
};


/* Unwraps zip and gzip layers and returns the text. Works for any URL extension. */
const decodePayloadToText = async (input, depth = 0) => {
  if (depth > 3) throw new ApiError('Payload has too many nested archive layers', 'parse');
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);


  if (isZipBytes(bytes)) {
    return decodePayloadToText(await unzipFirstEntry(bytes), depth + 1);
  }
  if (isGzipBytes(bytes)) {
    return decodePayloadToText(await runDecompression(bytes, 'gzip'), depth + 1);
  }
  return new TextDecoder().decode(bytes);
};


/* One attempt. Throws ApiError with a kind for every failure. */
const requestOnce = async (url, name) => {
  const entry = {
    name,
    url,
    status: null,
    contentType: null,
    bytes: 0,
    ok: false,
    ms: 0,
    error: null,
    preview: '',
  };
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_OPTIONS.timeoutMs);


  try {
    let response;
    try {
      response = await fetch(url, {
        credentials: API_OPTIONS.credentials,
        headers: { Accept: 'application/json, */*' },
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new ApiError(`Timed out after ${API_OPTIONS.timeoutMs} ms`, 'timeout');
      }
      throw new ApiError(
        `Network or CORS error (${fetchError.message}). Check the response headers allow this origin.`,
        'network',
      );
    }


    entry.status = response.status;
    entry.contentType = response.headers.get('content-type');


    if (response.status === 401 || response.status === 403) {
      throw new ApiError(`HTTP ${response.status}. ${AUTH_HINT}`, 'auth', response.status);
    }
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, 'http', response.status);
    }


    const bytes = new Uint8Array(await response.arrayBuffer());
    entry.bytes = bytes.byteLength;
    const raw = (await decodePayloadToText(bytes)).replace(/^\uFEFF/, '').trim();
    entry.preview = raw.slice(0, 160);


    // CORS failures never reach this point: browsers hide the response from JavaScript.
    // Toggle DEBUG_API_RESPONSE above to inspect text responses, including HTML error pages.
    if (DEBUG_API_RESPONSE) console.debug(`${LOG_TAG} [${name}] raw response`, raw);


    if (!raw) throw new ApiError('Empty response body', 'empty', response.status);
    if (raw.startsWith('<')) {
      throw new ApiError(
        'Got HTML instead of JSON (login page, redirect or error page?)',
        'html',
        response.status,
      );
    }


    let json;
    try {
      json = JSON.parse(raw);
    } catch (parseError) {
      throw new ApiError(`Invalid JSON: ${parseError.message}`, 'parse', response.status);
    }
    entry.ok = true;
    if (DEBUG_API_RESPONSE) console.debug(`${LOG_TAG} [${name}] parsed JSON`, json);
    return json;
  } catch (error) {
    entry.error = error.message;
    throw error instanceof ApiError ? error : new ApiError(error.message, 'unknown');
  } finally {
    clearTimeout(timer);
    entry.ms = Math.round(performance.now() - started);
    recordApi(entry);
  }
};


/*
 * Retries network errors, timeouts and 5xx responses. Auth and parse errors are not retried.
 * Recursion keeps the loop free of await-in-loop.
 */
const fetchApi = async (url, name, attempt = 1) => {
  try {
    return await requestOnce(url, name);
  } catch (error) {
    const serverError = error.kind === 'http' && error.status >= 500;
    const retryable = error.kind === 'timeout' || error.kind === 'network' || serverError;
    if (retryable && attempt <= API_OPTIONS.retries) {
      debugWarn(`${name}: attempt ${attempt} failed (${error.kind}), retrying`);
      return fetchApi(url, name, attempt + 1);
    }
    throw error;
  }
};


/* ============================================================
 * SHARED JSON HELPERS
 * ============================================================ */
const text = (value) => (value === null || value === undefined ? '' : String(value).trim());


/* Finds the first object with the given key, searching the whole tree. */
const findNode = (node, key) => {
  if (!node || typeof node !== 'object') return null;
  if (node[key] && typeof node[key] === 'object') return node[key];
  return Object.keys(node).reduce(
    (found, childKey) => found || findNode(node[childKey], key),
    null,
  );
};


/* Returns itemN children of an AEM multifield node in authoring order. */
const entriesOf = (node) => {
  if (Array.isArray(node)) {
    return node.map((value, index) => ({ key: `item${index}`, value }));
  }
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node)
    .filter((key) => /^item\d+$/.test(key))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
    .map((key) => ({ key, value: node[key] }));
};


const itemsOf = (node) => entriesOf(node).map(({ value }) => value);


/* ============================================================
 * VX2 PLUS CONTENT (colors, specs, price labels)
 * ============================================================ */
let contentPromise = null;


/*
 * Maps the VX2 Plus content response to the block shape.
 * Never throws on a partial response. Problems go into `issues` so they can be seen in debug.
 * Throws ApiError('shape') only when nothing usable is present.
 */
const normalizeVx2Content = (json) => {
  const issues = [];
  const topKeys = json && typeof json === 'object' ? Object.keys(json) : [];
  const pickerNode = findNode(json, 'newcolorpicker');
  const priceNode = findNode(json, 'priceandspec');


  if (!pickerNode) issues.push(`newcolorpicker not found (top-level keys: ${topKeys.join(', ') || 'none'})`);
  if (!priceNode) issues.push('priceandspec not found');


  const picker = pickerNode || {};
  const priceData = priceNode || {};
  const colors = itemsOf(picker.colors)
    .map((color) => ({
      id: text(color.id),
      name: text(color.name),
      colorCode: text(color.colorCode),
      image: text(color.image),
      imageMob: text(color.imageMob),
    }))
    .filter((color) => {
      if (!color.id) {
        issues.push('colour without id skipped');
        return false;
      }
      if (!color.image && !color.imageMob) {
        issues.push(`colour ${color.id} has no image or imageMob`);
        return false;
      }
      if (!color.colorCode) issues.push(`colour ${color.id} has no colorCode`);
      return true;
    });


  const defaultColorId = text(picker.defaultColor);
  if (colors.length && !colors.some((color) => color.id === defaultColorId)) {
    issues.push(`defaultColor "${defaultColorId}" is not one of the colours`);
  }


  const specificationNode = priceData.specifications || findNode(priceData, 'specifications');
  let specificationEntries = entriesOf(specificationNode);
  if (!specificationEntries.length && specificationNode && typeof specificationNode === 'object') {
    const namedEntries = Object.entries(specificationNode)
      .filter(([, value]) => value && typeof value === 'object'
        && (value.badgeImage || value.data || value.specificationData || value.id || value.modelId));
    if (namedEntries.length) {
      specificationEntries = namedEntries.map(([key, value]) => ({ key, value }));
    } else if (specificationNode.badgeImage || specificationNode.data
      || specificationNode.specificationData) {
      specificationEntries = [{ key: 'item0', value: specificationNode }];
    }
  }


  /*
   * Some AEM exports wrap the model items in specifications.item0.data.
   * Flatten that wrapper only when the wrapper is not itself a displayable model.
   */
  if (specificationEntries.length === 1) {
    const wrapper = specificationEntries[0].value || {};
    const wrapperBadge = text(wrapper.badgeImage);
    const nestedSource = wrapper.data || wrapper.models || wrapper.specifications;
    const nestedEntries = entriesOf(nestedSource);
    const nestedHasBadges = nestedEntries.some(({ value }) => text(value?.badgeImage));
    if (!wrapperBadge && nestedEntries.length > 1 && nestedHasBadges) {
      specificationEntries = nestedEntries;
    }
  }


  const labelNode = priceData.specificationLabels || findNode(priceData, 'specificationLabels')
    || findNode(json, 'specificationLabels') || {};
  const labelEntries = [];
  entriesOf(labelNode).forEach(({ key, value }) => labelEntries.push({ key, value }));
  if (labelNode && typeof labelNode === 'object' && !Array.isArray(labelNode)) {
    Object.entries(labelNode)
      .filter(([key]) => !/^item\d+$/.test(key))
      .forEach(([key, value]) => labelEntries.push({ key, value }));
  }


  const normalizeKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  const printable = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return text(value.text ?? value.value ?? value.label ?? value.title ?? value.html);
    }
    return text(value);
  };
  const findField = (object, aliases) => {
    if (!object || typeof object !== 'object') return '';
    const wanted = aliases.map(normalizeKey);
    const key = Object.keys(object).find((candidate) => wanted.includes(normalizeKey(candidate)));
    return key ? printable(object[key]) : '';
  };
  const getSpecLabel = ({ id, aliases }) => {
    const wanted = [id, ...aliases].map(normalizeKey);
    const match = labelEntries.find(({ key, value }) => {
      const valueId = text(value?.id || value?.key || value?.name);
      const valueLabel = printable(value?.label ?? value?.title ?? value?.value ?? value);
      return wanted.includes(normalizeKey(valueId || key))
        || wanted.includes(normalizeKey(valueLabel));
    });
    if (!match) return '';
    return printable(match.value?.label ?? match.value?.title ?? match.value?.value ?? match.value);
  };
  const unwrapSpecValues = (modelItem) => {
    const source = modelItem?.data || modelItem?.specificationData || modelItem?.specs || modelItem;
    if (!source || typeof source !== 'object') return {};
    const nested = itemsOf(source).find((item) => item && typeof item === 'object');
    return nested || source;
  };
  const getBadgeTitle = (modelItem, fallback) => {
    const raw = text(modelItem?.badgeImage || modelItem?.badgeTitle || modelItem?.title
      || modelItem?.modelName || modelItem?.name || modelItem?.label);
    if (!raw) return fallback;
    return raw.replace(/^\s*VX2\s*/i, '').trim();
  };


  const fallbackModels = BLOCK.defaults.models;
  const usedIds = new Set();
  const models = specificationEntries
    .map(({ key, value }, index) => {
      const item = value && typeof value === 'object' ? value : {};
      const fallbackModel = fallbackModels[index] || {};
      const rawId = text(item.id || item.modelId || item.key);
      let id = rawId || fallbackModel.id || key || `model-${index}`;
      if (usedIds.has(id)) id = `${id}-${index}`;
      usedIds.add(id);


      const valueNode = unwrapSpecValues(item);
      const modelSpecs = new Map();
      BLOCK.content.specRows.forEach((row) => {
        const aliases = [row.id, ...(row.aliases || [])];
        const value = findField(valueNode, aliases);
        const label = getSpecLabel(row);
        if (!label) issues.push(`specification label "${row.id}" missing from specificationLabels`);
        if (!value) issues.push(`spec "${row.id}" has no value for model "${id}"`);
        modelSpecs.set(row.id, { label, value });
      });


      return {
        id,
        label: getBadgeTitle(item, fallbackModel.label || `Model ${index + 1}`),
        badgeImage: text(item.badgeImage),
        isNew: item.isNew === true || text(item.isNew).toLowerCase() === 'true'
          || (!item.isNew && Boolean(fallbackModel.isNew)),
        itemSfId: text(item.itemSfId || item.itemSFId || item.item_sf_id) || fallbackModel.itemSfId || '',
        variantSfId: text(item.variantSfId || item.variantSFId || item.variant_sf_id)
          || fallbackModel.variantSfId || '',
        price: text(item.price) || fallbackModel.price || '',
        specs: modelSpecs,
        raw: item,
      };
    })
    .filter((model) => Boolean(model.label));


  if (!models.length) {
    issues.push('no model items could be read from priceandspec.specifications');
  }


  const apiLabelNode = priceData.label && typeof priceData.label === 'object'
    ? priceData.label
    : findNode(json, 'label') || priceData;
  const priceLabels = {
    priceBreakdown: text(apiLabelNode.title),
    showroom: text(apiLabelNode.exShowRoomLabel),
    pmDrive: text(apiLabelNode.pmEDriveLabel),
    stateSubsidy: text(apiLabelNode.stateSubsidyLabel),
    discounts: text(apiLabelNode.currentDiscountsLabel),
    effectivePrice: text(apiLabelNode.finalLabel),
  };
  Object.entries(priceLabels).forEach(([key, value]) => {
    if (!value) issues.push(`API price label \"${key}\" is missing`);
  });
  debugLog('API label object used for price labels', apiLabelNode);
  debugLog('normalized API price labels and notes', {
    priceLabels,
    note: text(apiLabelNode.notesOne),
    subsidyNote: text(apiLabelNode.notesTwo),
  });


  const specs = models[0]?.specs || new Map();
  if (!colors.length && !specs.size && !Object.values(priceLabels).some(Boolean)) {
    throw new ApiError(`No usable VX2 content. ${issues.join('; ')}`, 'shape');
  }


  return {
    defaultColorId,
    colors,
    models,
    specs,
    priceLabels,
    notes: {
      note: text(apiLabelNode.notesOne),
      subsidyNote: text(apiLabelNode.notesTwo),
    },
    issues,
    topKeys,
  };
};


const loadVx2Content = () => {
  if (!contentPromise) {
    const url = getVx2ContentUrl();
    if (!url) return Promise.reject(new ApiError('VX2 content URL could not be resolved', 'config'));
    contentPromise = fetchApi(url, 'vx2-content')
      .then(normalizeVx2Content)
      .catch((error) => {
        contentPromise = null; // allow retry on next call
        throw error;
      });
  }
  return contentPromise;
};


/* Default colour index: the colour whose id matches defaultColor, or 0. */
const defaultColorIndex = (content) => {
  const index = content ? content.colors.findIndex((c) => c.id === content.defaultColorId) : -1;
  return index >= 0 ? index : 0;
};


/* Mobile image when the screen is at or below the mobile breakpoint. */
const isMobileView = () => window.matchMedia(BLOCK.content.mobileQuery).matches;


/*
 * Image candidates for a colour, in preference order. The mobile image comes first on small
 * screens and the desktop image comes first otherwise. The other one is the fallback.
 */
const imageCandidates = (color) => {
  if (!color) return [];
  const ordered = isMobileView() ? [color.imageMob, color.image] : [color.image, color.imageMob];
  return ordered
    .filter(Boolean)
    .map((path) => getAPIEndpoint(path))
    .filter(Boolean);
};


/* Label from the API, falling back to the hardcoded label. */
const labelOf = (content, key) => text(content?.priceLabels?.[key]);


/* Note from the API (rich text), falling back to the hardcoded note. */
const appendNote = (element, content, key) => {
  const html = content?.notes?.[key];
  if (!html) return;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  element.append(...parsed.body.childNodes);
};


/* ============================================================
 * CITY MASTER
 * ============================================================ */
let cityMasterPromise = null;


/*
 * Accepts the flat shape [{ id, cityName, stateName, countryName, ... }] (current API)
 * and the legacy shape [{ state, cities: [] }]. Every row becomes a city entry.
 */
const normalizeCityMaster = (json) => {
  if (!Array.isArray(json)) {
    throw new ApiError('City master payload is not an array', 'shape');
  }


  const seen = new Set();
  const cities = [];


  const addCity = (row) => {
    const cityName = text(row.cityName);
    const stateName = text(row.stateName);
    if (!cityName || !stateName) return;


    const id = text(row.id) || `${cityName}~${stateName}`;
    const key = id.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);


    cities.push({
      id,
      cityName,
      stateName,
      countryName: text(row.countryName),
      latitude: text(row.latitude ?? row.latitde),
      longitude: text(row.longitude),
      defaultPartnerIdCity: text(row.defaultPartnerIdCity),
      defaultBranchIdCity: text(row.defaultBranchIdCity),
    });
  };


  json.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    if (typeof row.state === 'string' && Array.isArray(row.cities)) {
      row.cities.forEach((name) => addCity({
        cityName: name,
        stateName: row.state,
        countryName: row.country,
      }));
    } else {
      addCity(row);
    }
  });


  debugLog('city master normalised', { rawRows: json.length, usable: cities.length });
  if (!cities.length) throw new ApiError('City master has no usable rows', 'empty');


  return cities.sort((a, b) => a.stateName.localeCompare(b.stateName) || a.cityName.localeCompare(b.cityName));
};


const loadCityMaster = () => {
  if (!cityMasterPromise) {
    const url = getCityApiUrl();
    if (!url) return Promise.reject(new ApiError('City master URL could not be resolved', 'config'));
    cityMasterPromise = fetchApi(url, 'city-master')
      .then(normalizeCityMaster)
      .catch((error) => {
        cityMasterPromise = null; // allow retry on next call
        throw error;
      });
  }
  return cityMasterPromise;
};


const findCity = (cities, name) => {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return null;
  const exact = cities.find((c) => c.cityName.toLowerCase() === target);
  if (exact) return exact;
  return cities.find((c) => c.cityName.toLowerCase().includes(target)) || null;
};


/* ============================================================
 * PRICE LOADERS
 * ============================================================ */
let priceMasterPromise = null;
const detailedPriceCache = new Map();


/* Turns "1,40,000/-", "160990", "-" or "" into a number, or null when there is no amount. */
const toAmount = (value) => {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};


/* Returns the first amount that is not null. */
const firstAmount = (...values) => {
  const found = values.map(toAmount).find((value) => value !== null);
  return found === undefined ? null : found;
};


/*
 * Maps one price row to the shape the block uses.
 * Handles both the camelCase row (price master, some detailed responses)
 * and the snake_case object (detailed response).
 */
const mapPriceRow = (row) => ({
  effective: firstAmount(row.effective_onroad_price, row.effectivePrice, row.effective_price),
  exShowroom: firstAmount(row.ex_showroom_price, row.exShowRoomPrice, row.taxable_exshowroom_price),
  pmDrive: firstAmount(row.pmedrive_subsidy_amount, row.fame2IncentivePrice, row.fame_subsidy_amount),
  stateSubsidy: firstAmount(row.state_subsidy_amount, row.stateSubsidyPrice, row.state_subsidy),
  discount: firstAmount(row.discount_amount),
});


/* Price-master rows are kept intact because a city can have several variants. */
const buildPriceIndex = (json) => {
  if (!Array.isArray(json)) throw new ApiError('Price master payload is not an array', 'shape');
  const rows = json.filter((row) => row && typeof row === 'object' && text(row.city_state_id));
  debugLog('price master received', { rows: json.length, usableRows: rows.length });
  if (DEBUG_API_RESPONSE) console.table(rows.slice(0, 30).map((row) => ({
    city_state_id: row.city_state_id,
    item_name: row.item_name,
    variant_name: row.variant_name,
    item_sf_id: row.item_sf_id,
    variant_sf_id: row.variant_sf_id,
    effectivePrice: row.effectivePrice,
  })));
  if (!rows.length) throw new ApiError('Price master has no usable rows', 'empty');
  return rows;
};


const loadPriceMaster = () => {
  if (!priceMasterPromise) {
    const url = getPriceMasterApiUrl();
    debugLog('requesting production price master with fetch (not browser navigation)', { url });
    priceMasterPromise = fetchApi(url, 'price-master')
      .then(buildPriceIndex)
      .catch((error) => {
        priceMasterPromise = null;
        throw error;
      });
  }
  return priceMasterPromise;
};


/* Fetch detailed price for the IDs resolved from the selected city + selected tab label. */
const loadDetailedPrice = (url) => {
  if (!detailedPriceCache.has(url)) {
    const request = fetchApi(url, 'detailed-price').catch((error) => {
      detailedPriceCache.delete(url);
      throw error;
    });
    detailedPriceCache.set(url, request);
  }
  return detailedPriceCache.get(url);
};


const normalizeMatchText = (value) => text(value).toLowerCase().replace(/[^a-z0-9]/g, '');


const findPriceMasterRow = (rows, city, model) => {
  const cityRows = rows.filter((row) => text(row.city_state_id).toUpperCase() === text(city?.id).toUpperCase());
  const tabLabel = text(model.badgeImage || model.label);
  const tabKey = normalizeMatchText(tabLabel);
  const modelLabelKey = normalizeMatchText(model.label);
  debugLog('price master row matching started', {
    selected_City,
    cityId: city?.id,
    tabLabel,
    cityRows: cityRows.length,
  });
  const rowMatches = (row) => {
    const variantKey = normalizeMatchText(row.variant_name);
    const itemKey = normalizeMatchText(row.item_name);
    return (tabKey && (variantKey.includes(tabKey) || itemKey.includes(tabKey)
      || tabKey.includes(variantKey) || tabKey.includes(itemKey)))
      || (modelLabelKey && (variantKey.includes(modelLabelKey) || itemKey.includes(modelLabelKey)));
  };
  const matched = cityRows.find(rowMatches);
  if (!matched) {
    debugWarn('no price-master row matched selected city and tab label', {
      selected_City,
      cityId: city?.id,
      tabLabel,
      cityRows: cityRows.map((row) => ({ item_name: row.item_name, variant_name: row.variant_name })),
    });
    return null;
  }
  model.itemSfId = text(matched.item_sf_id);
  model.variantSfId = text(matched.variant_sf_id);
  debugLog('price master object selected for city + tab', {
    selected_City,
    cityId: city.id,
    tabLabel,
    item_sf_id: model.itemSfId,
    variant_sf_id: model.variantSfId,
    effectivePrice: matched.effectivePrice,
    selectedObject: matched,
  });
  return matched;
};


const lookupMasterPrice = async (city, model) => {
  try {
    const rows = await loadPriceMaster();
    const row = findPriceMasterRow(rows, city, model);
    if (!row) return null;
    return { row, breakdown: mapPriceRow(row) };
  } catch (error) {
    debugWarn('price master failed', { kind: error.kind, reason: error.message });
    return null;
  }
};


const lookupDetailedPrice = async (city, model) => {
  const url = getDetailedPriceApiUrl(city?.cityName, model.itemSfId, model.variantSfId);
  if (!url) {
    debugWarn('detailed price skipped because IDs are missing', {
      city: city?.cityName, itemSfId: model.itemSfId, variantSfId: model.variantSfId,
    });
    return null;
  }
  debugLog('generated detailed price URL', {
    selected_City,
    cityName: city.cityName,
    item_sf_id: model.itemSfId,
    variant_sf_id: model.variantSfId,
    url,
  });
  try {
    const json = await loadDetailedPrice(url);
    debugLog('detailed price API payload received', json);
    const rows = Array.isArray(json) ? json : [json];
    const row = rows.find((candidate) => candidate && typeof candidate === 'object'
      && (!candidate.variant_sf_id || text(candidate.variant_sf_id) === model.variantSfId)) || rows[0];
    if (!row || typeof row !== 'object') return null;
    return mapPriceRow(row);
  } catch (error) {
    debugWarn('detailed price failed', { kind: error.kind, reason: error.message, url });
    return null;
  }
};


/* Price master is the source of effectivePrice and Salesforce IDs; detailed API fills breakdown. */
const resolvePrice = async (city, model) => {
  if (!city) return null;
  const master = await lookupMasterPrice(city, model);
  if (!master) return null;
  const detailed = await lookupDetailedPrice(city, model);
  const breakdown = {
    effective: master.breakdown.effective ?? detailed?.effective ?? null,
    exShowroom: detailed?.exShowroom ?? master.breakdown.exShowroom,
    pmDrive: detailed?.pmDrive ?? master.breakdown.pmDrive,
    stateSubsidy: detailed?.stateSubsidy ?? master.breakdown.stateSubsidy,
    discount: detailed?.discount ?? master.breakdown.discount,
  };
  return { source: detailed ? 'price-master + detailed-price' : 'price-master', breakdown };
};


/* ============================================================
 * PUBLIC HELPER: selected city for the URL generation step
 * Usage: import { getSelectedCity } from './vida-pdp-specs.js';
 *        const city = getSelectedCity(blockElement);
 * ============================================================ */
const selectedCityByBlock = new WeakMap();
let selected_City = null;


export const getSelectedCity = (block) => {
  const city = selectedCityByBlock.get(block);
  return city ? { ...city } : null;
};


/* ============================================================
 * UI HELPERS
 * ============================================================ */
const hasAmount = (value) => value !== null && value !== undefined;


const currency = (amount) => (hasAmount(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—');


const makeElement = (tag, className, textContent) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
};


const makeButton = (className, textContent, label) => {
  const button = makeElement('button', className, textContent);
  button.type = 'button';
  if (label) button.setAttribute('aria-label', label);
  return button;
};


const priceKey = (city, model) => `${city?.id || ''}|${model.id}`;


/* ============================================================
 * BLOCK
 * ============================================================ */
function buildVidaPdpSpecs(block) {
  if (block.hasAttribute('data-vida-pdp-specs-ready')) return;
  block.setAttribute('data-vida-pdp-specs-ready', 'true');


  const { classes } = BLOCK;
  let modelList = BLOCK.defaults.models;
  const state = {
    modelId: BLOCK.defaults.model,
    selectedCity: null,
    cities: [],
    cityLoadFailed: false,
    cityQuery: '',
    cityOpen: false,
    priceOpen: false,
    colorIndex: 0,
    priceDetails: null,
    content: null,
    contentError: null,
  };


  // Image candidates currently assigned to the product image, and the one in use.
  let currentCandidates = [];
  let candidateIndex = 0;


  block.classList.add(classes.root);
  block.replaceChildren();
  block.append(makeElement('h2', classes.title, BLOCK.labels.pageTitle));


  /* ---------- Model tabs ---------- */
  const tabs = makeElement('div', classes.tabs);
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Choose scooter model');
  const tabButtons = new Map();
  block.append(tabs);


  /* ---------- Price panel ---------- */
  const pricePanel = makeElement('section', classes.pricePanel);
  pricePanel.id = `${classes.root}-panel`;
  pricePanel.setAttribute('aria-label', 'Product price');
  const priceCopy = makeElement('div', classes.priceCopy);
  const priceTitle = makeElement('h3', classes.priceTitle);


  const cityTrigger = makeButton(classes.cityTrigger, '', 'Choose state and city');
  cityTrigger.setAttribute('aria-haspopup', 'true');
  cityTrigger.setAttribute('aria-expanded', 'false');
  const cityName = makeElement('span', '', BLOCK.city.defaultCity);
  const cityArrow = makeElement('span', 'vida-pdp-specs__city-arrow');
  cityArrow.innerHTML = BLOCK.icons.chevronDown;
  cityTrigger.append(cityName, cityArrow);
  const citySelector = makeElement('span', 'vida-pdp-specs__city-selector');
  citySelector.append(cityTrigger);


  const modelLabel = makeElement('span', 'vida-pdp-specs__model-label', '');
  priceTitle.append(
    document.createTextNode('Your VX2 Plus '),
    modelLabel,
    document.createTextNode(' Price in '),
    citySelector,
  );
  priceCopy.append(priceTitle, makeElement('p', 'vida-pdp-specs__subtitle', BLOCK.labels.subtitle));


  /* ---------- City popover: search, count, full list ---------- */
  const cityPopover = makeElement('div', classes.cityPopover);
  cityPopover.hidden = true;


  const citySearchWrap = makeElement('label', 'vida-pdp-specs__search-wrap');
  citySearchWrap.append(makeElement('span', 'vida-pdp-specs__visually-hidden', BLOCK.labels.searchCity));
  const citySearch = makeElement('input', classes.citySearch);
  citySearch.type = 'search';
  citySearch.placeholder = BLOCK.labels.searchCity;
  citySearch.autocomplete = 'off';
  const searchIcon = makeElement('span', 'vida-pdp-specs__search-icon');
  searchIcon.innerHTML = BLOCK.icons.search;
  citySearchWrap.append(citySearch, searchIcon);


  const cityCount = makeElement('p', classes.cityCount);
  const cityList = makeElement('div', classes.cityList);
  cityList.setAttribute('role', 'listbox');
  cityList.style.maxHeight = BLOCK.city.listMaxHeight;
  cityList.style.overflowY = 'auto';
  cityPopover.append(citySearchWrap, cityList);
  citySelector.append(cityPopover);


  const dealership = makeElement('a', classes.dealership, BLOCK.labels.dealership);
  dealership.href = BLOCK.defaults.dealershipUrl;
  priceCopy.append(dealership);


  /* ---------- Price card ---------- */
  const priceCard = makeElement('div', classes.priceCard);
  const priceValue = makeElement('strong', classes.priceValue);
  const infoButton = makeButton(classes.infoButton, '', 'Show price breakdown');
  infoButton.innerHTML = BLOCK.icons.info;
  infoButton.setAttribute('aria-expanded', 'false');
  const pricePopover = makeElement('aside', classes.pricePopover);
  pricePopover.hidden = true;
  priceCard.append(priceValue, infoButton, pricePopover);
  pricePanel.append(priceCopy, priceCard);
  block.append(pricePanel);


  /* ---------- Media, colors, specs ---------- */
  const productMedia = makeElement('div', classes.productMedia);
  const productImage = makeElement('img', classes.productImage);
  productImage.loading = 'lazy';
  productImage.decoding = 'async';
  productMedia.append(productImage);
  block.append(productMedia);


  const colorPicker = makeElement('div', classes.colorPicker);
  const swatches = makeElement('div', classes.swatches);
  colorPicker.append(swatches);
  block.append(colorPicker);


  const specs = makeElement('div', classes.specs);
  specs.setAttribute('aria-label', 'Key specifications');
  block.append(specs);


  const allSpecs = makeElement('a', classes.allSpecs);
  allSpecs.href = BLOCK.defaults.specificationsUrl;
  allSpecs.append(document.createTextNode(BLOCK.labels.viewSpecs));
  const arrow = makeElement('span', classes.arrow);
  arrow.innerHTML = BLOCK.icons.chevron;
  allSpecs.append(arrow);
  block.append(allSpecs);
  attachSpecsOverlay(allSpecs);


  /* Image load events: log what is shown and try the other image once if one fails. */
  productImage.addEventListener('load', () => {
    debugLog('image loaded', { src: productImage.currentSrc, candidate: candidateIndex });
  });
  productImage.addEventListener('error', () => {
    const failed = currentCandidates[candidateIndex];
    candidateIndex += 1;
    const next = currentCandidates[candidateIndex];
    debugWarn('image failed to load', { failed, next: next || null });
    if (next) productImage.src = next;
    else productImage.removeAttribute('src');
  });


  const getModel = () => modelList.find((m) => m.id === state.modelId) || modelList[0];
  const getColors = () => state.content?.colors || [];
  const getCurrentColor = () => getColors()[state.colorIndex];


  /* ---------- Selected city: store, notify ---------- */
  const applySelectedCity = (city) => {
    state.selectedCity = city || null;
    selected_City = city?.cityName || '';
    debugLog('selected_City variable assigned', { selected_City, cityId: city?.id || null });
    if (city) selectedCityByBlock.set(block, { ...city });
    else selectedCityByBlock.delete(block);
    cityName.textContent = city?.cityName || BLOCK.city.defaultCity;
    debugLog('selected city assigned', getSelectedCity(block));
    block.dispatchEvent(new CustomEvent(BLOCK.city.changeEvent, {
      bubbles: true,
      detail: getSelectedCity(block),
    }));
  };


  /* ---------- Price rendering ---------- */
  const renderPriceHeadline = () => {
    const effective = state.priceDetails?.effective;
    priceValue.textContent = hasAmount(effective)
      ? `${currency(effective)}/-`
      : '';
  };


  const renderPriceDetails = () => {
    const data = state.priceDetails;
    const model = getModel();
    const { content } = state;
    pricePopover.replaceChildren();
    pricePopover.setAttribute('aria-label', labelOf(content, 'priceBreakdown'));


    const header = makeElement('div', 'vida-pdp-specs__price-popover-header', labelOf(content, 'priceBreakdown'));
    const closeButton = makeButton('vida-pdp-specs__close', '×', 'Close price breakdown');
    closeButton.addEventListener('click', () => {
      state.priceOpen = false;
      pricePopover.hidden = true;
      infoButton.setAttribute('aria-expanded', 'false');
    });
    header.append(closeButton);
    pricePopover.append(header);


    [
      [labelOf(content, 'showroom'), data?.exShowroom],
      [labelOf(content, 'pmDrive'), data?.pmDrive],
      [labelOf(content, 'stateSubsidy'), data?.stateSubsidy],
      [labelOf(content, 'discounts'), data?.discount],
    ].forEach(([label, value]) => {
      const row = makeElement('div', 'vida-pdp-specs__price-row');
      row.append(
        makeElement('span', '', label),
        makeElement('strong', '', currency(value)),
      );
      pricePopover.append(row);
    });


    const total = makeElement('div', 'vida-pdp-specs__price-total');
    total.append(
      makeElement('span', '', labelOf(content, 'effectivePrice')),
      makeElement('strong', '', hasAmount(data?.effective)
        ? currency(data.effective)
        : ''),
    );


    const note = makeElement('p', 'vida-pdp-specs__price-note');
    appendNote(note, content, 'note');
    const subsidyNote = makeElement('p', 'vida-pdp-specs__price-note');
    appendNote(subsidyNote, content, 'subsidyNote');
    pricePopover.append(total, note, subsidyNote);
  };


  const fetchPrice = async () => {
    const model = getModel();
    const city = state.selectedCity;
    const requestKey = priceKey(city, model);
    debugLog('price flow started', { selected_City, cityId: city?.id || null, tabLabel: model.badgeImage || model.label });


    state.priceDetails = null;
    renderPriceHeadline();


    const result = await resolvePrice(city, model);


    if (requestKey !== priceKey(state.selectedCity, getModel())) {
      debugLog('stale price response ignored', { requestKey });
      return;
    }


    state.priceDetails = result ? result.breakdown : null;
    renderPriceHeadline();
    renderPriceDetails();
    debugLog('price assigned', {
      city: city?.cityName,
      cityId: city?.id,
      model: model.id,
      variantSfId: model.variantSfId,
      source: result?.source || 'no matching API price',
      effective: state.priceDetails?.effective ?? null,
      breakdown: state.priceDetails,
    });
  };


  /* ---------- City list ---------- */
  // Every city, filtered by the search text. The search matches city or state name.
  const visibleCities = () => {
    const query = state.cityQuery.trim().toLowerCase();
    if (!query) return state.cities;
    return state.cities.filter((c) => (
      c.cityName.toLowerCase().includes(query)
      || c.stateName.toLowerCase().includes(query)
    ));
  };


  const selectCity = (city) => {
    applySelectedCity(city);
    state.cityQuery = '';
    citySearch.value = '';
    state.cityOpen = false;
    cityPopover.hidden = true;
    cityTrigger.setAttribute('aria-expanded', 'false');
    fetchPrice();
  };


  const renderCities = () => {
    cityList.replaceChildren();
    if (state.cityLoadFailed) {
      cityList.append(makeElement('p', 'vida-pdp-specs__city-hint', BLOCK.labels.loadError));
      cityCount.textContent = '';
      return;
    }


    const matches = visibleCities();
    cityCount.textContent = `${matches.length} of ${state.cities.length} cities`;


    if (!matches.length) {
      cityList.append(makeElement('p', 'vida-pdp-specs__city-hint', BLOCK.labels.noCities));
      return;
    }


    // Build all rows in one fragment, so every city is rendered in a single DOM update.
    const fragment = document.createDocumentFragment();
    const selectedId = state.selectedCity?.id;
    matches.forEach((city) => {
      const option = makeButton(classes.cityOption, '', `Select ${city.cityName}, ${city.stateName}`);
      option.setAttribute('role', 'option');
      option.append(
        document.createTextNode(city.cityName),
        makeElement('span', classes.cityOptionState),
      );
      const selected = city.id === selectedId;
      option.setAttribute('aria-selected', String(selected));
      option.classList.toggle(classes.selected, selected);
      option.addEventListener('click', () => selectCity(city));
      fragment.append(option);
    });
    cityList.append(fragment);
  };


  /* ---------- Specs ---------- */
  // Specification labels come from specificationLabels; values come from the selected model item.
  const buildSpecRows = () => BLOCK.content.specRows.map(({ icon, id }) => {
    const entry = getModel()?.specs?.get(id);
    if (!entry) debugWarn(`spec "${id}" missing from API content for model "${getModel()?.id || ''}"`);
    return {
      icon,
      id,
      title: entry?.label || '',
      value: entry?.value || '—',
    };
  });


  const renderSpecs = () => {
    const rows = buildSpecRows();
    specs.replaceChildren();
    rows.forEach((row) => {
      const item = makeElement('div', classes.spec);
      const icon = makeElement('span', classes.specIcon);
      icon.innerHTML = BLOCK.icons[row.icon] || BLOCK.icons.battery;
      const copy = makeElement('div', classes.specCopy);
      copy.append(
        makeElement('span', classes.specTitle, row.title),
        makeElement('strong', classes.specValue, row.value),
      );
      item.append(icon, copy);
      specs.append(item);
    });
    debugLog('specs assigned', rows);
  };


  /* ---------- Colour, image and swatches ---------- */
  const renderColorPicker = () => {
    const colors = getColors();
    const color = getCurrentColor();


    currentCandidates = imageCandidates(color);
    candidateIndex = 0;
    if (currentCandidates.length) productImage.src = currentCandidates[0];
    else productImage.removeAttribute('src');


    productImage.alt = color
      ? `${getModel().label} VIDA VX2 Plus in ${color.name}`
      : `${getModel().label} VIDA VX2 Plus`;
    debugLog('colour and image assigned', {
      colorIndex: state.colorIndex,
      colorId: color?.id,
      colorName: color?.name,
      colorCode: color?.colorCode,
      mobileView: isMobileView(),
      imageCandidates: currentCandidates,
    });


    swatches.replaceChildren();
    colors.forEach((c, index) => {
      const swatch = makeButton(classes.swatch, '', `Select ${c.name}`);
      swatch.style.setProperty('--swatch-color', c.colorCode);
      swatch.setAttribute('data-color-name', c.name);
      swatch.classList.toggle(classes.selected, index === state.colorIndex);
      swatch.setAttribute('aria-pressed', String(index === state.colorIndex));
      swatch.addEventListener('click', () => {
        state.colorIndex = index;
        renderModel();
      });
      swatches.append(swatch);
    });
  };


  const renderModel = () => {
    const model = getModel();
    tabButtons.forEach((button, id) => {
      const active = id === model.id;
      button.classList.toggle(classes.active, active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    modelLabel.textContent = model.label.replace('Plus ', '');
    cityName.textContent = state.selectedCity?.cityName || BLOCK.city.defaultCity;
    renderPriceHeadline();
    renderColorPicker();
    renderSpecs();
    renderPriceDetails();
  };


  /* ---------- Model tabs: titles and count are API-driven ---------- */
  const renderModelTabs = () => {
    tabs.replaceChildren();
    tabButtons.clear();
    modelList.forEach((model) => {
      const tabTitle = text(model.badgeImage || model.label);
      const displayTabLabel = tabTitle
        .replace(/^vida-pdp-specs-/i, '')
        .replace(/^VX2[_\s-]*/i, '')
        .replace(/[-_]?tab$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      const tab = makeButton(classes.tab, '', `Select ${displayTabLabel}`);
      tab.id = `${classes.root}-${model.id}-tab`;
      tab.setAttribute('role', 'tab');
      tab.append(document.createTextNode(displayTabLabel));
      if (model.isNew) tab.append(makeElement('span', classes.newTag, BLOCK.labels.new));
      tab.addEventListener('click', () => {
        state.modelId = model.id;
        renderModel();
        fetchPrice();
      });
      tabButtons.set(model.id, tab);
      tabs.append(tab);
    });
    debugLog('model tabs assigned from API', modelList.map(({ id, label, badgeImage }) => ({
      id, label, badgeImage,
    })));
  };


  /* ---------- Events ---------- */
  cityTrigger.addEventListener('click', () => {
    state.cityOpen = !state.cityOpen;
    cityPopover.hidden = !state.cityOpen;
    cityTrigger.setAttribute('aria-expanded', String(state.cityOpen));
    if (state.cityOpen) {
      renderCities();
      citySearch.focus();
    }
  });


  citySearch.addEventListener('input', () => {
    state.cityQuery = citySearch.value;
    renderCities();
  });


  infoButton.addEventListener('click', () => {
    state.priceOpen = !state.priceOpen;
    pricePopover.hidden = !state.priceOpen;
    infoButton.setAttribute('aria-expanded', String(state.priceOpen));
  });


  document.addEventListener('click', (event) => {
    if (!pricePanel.contains(event.target)) {
      state.cityOpen = false;
      cityPopover.hidden = true;
      cityTrigger.setAttribute('aria-expanded', 'false');
    }
    if (!priceCard.contains(event.target)) {
      state.priceOpen = false;
      pricePopover.hidden = true;
      infoButton.setAttribute('aria-expanded', 'false');
    }
  });


  window.matchMedia(BLOCK.content.mobileQuery).addEventListener('change', () => {
    renderColorPicker();
  });


  /* ---------- Load content, cities, then price ---------- */
  const loadContent = async () => {
    try {
      state.content = await loadVx2Content();
      if (state.content.models.length) {
        modelList = state.content.models;
        state.modelId = modelList.some((model) => model.id === BLOCK.defaults.model)
          ? BLOCK.defaults.model
          : modelList[0].id;
      }
      state.colorIndex = defaultColorIndex(state.content);
      if (state.content.issues.length) {
        debugWarn('VX2 content issues', state.content.issues);
      }
      debugLog('VX2 content assigned', {
        topKeys: state.content.topKeys,
        defaultColorId: state.content.defaultColorId,
        colorCount: state.content.colors.length,
        modelCount: state.content.models.length,
        models: state.content.models.map(({ id, label, badgeImage }) => ({ id, label, badgeImage })),
        priceLabels: state.content.priceLabels,
        notes: state.content.notes,
      });
      renderModelTabs();
    } catch (error) {
      state.contentError = error;
      console.error(`${LOG_TAG} VX2 content unavailable [${error.kind || 'unknown'}]:`, error.message);
    }
    renderModel();
    if (state.selectedCity) fetchPrice();
  };


  const loadCities = async () => {
    try {
      const cities = await loadCityMaster();
      state.cities = cities;
      state.cityLoadFailed = false;
      const start = findCity(cities, BLOCK.city.defaultCity) || cities[0] || null;
      applySelectedCity(start);
    } catch (error) {
      state.cities = [];
      state.cityLoadFailed = true;
      console.error(`${LOG_TAG} city list unavailable [${error.kind || 'unknown'}]:`, error.message);
    }
    renderCities();
    fetchPrice();
  };


  if (DEBUG) {
    window.vidaPdpDebug = {
      env: ENV,
      model: () => getModel(),
      apiLog: () => apiLog.slice(),
      apiTable: () => console.table(apiLog.map(({ name, status, ok, bytes, ms, error }) => ({
        name, status, ok, bytes, ms, error,
      }))),
      contentError: () => state.contentError,
      contentIssues: () => state.content?.issues || [],
      content: () => state.content,
      colors: () => getColors(),
      selectedColor: () => getCurrentColor() || null,
      images: () => ({
        mobileView: isMobileView(),
        candidates: currentCandidates,
        candidateIndex,
        currentSrc: productImage.currentSrc || null,
      }),
      specRows: () => buildSpecRows(),
      models: () => modelList.map((model) => ({
        id: model.id,
        label: model.label,
        badgeImage: model.badgeImage,
        specs: Object.fromEntries(model.specs),
      })),
      selectedCity: () => getSelectedCity(block),
      selected_City: () => selected_City,
      selectedPriceIds: () => ({ item_sf_id: getModel().itemSfId, variant_sf_id: getModel().variantSfId }),
      price: () => state.priceDetails,
      priceUrls: () => {
        const model = getModel();
        const city = state.selectedCity;
        return {
          contentApi: getVx2ContentUrl(),
          cityMaster: getCityApiUrl(),
          priceMaster: getPriceMasterApiUrl(),
          detailed: city ? getDetailedPriceApiUrl(city.cityName, model.itemSfId, model.variantSfId) : null,
        };
      },
      dump: () => {
        console.table(getColors());
        console.table(buildSpecRows());
        console.table(apiLog.map(({ name, status, ok, error }) => ({ name, status, ok, error })));
      },
      refreshPrice: () => fetchPrice(),
    };
    debugLog('block initialised', { env: ENV, model: state.modelId, api: API_OPTIONS });
  }


  renderModelTabs();
  renderModel();
  loadContent();
  loadCities();
}


export default function decorate(block) {
  buildVidaPdpSpecs(block);
}
