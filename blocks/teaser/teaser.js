export default function decorate(block) {
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  if (!picture) {
    return;
  }

  const media = document.createElement('div');
  media.className = 'teaser-media';
  media.append(picture);

  const content = document.createElement('div');
  content.className = 'teaser-content';

  const titleText = heading?.textContent.trim();
  if (heading && titleText) {
    const title = document.createElement(heading.tagName.toLowerCase());
    title.className = 'teaser-title';
    title.id = heading.id;
    title.textContent = titleText;
    content.append(title);
  }

  block.replaceChildren(media, content);
}
