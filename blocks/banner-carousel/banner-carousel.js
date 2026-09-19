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

  if (link && link.href) {
    return link.href;
  }

  return field.textContent.trim();
}

function createSlide(item, index, id) {
  const slide = document.createElement('li');

  slide.classList.add('carousel-slide');

  slide.dataset.slideIndex = index;

  slide.id = `banner-carousel-${id}-slide-${index}`;

  slide.setAttribute(
    'aria-hidden',
    'true',
  );

  /*
   * Authoring structure:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = CTA Link Text
   * 3 = CTA Link
   */

  const desktopField = getField(item, 0);

  const mobileField = getField(item, 1);

  const ctaTextField = getField(item, 2);

  const ctaLinkField = getField(item, 3);

  const desktopImage = getImage(desktopField);

  const mobileImage = getImage(mobileField);

  /*
   * IMAGE
   */

  if (desktopImage || mobileImage) {
    const picture = document.createElement('picture');

    picture.classList.add(
      'carousel-slide-picture',
    );

    /*
     * Mobile image
     */
    if (mobileImage) {
      const source = document.createElement('source');

      source.media = '(max-width: 767px)';

      source.srcset = mobileImage.src;

      picture.append(source);
    }

    /*
     * Desktop image
     */
    const image = desktopImage || mobileImage;

    image.classList.add(
      'carousel-slide-image',
    );

    image.removeAttribute('width');
    image.removeAttribute('height');

    picture.append(image);

    slide.append(picture);
  }

  /*
   * CTA
   */

  const ctaText = getFieldText(ctaTextField);

  const ctaLink = getFieldLink(ctaLinkField);

  if (ctaText && ctaLink) {
    const ctaWrapper = document.createElement('div');

    ctaWrapper.classList.add(
      'carousel-slide-cta-wrapper',
    );

    const cta = document.createElement('a');

    cta.classList.add(
      'carousel-slide-cta',
    );

    cta.href = ctaLink;

    cta.textContent = ctaText;

    ctaWrapper.append(cta);

    slide.append(ctaWrapper);
  }

  return slide;
}

function updateActiveSlide(
  block,
  index,
) {
  const slides = block.querySelectorAll(
    '.carousel-slide',
  );

  const indicators = block.querySelectorAll(
    '.carousel-slide-indicator',
  );

  slides.forEach(
    (slide, slideIndex) => {
      const isActive = slideIndex === index;

      slide.classList.toggle(
        'active',
        isActive,
      );

      slide.setAttribute(
        'aria-hidden',
        String(!isActive),
      );

      const links = slide.querySelectorAll('a');

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

  indicators.forEach(
    (indicator, indicatorIndex) => {
      const button = indicator.querySelector(
        'button',
      );

      const isActive = indicatorIndex === index;

      indicator.classList.toggle(
        'active',
        isActive,
      );

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

  block.dataset.activeSlide = index;
}

function showSlide(
  block,
  index,
  smooth = true,
) {
  const slides = block.querySelectorAll(
    '.carousel-slide',
  );

  const wrapper = block.querySelector(
    '.carousel-slides',
  );

  if (
    !slides.length
    || !wrapper
  ) {
    return;
  }

  let newIndex = index;

  /*
   * Loop to first banner
   */
  if (
    newIndex >= slides.length
  ) {
    newIndex = 0;
  }

  /*
   * Loop to last banner
   */
  if (newIndex < 0) {
    newIndex = slides.length - 1;
  }

  const slide = slides[newIndex];

  updateActiveSlide(
    block,
    newIndex,
  );

  const scrollPosition = slide.offsetLeft
    - (
      wrapper.clientWidth
      - slide.clientWidth
    ) / 2;

  wrapper.scrollTo({
    left: scrollPosition,
    behavior:
      smooth
        ? 'smooth'
        : 'auto',
  });
}

function stopAutoplay(block) {
  if (block.carouselTimer) {
    clearInterval(
      block.carouselTimer,
    );

    block.carouselTimer = null;
  }
}

function startAutoplay(block) {
  stopAutoplay(block);

  /*
   * 5 second autoplay
   */
  block.carouselTimer = setInterval(() => {
    const currentIndex = parseInt(
      block.dataset.activeSlide
            || '0',
      10,
    );

    showSlide(
      block,
      currentIndex + 1,
      true,
    );
  }, 5000);
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

  nav.classList.add(
    'carousel-slide-controls',
  );

  nav.setAttribute(
    'aria-label',
    'Banner carousel controls',
  );

  const indicators = document.createElement('ol');

  indicators.classList.add(
    'carousel-slide-indicators',
  );

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const indicator = document.createElement('li');

    indicator.classList.add(
      'carousel-slide-indicator',
    );

    const button = document.createElement('button');

    button.type = 'button';

    button.setAttribute(
      'aria-label',
      `Go to banner ${index + 1}`,
    );

    button.addEventListener(
      'click',
      () => {
        showSlide(
          block,
          index,
          true,
        );

        /*
         * Restart 5 second timer
         */
        restartAutoplay(block);
      },
    );

    indicator.append(button);

    indicators.append(indicator);
  }

  nav.append(indicators);

  block.append(nav);
}

function bindEvents(block) {
  /*
   * Pause when mouse enters
   */
  block.addEventListener(
    'mouseenter',
    () => {
      stopAutoplay(block);
    },
  );

  /*
   * Resume when mouse leaves
   */
  block.addEventListener(
    'mouseleave',
    () => {
      startAutoplay(block);
    },
  );

  /*
   * Pause when keyboard focus enters
   */
  block.addEventListener(
    'focusin',
    () => {
      stopAutoplay(block);
    },
  );

  /*
   * Resume when keyboard focus leaves
   */
  block.addEventListener(
    'focusout',
    () => {
      startAutoplay(block);
    },
  );

  /*
   * Mobile touch
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

export default function decorate(
  block,
) {
  carouselId += 1;

  block.id = `banner-carousel-${carouselId}`;

  /*
   * Every direct child is one
   * Banner Carousel Item.
   */
  const items = [
    ...block.querySelectorAll(
      ':scope > div',
    ),
  ];

  if (!items.length) {
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

  /*
   * Slides container
   */
  const slidesContainer = document.createElement('div');

  slidesContainer.classList.add(
    'carousel-slides-container',
  );

  /*
   * Slides list
   */
  const slidesWrapper = document.createElement('ul');

  slidesWrapper.classList.add(
    'carousel-slides',
  );

  /*
   * Create all slides
   */
  items.forEach(
    (item, index) => {
      const slide = createSlide(
        item,
        index,
        carouselId,
      );

      slidesWrapper.append(slide);

      item.remove();
    },
  );

  slidesContainer.append(
    slidesWrapper,
  );

  block.prepend(
    slidesContainer,
  );

  /*
   * Create dots
   */
  createIndicators(
    block,
    items.length,
  );

  /*
   * Start at Banner 1
   */
  showSlide(
    block,
    0,
    false,
  );

  /*
   * Events
   */
  bindEvents(block);

  /*
   * Start autoplay
   */
  startAutoplay(block);
}
