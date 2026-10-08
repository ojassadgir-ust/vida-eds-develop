const SESSION_COOKIE = 'SESSION_TOKEN';

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
