import { fetchPlaceholders, loadCSS } from '../../scripts/aem.js';
import { createOptimizedPictureWithFocalPoint } from '../../scripts/utils/picture.js';

const SWIPER_ASSET_BASE = `${window.hlx.codeBasePath}/scripts/swiper/swiper-bundle.min`;

let carouselId = 0;
let swiperLoader;

function loadSwiper() {
  if (!swiperLoader) {
    swiperLoader = loadCSS(`${SWIPER_ASSET_BASE}.css`)
      .then(() => import(`${SWIPER_ASSET_BASE}.mjs`))
      .then(({ default: Swiper }) => Swiper);
  }

  return swiperLoader;
}

function setSlideInteractivity(slide, isActive) {
  slide.classList.toggle('is-active', isActive);
  slide.setAttribute('aria-hidden', String(!isActive));

  slide.querySelectorAll('a, button, input, textarea, select').forEach((element) => {
    if (isActive) {
      element.removeAttribute('tabindex');
      return;
    }

    element.setAttribute('tabindex', '-1');
  });
}

function syncActiveSlide(block, activeIndex = 0) {
  const slides = [...block.querySelectorAll('.carousel-slide')];
  if (!slides.length) return;

  block.dataset.activeSlide = activeIndex;

  slides.forEach((slide, index) => {
    setSlideInteractivity(slide, index === activeIndex);
  });

  block.querySelectorAll('.carousel-pagination-bullet').forEach((button, index) => {
    const isActive = index === activeIndex;
    button.classList.toggle('is-active', isActive);
    if (isActive) {
      button.setAttribute('disabled', 'true');
    } else {
      button.removeAttribute('disabled');
    }
  });
}

function syncSwiperState(swiper) {
  swiper.update();
  swiper.updateSlidesClasses();
  swiper.updateProgress();
  swiper.updateSlidesProgress();
  swiper.slideTo(swiper.activeIndex, 0, false);
}

function setReadyState(block) {
  block.classList.remove('is-initializing');
  block.classList.add('is-ready');
}

function normaliseSlideColumns(row) {
  const columns = [...row.children];
  const imageColumn = columns.find((column) => column.querySelector('picture'));
  const contentColumn = columns.find((column) => column !== imageColumn) || columns[0];

  if (imageColumn) imageColumn.classList.add('carousel-slide-image');
  if (contentColumn) contentColumn.classList.add('carousel-slide-content');

  return { contentColumn, imageColumn };
}

function createOptimizedFullMedia(imageColumn) {
  const img = imageColumn?.querySelector('picture img');
  if (!img?.src) return imageColumn;

  const media = document.createElement('div');
  media.className = 'carousel-slide-media-full';

  const picture = createOptimizedPictureWithFocalPoint(img, false, [
    { media: '(min-width: 600px)', width: '1400' },
    { width: '900' },
  ]);
  const optimizedImg = picture?.querySelector('img');

  if (optimizedImg) optimizedImg.alt = img.alt || '';
  if (picture) media.append(picture);

  return media;
}

