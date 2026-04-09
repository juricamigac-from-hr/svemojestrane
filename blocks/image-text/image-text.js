import { applyBackgroundFocus } from '../../scripts/focal-point.js';

function getCell(row, index) {
  return row?.children[index] ?? null;
}

export default function decorate(block) {
  const [contentRow] = [...block.children];
  const mediaCell = getCell(contentRow, 0);
  const copyCell = getCell(contentRow, 1);

  const picture = mediaCell?.querySelector('picture');
  const heading = copyCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = Array.from(copyCell?.querySelectorAll('p') ?? [])
    .filter((paragraph) => paragraph.textContent.trim());
  const list = copyCell?.querySelector('ul, ol');

  const [lead, kicker] = paragraphs;

  if (!picture && !heading && !lead && !list && !kicker) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'image-text-shell';

  const layout = document.createElement('div');
  layout.className = 'image-text-layout';

  if (picture) {
    const media = document.createElement('div');
    media.className = 'image-text-media';
    applyBackgroundFocus(picture.querySelector('img'));
    media.append(picture);
    layout.append(media);
  } else {
    shell.classList.add('image-text-shell-no-media');
  }

  if (heading || lead || list || kicker) {
    const copy = document.createElement('div');
    copy.className = 'image-text-copy';

    if (heading) {
      heading.classList.add('image-text-title');
      copy.append(heading);
    }

    if (lead) {
      lead.classList.add('image-text-lead');
      copy.append(lead);
    }

    if (list) {
      list.classList.add('image-text-list');
      copy.append(list);
    }

    if (kicker) {
      kicker.classList.add('image-text-kicker');
      copy.append(kicker);
    }

    layout.append(copy);
  }

  shell.append(layout);
  block.replaceChildren(shell);
}
