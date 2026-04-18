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

/**
 * decorate the about-information block
 * @param {Element} block The about-information block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  const sectionBackground = section?.dataset.background;
  const sectionColor = section?.dataset.color || section?.dataset.textcolor;

  if (sectionBackground) {
    block.style.setProperty('--about-information-surface', sectionBackground);
  }

  if (sectionColor) {
    block.style.setProperty('--about-information-text', sectionColor);
  }

  const [primaryRow, secondaryRow] = [...block.children];
  const quoteSource = getTextSource(getCell(primaryRow, 0));
  const accentPicture = getPicture(getCell(primaryRow, 1));
  const portraitPicture = getPicture(getCell(primaryRow, 2));
  const signatureSource = getTextSource(getCell(secondaryRow, 0));

  const mainPicture = portraitPicture ?? accentPicture;
  const overlayPicture = portraitPicture && accentPicture ? accentPicture : null;

  if (!quoteSource && !signatureSource && !mainPicture) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'about-information-shell';

  const layout = document.createElement('div');
  layout.className = 'about-information-layout';

  if (quoteSource || signatureSource) {
    const content = document.createElement('div');
    content.className = 'about-information-content';

    if (quoteSource) {
      quoteSource.classList.add('about-information-quote');
      content.append(quoteSource);
    }

    if (signatureSource) {
      signatureSource.classList.add('about-information-signature');
      content.append(signatureSource);
    }

    layout.append(content);
  }

  if (mainPicture) {
    const media = document.createElement('div');
    media.className = 'about-information-media';
    applyBackgroundFocus(mainPicture.querySelector('img'));
    media.append(mainPicture);
    layout.append(media);
  } else {
    shell.classList.add('about-information-shell-no-media');
  }

  if (overlayPicture) {
    const overlay = document.createElement('div');
    overlay.className = 'about-information-overlay';
    applyBackgroundFocus(overlayPicture.querySelector('img'));
    overlay.append(overlayPicture);
    layout.append(overlay);
  } else {
    shell.classList.add('about-information-shell-no-overlay');
  }

  shell.append(layout);
  block.replaceChildren(shell);
}
