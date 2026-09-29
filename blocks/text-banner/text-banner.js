export default function decorate(block) {
  const content = block.querySelector(':scope > div > div');

  if (content) content.classList.add('text-banner-text');
}