function createDefaultSlide(row, slideIndex, id) {
  const slide = document.createElement('article');
  slide.className = 'carousel-slide swiper-slide';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-${id}-slide-${slideIndex}`;

  const card = document.createElement('div');
  card.className = 'carousel-slide-card';

  const { contentColumn, imageColumn } = normaliseSlideColumns(row);

  if (imageColumn) {
    card.append(imageColumn);
  }

  if (contentColumn) {
    const labelledBy = contentColumn.querySelector('h1, h2, h3, h4, h5, h6');
    if (labelledBy) {
      if (!labelledBy.id) labelledBy.id = `carousel-${id}-title-${slideIndex}`;
      slide.setAttribute('aria-labelledby', labelledBy.id);
    }

    card.append(contentColumn);
  }

  slide.append(card);
  return slide;
}

function createFullSlide(projectRow, detailsRow, slideIndex, id) {
  const slide = document.createElement('article');
  slide.className = 'carousel-slide swiper-slide carousel-slide-full';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-${id}-slide-${slideIndex}`;

  const card = document.createElement('div');
  card.className = 'carousel-slide-card carousel-slide-card-full';

  const { contentColumn: titleColumn, imageColumn } = normaliseSlideColumns(projectRow);
  const detailsColumn = detailsRow?.firstElementChild || null;
  const titleSource = titleColumn?.querySelector('strong')
    || titleColumn?.querySelector('h1, h2, h3, h4, h5, h6')
    || titleColumn?.querySelector('p');

  let media;
  if (imageColumn) {
    media = createOptimizedFullMedia(imageColumn);
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'carousel-slide-body-full';

  if (titleSource) {
    const title = document.createElement('h3');
    title.className = 'carousel-slide-title-full';
    title.innerHTML = titleSource.innerHTML;
    title.id = `carousel-${id}-title-${slideIndex}`;
    slide.setAttribute('aria-labelledby', title.id);
    body.append(title);
  }

  if (detailsColumn) {
    const description = document.createElement('div');
    description.className = 'carousel-slide-description-full';
    description.append(...detailsColumn.childNodes);
    body.append(description);
  }

  if (media) {
    media.append(body);
  } else {
    card.append(body);
  }
  slide.append(card);

  return slide;
}

function buildControls(placeholders, slideCount) {
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  const pagination = document.createElement('ol');
  pagination.className = 'carousel-pagination';
  pagination.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

  Array.from({ length: slideCount }, (_, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carousel-pagination-bullet';
    button.dataset.targetSlide = String(index);
    button.setAttribute(
      'aria-label',
      `${placeholders.showSlide || 'Show Slide'} ${index + 1} ${placeholders.of || 'of'} ${slideCount}`,
    );
    item.append(button);
    pagination.append(item);
    return item;
  });
  controls.append(pagination);

  return { controls, pagination };
}

function getSafeSlideIndex(slidesLength, slideIndex = 0) {
  const parsedIndex = Number(slideIndex);
  if (Number.isNaN(parsedIndex)) return 0;
  if (parsedIndex < 0) return slidesLength - 1;
  if (parsedIndex >= slidesLength) return 0;
  return parsedIndex;
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  const nextIndex = getSafeSlideIndex(slides.length, slideIndex);

  if (block.carouselSwiper) {
    block.carouselSwiper.slideTo(nextIndex);
    return;
  }

  const viewport = block.querySelector('.carousel-viewport');
  const activeSlide = slides[nextIndex];
  const centerOffset = (viewport.clientWidth - activeSlide.clientWidth) / 2;
  const targetLeft = activeSlide.offsetLeft - centerOffset;
  viewport.scrollTo({
    left: Math.max(targetLeft, 0),
    behavior: 'smooth',
  });
  syncActiveSlide(block, nextIndex);
}

function bindControls(block) {
  block.querySelectorAll('.carousel-pagination-bullet').forEach((button) => {
    button.addEventListener('click', () => {
      showSlide(block, Number(button.dataset.targetSlide));
    });
  });
}

function disableFallbackMode(block) {
  block.classList.remove('is-fallback');
  if (block.fallbackObserver) {
    block.fallbackObserver.disconnect();
    delete block.fallbackObserver;
  }
}

function finalizeSwiperLayout(block, swiper) {
  const viewport = block.querySelector('.carousel-viewport');

  const applyLayout = () => {
    disableFallbackMode(block);
    syncSwiperState(swiper);
    syncActiveSlide(block, swiper.activeIndex);
    setReadyState(block);
  };

  const scheduleApplyLayout = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(applyLayout);
    });
  };

  if (viewport.clientWidth > 0) {
    scheduleApplyLayout();
    return;
  }

  const resizeObserver = new ResizeObserver(() => {
    if (viewport.clientWidth <= 0) return;
    resizeObserver.disconnect();
    scheduleApplyLayout();
  });

  resizeObserver.observe(viewport);
}

function enableFallbackMode(block) {
  const viewport = block.querySelector('.carousel-viewport');
  const slides = [...block.querySelectorAll('.carousel-slide')];
  let currentIndex = 0;

  disableFallbackMode(block);
  block.classList.add('is-fallback');

  block.fallbackObserver = new IntersectionObserver((entries) => {
    const activeEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio)[0];

    if (!activeEntry) return;

    const activeIndex = Number(activeEntry.target.dataset.slideIndex);
    if (activeIndex !== currentIndex) {
      currentIndex = activeIndex;
      syncActiveSlide(block, activeIndex);
    }
  }, {
    root: viewport,
    threshold: [0.45, 0.6, 0.75],
  });

  slides.forEach((slide) => block.fallbackObserver.observe(slide));
  syncActiveSlide(block, 0);
  setReadyState(block);
}

