let bannerCarouselId = 0;

function updateActiveSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.banner-carousel-slide');
  const indicators = block.querySelectorAll('.banner-carousel-control');

  if (!slides.length) return;

  const realIndex = ((slideIndex % slides.length) + slides.length) % slides.length;

  block.dataset.activeIndex = realIndex;

  slides.forEach((slide, index) => {
    const isActive = index === realIndex;

    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    slide.setAttribute('tabindex', isActive ? '0' : '-1');

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
    const isActive = index === realIndex;

    indicator.classList.toggle('is-active', isActive);

    if (button) {
      button.setAttribute(
        'aria-current',
        isActive ? 'true' : 'false',
      );

      button.disabled = isActive;
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.banner-carousel-slide');

  if (!slides.length) return;

  const realIndex = ((slideIndex % slides.length) + slides.length) % slides.length;

  updateActiveSlide(block, realIndex);
}

function createCta(labelColumn, linkColumn, slideIndex, isPlaceholder) {
  const label = labelColumn?.textContent.trim() || '';
  const linkElement = linkColumn?.querySelector('a');

  const href = linkElement?.getAttribute('href')
    || linkColumn?.textContent.trim()
    || '';

  if (!label && !href && !isPlaceholder) {
    return null;
  }

  const cta = document.createElement('a');

  cta.classList.add('banner-carousel-cta');

  cta.textContent = label || 'CTA';
  cta.href = href || '#';

  if (!href) {
    cta.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  cta.setAttribute('aria-label', label || `Banner ${slideIndex + 1} CTA`);

  return cta;
}

function createSlide(row, slideIndex, carouselId, isPlaceholder = false) {
  const slide = document.createElement('article');

  slide.classList.add('banner-carousel-slide');

  slide.dataset.slideIndex = slideIndex;

  slide.id = `banner-carousel-${carouselId}-slide-${slideIndex}`;

  slide.setAttribute('role', 'tabpanel');
  slide.setAttribute('aria-label', `Banner ${slideIndex + 1}`);
  slide.setAttribute('aria-hidden', slideIndex === 0 ? 'false' : 'true');
  slide.setAttribute('tabindex', slideIndex === 0 ? '0' : '-1');

  const columns = row.querySelectorAll(':scope > div');

  const desktopImageColumn = columns[0];
  const mobileImageColumn = columns[1];
  const ctaLabelColumn = columns[2];
  const ctaLinkColumn = columns[3];

  /* -------------------------------------------
     Desktop image
  ------------------------------------------- */

  const imageContainer = document.createElement('div');

  imageContainer.classList.add('banner-carousel-slide-image');

  if (desktopImageColumn) {
    const picture = desktopImageColumn.querySelector('picture');
    const image = desktopImageColumn.querySelector('img');

    if (picture) {
      imageContainer.append(picture);
    } else if (image) {
      imageContainer.append(image);
    }
  }

  /* -------------------------------------------
     Mobile image
  ------------------------------------------- */

  const mobileImageContainer = document.createElement(
    'div',
  );

  mobileImageContainer.classList.add(
    'banner-carousel-slide-mobile-image',
  );

  if (mobileImageColumn) {
    const mobilePicture = mobileImageColumn.querySelector('picture');
    const mobileImage = mobileImageColumn.querySelector('img');

    if (mobilePicture) {
      mobileImageContainer.append(mobilePicture);
    } else if (mobileImage) {
      mobileImageContainer.append(mobileImage);
    }
  }

  /* -------------------------------------------
     Add mobile image as <source>
  ------------------------------------------- */

  const desktopImage = imageContainer.querySelector('img');
  const mobileImage = mobileImageContainer.querySelector('img');

  if (desktopImage) {
    desktopImage.classList.add('banner-carousel-image');

    let picture = desktopImage.closest('picture');

    if (!picture) {
      picture = document.createElement('picture');

      desktopImage.replaceWith(picture);

      picture.append(desktopImage);
    }

    if (mobileImage) {
      const mobileSource = document.createElement('source');

      mobileSource.media = '(max-width: 767px)';
      mobileSource.srcset = mobileImage.currentSrc || mobileImage.src;

      picture.prepend(mobileSource);
    }
  }

  /* -------------------------------------------
     Placeholder image
  ------------------------------------------- */

  if (!desktopImage && isPlaceholder) {
    const placeholder = document.createElement('span');

    placeholder.classList.add(
      'banner-carousel-placeholder',
    );

    placeholder.textContent = `Banner ${slideIndex + 1}`;

    imageContainer.append(placeholder);
  }

  /* -------------------------------------------
     CTA
  ------------------------------------------- */

  const contentContainer = document.createElement('div');

  contentContainer.classList.add(
    'banner-carousel-slide-content',
  );

  const cta = createCta(
    ctaLabelColumn,
    ctaLinkColumn,
    slideIndex,
    isPlaceholder,
  );

  if (cta) {
    contentContainer.append(cta);
  }

  /* -------------------------------------------
     Build slide
  ------------------------------------------- */

  slide.append(imageContainer);
  slide.append(mobileImageContainer);
  slide.append(contentContainer);

  return slide;
}

function createControls(block, slideCount) {
  if (slideCount < 2) return;

  const controlsWrapper = document.createElement('div');

  controlsWrapper.classList.add(
    'banner-carousel-controls',
  );

  const indicators = document.createElement('div');

  indicators.classList.add(
    'banner-carousel-indicators',
  );

  indicators.setAttribute('role', 'tablist');

  indicators.setAttribute(
    'aria-label',
    'Banner carousel controls',
  );

  for (let index = 0; index < slideCount; index += 1) {
    const indicator = document.createElement('div');

    indicator.classList.add(
      'banner-carousel-control',
    );

    indicator.dataset.targetSlide = index;

    const button = document.createElement('button');

    button.type = 'button';

    button.setAttribute('role', 'tab');

    button.setAttribute(
      'aria-label',
      `Show banner ${index + 1}`,
    );

    button.setAttribute(
      'aria-current',
      index === 0 ? 'true' : 'false',
    );

    indicator.append(button);

    indicators.append(indicator);
  }

  controlsWrapper.append(indicators);

  block.append(controlsWrapper);
}

function bindEvents(block) {
  const controls = block.querySelectorAll(
    '.banner-carousel-control',
  );

  controls.forEach((control) => {
    control.addEventListener('click', () => {
      const targetIndex = Number(
        control.dataset.targetSlide,
      );

      showSlide(block, targetIndex);
    });
  });

  /* -------------------------------------------
     Keyboard navigation
  ------------------------------------------- */

  block.addEventListener('keydown', (event) => {
    const activeIndex = Number(
      block.dataset.activeIndex || 0,
    );

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        showSlide(block, activeIndex - 1);
        break;

      case 'ArrowRight':
        event.preventDefault();
        showSlide(block, activeIndex + 1);
        break;

      case 'Home':
        event.preventDefault();
        showSlide(block, 0);
        break;

      case 'End':
        event.preventDefault();

        showSlide(
          block,
          block.querySelectorAll(
            '.banner-carousel-slide',
          ).length - 1,
        );

        break;

      default:
        break;
    }
  });

  /* -------------------------------------------
     Touch / swipe
  ------------------------------------------- */

  let touchStartX = 0;
  let touchEndX = 0;

  const slidesWrapper = block.querySelector(
    '.banner-carousel-slides',
  );

  if (!slidesWrapper) return;

  slidesWrapper.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true },
  );

  slidesWrapper.addEventListener(
    'touchend',
    (event) => {
      touchEndX = event.changedTouches[0].screenX;

      const distance = touchEndX - touchStartX;

      if (Math.abs(distance) < 50) return;

      const activeIndex = Number(
        block.dataset.activeIndex || 0,
      );

      if (distance < 0) {
        showSlide(block, activeIndex + 1);
      } else {
        showSlide(block, activeIndex - 1);
      }
    },
    { passive: true },
  );
}

