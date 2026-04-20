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
      label: 'Striktno nužni kolačići',
      description: 'Nužni kolačići neophodni su za ispravan rad web-stranice jer omogućuju osnovne funkcionalnosti, poput navigacije i pristupa sigurnim dijelovima stranice. Bez njih stranica ne može pravilno funkcionirati.',
    },
    functional: {
      default: 'denied',
      label: 'Funkcijski kolačići',
      description: 'Preferencijski kolačići omogućuju web-stranici da zapamti postavke koje utječu na njezino ponašanje ili izgled, poput odabranog jezika ili geografske regije. Pomažu pružiti personaliziranije iskustvo tako što vaše odabire zadržavaju dosljednima između posjeta, pa ne morate ponovno podešavati stranicu pri svakom povratku.',
    },
    analytics: {
      default: 'denied',
      label: 'Analitički kolačići',
      description: 'Statistički kolačići pomažu vlasnicima web-stranica razumjeti kako posjetitelji koriste web-stranicu prikupljanjem i izvještavanjem podataka u anonimiziranom obliku.',
    },
    advertising: {
      default: 'denied',
      label: 'Marketinški kolačići',
      description: 'Marketinški kolačići koriste se za praćenje korisnika na različitim web-stranicama kako bi se prikazivali oglasi koji su relevantniji i zanimljiviji, čime postaju korisniji i izdavačima i oglašivačima trećih strana.',
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
