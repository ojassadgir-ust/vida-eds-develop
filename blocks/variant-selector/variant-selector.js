import { moveInstrumentation } from "../../scripts/scripts.js"
import buildButton from "../../scripts/build-button.js"

function buildSlide(row, index, total, tagline) {
    const [imageCell, titleCell, descriptionCell, ctaLinkCell, ctaTextCell] = [...row.children];

    const slide = document.createElement('div');
    slide.className = 'vida-variant-selector-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${total}`);
    moveInstrumentation(row, slide);

    const content = document.createElement('div');
    content.className = 'vida-variant-selector-slide-content';

    if (tagline) {
        const tag = document.createElement('p');
        tag.className = 'vida-variant-selector-tagline';
        tag.textContent = tagline;
        content.append(tag);
    }

    const titleText = titleCell?.textContent.trim();
    if (titleText) {
        const title = document.createElement('h2');
        title.className = 'vida-variant-selector-title';
        title.textContent = titleText;
        moveInstrumentation(titleCell, title);
        content.append(title);
    }

    const descriptionText = descriptionCell?.textContent.trim();
    if (descriptionText) {
        const description = document.createElement('div');
        description.className = 'vida-variant-selector-description';
        description.append(...descriptionCell.childNodes);
        moveInstrumentation(descriptionCell, description);
        content.append(description);
    }

    const ctaLabel = ctaTextCell?.textContent?.trim();
    const ctaHref = ctaLinkCell?.textContent?.trim();

    if (ctaLabel && ctaHref) {
        const cta = buildButton({ label: ctaLabel, href: ctaHref });
        cta.classList.add('vida-variant-selector-cta');
        content.append(cta);
    }

    const media = document.createElement('div');
    media.className = 'vida-variant-selector-media';
    const picture = imageCell?.querySelector('picture');

    if (picture) media.append(picture);

    slide.append(content, media);

    return slide;
}

function buildControls() {
    const controls = document.createElement('div');
    controls.className = 'vida-variant-selector-controls';

    const makeBtn = (direction, label) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `vida-variant-selector-control-btn vida-variant-selector-control-btn-${direction}`;
        btn.setAttribute('aria-label', label);

        return btn;
    }

    const prevBtn = makeBtn('prev', 'Previous slide');
    const nextBtn = makeBtn('next', 'Next slide');

    controls.append(prevBtn, nextBtn);

    return { controls, prevBtn, nextBtn };
}

export default function decorate(block) {
    const rows = [...block.children];

    const taglineRow = rows[0]?.children.length === 1 ? rows[0] : null;
    const slideRows = taglineRow ? rows.slice(1) : rows;
    const total = slideRows.length;
    if (!total) return;

    const tagline = taglineRow?.textContent?.trim() || '';

    const track = document.createElement('div');
    track.className = 'vida-variant-selector-track';
    track.setAttribute('aria-live', 'polite');

    const slides = slideRows.map((row, i) => buildSlide(row, i, total, tagline));
    track.append(...slides);

    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', 'Vehicle variants');

    if (total < 2) {
        block.replaceChildren(track);
        return;
    }

    block.setAttribute('aria-roledescription', 'carousel');

    const { controls, prevBtn: prev, nextBtn: next } = buildControls();
    block.replaceChildren(track, controls);

    let current = 0;

    function goTo(i) {
        current = Math.max(0, Math.min(i, total - 1));
        slides.forEach((slide, idx) => {
            slide.hidden = idx !== current;
        });
        prev.setAttribute('aria-disabled', String(current === 0));
        next.setAttribute('aria-disabled', String(current === total - 1));

        [current - 1, current + 1].forEach((n) => {
            slides[n]?.querySelector('img').setAttribute('loading', 'eager');
        })
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    block.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                goTo(current - 1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                goTo(current + 1);
                break;
            default:
                break;
        }
    });

    goTo(0);
}