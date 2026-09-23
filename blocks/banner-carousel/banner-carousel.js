let carouselId = 0;

/**
 * Get a field from an EDS authoring row.
 */
function getField(row, index) {
  return row.children[index] || null;
}

/**
 * Get image from an authoring field.
 */
function getImage(field) {
  if (!field) return null;

  return field.querySelector('img');
}

/**
 * Get URL from an authoring field.
 *
 * Supports:
 * - <a href="...">
 * - plain text URL
 */
function getFieldLink(field) {
  if (!field) return '';

  const link = field.querySelector('a');

  if (link?.href) {
    return link.href;
  }

  return field.textContent.trim();
}

/**
 * Get the authorable auto-scroll timing.
 *
 * The value is configured once on the
 * Banner Carousel parent.
 *
 * Default:
 * 7 seconds = 7000 milliseconds
 */
function getAutoplayDelay(block) {
  const timingField = block.querySelector(
    ':scope > div:first-child',
  );

  if (!timingField) {
    return 7000;
  }

  const timingValue = Number(
    timingField.textContent.trim(),
  );

  if (
    Number.isFinite(timingValue)
    && timingValue > 0
  ) {
    return timingValue * 1000;
  }

  return 7000;
}

/**
 * Create one banner slide.
 *
 * Fields:
 *
 * 0 = Desktop Image
 * 1 = Mobile Image
 * 2 = Banner Link
 */
function createSlide(row, index) {
  const slide = document.createElement('li');

  slide.className = 'banner-carousel-slide';

  slide.dataset.slideIndex = index;

  const desktopField = getField(row, 0);
  const mobileField = getField(row, 1);
  const bannerLinkField = getField(row, 2);

  const desktopImage = getImage(desktopField);

  const mobileImage = getImage(mobileField);

  const bannerLink = getFieldLink(bannerLinkField);

  if (desktopImage || mobileImage) {
    const picture = document.createElement('picture');

    picture.className = 'banner-carousel-slide-image';

    /**
     * Mobile image.
     */
    if (mobileImage) {
      const source = document.createElement('source');

      source.media = '(max-width: 767px)';

      source.srcset = mobileImage.src;

      picture.append(source);
    }

    /**
     * Desktop image.
     *
     * If desktop image doesn't exist,
     * mobile image will be used as fallback.
     */
    const image = desktopImage || mobileImage;

    image.classList.add(
      'banner-carousel-image',
    );

    image.removeAttribute('width');
    image.removeAttribute('height');

    picture.append(image);

    /**
     * Make the ENTIRE banner clickable.
     */
    if (bannerLink) {
      const link = document.createElement('a');

      link.className = 'banner-carousel-slide-link';

      link.href = bannerLink;

      link.setAttribute(
        'aria-label',
        `Open banner ${index + 1}`,
      );

      link.append(picture);

      slide.append(link);
    } else {
      slide.append(picture);
    }
  }

  return slide;
}

/**
 * Update active controller.
 */
function updateIndicators(
  block,
  index,
) {
  const controls = block.querySelectorAll(
    '.banner-carousel-control',
  );

  controls.forEach(
    (control, controlIndex) => {
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
    },
  );
}

/**
 * Update active banner.
 */
function updateActiveSlide(
  block,
  index,
) {
  const slides = block.querySelectorAll(
    '.banner-carousel-slide',
  );

  slides.forEach(
    (slide, slideIndex) => {
      const isActive = slideIndex === index;

      slide.classList.toggle(
        'is-active',
        isActive,
      );

      slide.setAttribute(
        'aria-hidden',
        String(!isActive),
      );

      /**
       * Keep links on inactive slides
       * out of keyboard navigation.
       */
      const links = slide.querySelectorAll(
        'a',
      );

      links.forEach((link) => {
        if (isActive) {
          link.removeAttribute(
            'tabindex',
          );
        } else {
          link.setAttribute(
            'tabindex',
            '-1',
          );
        }
      });
    },
  );

  updateIndicators(
    block,
    index,
  );

  block.dataset.activeIndex = index;
}

/**
 * Show a particular banner.
 */
function showSlide(
  block,
  index,
) {
  const slides = block.querySelectorAll(
    '.banner-carousel-slide',
  );

  if (!slides.length) return;

  let newIndex = index;

  /**
   * Go back to first banner.
   */
  if (
    newIndex >= slides.length
  ) {
    newIndex = 0;
  }

  /**
   * Go to last banner when
   * index becomes negative.
   */
  if (newIndex < 0) {
    newIndex = slides.length - 1;
  }

  updateActiveSlide(
    block,
    newIndex,
  );
}

/**
 * Stop autoplay.
 */
