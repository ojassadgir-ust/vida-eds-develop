let carouselId = 0;

function getField(row, index) {
  return row.children[index] || null;
}

function getImage(field) {
  if (!field) return null;

  return field.querySelector('img');
}

function getFieldLink(field) {
  if (!field) return '';

  const link = field.querySelector('a');

  if (link?.href) {
    return link.href;
  }

  return field.textContent.trim();
}

function createSlide(row, index) {
  const slide = document.createElement('li');

  slide.className = 'banner-carousel-slide';
  slide.dataset.slideIndex = index;

  const desktopField = getField(row, 0);
  const mobileField = getField(row, 1);
  const bannerLinkField = getField(row, 2);

  const desktopImage = getImage(desktopField);
  const mobileImage = getImage(mobileField);

  const bannerLink = getFieldLink(
    bannerLinkField,
  );

  if (desktopImage || mobileImage) {
    const picture = document.createElement('picture');

    picture.className = 'banner-carousel-slide-image';

    if (mobileImage) {
      const source = document.createElement('source');

      source.media = '(max-width: 767px)';
      source.srcset = mobileImage.src;

      picture.append(source);
    }

    const image = desktopImage || mobileImage;

    image.classList.add(
      'banner-carousel-image',
    );

    image.removeAttribute('width');
    image.removeAttribute('height');

    picture.append(image);

    if (bannerLink) {
      const link = document.createElement('a');

      link.className = 'banner-carousel-slide-link';

      link.href = bannerLink;

      link.append(picture);
      slide.append(link);
    } else {
      slide.append(picture);
    }
  }

  return slide;
}

function updateIndicators(block, index) {
  const controls = block.querySelectorAll(
    '.banner-carousel-control',
  );

  controls.forEach((control, controlIndex) => {
    const isActive = controlIndex === index;

    control.classList.toggle(
      'is-active',
      isActive,
    );

    const button = control.querySelector(
      'button',
    );

    if (!button) return;

    if (isActive) {
      button.setAttribute(
        'aria-current',
        'true',
      );
    } else {
      button.removeAttribute(
        'aria-current',
      );
    }
  });
}

function updateActiveSlide(block, index) {
  const slides = block.querySelectorAll(
    '.banner-carousel-slide',
  );

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === index;

    slide.classList.toggle(
      'is-active',
      isActive,
    );

    slide.setAttribute(
      'aria-hidden',
      String(!isActive),
    );

    const links = slide.querySelectorAll(
      'a',
    );

    links.forEach((link) => {
      if (isActive) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute(
          'tabindex',
          '-1',
        );
      }
    });
  });

  updateIndicators(
    block,
    index,
  );

  block.dataset.activeIndex = index;
}

function showSlide(block, index) {
  const slides = block.querySelectorAll(
    '.banner-carousel-slide',
  );

  if (!slides.length) return;

  let newIndex = index;

  if (newIndex >= slides.length) {
    newIndex = 0;
  }

  if (newIndex < 0) {
    newIndex = slides.length - 1;
  }

  updateActiveSlide(
    block,
    newIndex,
  );
}

function stopAutoplay(block) {
  if (block.bannerCarouselTimer) {
    clearTimeout(
      block.bannerCarouselTimer,
    );

    block.bannerCarouselTimer = null;
  }
}

function startAutoplay(block) {
  stopAutoplay(block);

  block.bannerCarouselTimer = setTimeout(() => {
    const currentIndex = Number(
      block.dataset.activeIndex || 0,
    );

    showSlide(
      block,
      currentIndex + 1,
    );

    startAutoplay(block);
  }, 7000);
}

function restartAutoplay(block) {
  stopAutoplay(block);
  startAutoplay(block);
}

function createIndicators(
  block,
  count,
) {
  const nav = document.createElement('nav');

  nav.className = 'banner-carousel-controls';

  nav.setAttribute(
    'aria-label',
    'Banner carousel controls',
  );

  const indicators = document.createElement('ol');

  indicators.className = 'banner-carousel-indicators';

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const control = document.createElement('li');

    control.className = 'banner-carousel-control';

    const button = document.createElement('button');

    button.type = 'button';

    button.setAttribute(
      'aria-label',
      `Go to banner ${index + 1}`,
    );

    button.dataset.targetSlide = index;

    button.addEventListener(
      'click',
      () => {
        const targetIndex = Number(
          button.dataset.targetSlide,
        );

        showSlide(
          block,
          targetIndex,
        );

        restartAutoplay(block);
      },
    );

    control.append(button);
    indicators.append(control);
  }

  nav.append(indicators);
  block.append(nav);
}

function bindEvents(block) {
  block.addEventListener(
    'mouseenter',
    () => {
      stopAutoplay(block);
    },
  );

  block.addEventListener(
    'mouseleave',
    () => {
      startAutoplay(block);
    },
  );

  block.addEventListener(
    'focusin',
    () => {
      stopAutoplay(block);
    },
  );

  block.addEventListener(
    'focusout',
    () => {
      startAutoplay(block);
    },
  );

  block.addEventListener(
    'touchstart',
    () => {
      stopAutoplay(block);
    },
    {
      passive: true,
    },
  );

  block.addEventListener(
    'touchend',
    () => {
      startAutoplay(block);
    },
    {
      passive: true,
    },
  );
}

export default function decorate(block) {
  const isAuthor = window?.origin !== undefined
    && window.origin.includes('author');

  if (isAuthor) {
    return;
  }

  carouselId += 1;

  block.id = `banner-carousel-${carouselId}`;

  const rows = [
    ...block.querySelectorAll(
      ':scope > div',
    ),
  ];

  if (!rows.length) {
    return;
  }

  block.setAttribute(
    'role',
    'region',
  );

  block.setAttribute(
    'aria-roledescription',
    'Carousel',
  );

  block.setAttribute(
    'aria-label',
    'Banner carousel',
  );

  const slidesContainer = document.createElement('div');

  slidesContainer.className = 'banner-carousel-slides-container';

  const slides = document.createElement('ul');

  slides.className = 'banner-carousel-slides';

  rows.forEach((row, index) => {
    const slide = createSlide(
      row,
      index,
    );

    slides.append(slide);
    row.remove();
  });

  slidesContainer.append(slides);
  block.prepend(slidesContainer);

  createIndicators(
    block,
    rows.length,
  );

  updateActiveSlide(
    block,
    0,
  );

  if (rows.length > 1) {
    bindEvents(block);
    startAutoplay(block);
  }
}
