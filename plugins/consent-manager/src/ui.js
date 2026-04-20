const DEFAULT_CONTENT = {
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
  closeModalLabel: 'Zatvori popup',
  alwaysEnabledLabel: 'Uvijek omogućeno',
  links: [
    { label: 'Polica privatnosti', href: '#link' },
    { label: 'Terms and conditions', href: '#link' },
  ],
};

function getContent(config) {
  return {
    ...DEFAULT_CONTENT,
    ...(config.ui?.content || {}),
    links: config.ui?.content?.links || DEFAULT_CONTENT.links,
  };
}

function getCategoryLabel(key, def) {
  if (def.label) return def.label;
  if (key === 'necessary') return 'Strictly Necessary Cookies';
  return `${key.charAt(0).toUpperCase()}${key.slice(1)} Cookies`;
}

function categoryRow([key, def], state, expanded, content) {
  const checked = state.categories[key] === 'granted' ? 'checked' : '';
  const disabled = def.required ? 'disabled' : '';
  const isExpanded = expanded.has(key);
  const label = getCategoryLabel(key, def);
  const badge = def.required ? ` <span class="pm__badge">${content.alwaysEnabledLabel}</span>` : '';
  const controlsId = `${key}-desc`;
  const sectionClasses = ['pm__section--toggle', 'pm__section--expandable'];
  if (isExpanded) sectionClasses.push('is-expanded');

  return `
    <div class="${sectionClasses.join(' ')}">
      <div class="pm__section-title-wrapper">
        <button type="button" class="pm__section-title" data-action="toggle-section" data-key="${key}" aria-expanded="${isExpanded}" aria-controls="${controlsId}">${label}${badge}</button>
        <span class="pm__section-arrow">
          <svg viewBox="0 0 24 24" stroke-width="3.5">
            <path d="M 21.999 6.94 L 11.639 17.18 L 2.001 6.82 "></path>
          </svg>
        </span>
        <label class="section__toggle-wrapper">
          <input type="checkbox" class="section__toggle" name="${key}" value="${key}" ${checked} ${disabled}>
          <span class="toggle__icon" aria-hidden="true">
            <span class="toggle__icon-circle">
              <span class="toggle__icon-off">
                <svg viewBox="0 0 24 24" stroke-width="3">
                  <path d="M 19.5 4.5 L 4.5 19.5 M 4.5 4.501 L 19.5 19.5"></path>
                </svg>
              </span>
              <span class="toggle__icon-on">
                <svg viewBox="0 0 24 24" stroke-width="3">
                  <path d="M 3.572 13.406 L 8.281 18.115 L 20.428 5.885"></path>
                </svg>
              </span>
            </span>
          </span>
          <span class="toggle__label">${label}</span>
        </label>
      </div>
      <div class="pm__section-desc-wrapper" aria-hidden="${!isExpanded}" id="${controlsId}">
        <p class="pm__section-desc">${def.description || ''}</p>
      </div>
    </div>
  `;
}

