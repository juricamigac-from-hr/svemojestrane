export default class GoogleConsentAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  getConsentState(state) {
    const mapping = this.config.mapping || {};
    const output = {};
    Object.entries(mapping).forEach(([category, keys]) => {
      const status = state.categories[category] === 'granted' ? 'granted' : 'denied';
      keys.forEach((key) => {
        output[key] = status;
      });
    });
    return output;
  }

  applyDefaults(_ctx, state) {
    this.ensureGtag();
    window.gtag('consent', 'default', this.getConsentState(state));
  }

  pushUpdate(_ctx, state) {
    this.ensureGtag();
    window.gtag('consent', 'update', this.getConsentState(state));
  }
}
