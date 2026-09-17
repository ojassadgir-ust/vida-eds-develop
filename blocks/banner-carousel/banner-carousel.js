function getText(cell) {
  return cell?.textContent.trim() || '';
}

function getLink(cell) {
  const link = cell?.querySelector('a');

  if (link) {
    return link.href;
  }

  return getText(cell);
}

function createPicture(desktopImage, mobileImage, index) {
  const picture = document.createElement('picture');

  /*
   * Mobile image
   */
  if (mobileImage) {
    const mobileSource = document.createElement('source');

    mobileSource.media = '(max-width: 767px)';
    mobileSource.srcset = mobileImage.src;

    picture.appendChild(mobileSource);
  }

  /*
   * Desktop image
   */
  const image = document.createElement('img');

  image.src = desktopImage.src;
  image.alt = desktopImage.alt || '';

  /*
   * First image is loaded immediately because
   * it is likely to be the LCP image.
   */
  if (index === 0) {
    image.loading = 'eager';
    image.fetchPriority = 'high';
  } else {
    image.loading = 'lazy';
  }

  picture.appendChild(image);

  return picture;
}

function createSlide(row, index) {
  const cells = [...row.children];

  /*
   * Authoring structure:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = Title
   * 3 = Subtitle
   * 4 = CTA Text
   * 5 = CTA Link
   */

  const desktopImage = cells[0]?.querySelector('img');

  const mobileImage = cells[1]?.querySelector('img');

  const title = getText(cells[2]);

  const subtitle = cells[3]?.innerHTML.trim() || '';

  const ctaText = getText(cells[4]);

  const ctaLink = getLink(cells[5]);

  /*
   * Slide
   */
  const slide = document.createElement('div');

  slide.className = 'banner-carousel-slide';

  /*
   * Background image
   */
  if (desktopImage) {
    const background = document.createElement('div');

    background.className = 'banner-carousel-background';

    background.appendChild(
      createPicture(
        desktopImage,
        mobileImage,
        index,
      ),
    );

    slide.appendChild(background);
  }

  /*
   * Content
   */
  const content = document.createElement('div');

  content.className = 'banner-carousel-content';

  /*
   * Title
   */
  if (title) {
    const heading = document.createElement('h2');

    heading.className = 'banner-carousel-title';

    heading.textContent = title;

    content.appendChild(heading);
  }

  /*
   * Subtitle
   *
   * innerHTML is used so the author can use
   * line breaks or basic markup.
   */
  if (subtitle) {
    const description = document.createElement('div');

    description.className = 'banner-carousel-subtitle';

    description.innerHTML = subtitle;

    content.appendChild(description);
  }

  /*
   * CTA
   */
  if (ctaText && ctaLink) {
    const cta = document.createElement('a');

    cta.className = 'banner-carousel-cta';

    cta.href = ctaLink;

    cta.textContent = ctaText;

    content.appendChild(cta);
  }

  slide.appendChild(content);

  return slide;
}

function createController(track, slides) {
  const controller = document.createElement('div');

  controller.className = 'banner-carousel-controller';

  controller.setAttribute(
    'aria-label',
    'Carousel Pagination',
  );

  slides.forEach((slide, index) => {
    const button = document.createElement('button');

    button.type = 'button';

    button.className = 'banner-carousel-dot';

    button.setAttribute(
      'aria-label',
      `Go to banner ${index + 1}`,
    );

    button.dataset.slide = index;

    /*
     * First dot active
     */
    if (index === 0) {
      button.classList.add('active');

      button.setAttribute(
        'aria-current',
        'true',
      );
    }

    /*
     * Navigate to slide
     */
    button.addEventListener(
      'click',
      () => {
        track.scrollTo({
          left: slide.offsetLeft,
          behavior: 'smooth',
        });
      },
    );

    controller.appendChild(button);
  });

  return controller;
}

function updateController(
  track,
  controller,
) {
  const slides = [
    ...track.querySelectorAll(
      '.banner-carousel-slide',
    ),
  ];

  const dots = [
    ...controller.querySelectorAll(
      '.banner-carousel-dot',
    ),
  ];

  if (!slides.length) {
    return;
  }

  let activeIndex = 0;

  let smallestDistance = Infinity;

  slides.forEach(
    (slide, index) => {
      const distance = Math.abs(
        track.scrollLeft
            - slide.offsetLeft,
      );

      if (
        distance
        < smallestDistance
      ) {
        smallestDistance = distance;

        activeIndex = index;
      }
    },
  );

  dots.forEach(
    (dot, index) => {
      const active = index === activeIndex;

      dot.classList.toggle(
        'active',
        active,
      );

      if (active) {
        dot.setAttribute(
          'aria-current',
          'true',
        );
      } else {
        dot.removeAttribute(
          'aria-current',
        );
      }
    },
  );
}

function setupAutoplay(
  track,
  slides,
) {
  if (slides.length <= 1) {
    return;
  }

  let currentIndex = 0;

  let timer;

  const start = () => {
    window.clearInterval(timer);

    timer = window.setInterval(
      () => {
        currentIndex += 1;

        /*
         * Return to first banner
         * after the last banner.
         */
        if (
          currentIndex
          >= slides.length
        ) {
          currentIndex = 0;
        }

        track.scrollTo({
          left:
            slides[currentIndex]
              .offsetLeft,
          behavior: 'smooth',
        });
      },
      5000,
    );
  };

  const stop = () => {
    window.clearInterval(timer);
  };

  /*
   * Pause on mouse hover
   */
  track.addEventListener(
    'mouseenter',
    stop,
  );

  track.addEventListener(
    'mouseleave',
    start,
  );

  /*
   * Pause when keyboard focus
   * enters the carousel.
   */
  track.addEventListener(
    'focusin',
    stop,
  );

  track.addEventListener(
    'focusout',
    start,
  );

  /*
   * Pause while touching/swiping.
   */
  track.addEventListener(
    'touchstart',
    stop,
    {
      passive: true,
    },
  );

  track.addEventListener(
    'touchend',
    start,
    {
      passive: true,
    },
  );

  start();
}

export default function decorate(block) {
  /*
   * Each row represents one banner.
   *
   * Example:
   *
   * Row 1 = Banner 1
   * Row 2 = Banner 2
   * ...
   * Row 10 = Banner 10
   */
  const rows = [
    ...block.children,
  ];

  /*
   * Track
   */
  const track = document.createElement('div');

  track.className = 'banner-carousel-track';

  /*
   * Create slides.
   */
  const slides = rows
    .map(
      (row, index) => createSlide(
        row,
        index,
      ),
    )
    .filter(
      (slide) => slide.querySelector(
        '.banner-carousel-background',
      ),
    );

  slides.forEach(
    (slide) => {
      track.appendChild(slide);
    },
  );

  /*
   * Create pagination controller.
   */
  const controller = createController(
    track,
    slides,
  );

  /*
   * Remove the original authored table.
   */
  block.textContent = '';

  /*
   * Add carousel track.
   */
  block.appendChild(track);

  /*
   * Add pagination.
   */
  block.appendChild(
    controller,
  );

  /*
   * Update pagination when the
   * user swipes/scrolls.
   */
  let scrollTimeout;

  track.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(
        scrollTimeout,
      );

      scrollTimeout = window.setTimeout(
        () => {
          updateController(
            track,
            controller,
          );
        },
        50,
      );
    },
    {
      passive: true,
    },
  );

  /*
   * Start autoplay.
   */
  setupAutoplay(
    track,
    slides,
  );
}
