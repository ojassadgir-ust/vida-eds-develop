let carouselId = 0;

function updateActiveSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-slide');
  const indicators = block.querySelectorAll(
    '.carousel-slide-indicator',
  );

  slides.forEach((slide, index) => {
    const isActive = index === slideIndex;

    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));

    slide.querySelectorAll('a').forEach((link) => {
      if (isActive) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  });

  indicators.forEach((indicator, index) => {
    const button = indicator.querySelector('button');
    const isActive = index === slideIndex;

    indicator.classList.toggle('active', isActive);

    if (isActive) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  block.dataset.activeSlide = slideIndex;
}

function showSlide(block, slideIndex, smooth = true) {
  const slides = block.querySelectorAll('.carousel-slide');

  if (!slides.length) {
    return;
  }

  let newIndex = slideIndex;

  if (newIndex >= slides.length) {
    newIndex = 0;
  }

  if (newIndex < 0) {
    newIndex = slides.length - 1;
  }

  const activeSlide = slides[newIndex];
  const slidesWrapper = block.querySelector('.carousel-slides');

  updateActiveSlide(block, newIndex);

  if (slidesWrapper && activeSlide) {
    const scrollPosition = activeSlide.offsetLeft
      - (slidesWrapper.clientWidth - activeSlide.clientWidth) / 2;

    slidesWrapper.scrollTo({
      left: scrollPosition,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }
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

function restartAutoplay(block) {
  stopAutoplay(block);
  startAutoplay(block);
}

function createSlide(column, index, id) {
  const slide = document.createElement('li');

  slide.classList.add('carousel-slide');
  slide.dataset.slideIndex = index;
  slide.id = `banner-carousel-${id}-slide-${index}`;
  slide.setAttribute('aria-hidden', 'true');

  while (column.firstElementChild) {
    slide.append(column.firstElementChild);
  }

  const imageWrapper = slide.querySelector(
    ':scope > div:first-child',
  );

  if (imageWrapper) {
    imageWrapper.classList.add('carousel-slide-image');
  }

  const contentWrapper = slide.querySelector(
    ':scope > div:nth-child(2)',
  );

  if (contentWrapper) {
    contentWrapper.classList.add('carousel-slide-content');
  }

  return slide;
}

function createIndicators(block, slideCount) {
  const nav = document.createElement('nav');

  nav.classList.add('carousel-slide-controls');

  nav.setAttribute(
    'aria-label',
    'Banner carousel controls',
  );

  const indicators = document.createElement('ol');

  indicators.classList.add('carousel-slide-indicators');

  for (let index = 0; index < slideCount; index += 1) {
    const indicator = document.createElement('li');

    indicator.classList.add('carousel-slide-indicator');
    indicator.dataset.targetSlide = index;

    const button = document.createElement('button');

    button.type = 'button';

    button.setAttribute(
      'aria-label',
      `Go to banner ${index + 1} of ${slideCount}`,
    );

    button.addEventListener('click', () => {
      showSlide(block, index);
      restartAutoplay(block);
    });

    indicator.append(button);
    indicators.append(indicator);
  }

  nav.append(indicators);
  block.append(nav);
}

function bindEvents(block) {
  block.addEventListener('mouseenter', () => {
    stopAutoplay(block);
  });

  block.addEventListener('mouseleave', () => {
    startAutoplay(block);
  });

  block.addEventListener('focusin', () => {
    stopAutoplay(block);
  });

  block.addEventListener('focusout', () => {
    startAutoplay(block);
  });
}

export default function decorate(block) {
  carouselId += 1;

  block.id = `banner-carousel-${carouselId}`;

  /*
   * Every direct child is one banner column.
   */
  const columns = [
    ...block.querySelectorAll(':scope > div'),
  ];

  if (!columns.length) {
    return;
  }

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

  slidesContainer.classList.add(
    'carousel-slides-container',
  );

  const slidesWrapper = document.createElement('ul');

  slidesWrapper.classList.add('carousel-slides');

  columns.forEach((column, index) => {
    const slide = createSlide(
      column,
      index,
      carouselId,
    );

    slidesWrapper.append(slide);

    column.remove();
  });

  slidesContainer.append(slidesWrapper);

  block.prepend(slidesContainer);

  /*
   * Create one dot for every column.
   */
  createIndicators(
    block,
    columns.length,
  );

  /*
   * Show first banner.
   */
  showSlide(block, 0, false);

  bindEvents(block);

  startAutoplay(block);
}
