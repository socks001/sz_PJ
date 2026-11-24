import { px } from './tokens';

const SECTION_IDS = ['top', 'experience', 'stack', 'arch', 'motion', 'perf', 'contact'];

export function initNav(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.nav-list a[href^="#"], .menu-nav a[href^="#"]'),
  );
  const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
    (section): section is HTMLElement => section !== null,
  );

  const scrimAt = px('--motion-nav-scrim-threshold', 80);
  const hideAt = px('--motion-nav-hide-threshold', 120);
  const showAt = px('--motion-nav-show-threshold', 40);
  const anchorOffset = px('--layout-anchor-offset', 72);

  let lastY = window.scrollY;
  let down = 0;
  let up = 0;
  let frame = 0;

  const update = (): void => {
    frame = 0;
    const y = window.scrollY;

    if (header) {
      header.classList.toggle('is-scrolled', y > scrimAt);

      if (y <= scrimAt) {
        header.classList.remove('is-hidden');
      } else if (y > lastY) {
        down += y - lastY;
        up = 0;
        if (down > hideAt) header.classList.add('is-hidden');
      } else if (y < lastY) {
        up += lastY - y;
        down = 0;
        if (up > showAt) header.classList.remove('is-hidden');
      }
    }

    lastY = y;

    let active = '';
    const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2;

    if (atBottom) {
      active = sections[sections.length - 1]?.id ?? '';
    } else {
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= anchorOffset) active = section.id;
      });
    }

    links.forEach((link) => {
      if (link.getAttribute('href') === `#${active}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
