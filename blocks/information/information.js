export default function decorate(block) {
  const rows = [...block.children];
  const [introRow, leadRow, bodyRow] = rows;

  const introCells = introRow ? [...introRow.children] : [];
  const media = introCells.find((cell) => cell.querySelector('picture, img'));
  const lead = leadRow?.firstElementChild;
  const body = bodyRow?.firstElementChild;

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
    media.classList.add('information-media');
    layout.append(media);
  } else {
    shell.classList.add('information-shell-no-media');
  }

  shell.append(layout);

  block.replaceChildren(shell);
}
