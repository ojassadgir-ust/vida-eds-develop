export default function attachAutoComplete(input, options) {
    const { fetchOptions, onSelect = () => {}, onLoadError } = options;
    let items = [];
    let active = -1;
    let requestId = 0;
    let failed = false;

    const combo = document.createElement('div');
    combo.className = 'vida-autocomplete-combo';
    input.replaceWith(combo);

    const list = document.createElement('ul');
    list.className = 'vida-autocomplete-options';
    list.id = `${input.id}-listbox`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    combo.append(input, list);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');

    const close = () => {
        list.hidden = true;
        active = -1;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
    };

    const highlight = (i) => {
        active = i;
        [...list.children].forEach((li, n) => {
            const on = n === i;
            li.classList.toggle('vida-autocomplete-option--active', on);
            li.setAttribute('aria-selected', String(on));

            if (on) {
                input.setAttribute('aria-activedescendant', li.id);
                li.scrollIntoView({ block: 'nearest' });
            }
        });
    };

    const choose = (i) => {
        const item = items[i];
        input.value = item.label;
        input.dataset.picked = item.label;
        close();
        onSelect(item);
    };

    const render = () => {
        list.replaceChildren(
            ...items.map((item, i) => {
                const li = document.createElement('li');
                li.id = `${list.id}-${i}`;
                li.className = 'vida-autocomplete-option';
                li.setAttribute('role', 'option');
                li.textContent = item.label;
                li.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    choose(i);
                });
                return li;
            }),
        );
        input.removeAttribute('aria-activedescendant');
        list.hidden = items.length === 0;
        input.setAttribute('aria-expanded', String(items.length > 0));
    };

    input.addEventListener('input', async () => {
        delete input.dataset.picked;
        requestId += 1;
        const id = requestId;

        let results;
        try {
            results = await fetchOptions(input.value);
        } catch (e) {
            if (id !== requestId) return;
            items = [];
            active = -1;
            render();
            failed = true;
            if (onLoadError) onLoadError(true);
            return;
        }

        if (id !== requestId) return;

        items = results;
        active = -1;
        render();

        if (failed) {
            failed = false;
            if (onLoadError) onLoadError(false);
        }

        const typed = input.value.trim().toLowerCase();
        const exact = typed ? results.filter((r) => r.label.toLowerCase() === typed) : [];
        if (exact.length === 1) {
            input.dataset.picked = input.value;
            onSelect(exact[0]);
        }
    });

    input.addEventListener('keydown', (e) => {
        if (list.hidden) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlight((active + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlight(active <= 0 ? items.length - 1 : active - 1);
        } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            choose(active);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
        }
    });

    input.addEventListener('blur', close);
}