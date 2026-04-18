import { applyBackgroundFocus } from '../../scripts/focal-point.js';

function getCell(row, index) {
  return row?.children[index] ?? null;
}

function getHeading(source) {
  return source?.querySelector('h1, h2, h3, h4, h5, h6') ?? null;
}

function getPicture(source) {
  return source?.querySelector('picture') ?? null;
}

function getDirectParagraphs(source) {
  return Array.from(source?.children ?? [])
    .filter((element) => element.tagName === 'P' && element.textContent.trim());
}

function decorateWebinarVariant(block) {
  const rows = [...block.children];
  const topRow = rows[0];
  const copyRow = rows[1];
  const panelRow = rows[2];

  const badgeCell = getCell(topRow, 0);
  const mediaCell = getCell(topRow, 1);
  const copyCell = getCell(copyRow, 0);
  const panelCell = getCell(panelRow, 0);

  const badge = getDirectParagraphs(badgeCell)[0] ?? null;
  const picture = getPicture(mediaCell) ?? block.querySelector('picture');
  const heading = getHeading(copyCell) ?? block.querySelector('h1, h2, h3, h4, h5, h6');
  const copyParagraphs = getDirectParagraphs(copyCell);
  const panelParagraphs = getDirectParagraphs(panelCell);

  if (!heading || !picture) {
    return false;
  }

  const content = document.createElement('div');
  content.className = 'hero-content hero-webinar-content';

  if (badge) {
    badge.classList.add('hero-webinar-badge');
    content.append(badge);
  }

  heading.classList.add('hero-title');
  content.append(heading);

  if (copyParagraphs.length) {
    const copy = document.createElement('div');
    copy.className = 'hero-copy';

    copyParagraphs.forEach((paragraph, index) => {
      paragraph.classList.add('hero-description');
      if (index === 0) {
        paragraph.classList.add('hero-webinar-lead');
      }
      copy.append(paragraph);
    });

    content.append(copy);
  }

  if (panelParagraphs.length) {
    const panel = document.createElement('div');
    panel.className = 'hero-webinar-panel';

    panelParagraphs.forEach((paragraph, index) => {
      if (index === 0) {
        paragraph.classList.add('hero-webinar-meta');
      }

      if (paragraph.querySelector('a')) {
        paragraph.classList.add('hero-webinar-action');
      }

      panel.append(paragraph);
    });

    content.append(panel);
  }

  applyBackgroundFocus(picture.querySelector('img'));
  block.replaceChildren(content, picture);
  return true;
}

export default function decorate(block) {
  if (block.classList.contains('webinar') && decorateWebinarVariant(block)) {
    return;
  }

  const isColorVariant = block.classList.contains('color');
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  if (!heading || (!picture && !isColorVariant)) {
    return;
  }

  const titleText = heading.textContent.trim();
  if (!titleText) {
    return;
  }

  const descriptionNodes = Array.from(block.querySelectorAll('p'))
    .filter((paragraph) => !heading.contains(paragraph) && paragraph.textContent.trim());

  const content = document.createElement('div');
  content.className = 'hero-content';

  const title = document.createElement(heading.tagName.toLowerCase());
  title.className = 'hero-title';
  title.id = heading.id;
  title.textContent = titleText;
  content.append(title);

  if (descriptionNodes.length) {
    const copy = document.createElement('div');
    copy.className = 'hero-copy';
    descriptionNodes.forEach((paragraph) => {
      paragraph.classList.add('hero-description');
      copy.append(paragraph);
    });
    content.append(copy);
  }

  if (isColorVariant) {
    const section = block.closest('.section');
    const { background, textcolor } = section?.dataset ?? {};

    if (background) {
      block.style.setProperty('--hero-background-color', background);
    }

    if (textcolor) {
      block.style.setProperty('--hero-text-color', textcolor);
    }
  }

  applyBackgroundFocus(picture?.querySelector('img'));

  block.replaceChildren(...(picture ? [picture, content] : [content]));
}