function stopAutoplay(block) {
  if (block.bannerCarouselTimer) {
    clearTimeout(
      block.bannerCarouselTimer,
    );

    block.bannerCarouselTimer = null;
  }
}

/**
 * Start autoplay.
 *
 * The timing is read from:
 *
 * block.dataset.autoplayDelay
 *
 * Example:
 *
 * 7 seconds
 * ↓
 * 7000 milliseconds
 */
function startAutoplay(block) {
  stopAutoplay(block);

  const autoplayDelay = Number(
    block.dataset.autoplayDelay
      || 7000,
  );

  block.bannerCarouselTimer = setTimeout(() => {
    const currentIndex = Number(
      block.dataset.activeIndex
          || 0,
    );

    /**
       * Move to the next banner.
       */
    showSlide(
      block,
      currentIndex + 1,
    );

    /**
       * Start another 7-second
       * countdown.
       */
    startAutoplay(block);
  }, autoplayDelay);
}

/**
 * Restart autoplay.
 *
 * Used when the user clicks
 * an indicator.
 */
function restartAutoplay(block) {
  stopAutoplay(block);

  startAutoplay(block);
}

/**
 * Create bottom controller indicators.
 */
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

        /**
         * Immediately show selected banner.
         */
        showSlide(
          block,
          targetIndex,
        );

        /**
         * Restart 7-second timer.
         */
        restartAutoplay(block);
      },
    );

    control.append(button);

    indicators.append(control);
  }

  nav.append(indicators);

  block.append(nav);
}

/**
 * Bind pause/resume events.
 */
function bindEvents(block) {
  /**
   * Pause when mouse enters.
   */
  block.addEventListener(
    'mouseenter',
    () => {
      stopAutoplay(block);
    },
  );

  /**
   * Resume when mouse leaves.
   */
  block.addEventListener(
    'mouseleave',
    () => {
      startAutoplay(block);
    },
  );

  /**
   * Pause when keyboard focus
   * enters carousel.
   */
  block.addEventListener(
    'focusin',
    () => {
      stopAutoplay(block);
    },
  );

  /**
   * Resume when keyboard focus
   * leaves carousel.
   */
  block.addEventListener(
    'focusout',
    () => {
      startAutoplay(block);
    },
  );

  /**
   * Pause on touch.
   */
  block.addEventListener(
    'touchstart',
    () => {
      stopAutoplay(block);
    },
    {
      passive: true,
    },
  );

  /**
   * Resume after touch.
   */
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

/**
 * Main EDS block decoration.
 */
export default function decorate(block) {
  /**
   * Do not render the custom carousel
   * inside Universal Editor authoring mode.
   */
  const isAuthor = window?.origin !== undefined
    && window.origin.includes(
      'author',
    );

  if (isAuthor) {
    return;
  }

  carouselId += 1;

  block.id = `banner-carousel-${carouselId}`;

  /**
   * Get all direct rows.
   */
  const rows = [
    ...block.querySelectorAll(
      ':scope > div',
    ),
  ];

  if (!rows.length) {
    return;
  }

  /**
   * ------------------------------------------------
   * IMPORTANT
   * ------------------------------------------------
   *
   * The first row contains the carousel-level
   * Auto Scroll Timing field.
   *
   * Example:
   *
   * 7
   *
   * becomes:
   *
   * 7000ms
   */
  const autoplayDelay = getAutoplayDelay(block);

  block.dataset.autoplayDelay = autoplayDelay;

  /**
   * Accessibility.
   */
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

  /**
   * Create slides container.
   */
  const slidesContainer = document.createElement('div');

  slidesContainer.className = 'banner-carousel-slides-container';

  /**
   * Create slides list.
   */
  const slides = document.createElement('ul');

  slides.className = 'banner-carousel-slides';

  /**
   * IMPORTANT:
   *
   * The first row is the carousel-level
   * settings row.
   *
   * The remaining rows are banner items.
   */
  const itemRows = rows.slice(1);

  itemRows.forEach(
    (row, index) => {
      const slide = createSlide(
        row,
        index,
      );

      slides.append(slide);

      row.remove();
    },
  );

  /**
   * Remove the settings row
   * after reading its timing value.
   */
  rows[0].remove();

  slidesContainer.append(slides);

  block.prepend(
    slidesContainer,
  );

  /**
   * Create bottom indicators.
   */
  createIndicators(
    block,
    itemRows.length,
  );

  /**
   * Start with first banner.
   */
  updateActiveSlide(
    block,
    0,
  );

  /**
   * Only enable autoplay when
   * there is more than one banner.
   */
  if (itemRows.length > 1) {
    bindEvents(block);

    startAutoplay(block);
  }
}
