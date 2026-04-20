import { loadCSS } from '../../../../scripts/aem.js';
import { createStorage } from './storage.js';
import { createEmitter } from './events.js';
import createUI from './ui.js';
import { applyManagedEmbeds, applyManagedScripts } from './runtime.js';
import GoogleConsentAdapter from './adapters/google-consent.js';

const DEFAULT_CONFIG = {
  version: '1.0.0',
  policyVersion: '2026-04',
  debug: false,
  mode: 'basic',
  autoShowBanner: true,
  ui: {
    enabled: true,
    cssPath: '/styles/consent-manager.css',
  },
  storage: {
    type: 'localStorage',
    key: 'site_consent',
  },
  categories: {
    necessary: { required: true, default: 'granted', label: 'Necessary', description: 'Required for core site functionality.' },
    functional: { default: 'denied', label: 'Functional', description: 'Embedded media and enhanced experiences.' },
    analytics: { default: 'denied', label: 'Analytics', description: 'Audience measurement and site improvement.' },
    advertising: { default: 'denied', label: 'Advertising', description: 'Ad measurement, remarketing, and personalization.' },
  },
  vendors: {},
  googleConsentMode: {
    enabled: true,
    mapping: {
      analytics: ['analytics_storage'],
      advertising: ['ad_storage', 'ad_user_data', 'ad_personalization'],
      functional: ['functionality_storage', 'personalization_storage'],
      necessary: ['security_storage'],
    },
  },
  martech: {
    enabled: false,
    dataLayerName: 'dataLayer',
  },
};

