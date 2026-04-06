const BLOGS_PER_PAGE = 8;
const FILTER_COLORS = ['#58c4ca', '#ffb411', '#e26aa6', '#9fc53d', '#7468d6', '#f17c52'];

function extractTextContent(element) {
  return element?.textContent.trim() || '';
}

function extractConfig(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const subtitle = block.querySelector('em');
  const paragraphs = Array.from(block.querySelectorAll('p'))
    .filter((paragraph) => !paragraph.querySelector('a') && !paragraph.querySelector('em'));
  const sourceLink = block.querySelector('a[href]');

  return {
    title: extractTextContent(heading),
    subtitle: extractTextContent(subtitle),
    lead: extractTextContent(paragraphs[0]),
    source: sourceLink?.href || '',
  };
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.payload?.items)) return payload.payload.items;
  return [];
}

function resolveUrl(value, base) {
  if (!value) return '';

  try {
    return new URL(value, base).href;
  } catch (e) {
    return '';
  }
}

function parseCategories(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => `${item}`.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function extractSectionSettings(block) {
  const section = block.closest('.section');
  const hasShowFilterSetting = section?.hasAttribute('data-show-filter');
  const showFilter = !hasShowFilterSetting || section.dataset.showFilter?.toLowerCase() !== 'no';
  const filterBy = parseCategories(section?.dataset.filterBy)
    .map((category) => category.toLowerCase());

  return {
    showFilter,
    filterBy,
  };
}

function normalizeBlog(item, source) {
  const title = item.title || item.name || item.heading || item.label || '';
  const description = item.description || item.excerpt || item.summary || item.teaser || '';
  const image = resolveUrl(
    item.image
      || item.imageUrl
      || item.thumbnail
      || item.thumbnailUrl
      || item.featuredImage
      || item.featured_image
      || item.photo,
    source,
  );
  const path = resolveUrl(
    item.path || item.url || item.link || item.permalink || item.slug,
    source,
  );
  const author = item.author || item.authorName || item.createdBy || '';
  const date = item.date || item.published || item.publishDate || item.publishedAt || item.createdAt || '';
  const categories = parseCategories(item.categories || item.category || item.tags);

  return {
    id: item.id || path || `${title}-${date}`,
    title,
    description,
    image,
    path,
    author,
    date,
    categories,
  };
}

async function fetchBlogs(source) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error('Unable to load blogs');
  }

  const payload = await response.json();
  return extractItems(payload)
    .map((item) => normalizeBlog(item, source))
    .filter((item) => item.title);
}

function formatDateParts(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const locale = document.documentElement.lang || 'en';
  return {
    day: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
  };
}

function buildImage(src, alt) {
  const picture = document.createElement('picture');
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.loading = 'lazy';
  picture.append(image);
  return picture;
}

