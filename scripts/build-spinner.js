export function showSpinner(parent, mode) {
  const loader = document.createElement('div');
  loader.className = 'vida-spinner-loader';
  loader.setAttribute('role', 'status');

  if (mode === 'action') {
    loader.classList.add('vida-spinner-loader-sm');
    loader.setAttribute('aria-label', 'Loading');

    parent.append(loader);
    return () => loader.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'vida-spinner-wrapper';
  const text = document.createElement('p');
  text.className = 'vida-spinner-text';
  text.textContent = 'Loading...';
  wrapper.append(loader, text);
  parent.append(wrapper);
  return () => wrapper.remove();
}