function deepMerge(base, extra) {
  const output = { ...base };
  Object.entries(extra || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function createDefaultCategories(categories) {
  return Object.fromEntries(Object.entries(categories).map(([key, def]) => [key, def.required ? 'granted' : (def.default || 'denied')]));
}

export default class ConsentManager {
  constructor(config = {}) {
    this.config = deepMerge(DEFAULT_CONFIG, config);
    console.log(this.config);
    
    this.storage = createStorage(this.config.storage);
    this.emitter = createEmitter();
    this.state = null;
    this.ui = null;
    this.adapters = new Map();
    this.googleAdapter = new GoogleConsentAdapter(this.config.googleConsentMode);
    this.registerVendor('google-consent-mode', this.googleAdapter);
  }

  log(...args) {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[consent-manager]', ...args);
    }
  }

  registerVendor(id, adapter) {
    this.adapters.set(id, adapter);
  }

  async init() {
    this.state = this.getStoredState() || this.createInitialState();

    if (this.config.ui?.enabled) {
      await loadCSS(`${window.hlx.codeBasePath}${this.config.ui.cssPath}`);
      this.ui = createUI(this, this.config);
      this.ui.mount();
    }

    this.applyGoogleConsentDefaults();
    this.publishMartechEvent('consent_default_applied', this.state);
    applyManagedEmbeds(document, this);
    applyManagedScripts(document, this);

    if (this.config.autoShowBanner && this.shouldShowBanner()) {
      this.openPreferences(false);
    }

    this.emitter.emit('ready', this.state);
    document.dispatchEvent(new CustomEvent('consent:ready', { detail: this.state }));
    return this.state;
  }

  createInitialState() {
    return {
      version: this.config.version,
      policyVersion: this.config.policyVersion,
      status: 'unknown',
      categories: createDefaultCategories(this.config.categories),
      vendors: {},
      timestamp: new Date().toISOString(),
      source: 'default',
    };
  }

  getStoredState() {
    const value = this.storage.get();
    if (!value) return null;
    if (value.policyVersion !== this.config.policyVersion) return null;
    return value;
  }

  persistState() {
    this.storage.set(this.state);
  }

  shouldShowBanner() {
    return this.state.status === 'unknown';
  }

  getState() {
    return structuredClone(this.state);
  }

  isAllowed(categoryOrVendor) {
    const vendor = this.config.vendors[categoryOrVendor];
    if (vendor) {
      const vendorSetting = this.state.vendors[categoryOrVendor];
      if (vendorSetting && vendorSetting !== 'inherit') return vendorSetting === 'granted';
      return this.state.categories[vendor.category] === 'granted';
    }
    return this.state.categories[categoryOrVendor] === 'granted';
  }

  async setState(nextState, source = 'api') {
    this.state = {
      ...this.state,
      ...nextState,
      categories: { ...this.state.categories, ...(nextState.categories || {}) },
      vendors: { ...this.state.vendors, ...(nextState.vendors || {}) },
      timestamp: new Date().toISOString(),
      source,
    };

    const categoryValues = Object.values(this.state.categories);
    const allGranted = categoryValues.every((value) => value === 'granted');
    const allDenied = Object.entries(this.config.categories)
      .filter(([, def]) => !def.required)
      .every(([key]) => this.state.categories[key] === 'denied');

    this.state.status = allGranted ? 'granted' : (allDenied ? 'denied' : 'custom');

    this.persistState();
    this.pushGoogleConsentUpdate();
    this.publishMartechEvent('consent_updated', this.state);
    applyManagedEmbeds(document, this);
    applyManagedScripts(document, this);

    await Promise.all([...this.adapters.values()].map(async (adapter) => {
      if (adapter.onUpdate) await adapter.onUpdate(this.getContext(), this.state);
    }));

    this.emitter.emit('updated', this.state);
    document.dispatchEvent(new CustomEvent('consent:updated', { detail: this.state }));
  }

  async grantAll() {
    const categories = Object.fromEntries(Object.keys(this.config.categories).map((key) => [key, 'granted']));
    await this.setState({ categories }, 'banner');
  }

  async denyAll() {
    const categories = Object.fromEntries(Object.entries(this.config.categories).map(([key, def]) => [key, def.required ? 'granted' : 'denied']));
    await this.setState({ categories }, 'banner');
  }

  async saveCategories(categories, source = 'preferences') {
    const nextCategories = { ...this.state.categories };
    Object.entries(categories).forEach(([key, value]) => {
      if (!this.config.categories[key]?.required) nextCategories[key] = value;
    });
    await this.setState({ categories: nextCategories }, source);
  }

  openPreferences(forceModal = true) {
    if (this.ui) this.ui.open(forceModal);
  }

  reset() {
    this.storage.clear();
    this.state = this.createInitialState();
    if (this.ui) this.ui.render();
  }

  getGoogleConsentState() {
    return this.googleAdapter.getConsentState(this.state);
  }

  applyGoogleConsentDefaults() {
    if (!this.config.googleConsentMode?.enabled) return;
    this.googleAdapter.applyDefaults(this.getContext(), this.state);
  }

  pushGoogleConsentUpdate() {
    if (!this.config.googleConsentMode?.enabled) return;
    this.googleAdapter.pushUpdate(this.getContext(), this.state);
  }

  publishMartechEvent(event, state) {
    if (!this.config.martech?.enabled) return;
    const dataLayerName = this.config.martech.dataLayerName || 'dataLayer';
    window[dataLayerName] = window[dataLayerName] || [];
    window[dataLayerName].push({
      event,
      consent_state: state.status,
      consent_categories: { ...state.categories },
      consent_policy_version: state.policyVersion,
      consent_timestamp: state.timestamp,
    });
  }

  async applyPhase(phase) {
    const phaseVendors = Object.entries(this.config.vendors).filter(([, vendor]) => vendor.phase === phase);
    await Promise.all(phaseVendors.map(async ([id, vendor]) => {
      if (!this.isAllowed(id)) return;
      const adapter = this.adapters.get(vendor.adapter);
      if (adapter?.onAllow) {
        await adapter.onAllow(this.getContext({ vendorId: id, vendor }));
      }
    }));
    this.publishMartechEvent('consent_phase_applied', { ...this.state, phase });
  }

  getContext(extra = {}) {
    return {
      config: this.config,
      manager: this,
      state: this.state,
      ...extra,
    };
  }

  on(eventName, handler) {
    return this.emitter.on(eventName, handler);
  }
}
