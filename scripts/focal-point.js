/* eslint-disable import/prefer-default-export */
export function applyBackgroundFocus(img) {
  const { title } = img?.dataset ?? {};
  if (!title?.includes('data-focal')) {
    return false;
  }

  const [, focalPoint] = title.split(':');
  if (!focalPoint) {
    return false;
  }

  const [x, y] = focalPoint.split(',').map((value) => Number.parseFloat(value.trim()));
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  delete img.dataset.title;
  img.style.objectPosition = `${x}% ${y}%`;
  return true;
}
