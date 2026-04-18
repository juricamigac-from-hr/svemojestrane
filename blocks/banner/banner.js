function cloneChildren(source, target) {
  [...source.childNodes].forEach((node) => target.append(node.cloneNode(true)));
}

function createElement(tagName, className) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  return element;
}

export default function decorate(block) {
  const headingSource = block.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = [...block.querySelectorAll('p')];
  const ctaSource = paragraphs.find((paragraph) => paragraph.querySelector('a[href]'));
  const subtitleSource = paragraphs.find((paragraph) => paragraph !== ctaSource);

  const shell = createElement('div', 'banner-shell');

  if (headingSource) {
    const title = createElement(headingSource.tagName.toLowerCase(), 'banner-title');
    cloneChildren(headingSource, title);
    shell.append(title);
  }

  if (subtitleSource) {
    const subtitle = createElement('p', 'banner-subtitle');
    cloneChildren(subtitleSource, subtitle);
    shell.append(subtitle);
  }

  if (ctaSource) {
    const link = ctaSource.querySelector('a[href]');
    if (link) {
      const cta = createElement('p', 'banner-cta');
      const ctaLink = link.cloneNode(true);
      cta.append(ctaLink);
      shell.append(cta);
    }
  }

  block.replaceChildren(shell);
}
