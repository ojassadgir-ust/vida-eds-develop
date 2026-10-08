const SESSION_COOKIE = 'SESSION_TOKEN';

export function isLoggedIn() {
    const prefix = `${SESSION_COOKIE}=`;
    console.log(document.cookie.split('; '));
    return document.cookie.split('; ').some((cookie) => cookie.startsWith(prefix) );
}