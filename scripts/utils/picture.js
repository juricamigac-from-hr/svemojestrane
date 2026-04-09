import { createOptimizedPicture } from '../aem.js';

const FOCAL_PATTERN = /(?:^|\s)data-focal:(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:\s|$)/;

function toFocalValue(value) {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function readFocalPoint(img) {
  if (!img) return null;

  const focalX = toFocalValue(img.dataset.focalX);
  const focalY = toFocalValue(img.dataset.focalY);

  if (focalX !== null && focalY !== null) {
    return { x: focalX, y: focalY };
  }

  const title = img.getAttribute('title') || '';
  const match = title.match(FOCAL_PATTERN);

  if (!match) return null;

  const parsedFocalX = toFocalValue(match[1]);
  const parsedFocalY = toFocalValue(match[2]);

  if (parsedFocalX === null || parsedFocalY === null) return null;

  return { x: parsedFocalX, y: parsedFocalY };
}

export function applyFocalPoint(img, focalPoint = readFocalPoint(img)) {
  if (!img || !focalPoint) return img;

  img.dataset.focalX = `${focalPoint.x}`;
  img.dataset.focalY = `${focalPoint.y}`;
  img.style.objectPosition = `${focalPoint.x}% ${focalPoint.y}%`;

  return img;
}

export function createOptimizedPictureWithFocalPoint(
  img,
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  if (!img?.src) return null;

  const picture = createOptimizedPicture(img.src, img.alt || '', eager, breakpoints);
  const optimizedImg = picture.querySelector('img');

  if (!optimizedImg) return picture;

  if (img.width) optimizedImg.width = img.width;
  if (img.height) optimizedImg.height = img.height;

  const title = img.getAttribute('title');
  if (title) optimizedImg.setAttribute('title', title);

  applyFocalPoint(optimizedImg, readFocalPoint(img));

  return picture;
}
