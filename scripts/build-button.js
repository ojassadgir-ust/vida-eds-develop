import { markTracked } from "./analytics.js";

export default function buildButton({
  label = '',
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type,
  trackingParams = {},
} = {}) {
  const buttonElement = document.createElement(href && !disabled ? 'a' : 'button');

  if (href && !disabled) {
    buttonElement.href = href;
  } else {
    buttonElement.type = 'button';
  }

  buttonElement.className = ['button', `button-${variant}`, `button-${size}`]
    .filter(Boolean)
    .join(' ');

  if (type) {
    buttonElement.type = type;
  }

  if (disabled) {
    buttonElement.classList.add('button-disabled');
    if (buttonElement.tagName === 'BUTTON') {
      buttonElement.disabled = true;
    } else {
      buttonElement.setAttribute('aria-disabled', 'true');
      buttonElement.removeAttribute('href');
      buttonElement.tabIndex = -1;
    }
  }

  const span = document.createElement('span');
  span.className = 'button-label';
  span.textContent = label;
  buttonElement.append(span);
  markTracked(buttonElement, { ...trackingParams });

  if (onClick && !disabled) buttonElement.addEventListener('click', onClick);

  return buttonElement;
}
