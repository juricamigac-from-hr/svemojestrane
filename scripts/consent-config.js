const consentConfig = {
  version: '1.0.0',
  policyVersion: '2026-04',
  debug: false,
  autoShowBanner: true,
  ui: {
    enabled: true,
    cssPath: '/styles/consent-manager.css',
    content: {
      bannerTitle: 'Pozdrav putniče, vrijeme je za kolačić!',
      bannerDescription: 'Koristimo analitičke kolačiće za analizu prometa na našoj web stranici. Informacije o vašem korištenju stranice možemo dijeliti s našim analitičkim partnerima, koji ih mogu povezati s drugim podacima koje ste im dali ili koje su prikupili korištenjem svojih usluga.',
      preferencesTitle: 'Centar za postavke privole',
      usageTitle: 'Upotreba kolačića',
      usageDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      moreInfoTitle: 'Više informacija',
      moreInfoText: 'Za sve upite vezane uz našu politiku kolačića i vaše odabire, molimo',
      moreInfoLinkLabel: 'da nas kontaktirate.',
      moreInfoLinkHref: 'mailto:helena.svemojestrane@gmail.com',
      acceptAllLabel: 'Prihvati sve',
      rejectAllLabel: 'Odbij sve',
      managePreferencesLabel: 'Upravljal preferencama',
      savePreferencesLabel: 'Spremi preference',
      links: [
        { label: 'Polica privatnosti', href: '#link' },
        { label: 'Uvjeti korištenja', href: '#link' },
      ],
    },
  },
  storage: {
    type: 'localStorage',
    key: 'svemojestrane_consent',
  },
  categories: {
    necessary: {
      required: true,
      default: 'granted',
      label: 'Strictly Necessary Cookies',
      description: 'Necessary cookies are essential for a website to work correctly, as they enable core features such as navigation and access to secure sections. Without them, the site cannot operate properly.',
    },
    functional: {
      default: 'denied',
      label: 'Functionality Cookies',
      description: 'Preference cookies allow a website to remember settings that influence how it behaves or appears, such as your chosen language or geographic region. They help provide a more personalized experience by keeping your selections consistent across visits, so you don’t have to reconfigure the site each time you return.',
    },
    analytics: {
      default: 'denied',
      label: 'Analytics Cookies',
      description: 'Statistic cookies help site owners understand how visitors use the website by gathering and reporting data in an anonymous form.',
    },
    advertising: {
      default: 'denied',
      label: 'Advertising Cookies',
      description: 'Marketing cookies are used to follow users across different websites in order to show ads that are more relevant and engaging, making them more useful for both publishers and third-party advertisers.',
    },
  },
  vendors: {
    'google-analytics': {
      category: 'analytics',
      phase: 'eager',
      adapter: 'google-consent-mode',
    },
    'gtm-lazy': {
      category: 'analytics',
      phase: 'lazy',
      adapter: 'google-consent-mode',
    },
    'gtm-delayed': {
      category: 'advertising',
      phase: 'delayed',
      adapter: 'google-consent-mode',
    },
  },
  googleConsentMode: {
    enabled: true,
  },
  martech: {
    enabled: true,
    dataLayerName: 'dataLayer',
  },
};

export default consentConfig;
