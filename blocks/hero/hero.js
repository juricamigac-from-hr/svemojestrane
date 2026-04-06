export default function decorate(block) {
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

  block.replaceChildren(...(picture ? [picture, content] : [content]));
}
