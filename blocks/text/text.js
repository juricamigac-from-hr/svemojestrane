function getValidTextAlign(value) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return ['left', 'center', 'right'].includes(normalized) ? normalized : null;
}

export default function decorate(block) {
  const section = block.closest('.section');
  if (!section) return;

  const textAlign = getValidTextAlign(section.dataset.textAlign || section.dataset.textalign);
  if (textAlign) {
    section.style.setProperty('--text-block-align', textAlign);
  }

  if (section.dataset.background) {
    section.style.setProperty('--text-block-background', section.dataset.background);
  }

  if (section.dataset.color) {
    section.style.setProperty('--text-block-color', section.dataset.color);
  }
}
