export default function buildInput({
    id,
    name = id,
    label = '',
    type = 'text',
    placeholder = '',
    required = false,
    inputMode = '',
    autocomplete = 'off',
    maxLength = '',
}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'vida-field';

    const labelElement = document.createElement('label');
    labelElement.className = 'vida-field-label';
    labelElement.htmlFor = id;
    labelElement.textContent = label;

    if (required) {
        const reqStar = document.createElement('span');
        reqStar.className = 'vida-field-required';
        reqStar.setAttribute('aria-hidden', 'true');
        reqStar.textContent = '*';
        labelElement.append(reqStar);
    }

    const input = document.createElement('input');
    input.className = 'vida-field-input';
    input.id = id;
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    input.autocomplete = autocomplete;
    if (inputMode) input.inputMode = inputMode;
    if (maxLength) input.maxLength = maxLength;
    if (required) input.setAttribute('aria-required', 'true');

    const errorText = document.createElement('p');
    errorText.className = 'vida-field-error-text';
    errorText.id = `${id}-error`;
    errorText.hidden = true;

    wrapper.append(labelElement, input, errorText);

    const setError = (errorMessage = '') => {
        errorText.textContent = errorMessage;
        errorText.hidden = false;
        wrapper.classList.add('vida-field--error');
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errorText.id);
    };

    const clearError = () => {
        errorText.textContent = '';
        errorText.hidden = true;
        wrapper.classList.remove('vida-field--error');
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
    };

    return {
        wrapper, input, setError, clearError
    }
}