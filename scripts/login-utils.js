const SESSION_COOKIE = 'SESSION_TOKEN';
const COOKIES = {
  accountId: 'ACCOUNT_ID',
  leadId: 'LEAD_ID',
  custNum: 'CUS_NUM',
  opportunityId: 'OPPORTUNITY_ID',
  locationData: 'ADOBE_ANALYTICS_LOCATION_DATA',
}
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

export function isLoggedIn() {
  const prefix = `${SESSION_COOKIE}=`;
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(prefix));
}

export function setUserLoggedIn(token, days) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'path=/',
    'secure',
    'samesite=strict',
  ];

  if (days) {
    const milliseconds = days * 24 * 60 * 60 * 1000;
    const expiry = new Date(Date.now() + milliseconds);
    parts.push(`expires=${expiry.toUTCString()}`);
  }

  document.cookie = parts.join('; ');
}

export function clearSessionToken() {
  document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/`;
}

export function logout(e) {
  if (e) e.preventDefault();
  clearSessionToken();
  window.location.reload();
}

export function getCookie(name) {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}

const clean = (v) => (v && v !== 'null' ? v.trim() : '');

const isJwtLike = (v) => JWT_PATTERN.test(v);

export function getVidaID() {
  const leadID = clean(getCookie(COOKIES.leadId));

  return {
    accountID: clean(getCookie(COOKIES.accountId)),
    leadID: isJwtLike(leadID),
    custNum: clean(getCookie(COOKIES.custNum)),
    opportunityID: clean(getCookie(COOKIES.opportunityId)),
  };
}

export function getVidaLocation() {
  const [city = '', state = '', country = '', pinCode = ''] = clean(getCookie(COOKIES.locationData)).split('|');

  return { pinCode, city, state, country }
}