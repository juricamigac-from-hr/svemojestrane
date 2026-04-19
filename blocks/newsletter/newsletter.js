const NEWSLETTER_SUBMIT_ENDPOINT = 'https://forwarder.helenakukec.from.hr/subscribe';

const DEFAULT_CONTENT = {
  title: 'Subscribe and find out more about us',
  placeholder: 'email',
  submitLabel: 'Subscribe',
  successMessage: 'Thank you for subscribing. Check your inbox soon.',
  invalidEmailMessage: 'Please enter a valid email address.',
  submitErrorMessage: 'Something went wrong. Please try again.',
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (typeof text === 'string') element.textContent = text;
  return element;
}

function getCell(block, rowIndex, columnIndex) {
  return block.children[rowIndex]?.children[columnIndex];
}

function getCellText(cell, fallback) {
  const value = cell?.textContent?.trim();
  return value || fallback;
}

function appendClonedNodes(source, target) {
  [...source.childNodes].forEach((node) => target.append(node.cloneNode(true)));
}

function buildTitle(cell) {
  const title = createElement('h2', 'newsletter-title');
  const source = cell?.querySelector('h1, h2, h3, h4, h5, h6') || cell;

  if (source) {
    appendClonedNodes(source, title);
  }

  if (!title.textContent.trim()) {
    title.textContent = DEFAULT_CONTENT.title;
  }

  return title;
}

function extractContent(block) {
  return {
    titleCell: getCell(block, 0, 0),
    placeholder: getCellText(getCell(block, 1, 0), DEFAULT_CONTENT.placeholder),
    submitLabel: getCellText(getCell(block, 1, 1), DEFAULT_CONTENT.submitLabel),
    successMessage: getCellText(getCell(block, 2, 0), DEFAULT_CONTENT.successMessage),
    invalidEmailMessage: getCellText(getCell(block, 2, 1), DEFAULT_CONTENT.invalidEmailMessage),
    submitErrorMessage: getCellText(getCell(block, 3, 1), DEFAULT_CONTENT.submitErrorMessage),
  };
}

function clearStatus(element) {
  element.hidden = true;
  element.textContent = '';
  delete element.dataset.tone;
}

function setStatus(element, message, tone = 'neutral') {
  if (!message) {
    clearStatus(element);
    return;
  }

  element.hidden = false;
  element.textContent = message;
  element.dataset.tone = tone;
}

function validateEmail(input, invalidEmailMessage) {
  const email = input.value.trim();
  const valid = input.validity.valid && email.length > 0;

  input.setAttribute('aria-invalid', String(!valid));

  if (!valid) {
    input.setCustomValidity(invalidEmailMessage);
    return false;
  }

  input.setCustomValidity('');
  return true;
}

async function submitForm(form, input, submitButton, status, thankYou, content) {
  if (form.dataset.submitting === 'true') {
    return;
  }

  form.dataset.submitting = 'true';
  submitButton.disabled = true;

  try {
    const email = input.value.trim();
    const response = await fetch(NEWSLETTER_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`Newsletter submit failed: ${response.status}`);
    }

    clearStatus(status);
    thankYou.hidden = false;
    form.hidden = true;
    form.reset();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    setStatus(status, content.submitErrorMessage, 'error');
  } finally {
    form.dataset.submitting = 'false';
    submitButton.disabled = false;
  }
}

export default async function decorate(block) {
  const content = extractContent(block);

  block.replaceChildren();

  const shell = createElement('div', 'newsletter-shell');
  const copy = createElement('div', 'newsletter-copy');
  const panel = createElement('div', 'newsletter-panel');
  const form = createElement('form', 'newsletter-form');
  const formRow = createElement('div', 'newsletter-form-row');
  const field = createElement('label', 'newsletter-field');
  const label = createElement('span', 'newsletter-field-label', content.placeholder);
  const input = createElement('input', 'newsletter-input');
  const submitButton = createElement('button', 'newsletter-submit');
  const submitArrow = createElement('span', 'newsletter-submit-arrow', '→');
  const status = createElement('p', 'newsletter-status');
  const thankYou = createElement('p', 'newsletter-thank-you', content.successMessage);

  form.noValidate = true;
  form.dataset.submitting = 'false';

  input.type = 'email';
  input.name = 'email';
  input.required = true;
  input.autocomplete = 'email';
  input.inputMode = 'email';
  input.placeholder = content.placeholder;
  input.setAttribute('aria-invalid', 'false');

  submitButton.type = 'submit';
  submitButton.append(content.submitLabel, submitArrow);

  status.hidden = true;
  status.setAttribute('aria-live', 'polite');
  thankYou.hidden = true;
  thankYou.setAttribute('aria-live', 'polite');

  field.append(label, input);
  formRow.append(field, submitButton);
  form.append(formRow, status);
  copy.append(buildTitle(content.titleCell));
  panel.append(form, thankYou);
  shell.append(copy, panel);
  block.append(shell);

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    input.setAttribute('aria-invalid', 'false');
    if (status.dataset.tone === 'error' && status.textContent === content.invalidEmailMessage) {
      clearStatus(status);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus(status);
    thankYou.hidden = true;

    if (!validateEmail(input, content.invalidEmailMessage)) {
      setStatus(status, content.invalidEmailMessage, 'error');
      input.focus();
      return;
    }

    await submitForm(form, input, submitButton, status, thankYou, content);
  });
}
