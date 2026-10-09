import toWebp from "../../scripts/to-webp.js";

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
 * 1 = Tablet Image
 * 2 = Mobile Image
 * 3 = Banner Link
 */
function createSlide(row, index) {
  const slide = document.createElement('li');

  slide.className = 'banner-carousel-slide';

  slide.dataset.slideIndex = index;

  const desktopField = getField(row, 0);
  const tabletField = getField(row, 1);
  const mobileField = getField(row, 2);
  const bannerLinkField = getField(row, 3);

  const desktopImage = getImage(desktopField);
  const tabletImage = getImage(tabletField);
  const mobileImage = getImage(mobileField);

  const bannerLink = getFieldLink(bannerLinkField);

  if (desktopImage || tabletImage || mobileImage) {
    const picture = document.createElement('picture');

    picture.className = 'banner-carousel-slide-image';

    /**
     * Mobile image.
     */
    if (mobileImage) {
      const source = document.createElement('source');

      source.media = '(max-width: 767px)';

      source.srcset = toWebp(mobileImage.src, 750);

      picture.append(source);
    }

    /**
     * Tablet image.
     */
    if (tabletImage) {
      const source = document.createElement('source');

      source.media = '(min-width: 768px) and (max-width: 1023px)';

      source.srcset = toWebp(tabletImage.src, 1024);

      picture.append(source);
    }

    /**
     * Desktop image.
     *
     * If desktop image doesn't exist,
     * tablet or mobile image will be used as fallback.
     */
    const image = desktopImage || tabletImage || mobileImage;
    image.src = toWebp(image.src, image === desktopImage ? 2000: 750);

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
    clearInterval(
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

  block.bannerCarouselTimer = setInterval(() => {
    const currentIndex = Number(
      block.dataset.activeIndex || 0,
    );

    showSlide(
      block,
      currentIndex + 1,
    );
  }, autoplayDelay);
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

        showSlide(
          block,
          targetIndex,
        );
      },
    );

    control.append(button);

    indicators.append(control);
  }

  nav.append(indicators);

  block.append(nav);
}

/**
 * Handle swipe gesture with minimum swipe distance.
 */
function handleSwipe(block, startX, endX) {
  const minSwipeDistance = 50;
  const diffX = startX - endX;

  if (Math.abs(diffX) < minSwipeDistance) {
    return;
  }

  const currentIndex = Number(
    block.dataset.activeIndex || 0,
  );

  if (diffX > 0) {
    showSlide(block, currentIndex + 1);
  } else {
    showSlide(block, currentIndex - 1);
  }
}

/**
 * Bind swipe/drag gestures for all devices.
 */
function bindEvents(block) {
  let startX = 0;
  let isDragging = false;
  const slidesContainer = block.querySelector(
    '.banner-carousel-slides-container',
  );

  if (!slidesContainer) return;

  /**
   * Touch swipe - for all devices with touch support.
   */
  slidesContainer.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      block.classList.add('is-dragging');
    },
    {
      passive: true,
    },
  );

  /**
   * Touch end - detect swipe and navigate.
   */
  slidesContainer.addEventListener(
    'touchend',
    (e) => {
      if (isDragging) {
        const endX = e.changedTouches[0].clientX;
        handleSwipe(block, startX, endX);
      }
      isDragging = false;
      block.classList.remove('is-dragging');
    },
    {
      passive: true,
    },
  );

  /**
   * Mouse drag - for all devices with mouse support.
   */
  slidesContainer.addEventListener(
    'mousedown',
    (e) => {
      startX = e.clientX;
      isDragging = true;
      block.classList.add('is-dragging');
    },
  );

  /**
   * Mouse up - detect drag and navigate.
   */
  slidesContainer.addEventListener(
    'mouseup',
    (e) => {
      if (isDragging) {
        const endX = e.clientX;
        handleSwipe(block, startX, endX);
        isDragging = false;
        block.classList.remove('is-dragging');
      }
    },
  );

  /**
   * Mouse leave - cancel drag.
   */
  slidesContainer.addEventListener(
    'mouseleave',
    () => {
      if (isDragging) {
        isDragging = false;
        block.classList.remove('is-dragging');
      }
    },
  );

  /**
   * Prevent default drag behavior.
   */
  slidesContainer.addEventListener(
    'dragstart',
    (e) => {
      e.preventDefault();
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

  slidesContainer.setAttribute(
    'data-carousel-id',
    block.id,
  );

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
