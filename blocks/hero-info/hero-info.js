import { applyBackgroundFocus } from '../../scripts/focal-point.js';

function getCell(row, index) {
  return row?.children[index] ?? null;
}

function stripAutoButton(link) {
  link.classList.remove('button', 'primary', 'secondary');
}

export default function decorate(block) {
  const [contentRow, ctaRow] = [...block.children];
  const copyCell = getCell(contentRow, 0);
  const mediaCell = getCell(contentRow, 1);

  const paragraphs = Array.from(copyCell?.querySelectorAll('p') ?? [])
    .filter((paragraph) => paragraph.textContent.trim());

  const [titleSource, introSource, ...quoteSources] = paragraphs;
  const picture = mediaCell?.querySelector('picture');
  const ctaLink = ctaRow?.querySelector('a[href]');

  if (!titleSource && !introSource && !quoteSources.length && !picture && !ctaLink) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'hero-info-shell';

  const layout = document.createElement('div');
  layout.className = 'hero-info-layout';

  if (titleSource) {
    const title = document.createElement('h2');
    title.className = 'hero-info-title';
    title.id = titleSource.id;
    title.innerHTML = titleSource.innerHTML;
    layout.append(title);
  }

  const content = document.createElement('div');
  content.className = 'hero-info-content';

  if (introSource) {
    introSource.classList.add('hero-info-intro');
    content.append(introSource);
  }

  if (quoteSources.length) {
    const quote = document.createElement('div');
    quote.className = 'hero-info-quote';
    quoteSources.forEach((paragraph) => {
      paragraph.classList.add('hero-info-quote-line');
      quote.append(paragraph);
    });
    content.append(quote);
  }

  if (ctaLink) {
    stripAutoButton(ctaLink);
    ctaLink.classList.add('hero-info-cta');
    content.append(ctaLink);
  }

  if (content.children.length) {
    layout.append(content);
  }

  if (picture) {
    const media = document.createElement('div');
    media.className = 'hero-info-media';
    const image = picture.querySelector('img');
    if (applyBackgroundFocus(image)) {
      media.classList.add('hero-info-media-focused');
    }
    media.append(picture);
    layout.append(media);
  } else {
    shell.classList.add('hero-info-shell-no-media');
  }

  shell.append(layout);
  block.replaceChildren(shell);
}