function buildTagName(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function buildIntro({ title, subtitle, lead }) {
  const intro = document.createElement('div');
  intro.className = 'blog-listing-intro';

  if (title) {
    intro.append(buildTagName('h2', 'blog-listing-title', title));
  }

  if (subtitle) {
    intro.append(buildTagName('p', 'blog-listing-subtitle', subtitle));
  }

  if (lead) {
    intro.append(buildTagName('p', 'blog-listing-lead', lead));
  }

  return intro;
}

function createFilterButton(label, value, isActive, index, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'blog-listing-filter';
  button.textContent = label;
  button.dataset.value = value;
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  if (value !== 'all') {
    button.style.setProperty('--blog-listing-filter-color', FILTER_COLORS[index % FILTER_COLORS.length]);
  }

  if (isActive) {
    button.classList.add('active');
  }

  button.addEventListener('click', () => onSelect(value));
  return button;
}

function createMeta(blog) {
  const meta = document.createElement('div');
  meta.className = 'blog-listing-card-meta';

  const parts = [blog.author, blog.categories.slice(0, 2).join(' / ')].filter(Boolean);
  if (!parts.length) {
    return meta;
  }

  parts.forEach((part, index) => {
    const span = document.createElement('span');
    span.textContent = part;
    meta.append(span);

    if (index < parts.length - 1) {
      const divider = document.createElement('span');
      divider.className = 'blog-listing-card-meta-divider';
      divider.textContent = '|';
      meta.append(divider);
    }
  });

  return meta;
}

function createCard(blog) {
  const article = document.createElement('article');
  article.className = 'blog-listing-card';

  const media = document.createElement(blog.path ? 'a' : 'div');
  media.className = 'blog-listing-card-media';
  if (blog.path) media.href = blog.path;

  if (blog.image) {
    media.append(buildImage(blog.image, blog.title));
  } else {
    media.classList.add('is-empty');
  }

  const dateParts = formatDateParts(blog.date);
  if (dateParts) {
    const badge = document.createElement('div');
    badge.className = 'blog-listing-card-date';
    badge.append(
      buildTagName('span', 'blog-listing-card-date-day', dateParts.day),
      buildTagName('span', 'blog-listing-card-date-month', dateParts.month),
    );
    media.append(badge);
  }

  const body = document.createElement('div');
  body.className = 'blog-listing-card-body';

  const title = document.createElement('h3');
  title.className = 'blog-listing-card-title';
  if (blog.path) {
    const link = document.createElement('a');
    link.href = blog.path;
    link.textContent = blog.title;
    title.append(link);
  } else {
    title.textContent = blog.title;
  }

  body.append(title);

  const meta = createMeta(blog);
  if (meta.childNodes.length) {
    body.append(meta);
  }

  if (blog.description) {
    body.append(buildTagName('p', 'blog-listing-card-description', blog.description));
  }

  article.append(media, body);
  return article;
}

function createPaginationButton(label, targetPage, disabled, isCurrent, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'blog-listing-pagination-button';
  button.textContent = label;
  button.disabled = disabled;

  if (isCurrent) {
    button.classList.add('active');
    button.setAttribute('aria-current', 'page');
  }

  if (!disabled) {
    button.addEventListener('click', () => onSelect(targetPage));
  }

  return button;
}

function getVisiblePages(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('start-ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('end-ellipsis');
  pages.push(totalPages);

  return pages;
}

function renderResults(resultsContainer, paginationContainer, blogs, currentPage, onPageChange) {
  resultsContainer.innerHTML = '';
  paginationContainer.innerHTML = '';

  if (!blogs.length) {
    const empty = document.createElement('p');
    empty.className = 'blog-listing-empty';
    empty.textContent = 'No blogs found for this category.';
    resultsContainer.append(empty);
    return;
  }

  const totalPages = Math.ceil(blogs.length / BLOGS_PER_PAGE);
  const offset = (currentPage - 1) * BLOGS_PER_PAGE;
  const currentBlogs = blogs.slice(offset, offset + BLOGS_PER_PAGE);

  currentBlogs.forEach((blog) => {
    resultsContainer.append(createCard(blog));
  });

  if (totalPages === 1) {
    return;
  }

  paginationContainer.append(
    createPaginationButton('Previous', currentPage - 1, currentPage === 1, false, onPageChange),
  );

  getVisiblePages(totalPages, currentPage).forEach((page) => {
    if (typeof page === 'string') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'blog-listing-pagination-ellipsis';
      ellipsis.textContent = '...';
      paginationContainer.append(ellipsis);
      return;
    }

    paginationContainer.append(
      createPaginationButton(`${page}`, page, false, page === currentPage, onPageChange),
    );
  });

  paginationContainer.append(
    createPaginationButton('Next', currentPage + 1, currentPage === totalPages, false, onPageChange),
  );
}

function renderFilters(container, categories, activeCategory, onSelect) {
  container.innerHTML = '';

  container.append(createFilterButton('Sve', 'all', activeCategory === 'all', -1, onSelect));
  categories.forEach((category, index) => {
    container.append(
      createFilterButton(
        category,
        category.toLowerCase(),
        activeCategory === category.toLowerCase(),
        index,
        onSelect,
      ),
    );
  });
}

function createShell(config) {
  const shell = document.createElement('div');
  shell.className = 'blog-listing-shell';

  const intro = buildIntro(config);
  const filters = document.createElement('div');
  filters.className = 'blog-listing-filters';

  const results = document.createElement('div');
  results.className = 'blog-listing-results';
  results.setAttribute('aria-live', 'polite');

  const pagination = document.createElement('div');
  pagination.className = 'blog-listing-pagination';

  shell.append(intro, filters, results, pagination);
  return {
    shell,
    filters,
    results,
    pagination,
  };
}

function filterBlogsByCategories(blogs, filters) {
  if (!filters.length) {
    return blogs;
  }

  return blogs.filter((blog) => blog.categories
    .map((category) => category.toLowerCase())
    .some((category) => filters.includes(category)));
}

export default async function decorate(block) {
  const config = extractConfig(block);
  const sectionSettings = extractSectionSettings(block);
  const shell = createShell(config);
  block.replaceChildren(shell.shell);

  if (!config.source) {
    shell.results.append(buildTagName('p', 'blog-listing-empty', 'Add an API URL to the block to load blogs.'));
    return;
  }

  shell.results.append(buildTagName('p', 'blog-listing-empty', 'Loading blogs...'));

  try {
    const blogs = await fetchBlogs(config.source);
    const categories = [...new Set(blogs.flatMap((blog) => blog.categories))]
      .filter(Boolean);
    const initialCategory = sectionSettings.showFilter && sectionSettings.filterBy.length
      ? sectionSettings.filterBy[0]
      : 'all';
    const state = {
      activeCategory: initialCategory,
      currentPage: 1,
    };

    const update = () => {
      let filteredBlogs = blogs;
      if (!sectionSettings.showFilter) {
        filteredBlogs = filterBlogsByCategories(blogs, sectionSettings.filterBy);
      } else if (state.activeCategory !== 'all') {
        filteredBlogs = blogs.filter((blog) => blog.categories
          .map((category) => category.toLowerCase())
          .includes(state.activeCategory));
      }

      shell.filters.hidden = !sectionSettings.showFilter;
      if (!shell.filters.hidden) {
        renderFilters(shell.filters, categories, state.activeCategory, (value) => {
          state.activeCategory = value;
          state.currentPage = 1;
          update();
        });
      } else {
        shell.filters.innerHTML = '';
      }

      renderResults(
        shell.results,
        shell.pagination,
        filteredBlogs,
        state.currentPage,
        (page) => {
          state.currentPage = page;
          update();
        },
      );
    };

    update();
  } catch (e) {
    shell.results.innerHTML = '';
    shell.results.append(buildTagName('p', 'blog-listing-empty', 'We could not load the blog listing right now.'));
  }
}
