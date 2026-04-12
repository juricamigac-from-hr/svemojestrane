function activateManagedScript(script) {
  if (script.dataset.cmExecuted === 'true') return;
  const next = document.createElement('script');
  [...script.attributes].forEach((attribute) => {
    if (!['type', 'data-src', 'data-managed-by', 'data-consent-category', 'data-consent-vendor'].includes(attribute.name)) {
      next.setAttribute(attribute.name, attribute.value);
    }
  });
  if (script.dataset.src) {
    next.src = script.dataset.src;
  } else {
    next.textContent = script.textContent;
  }
  script.dataset.cmExecuted = 'true';
  script.replaceWith(next);
}

export function applyManagedScripts(root, manager) {
  root.querySelectorAll('script[data-managed-by="consent-manager"]').forEach((script) => {
    const vendor = script.dataset.consentVendor;
    const category = script.dataset.consentCategory;
    const allowed = vendor ? manager.isAllowed(vendor) : manager.isAllowed(category);
    if (allowed) activateManagedScript(script);
  });
}

export function applyManagedEmbeds(root, manager) {
  root.querySelectorAll('[data-managed-embed="consent-manager"]').forEach((element) => {
    const vendor = element.dataset.consentVendor;
    const category = element.dataset.consentCategory;
    const allowed = vendor ? manager.isAllowed(vendor) : manager.isAllowed(category);
    const isMounted = element.dataset.cmMounted === 'true';

    if (allowed && !isMounted) {
      const iframe = document.createElement('iframe');
      iframe.src = element.dataset.src;
      iframe.title = element.dataset.title || 'Embedded content';
      iframe.loading = 'lazy';
      iframe.allow = element.dataset.allow || '';
      iframe.referrerPolicy = element.dataset.referrerpolicy || 'strict-origin-when-cross-origin';
      iframe.className = 'consent-embed-frame';
      element.innerHTML = '';
      element.append(iframe);
      element.dataset.cmMounted = 'true';
      return;
    }

    if (!allowed) {
      element.dataset.cmMounted = 'false';
      element.innerHTML = `
        <div class="consent-embed-placeholder">
          <p>${element.dataset.placeholderText || 'This content requires consent before it can be loaded.'}</p>
          <button type="button" class="button consent-open-preferences">Manage cookies</button>
        </div>
      `;
      const button = element.querySelector('.consent-open-preferences');
      if (button) {
        button.addEventListener('click', () => manager.openPreferences(true));
      }
    }
  });
}