export default function decorate(block) {
  bannerCarouselId += 1;

  const carouselId = bannerCarouselId;

  block.id = `banner-carousel-${carouselId}`;

  block.setAttribute('role', 'region');

  block.setAttribute(
    'aria-roledescription',
    'Carousel',
  );

  block.dataset.activeIndex = '0';

  let rows = [
    ...block.querySelectorAll(':scope > div'),
  ];

  /* -------------------------------------------
     Temporary 10-slide placeholder
  ------------------------------------------- */

  const hasAuthoredContent = rows.some(
    (row) => row.textContent.trim()
      || row.querySelector('img'),
  );

  let placeholderMode = false;

  if (!hasAuthoredContent) {
    placeholderMode = true;

    rows.forEach((row) => row.remove());

    rows = Array.from(
      { length: 10 },
      () => {
        const row = document.createElement('div');

        for (let index = 0; index < 4; index += 1) {
          row.append(
            document.createElement('div'),
          );
        }

        return row;
      },
    );
  }

  /* -------------------------------------------
     Slides
  ------------------------------------------- */

  const slidesContainer = document.createElement('div');

  slidesContainer.classList.add(
    'banner-carousel-slides-container',
  );

  const slidesWrapper = document.createElement('div');

  slidesWrapper.classList.add(
    'banner-carousel-slides',
  );

  rows.forEach((row, index) => {
    const slide = createSlide(
      row,
      index,
      carouselId,
      placeholderMode,
    );

    slidesWrapper.append(slide);

    if (!placeholderMode) {
      row.remove();
    }
  });

  slidesContainer.append(slidesWrapper);

  block.prepend(slidesContainer);

  /* -------------------------------------------
     Controller pills
  ------------------------------------------- */

  createControls(
    block,
    rows.length,
  );

  updateActiveSlide(block, 0);

  /* -------------------------------------------
     Events
  ------------------------------------------- */

  if (rows.length > 1) {
    bindEvents(block);
  }
}
