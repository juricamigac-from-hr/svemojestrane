export default function decorate(block) {
  const section = block.closest('.section');
  const sectionBackground = section?.dataset.background;
  const sectionColor = section?.dataset.color || section?.dataset.textcolor;

  if (sectionBackground) {
    block.style.setProperty('--columns-bg', sectionBackground);
    block.style.setProperty('--columns-full-background-color', sectionBackground);
  }

  if (sectionColor) {
    block.style.setProperty('--columns-text', sectionColor);
  }

  const rows = [...block.children];
  const maxCols = Math.max(...rows.map((row) => row.children.length), 1);
  block.classList.add(`columns-${maxCols}-cols`);

  // setup image columns
  rows.forEach((row) => {
    if (row.children.length === 1 && row.querySelector('h1, h2, h3, h4, h5, h6')) {
      row.classList.add('columns-heading-row');
    }

    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
