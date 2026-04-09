import { applyBackgroundFocus } from '../../scripts/focal-point.js';

function getContentRoot(row) {
  return row?.firstElementChild ?? row;
}

function stripAutoButton(link) {
  link.classList.remove('button', 'primary', 'secondary');
}

function buildElement(tagName, className) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  return element;
}

function buildIntro(root) {
  const header = buildElement('div', 'follow-me-header');
  const outro = buildElement('div', 'follow-me-outro');
  const heading = root?.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = Array.from(root?.querySelectorAll('p') ?? [])
    .filter((paragraph) => paragraph.textContent.trim());

  const titleSource = heading ?? paragraphs.shift();
  const handleSource = paragraphs.shift();

  if (titleSource) {
    const title = buildElement('h2', 'follow-me-title');
    title.innerHTML = titleSource.innerHTML;
    header.append(title);
  }

  if (handleSource) {
    const handle = buildElement('p', 'follow-me-handle');
    handle.innerHTML = handleSource.innerHTML;
    header.append(handle);
  }

  paragraphs.forEach((paragraph) => {
    paragraph.classList.add('follow-me-outro-line');
    outro.append(paragraph);
  });

  return {
    header,
    outro: outro.childElementCount ? outro : null,
  };
}

function buildMediaCard(root) {
  const picture = root?.querySelector('picture');
  if (!picture) {
    return null;
  }

  const card = buildElement('article', 'follow-me-card follow-me-card-media');
  const media = buildElement('div', 'follow-me-card-media-inner');
  const image = picture.querySelector('img');

  if (image && applyBackgroundFocus(image)) {
    card.classList.add('follow-me-card-focused');
  }

  media.append(picture);
  card.append(media);
  return card;
}

function isHandleParagraph(paragraph) {
  const link = paragraph.querySelector('a[href]');
  return Boolean(link) && paragraph.textContent.trim() === link.textContent.trim();
}

function buildTextCard(root) {
  const card = buildElement('article', 'follow-me-card follow-me-card-text');
  const heading = buildElement('div', 'follow-me-card-heading');
  const body = buildElement('div', 'follow-me-card-body');
  const footer = buildElement('div', 'follow-me-card-footer');
  const items = Array.from(root?.children ?? [])
    .filter((child) => ['P', 'HR'].includes(child.tagName));

  let beforeDivider = true;
  let hasDivider = false;

  items.forEach((item) => {
    if (item.tagName === 'HR') {
      beforeDivider = false;
      hasDivider = true;
      return;
    }

    if (isHandleParagraph(item)) {
      const link = item.querySelector('a[href]');
      stripAutoButton(link);
      link.classList.add('follow-me-card-handle');
      footer.append(link);
      return;
    }

    item.classList.add(beforeDivider ? 'follow-me-card-heading-line' : 'follow-me-card-body-line');
    if (beforeDivider) {
      heading.append(item);
    } else {
      body.append(item);
    }
  });

  const isStatement = heading.childElementCount > 1
    || Array.from(heading.children).every((child) => child.querySelector('strong'));

  card.classList.add(isStatement ? 'follow-me-card-statement' : 'follow-me-card-quote');

  if (heading.childElementCount) {
    card.append(heading);
  }

  if (hasDivider) {
    card.append(buildElement('hr', 'follow-me-card-divider'));
  }

  if (body.childElementCount) {
    card.append(body);
  }

  if (footer.childElementCount) {
    card.append(footer);
  }

  return card;
}

function buildCard(row) {
  const root = getContentRoot(row);
  if (!root?.textContent.trim() && !root?.querySelector('picture')) {
    return null;
  }

  return root.querySelector('picture') ? buildMediaCard(root) : buildTextCard(root);
}

export default function decorate(block) {
  const [introRow, ...cardRows] = [...block.children];
  const introRoot = getContentRoot(introRow);
  const { header, outro } = buildIntro(introRoot);
  const gallery = buildElement('div', 'follow-me-gallery');

  cardRows
    .map((row) => buildCard(row))
    .filter(Boolean)
    .forEach((card) => gallery.append(card));

  const shell = buildElement('div', 'follow-me-shell');
  shell.append(header);

  if (gallery.childElementCount) {
    shell.append(gallery);
  }

  if (outro) {
    shell.append(outro);
  }

  block.replaceChildren(shell);
}
