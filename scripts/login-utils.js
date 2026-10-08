const SESSION_COOKIE = 'SESSION_TOKEN';

export default function isLoggedIn() {
  const prefix = `${SESSION_COOKIE}=`;
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(prefix));
}
