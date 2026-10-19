import { moveInstrumentation } from "../../scripts/scripts.js";
import buildInput from "../../scripts/common-components/build-input.js";
import attachAutoComplete from "../../scripts/common-components/build-autocomplete.js";
import { fetchCities } from "../../scripts/api/cities-api.js";
import buildButton from "../../scripts/common-components/build-button.js";
import { fetchDealers, fetchServiceStations } from "../../scripts/api/dealers-api.js";

const PARENT_ROWS = 10;

const cellOf = (row) => row.firstElementChild;
const textOf = (row) => cellOf(row)?.textContent?.trim() || '';

function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

function textEl(row, tag, cls) {
    const text = textOf(row);
    if (!text) return null;

    const el = makeEl(tag, cls, text);
    moveInstrumentation(cellOf(row), el);
    return el;
}

function buildStat(row) {
    const [statIcon, statLabel, statValue] = row.children;

    const stat = makeEl('div', 'reliable-services-stat');
    moveInstrumentation(row, stat);

    const icon = statIcon.querySelector('img');
    if (icon) {
        const wrapEl = makeEl('span', 'reliable-services-stat-icon');
        wrapEl.appendChild(icon);
        stat.appendChild(wrapEl);
    }

    const body = makeEl('div', 'reliable-services-stat-body');
    body.append(
        makeEl('p', 'reliable-services-stat-value', statValue.textContent.trim()),
        makeEl('p', 'reliable-services-stat-label', statLabel.textContent.trim()),
    );


    stat.appendChild(body);

    return stat;
}

function buildBadge(picRow, textRow) {
    const badge = makeEl('div', 'reliable-services-badge');

    const pic = cellOf(picRow)?.querySelector('picture');
    if (pic) {
        const pill = makeEl('span', 'reliable-services-badge-pill');
        pill.appendChild(pic);
        badge.appendChild(pill);
    }

    badge.appendChild(textEl(textRow, 'p', 'reliable-services-badge-text'));

    return badge;
}

function buildTop(rows) {
    const topSection = makeEl('div', 'reliable-services-top');

    const items = rows.slice(PARENT_ROWS).map(buildStat);

    items.splice(1, 0, buildBadge(rows[1], rows[2]));

    topSection.append(...items);

    return topSection;
}

function buildSearch(rows) {
    const url = textOf(rows[9]);
    const { wrapper, input } = buildInput({
        id: 'reliable-services-search',
        label: textOf(rows[4]),
        placeholder: textOf(rows[5]),
    });
    let latest = 0;
    const setCount = (value) => {
        const el = wrapper.closest('.reliable-services')?.querySelector('.reliable-services-count-value');
        if (el) el.textContent = value;
    }
    attachAutoComplete(input, {
        fetchOptions: (query) => fetchCities(query, url),
        onSelect: async (item) => {
            latest += 1;
            const id = latest;
            setCount('--');
            try {
                const stations =
                    await fetchServiceStations(
                        'https://dev.vidaworld.com/content/vida/in/en/sf-master/jcr:content.nearbybranches.',
                        item.city,
                    );
                if (id === latest) {
                    setCount(String(stations.length));
                }
            } catch (e) {
                if (id === latest) setCount('--');
            }
        },
    });

    input.addEventListener('input', () => {
        latest += 1;
        setCount('--');
    });
    wrapper.classList.add('reliable-services-search');

    return wrapper;
}

function buildCount(row) {
    const count = makeEl('div', 'reliable-services-count');
    count.append(textEl(row, 'p', 'reliable-services-count-label'),
        makeEl('span', 'reliable-services-count-value', '--'),
    );

    return count;
}

function buildDescription(row) {
    const desc = makeEl('div', 'reliable-services-description');
    desc.append(...cellOf(row).childNodes);

    return desc;
}

function buildCta(row) {
    const link = cellOf(row)?.querySelector('a');

    if (!link) return null;

    const button = buildButton({
        label: link.textContent.trim(),
        href: link.getAttribute('href'),
        variant: 'primary', size: 'md'
    });

    button.classList.add('reliable-services-cta');

    return button;
}

function buildCard(rows) {
    const card = makeEl('div', 'reliable-services-card');
    card.append(
        textEl(rows[4], 'h3', 'reliable-services-card-title'),
        buildSearch(rows),
        buildCount(rows[6]),
        buildDescription(rows[7]),
    );

    const cta = buildCta(rows[8]);
    if (cta) card.appendChild(cta);

    return card;
}

function buildMedia(row) {
    const media = makeEl('div', 'reliable-services-media');
    const pic = cellOf(row)?.querySelector('picture');
    if (pic) media.appendChild(pic);

    return media;
}

export default function decorate(block) {
    const rows = [...block.children];
    const top = buildTop(rows);
    const topBadge = top.querySelector('.reliable-services-badge');
    topBadge.classList.add('reliable-services-badge-top');

    const cardBadge = topBadge.cloneNode(true);
    cardBadge.classList.replace('reliable-services-badge-top', 'reliable-services-badge-card');

    const text = cardBadge.querySelector('.reliable-services-badge-text');
    [...text.attributes].forEach(a => {
        if (a.name.startsWith('data-')) {
            text.removeAttribute(a.name);
        }
    });

    const body = makeEl('div', 'reliable-services-body');
    body.append(cardBadge, buildCard(rows), buildMedia(rows[3]));

    block.replaceChildren(textEl(rows[0], 'h2', 'reliable-services-title'), top, body);
}