import { applyBackgroundFocus } from '../../scripts/focal-point.js';

function getCell(row, index) {
  return row?.children[index] ?? null;
}

function getTextSource(cell) {
  return Array.from(cell?.children ?? [])
    .find((child) => child.textContent.trim()) ?? null;
}

function getPicture(cell) {
  return cell?.querySelector('picture') ?? null;
}

function getContentSource(cell) {
  return cell?.textContent.trim() ? cell : null;
}

/**
 * decorate the z-style block
 * @param {Element} block The z-style block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  const sectionBackground = section?.dataset.background;
  const sectionColor = section?.dataset.color || section?.dataset.textcolor;

  if (sectionBackground) {
    block.style.setProperty('--z-style-bg', sectionBackground);
  }

  if (sectionColor) {
    block.style.setProperty('--z-style-text', sectionColor);
  }

  const rows = [...block.children];
  const contentIndex = rows.findIndex((row) => row.querySelector('picture'));

  const contentRow = contentIndex >= 0 ? rows[contentIndex] : rows[0];
  const rowsBeforeContent = rows.slice(0, Math.max(contentIndex, 0));
  const rowsAfterContent = rows.slice(Math.max(contentIndex + 1, 1));

  const titleRow = rowsBeforeContent.find((row) => row.textContent.trim()) ?? null;
  const signatureRow = rowsAfterContent.find((row) => row.textContent.trim()) ?? null;

  const titleSource = getTextSource(getCell(titleRow, 0));
  const mediaPicture = getPicture(getCell(contentRow, 0));
  const contentSource = getContentSource(getCell(contentRow, 1));
  const signatureSource = getTextSource(getCell(signatureRow, 0));

  if (!titleSource && !mediaPicture && !contentSource && !signatureSource) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'z-style-shell';

  if (titleSource) {
    titleSource.classList.add('z-style-title');
    shell.append(titleSource);
  } else {
    shell.classList.add('z-style-shell-no-title');
  }

  const layout = document.createElement('div');
  layout.className = 'z-style-layout';

  if (mediaPicture) {
    const media = document.createElement('div');
    media.className = 'z-style-media';
    applyBackgroundFocus(mediaPicture.querySelector('img'));
    media.append(mediaPicture);
    layout.append(media);
  } else {
    shell.classList.add('z-style-shell-no-media');
  }

  if (contentSource || signatureSource) {
    const content = document.createElement('div');
    content.className = 'z-style-content';

    if (contentSource) {
      contentSource.classList.add('z-style-copy');
      content.append(contentSource);
    }

    if (signatureSource) {
      signatureSource.classList.add('z-style-signature');
      content.append(signatureSource);
    }

    layout.append(content);
  }

  shell.append(layout);
  block.replaceChildren(shell);
}
