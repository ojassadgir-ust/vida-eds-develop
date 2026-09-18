function getImageUrl(element) {
  return element?.textContent?.trim() || '';
}

function getContentData(element) {
  if (!element) {
    return {
      title: '',
      subtitle: '',
    };
  }

  const headings = element.querySelectorAll(
    'h1, h2, h3, h4, h5, h6',
  );

  const paragraphs = element.querySelectorAll(
    'p',
  );

  const title = headings.length
    ? headings[0].textContent.trim()
    : '';

  const subtitle = paragraphs.length
    ? paragraphs[0].innerHTML.trim()
    : '';

  return {
    title,
    subtitle,
  };
}

function getCtaData(element) {
  if (!element) {
    return {
      label: '',
      link: '',
    };
  }

  const anchor = element.querySelector('a');

  if (anchor) {
    return {
      label: anchor.textContent.trim(),
      link: anchor.href,
    };
  }

  return {
    label: element.textContent.trim(),
    link: '',
  };
}

function createPicture(
  desktopImage,
  mobileImage,
  index,
) {
  const picture = document.createElement('picture');

  if (mobileImage) {
    const source = document.createElement('source');

    source.media = '(max-width: 767px)';
    source.srcset = mobileImage;

    picture.appendChild(source);
  }

  if (desktopImage) {
    const image = document.createElement('img');

    image.src = desktopImage;
    image.alt = '';

    if (index === 0) {
      image.loading = 'eager';
      image.fetchPriority = 'high';
    } else {
      image.loading = 'lazy';
    }

    picture.appendChild(image);
  }

  return picture;
}

function createSlide(item, index) {
  const fields = [...item.children];

  /*
   * 4 cells:
   *
   * 0 = Desktop Image
   * 1 = Mobile Image
   * 2 = Title / Subtitle
   * 3 = CTA
   */

  const desktopImage = getImageUrl(fields[0]);
  const mobileImage = getImageUrl(fields[1]);

  const contentData = getContentData(fields[2]);

  const ctaData = getCtaData(fields[3]);

  item.classList.add('banner-carousel-item');

  item.innerHTML = '';

  /*
   * Media
   */

  const media = document.createElement('div');

  media.className = 'banner-carousel-media';

  if (desktopImage || mobileImage) {
    media.appendChild(
      createPicture(
        desktopImage,
        mobileImage,
        index,
      ),
    );
  }

  item.appendChild(media);

  /*
   * Content
   */

  const content = document.createElement('div');

  content.className = 'banner-carousel-content';

  if (contentData.title) {
    const title = document.createElement('h2');

    title.className = 'banner-carousel-title';
    title.textContent = contentData.title;

    content.appendChild(title);
  }

  if (contentData.subtitle) {
    const subtitle = document.createElement('div');

    subtitle.className = 'banner-carousel-subtitle';
    subtitle.innerHTML = contentData.subtitle;

    content.appendChild(subtitle);
  }

  /*
   * CTA
   */

  if (ctaData.label && ctaData.link) {
    const cta = document.createElement('a');

    cta.className = 'banner-carousel-cta';
    cta.href = ctaData.link;
    cta.textContent = ctaData.label;

    content.appendChild(cta);
  }

  item.appendChild(content);

  return item;
}

function createControls(block, slideCount) {
  const controls = document.createElement('div');

  controls.className = 'banner-carousel-controls';

  /*
   * Previous
   */

  const previousButton = document.createElement('button');

  previousButton.type = 'button';
  previousButton.className = 'banner-carousel-prev';
  previousButton.setAttribute(
    'aria-label',
    'Previous banner',
  );

  /*
   * Pagination
   */

  const pagination = document.createElement('div');

  pagination.className = 'banner-carousel-pagination';

  pagination.setAttribute(
    'aria-label',
    'Banner carousel navigation',
  );

  /*
   * Dots
   */

  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement('button');

    dot.type = 'button';
    dot.className = 'banner-carousel-dot';

    dot.setAttribute(
      'aria-label',
      `Go to banner ${i + 1}`,
    );

    pagination.appendChild(dot);
  }

  /*
   * Next
   */

  const nextButton = document.createElement('button');

  nextButton.type = 'button';
  nextButton.className = 'banner-carousel-next';

  nextButton.setAttribute(
    'aria-label',
    'Next banner',
  );

  controls.appendChild(previousButton);
  controls.appendChild(pagination);
  controls.appendChild(nextButton);

  block.appendChild(controls);

  return {
    previousButton,
    pagination,
    nextButton,
  };
}

function initCarousel(block) {
  const slides = [
    ...block.querySelectorAll('.banner-carousel-item'),
  ];

  if (!slides.length) {
    return;
  }

  let currentIndex = 0;
  let autoplayTimer;

  const {
    previousButton,
    pagination,
    nextButton,
  } = createControls(
    block,
    slides.length,
  );

  const dots = [
    ...pagination.querySelectorAll(
      '.banner-carousel-dot',
    ),
  ];

  function showSlide(index) {
    currentIndex = index;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentIndex;

      slide.hidden = !isActive;

      slide.setAttribute(
        'aria-hidden',
        String(!isActive),
      );
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentIndex;

      dot.classList.toggle(
        'active',
        isActive,
      );

      if (isActive) {
        dot.setAttribute(
          'aria-current',
          'true',
        );
      } else {
        dot.removeAttribute(
          'aria-current',
        );
      }
    });

    previousButton.disabled = currentIndex === 0;

    nextButton.disabled = currentIndex === slides.length - 1;
  }

  function startAutoplay() {
    autoplayTimer = window.setInterval(
      () => {
        if (currentIndex === slides.length - 1) {
          showSlide(0);
        } else {
          showSlide(currentIndex + 1);
        }
      },
      5000,
    );
  }

  function stopAutoplay() {
    window.clearInterval(
      autoplayTimer,
    );
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  previousButton.addEventListener(
    'click',
    () => {
      if (currentIndex > 0) {
        showSlide(currentIndex - 1);
        restartAutoplay();
      }
    },
  );

  nextButton.addEventListener(
    'click',
    () => {
      if (currentIndex < slides.length - 1) {
        showSlide(currentIndex + 1);
        restartAutoplay();
      }
    },
  );

  dots.forEach((dot, index) => {
    dot.addEventListener(
      'click',
      () => {
        showSlide(index);
        restartAutoplay();
      },
    );
  });

  block.addEventListener(
    'mouseenter',
    stopAutoplay,
  );

  block.addEventListener(
    'mouseleave',
    startAutoplay,
  );

  block.addEventListener(
    'focusin',
    stopAutoplay,
  );

  block.addEventListener(
    'focusout',
    startAutoplay,
  );

  showSlide(0);
  startAutoplay();
}

export default function decorate(block) {
  const items = [...block.children];

  if (!items.length) {
    return;
  }

  block.classList.add(
    'banner-carousel',
  );

  items.forEach((item, index) => {
    createSlide(item, index);
  });

  initCarousel(block);
}
