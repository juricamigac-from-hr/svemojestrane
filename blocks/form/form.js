import createField from './form-fields.js';

function applySectionTheme(block) {
  const section = block.closest('.section');
  if (!section) return;

  const { background, color } = section.dataset;

  if (background) {
    block.style.setProperty('--form-horizontal-background', background);
    block.style.setProperty('--form-horizontal-background-dark', background);
  }

  if (color) {
    block.style.setProperty('--form-horizontal-text', color);
  }
}

function normalizeUrl(href) {
  try {
    return new URL(href, window.location.href);
  } catch (e) {
    return null;
  }
}

function getFormConfigFetchPaths(formHref) {
  const url = normalizeUrl(formHref);
  if (!url) return [];

  const fetchPaths = [];

  // Prefer local path first so authored absolute links work in local dev.
  if (url.pathname.endsWith('.json')) {
    fetchPaths.push(`${url.pathname}${url.search}`);
  }

  fetchPaths.push(url.href);
  return [...new Set(fetchPaths)];
}

async function fetchFormConfig(formHref) {
  const fetchPaths = getFormConfigFetchPaths(formHref);
  async function attempt(index = 0, lastError = null) {
    if (index >= fetchPaths.length) {
      throw lastError || new Error('Failed to load form config.');
    }

    const path = fetchPaths[index];
    try {
      const resp = await fetch(path);
      if (!resp.ok) {
        throw new Error(`Failed to load form config: ${resp.status} (${path})`);
      }
      return await resp.json();
    } catch (e) {
      return attempt(index + 1, e);
    }
  }

  return attempt();
}

async function createForm(formHref, submitHref) {
  const formConfigPaths = getFormConfigFetchPaths(formHref);
  const submitUrl = normalizeUrl(submitHref);
  if (!formConfigPaths.length || !submitUrl) return null;

  const json = await fetchFormConfig(formHref);
  const fieldsData = Array.isArray(json?.data) ? json.data : [];

  const form = document.createElement('form');
  form.dataset.action = submitUrl.href;

  const fields = await Promise.all(fieldsData.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  const titleizeFieldsetName = (value) => value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const getOrCreateFieldset = (fieldsetId) => {
    const escapedId = CSS.escape(fieldsetId);
    const existingFieldset = form.querySelector(`fieldset[name="${escapedId}"], fieldset[data-fieldset-id="${escapedId}"]`);
    if (existingFieldset) {
      return existingFieldset;
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('field-wrapper', 'fieldset-wrapper');

    const fieldset = document.createElement('fieldset');
    fieldset.name = fieldsetId;
    fieldset.dataset.fieldsetId = fieldsetId;

    const legend = document.createElement('legend');
    legend.textContent = titleizeFieldsetName(fieldsetId);
    fieldset.append(legend);

    wrapper.append(fieldset);
    form.append(wrapper);

    return fieldset;
  };

  // group fields into fieldsets (explicit or implicit)
  const fieldWrappers = [...form.querySelectorAll(':scope > .field-wrapper[data-fieldset]')];
  fieldWrappers.forEach((wrapper) => {
    const fieldsetId = wrapper.dataset.fieldset?.trim();
    if (!fieldsetId) return;

    const targetFieldset = getOrCreateFieldset(fieldsetId);
    targetFieldset.append(wrapper);
  });

  return form;
}

function generatePayload(form) {
  const payload = {};
  const groups = [];

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked && field.value !== undefined && field.value !== null && field.value !== '') {
          groups.push(field.value);
        }
      } else if (field.value !== undefined && field.value !== null && field.value !== '') {
        payload[field.name] = field.value;
      }
    }
  });

  if (groups.length) {
    payload.groups = groups;
  }

  return payload;
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    submit.disabled = true;

    // create payload
    const payload = generatePayload(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    form.setAttribute('data-submitting', 'false');
    submit.disabled = false;
  }
}

export default async function decorate(block) {
  applySectionTheme(block);

  const links = [...block.querySelectorAll('a')].map((a) => a.href);
  const [formLink, submitLink] = links;
  if (!formLink || !submitLink) return;

  const form = await createForm(formLink, submitLink);
  if (!form) return;
  block.replaceChildren(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}
