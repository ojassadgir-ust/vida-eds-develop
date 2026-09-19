let carouselId = 0;

function getField(item, index) {
  return item.children[index] || null;
}

function getImage(field) {
  if (!field) return null;

  return field.querySelector('img');
}

function getFieldText(field) {
  if (!field) return '';

  return field.textContent.trim();
}

function getFieldLink(field) {
  if (!field) return '';

  const link = field.querySelector('a');

  if (link?.href) {
    return link.href;
  }

  return field.textContent.trim();
}

function createSlide(item, index, id) {
  const slide = document.createElement('li');

  slide.className = 'carousel-slide';
  slide.dataset.slideIndex = index;
  slide.id = `banner-carousel-${id}-slide-${index}`;

  /*
   * Authoring order:
   *
   * 0 = Desktop Feature Image
   * 1 = Mobile Feature Image
   * 2 = CTA Label
   * 3 = CTA Link
   */

  const desktopField = getField(item, 0);
  const mobileField = getField(item, 1);
  const ctaLabelField = getField(item, 2);
  const ctaLinkField = getField(item, 3);

  const desktopImage = getImage(desktopField);
  const mobileImage = getImage(mobileField);

  /*
   * Banner image
   */

  if (desktopImage || mobileImage) {
    const picture = document.createElement('picture');

    picture.className = 'carousel-slide-picture';

    if (mobileImage) {
      const source = document.createElement('source');

      source.media = '(max-width: 767px)';
      source.srcset = mobileImage.src;

      picture.append(source);
    }

    const image = desktopImage || mobileImage;

    image.classList.add('carousel-slide-image');

    image.removeAttribute('width');
    image.removeAttribute('height');

    picture.append(image);
    slide.append(picture);
  }

  /*
   * CTA
   */

  const ctaLabel = getFieldText(ctaLabelField);
  const ctaLink = getFieldLink(ctaLinkField);

  if (ctaLabel && ctaLink) {
    const ctaWrapper = document.createElement('div');

    ctaWrapper.className = 'carousel-slide-cta-wrapper';

    const cta = document.createElement('a');

    cta.className = 'carousel-slide-cta';
    cta.href = ctaLink;
    cta.textContent = ctaLabel;

    ctaWrapper.append(cta);
    slide.append(ctaWrapper);
  }

  return slide;
}

function updateActiveSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-slide');
  const indicators = block.querySelectorAll(
    '.carousel-slide-indicator',
  );

  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === index;

    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', String(!active));

    slide.querySelectorAll('a').forEach((link) => {
      if (active) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  });

  indicators.forEach((indicator, indicatorIndex) => {
    const button = indicator.querySelector('button');
    const active = indicatorIndex === index;

    indicator.classList.toggle('active', active);

    if (active) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  block.dataset.activeSlide = index;
}

function showSlide(block, index, smooth = true) {
  const slides = block.querySelectorAll('.carousel-slide');
  const wrapper = block.querySelector('.carousel-slides');

  if (!slides.length || !wrapper) return;

  let newIndex = index;

  if (newIndex >= slides.length) {
    newIndex = 0;
  }

  if (newIndex < 0) {
    newIndex = slides.length - 1;
  }

  const slide = slides[newIndex];

  updateActiveSlide(block, newIndex);

  wrapper.scrollTo({
    left: slide.offsetLeft,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

function stopAutoplay(block) {
  if (block.carouselTimer) {
    clearInterval(block.carouselTimer);
    block.carouselTimer = null;
  }
}

function startAutoplay(block) {
  stopAutoplay(block);

  block.carouselTimer = setInterval(() => {
    const currentIndex = parseInt(
      block.dataset.activeSlide || '0',
      10,
    );

    showSlide(block, currentIndex + 1);
  }, 5000);
}

function createIndicators(block, count) {
  const nav = document.createElement('nav');

  nav.className = 'carousel-slide-controls';
  nav.setAttribute(
    'aria-label',
    'Banner carousel controls',
  );

  const indicators = document.createElement('ol');

  indicators.className = 'carousel-slide-indicators';

  for (let index = 0; index < count; index += 1) {
    const indicator = document.createElement('li');

    indicator.className = 'carousel-slide-indicator';

    const button = document.createElement('button');

    button.type = 'button';
    button.setAttribute(
      'aria-label',
      `Go to banner ${index + 1}`,
    );

    button.addEventListener('click', () => {
      showSlide(block, index);
      startAutoplay(block);
    });

    indicator.append(button);
    indicators.append(indicator);
  }

  nav.append(indicators);
  block.append(nav);
}

export default function decorate(block) {
  carouselId += 1;

  block.id = `banner-carousel-${carouselId}`;

  const items = [
    ...block.querySelectorAll(':scope > div'),
  ];

  if (!items.length) return;

  block.setAttribute('role', 'region');
  block.setAttribute(
    'aria-roledescription',
    'Carousel',
  );
  block.setAttribute(
    'aria-label',
    'Banner carousel',
  );

  const slidesContainer = document.createElement('div');

  slidesContainer.className = 'carousel-slides-container';

  const slidesWrapper = document.createElement('ul');

  slidesWrapper.className = 'carousel-slides';

  items.forEach((item, index) => {
    const slide = createSlide(
      item,
      index,
      carouselId,
    );

    slidesWrapper.append(slide);
    item.remove();
  });

  slidesContainer.append(slidesWrapper);
  block.prepend(slidesContainer);

  createIndicators(block, items.length);

  showSlide(block, 0, false);

  startAutoplay(block);
}
