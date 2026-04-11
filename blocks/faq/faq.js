import { applyFocalPoint } from '../../scripts/utils/picture.js';

function getCell(row, index) {
  return row?.children[index] ?? null;
}

function hasMeaningfulContent(cell) {
  return Boolean(
    cell?.textContent.trim()
    || cell?.querySelector('picture, img, video, iframe, svg, ul, ol, li, a[href]'),
  );
}

function moveChildren(source, target) {
  while (source?.firstChild) {
    target.append(source.firstChild);
  }
}

function buildFaqItem(row, index) {
  const questionCell = getCell(row, 0);
  const answerCell = getCell(row, 1);

  if (!hasMeaningfulContent(questionCell) || !hasMeaningfulContent(answerCell)) {
    return null;
  }

  const item = document.createElement('details');
  item.className = 'faq-item';

  const summary = document.createElement('summary');
  summary.className = 'faq-question';

  const itemIndex = document.createElement('span');
  itemIndex.className = 'faq-item-index';
  itemIndex.textContent = `${index}.`;

  const title = document.createElement('span');
  title.className = 'faq-item-title';
  moveChildren(questionCell, title);

  const toggle = document.createElement('span');
  toggle.className = 'faq-item-toggle';
  toggle.setAttribute('aria-hidden', 'true');

  summary.append(itemIndex, title, toggle);

  const answer = document.createElement('div');
  answer.className = 'faq-answer';
  moveChildren(answerCell, answer);

  item.append(summary, answer);

  return item;
}

function closeSiblingItems(items, currentItem) {
  items.forEach((item) => {
    if (item !== currentItem) {
      item.open = false;
    }
  });
}

/**
 * Decorates the faq block.
 * @param {Element} block The faq block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) {
    return;
  }

  const [introRow, ...contentRows] = rows;
  const headingCell = getCell(introRow, 0);
  const mediaCell = getCell(introRow, 1);
  const picture = mediaCell?.querySelector('picture');

  const shell = document.createElement('div');
  shell.className = 'faq-shell';

  const layout = document.createElement('div');
  layout.className = 'faq-layout';

  const content = document.createElement('div');
  content.className = 'faq-content';

  if (hasMeaningfulContent(headingCell)) {
    const heading = document.createElement('div');
    heading.className = 'faq-heading';
    moveChildren(headingCell, heading);
    content.append(heading);
  }

  const list = document.createElement('div');
  list.className = 'faq-list';

  let footerNote;
  let faqIndex = 1;

  contentRows.forEach((row, rowIndex) => {
    const labelCell = getCell(row, 0);
    const valueCell = getCell(row, 1);
    const isFooterRow = rowIndex === contentRows.length - 1
      && hasMeaningfulContent(labelCell)
      && !hasMeaningfulContent(valueCell);

    if (isFooterRow) {
      footerNote = document.createElement('div');
      footerNote.className = 'faq-note';
      moveChildren(labelCell, footerNote);
      return;
    }

    const item = buildFaqItem(row, faqIndex);
    if (!item) {
      return;
    }

    list.append(item);
    faqIndex += 1;
  });

  const items = Array.from(list.children);

  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        closeSiblingItems(items, item);
      }
    });
  });

  if (items[0]) {
    items[0].open = true;
  }

  if (items.length) {
    content.append(list);
  }

  if (footerNote) {
    content.append(footerNote);
  }

  layout.append(content);

  if (picture) {
    const media = document.createElement('div');
    media.className = 'faq-media';
    applyFocalPoint(picture.querySelector('img'));
    media.append(picture);
    layout.append(media);
  } else {
    shell.classList.add('faq-shell-no-media');
  }

  shell.append(layout);
  block.replaceChildren(shell);
}
