import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const SOCIAL_ICONS = {
  instagram: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.7"></rect>
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"></circle>
      <circle cx="17.4" cy="6.8" r="1.1" fill="currentColor"></circle>
    </svg>`,
  facebook: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13.4 20V12.8H16l.4-3h-3v-1.9c0-1 .3-1.7 1.7-1.7h1.5V3.5c-.3 0-1.2-.1-2.2-.1-2.8 0-4.6 1.7-4.6 4.9v1.5H7.4v3h2.4V20z" fill="currentColor"></path>
    </svg>`,
  youtube: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.4 8.2c-.2-.9-.9-1.6-1.8-1.8C17 6 12 6 12 6s-5 0-6.6.4c-.9.2-1.6.9-1.8 1.8C3.2 9.8 3.2 12 3.2 12s0 2.2.4 3.8c.2.9.9 1.6 1.8 1.8C7 18 12 18 12 18s5 0 6.6-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-3.8.4-3.8s0-2.2-.4-3.8M10.1 14.7V9.3l4.7 2.7z" fill="currentColor"></path>
    </svg>`,
};

function getSocialType(link) {
  const identifier = [
    link.getAttribute('title'),
    link.textContent,
    link.href,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (identifier.includes('instagram')) return 'instagram';
  if (identifier.includes('facebook')) return 'facebook';
  if (identifier.includes('youtube') || identifier.includes('youtu.be')) return 'youtube';

  return '';
}

function buildSocialLink(link) {
  const item = document.createElement('li');
  const anchor = link.cloneNode(true);
  const socialType = getSocialType(anchor);

  anchor.classList.add('footer-social-link');
  anchor.setAttribute('aria-label', anchor.title || anchor.textContent.trim());

  if (socialType && SOCIAL_ICONS[socialType]) {
    const label = document.createElement('span');
    label.className = 'footer-social-label';
    label.textContent = anchor.textContent.trim();

    const icon = document.createElement('span');
    icon.className = 'footer-social-icon';
    icon.innerHTML = SOCIAL_ICONS[socialType];

    anchor.textContent = '';
    anchor.dataset.social = socialType;
    anchor.append(icon, label);
  }

  item.append(anchor);
  return item;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const sections = Array.from(footer.querySelectorAll(':scope > .section'));
  const copyNodes = sections
    .flatMap((section) => Array.from(section.querySelectorAll('.default-content-wrapper > *')))
    .filter((node) => node.tagName !== 'UL');
  const socialLinks = sections.flatMap((section) => Array.from(section.querySelectorAll('a[href]')));

  const shell = document.createElement('div');
  shell.className = 'footer-shell';

  const meta = document.createElement('div');
  meta.className = 'footer-meta';
  copyNodes.forEach((node) => meta.append(node.cloneNode(true)));

  const social = document.createElement('nav');
  social.className = 'footer-social';
  social.setAttribute('aria-label', 'Social links');

  const socialList = document.createElement('ul');
  socialLinks.forEach((link) => {
    socialList.append(buildSocialLink(link));
  });

  social.append(socialList);
  shell.append(meta, social);

  footer.replaceChildren(shell);
  block.append(footer);
}
