export default function toWebp(src, width) {
  const url = new URL(src, window.location.href);
  if (!url.pathname.includes('/media_')) return src;
  url.searchParams.set('format', 'webply');
  url.searchParams.set('width', width);
  return url.href;
}
