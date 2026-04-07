import { applyBackgroundFocus } from '../../scripts/focal-point.js';

export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.flatMap((row) => [...row.children]);
  const media = cells.find((cell) => cell.querySelector('picture, img'));
  const textCells = cells
    .filter((cell) => cell !== media && cell.textContent.trim())
    .map((cell) => cell.firstElementChild ?? cell);
  const [lead, body] = textCells;

  if (!lead && !body && !media) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'information-shell';

  const layout = document.createElement('div');
  layout.className = 'information-layout';

  if (lead || body) {
    const copy = document.createElement('div');
    copy.className = 'information-copy';

    if (lead) {
      lead.classList.add('information-lead');
      copy.append(lead);
    }

    if (body) {
      body.classList.add('information-body');
      copy.append(body);
    }

    layout.append(copy);
  }

  if (media) {
    applyBackgroundFocus(media.querySelector('img'));
    media.classList.add('information-media');
    layout.append(media);
  } else {
    shell.classList.add('information-shell-no-media');
  }

  shell.append(layout);

  block.replaceChildren(shell);
}