function createSwiper(block, placeholders) {
  const viewport = block.querySelector('.carousel-viewport');
  const isFullVariant = block.classList.contains('full');

  return loadSwiper().then((Swiper) => {
    const swiper = new Swiper(viewport, {
      a11y: {
        enabled: true,
        prevSlideMessage: placeholders.previousSlide || 'Previous Slide',
        nextSlideMessage: placeholders.nextSlide || 'Next Slide',
      },
      centeredSlides: true,
      effect: isFullVariant ? 'slide' : 'creative',
      grabCursor: true,
      initialSlide: 0,
      keyboard: {
        enabled: true,
      },
      observer: true,
      observeParents: true,
      rewind: true,
      slideToClickedSlide: true,
      slidesPerView: 1.08,
      spaceBetween: isFullVariant ? 22 : 18,
      speed: 950,
      watchSlidesProgress: true,
      creativeEffect: isFullVariant ? undefined : {
        limitProgress: 2,
        perspective: true,
        prev: {
          scale: 0.84,
          shadow: false,
          translate: ['-88%', '10%', -260],
        },
        next: {
          scale: 0.84,
          shadow: false,
          translate: ['88%', '10%', -260],
        },
      },
      breakpoints: {
        600: {
          slidesPerView: isFullVariant ? 1.34 : 1.2,
          spaceBetween: isFullVariant ? 20 : 24,
          creativeEffect: isFullVariant ? undefined : {
            limitProgress: 2,
            perspective: true,
            prev: {
              scale: 0.86,
              shadow: false,
              translate: ['-82%', '8%', -230],
            },
            next: {
              scale: 0.86,
              shadow: false,
              translate: ['82%', '8%', -230],
            },
          },
        },
        900: {
          slidesPerView: isFullVariant ? 1.82 : 1.78,
          spaceBetween: isFullVariant ? 24 : 18,
          creativeEffect: isFullVariant ? undefined : {
            limitProgress: 2,
            perspective: true,
            prev: {
              scale: 0.88,
              shadow: false,
              translate: ['-60%', '4%', -180],
            },
            next: {
              scale: 0.88,
              shadow: false,
              translate: ['60%', '4%', -180],
            },
          },
        },
        1200: {
          slidesPerView: isFullVariant ? 2.04 : 1.92,
          spaceBetween: isFullVariant ? 26 : 20,
        },
      },
      on: {
        afterInit(instance) {
          finalizeSwiperLayout(block, instance);
        },
        activeIndexChange(instance) {
          syncActiveSlide(block, instance.activeIndex);
        },
        slideChange(instance) {
          syncActiveSlide(block, instance.activeIndex);
        },
      },
    });

    block.carouselSwiper = swiper;
  }).catch(() => {
    enableFallbackMode(block);
  });
}

export default async function decorate(block) {
  carouselId += 1;

  const rows = [...block.querySelectorAll(':scope > div')];
  const placeholders = await fetchPlaceholders();
  const isFullVariant = block.classList.contains('full');
  const slideData = isFullVariant
    ? rows.reduce((accumulator, row, index) => {
      if (index % 2 === 0) {
        accumulator.push([row, rows[index + 1]]);
      }
      return accumulator;
    }, [])
    : rows;
  const isSingleSlide = slideData.length < 2;

  block.id = `carousel-${carouselId}`;
  block.classList.add('is-initializing');
  block.classList.toggle('is-single', isSingleSlide);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const shell = document.createElement('div');
  shell.className = 'carousel-shell';

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport swiper';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-slides swiper-wrapper';

  slideData.forEach((entry, index) => {
    const slide = isFullVariant
      ? createFullSlide(entry[0], entry[1], index, carouselId)
      : createDefaultSlide(entry, index, carouselId);
    slidesWrapper.append(slide);
  });

  viewport.append(slidesWrapper);
  shell.append(viewport);

  if (!isSingleSlide) {
    const { controls } = buildControls(placeholders, slideData.length);
    shell.append(controls);
  }

  block.replaceChildren(shell);
  syncActiveSlide(block, 0);

  if (!isSingleSlide) {
    bindControls(block);
    await createSwiper(block, placeholders);
  } else {
    setReadyState(block);
  }
}