export default function createUI(manager, config) {
  let root;
  let activeView = 'none';
  let expandedSections = new Set();
  let bindEvents = () => {};
  let render = () => {};

  const content = getContent(config);

  render = () => {
    const state = manager.getState();
    const isBannerOpen = activeView === 'banner' && state.status === 'unknown';
    const isModalOpen = activeView === 'modal';
    const hasDecision = state.status !== 'unknown';
    const bannerVisibility = isBannerOpen ? 'false' : 'true';
    const modalVisibility = isModalOpen ? 'false' : 'true';

    root.className = 'consent-manager';
    if (isBannerOpen) root.classList.add('is-banner-open');
    if (isModalOpen) root.classList.add('is-modal-open');
    if (hasDecision) root.classList.add('has-consent');

    root.innerHTML = `
      <div id="cc-main" data-nosnippet="">
        <div class="cm-wrapper cc--anim">
          <div class="cm cm--bar cm--inline cm--bottom cm--flip" role="dialog" aria-modal="true" aria-hidden="${bannerVisibility}" aria-describedby="cm__desc" aria-labelledby="cm__title">
            <div tabindex="-1"></div>
            <div class="cm__body">
              <div class="cm__texts">
                <h2 id="cm__title" class="cm__title">${content.bannerTitle}</h2>
                <p id="cm__desc" class="cm__desc">${content.bannerDescription}</p>
              </div>
              <div class="cm__btns">
                <div class="cm__btn-group">
                  <button type="button" class="cm__btn cm__btn--secondary" data-role="necessary"><span>${content.rejectAllLabel}</span></button>
                  <button type="button" class="cm__btn" data-role="all"><span>${content.acceptAllLabel}</span></button>
                </div>
                <div class="cm__btn-group">
                  <button type="button" class="cm__btn cm__btn--secondary" data-role="show"><span>${content.managePreferencesLabel}</span></button>
                </div>
              </div>
            </div>
            <div class="cm__footer">
              <div class="cm__links">
                <div class="cm__link-group">
                  ${content.links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="pm-wrapper cc--anim">
          <div class="pm-overlay"></div>
          <div class="pm pm--box" role="dialog" aria-hidden="${modalVisibility}" aria-modal="true" aria-labelledby="pm__title">
            <div tabindex="-1"></div>
            <div class="pm__header">
              <h2 class="pm__title" id="pm__title">${content.preferencesTitle}</h2>
              <button type="button" class="pm__close-btn" data-action="close" aria-label="${content.closeModalLabel}">
                <span>
                  <svg viewBox="0 0 24 24" stroke-width="1.5">
                    <path d="M 19.5 4.5 L 4.5 19.5 M 4.5 4.501 L 19.5 19.5"></path>
                  </svg>
                </span>
              </button>
            </div>
            <div class="pm__body">
              <div class="pm__section">
                <div class="pm__section-title-wrapper">
                  <div class="pm__section-title" role="heading" aria-level="3">${content.usageTitle}</div>
                </div>
                <div class="pm__section-desc-wrapper">
                  <p class="pm__section-desc">${content.usageDescription}</p>
                </div>
              </div>
              <form class="pm__section-toggles">
                ${Object.entries(config.categories).map((entry) => categoryRow(entry, state, expandedSections, content)).join('')}
              </form>
              <div class="pm__section pm__section--info">
                <div class="pm__section-title-wrapper">
                  <div class="pm__section-title" role="heading" aria-level="3">${content.moreInfoTitle}</div>
                </div>
                <div class="pm__section-desc-wrapper">
                  <p class="pm__section-desc">${content.moreInfoText} <a class="cc__link" href="${content.moreInfoLinkHref}">${content.moreInfoLinkLabel}</a></p>
                </div>
              </div>
            </div>
            <div class="pm__footer">
              <div class="pm__btn-group">
                <button type="button" class="pm__btn" data-role="all">${content.acceptAllLabel}</button>
                <button type="button" class="pm__btn" data-role="necessary">${content.rejectAllLabel}</button>
              </div>
              <div class="pm__btn-group">
                <button type="button" class="pm__btn pm__btn--secondary" data-role="save">${content.savePreferencesLabel}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="consent-manager__floating-button" data-action="open-preferences" aria-label="${content.managePreferencesLabel}">
        <img src="/plugins/consent-manager/assets/cookie-consent-logo-sm.png" alt="" />
      </button>
    `;

    bindEvents();
  };

  function closePanel() {
    activeView = manager.shouldShowBanner() ? 'banner' : 'none';
    render();
  }

  async function handleSubmit(action) {
    if (action === 'accept-all') {
      await manager.grantAll();
    } else if (action === 'reject-all') {
      await manager.denyAll();
    } else {
      const form = root.querySelector('.pm__section-toggles');
      const data = new FormData(form);
      const categories = Object.fromEntries(
        Object.keys(config.categories).map((key) => [key, data.get(key) ? 'granted' : 'denied']),
      );
      await manager.saveCategories(categories);
    }

    activeView = 'none';
    expandedSections = new Set();
    render();
  }

  bindEvents = () => {
    root.querySelectorAll('[data-role="all"]').forEach((button) => {
      button.addEventListener('click', async () => handleSubmit('accept-all'));
    });

    root.querySelectorAll('[data-role="necessary"]').forEach((button) => {
      button.addEventListener('click', async () => handleSubmit('reject-all'));
    });

    root.querySelector('[data-role="show"]').addEventListener('click', () => {
      activeView = 'modal';
      render();
    });

    root.querySelector('[data-role="save"]').addEventListener('click', async () => handleSubmit('save'));
    root.querySelector('[data-action="close"]').addEventListener('click', closePanel);
    root.querySelector('.pm-overlay').addEventListener('click', closePanel);
    root.querySelector('[data-action="open-preferences"]').addEventListener('click', () => {
      activeView = 'modal';
      render();
    });

    root.querySelectorAll('[data-action="toggle-section"]').forEach((button) => {
      button.addEventListener('click', () => {
        const { key } = button.dataset;
        if (expandedSections.has(key)) expandedSections.delete(key);
        else expandedSections.add(key);
        render();
      });
    });
  };

  return {
    mount() {
      root = document.createElement('aside');
      root.className = 'consent-manager';
      document.body.append(root);
      render();
    },
    render,
    open(forceModal = true) {
      activeView = forceModal ? 'modal' : 'banner';
      render();
    },
  };
}
