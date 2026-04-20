import { getMetadata } from '../../scripts/aem.js';

const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];

function extractTextContent(element) {
  return element?.textContent.trim() || '';
}

function resolveUrl(value) {
  return value || '';
}

function toRelativeMediaPath(value, base) {
  if (!value) return '';

  const normalizedValue = value.trim();
  if (normalizedValue.startsWith('./media')) {
    return normalizedValue;
  }

  try {
    const url = new URL(normalizedValue, base);
    const mediaIndex = url.pathname.lastIndexOf('/media');

    if (mediaIndex >= 0) {
      return `.${url.pathname.slice(mediaIndex)}${url.search}`;
    }
  } catch (e) {
    const mediaIndex = normalizedValue.indexOf('./media');
    if (mediaIndex >= 0) {
      return normalizedValue.slice(mediaIndex);
    }
  }

  return normalizedValue;
}

function extractConfig(block) {
  const [introRow, ...postRows] = [...block.children];
  const introCell = introRow?.firstElementChild ?? introRow;
  const heading = introCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = Array.from(introCell?.querySelectorAll('p') ?? [])
    .filter((paragraph) => paragraph.textContent.trim());

  return {
    title: extractTextContent(heading),
    subtitle: extractTextContent(paragraphs[0]),
    lead: extractTextContent(paragraphs[1]),
    links: postRows
      .map((row) => row.querySelector('a[href]')?.href)
      .filter(Boolean),
  };
}

function parseCategories(value) {
  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDate(value) {
  if (!value) return null;

  const normalized = value.trim();
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return value || '';

  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
}

async function fetchPost(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load blog post: ${url}`);
  }

  const markup = await response.text();
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  const canonical = doc.querySelector('link[rel="canonical"]')?.href || url;
  const title = getMetadata('og:title', doc) || extractTextContent(doc.querySelector('title'));
  const description = getMetadata('description', doc) || getMetadata('og:description', doc);
  const image = toRelativeMediaPath(
    doc.querySelector('main picture img')?.getAttribute('src')
      || getMetadata('og:image', doc),
    canonical,
  );
  const imageAlt = getMetadata('og:image:alt', doc) || title;
  const date = getMetadata('date', doc) || getMetadata('publication-date', doc);
  const categories = parseCategories(getMetadata('category', doc));

  return {
    url: canonical,
    title,
    description,
    image,
    imageAlt,
    date,
    categories,
  };
}

function buildTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
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

function buildIntro({ title, subtitle, lead }) {
  const intro = document.createElement('div');
  intro.className = 'blog-posts-intro';

  if (title) {
    intro.append(buildTextElement('h2', 'blog-posts-title', title));
  }

  if (subtitle) {
    intro.append(buildTextElement('p', 'blog-posts-subtitle', subtitle));
  }

  if (lead) {
    intro.append(buildTextElement('p', 'blog-posts-lead', lead));
  }

  return intro;
}

function buildCard(post) {
  const article = document.createElement('article');
  article.className = 'blog-posts-card';

  const mediaLink = document.createElement('a');
  mediaLink.className = 'blog-posts-card-media';
  mediaLink.href = post.url;
  mediaLink.setAttribute('aria-label', post.title || 'Read more');

  if (post.image) {
    mediaLink.append(buildImage(resolveUrl(post.image), post.imageAlt || post.title));
  } else {
    mediaLink.classList.add('is-empty');
  }

  if (post.categories[0]) {
    mediaLink.append(buildTextElement('span', 'blog-posts-card-category', post.categories[0]));
  }

  const body = document.createElement('div');
  body.className = 'blog-posts-card-body';

  if (post.date) {
    body.append(buildTextElement('p', 'blog-posts-card-date', formatDate(post.date)));
  }

  if (post.title) {
    body.append(buildTextElement('h3', 'blog-posts-card-title', post.title));
  }

  if (post.description) {
    body.append(buildTextElement('p', 'blog-posts-card-description', post.description));
  }

  const cta = document.createElement('a');
  cta.className = 'blog-posts-card-cta';
  cta.href = post.url;
  cta.textContent = 'Pročitaj više';
  body.append(cta);

  article.append(mediaLink, body);
  return article;
}

function createShell(config) {
  const shell = document.createElement('div');
  shell.className = 'blog-posts-shell';

  const intro = buildIntro(config);
  const results = document.createElement('div');
  results.className = 'blog-posts-results';
  results.setAttribute('aria-live', 'polite');

  shell.append(intro, results);
  return { shell, results };
}

export default async function decorate(block) {
  const config = extractConfig(block);
  const { shell, results } = createShell(config);
  block.replaceChildren(shell);

  if (!config.links.length) {
    results.append(buildTextElement('p', 'blog-posts-empty', 'Add blog post links to the block to load posts.'));
    return;
  }

  results.append(buildTextElement('p', 'blog-posts-empty', 'Loading posts...'));

  try {
    const posts = await Promise.allSettled(config.links.map((url) => fetchPost(url)));
    results.replaceChildren();

    posts
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((post) => post.title || post.description || post.image)
      .forEach((post) => results.append(buildCard(post)));

    if (!results.childNodes.length) {
      results.append(buildTextElement('p', 'blog-posts-empty', 'No posts could be loaded from the provided links.'));
    }
  } catch (error) {
    results.replaceChildren(
      buildTextElement('p', 'blog-posts-empty', 'The blog posts could not be loaded right now.'),
    );
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
