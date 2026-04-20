function buildHeader(row) {
  const cell = row.firstElementChild;
  if (!cell) return null;

  const header = document.createElement('div');
  header.className = 'list-header';

  while (cell.firstChild) {
    header.append(cell.firstChild);
  }

  return header;
}

function buildItem(row) {
  const cell = row.firstElementChild;
  const title = cell?.querySelector('h1, h2, h3, h4, h5, h6');
  const list = cell?.querySelector('ul, ol');

  if (!cell || !title || !list) return null;

  const item = document.createElement('article');
  item.className = 'list-item';

  while (cell.firstChild) {
    item.append(cell.firstChild);
  }

  return item;
}

/**
 * Decorates the list block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const [headerRow, ...itemRows] = rows;
  const header = buildHeader(headerRow);
  const grid = document.createElement('div');
  grid.className = 'list-grid';

  itemRows
    .map(buildItem)
    .filter(Boolean)
    .forEach((item) => grid.append(item));

  block.replaceChildren(...[header, grid].filter(Boolean));
}
