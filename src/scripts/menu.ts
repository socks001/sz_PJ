import { easing, isReduced, ms, px } from './tokens';

let closeHandler: ((restoreFocus?: boolean) => void) | null = null;

export function closeMenu(restoreFocus = false): void {
  closeHandler?.(restoreFocus);
}

export function initMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const overlay = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !overlay) return;

  const closeButton = overlay.querySelector<HTMLButtonElement>('[data-menu-close]');
  const items = Array.from(overlay.querySelectorAll<HTMLElement>('[data-menu-item]'));
  const background = Array.from(
    document.querySelectorAll<HTMLElement>('main, .site-header, .site-footer'),
  );

  const openDuration = ms('--motion-menu-duration', 360);
  const closeDuration = ms('--motion-menu-close-duration', 320);
  const stagger = ms('--motion-menu-item-stagger', 60);
  const reducedDuration = ms('--motion-reduced-duration', 300);
  const itemOffset = px('--motion-reveal-offset-xs', 12);

  let open = false;
  let overlayAnimation: Animation | null = null;
  let itemAnimations: Animation[] = [];

  overlay.inert = true;
  overlay.setAttribute('aria-hidden', 'true');

  const setBackgroundInert = (state: boolean): void => {
    background.forEach((el) => {
      el.inert = state;
    });
  };

  const show = (): void => {
    if (open) return;
    open = true;

    overlay.classList.add('is-open');
    overlay.inert = false;
    overlay.removeAttribute('aria-hidden');
    document.documentElement.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '关闭导航菜单');
    setBackgroundInert(true);

    const reduced = isReduced();
    overlayAnimation?.cancel();
    overlayAnimation = overlay.animate(
      reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { transform: 'translateY(100%)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
      {
        duration: reduced ? reducedDuration : openDuration,
        easing: easing(),
        fill: 'backwards',
      },
    );

    itemAnimations.forEach((animation) => animation.cancel());
    itemAnimations = items.map((item, index) =>
      item.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: `translateY(${itemOffset}px)` },
              { opacity: 1, transform: 'translateY(0)' },
            ],
        {
          duration: reduced ? reducedDuration : openDuration,
          delay: reduced ? 0 : stagger * index,
          easing: easing(),
          fill: 'backwards',
        },
      ),
    );

    window.requestAnimationFrame(() => {
      closeButton?.focus({ preventScroll: true });
    });
  };

  const hide = (restoreFocus = true): void => {
    if (!open) return;
    open = false;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开导航菜单');
    document.documentElement.classList.remove('menu-open');
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);

    if (restoreFocus) toggle.focus({ preventScroll: true });

    const reduced = isReduced();
    itemAnimations.forEach((animation) => animation.cancel());
    itemAnimations = [];

    overlayAnimation?.cancel();
    overlayAnimation = overlay.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
      {
        duration: reduced ? reducedDuration : closeDuration,
        easing: easing('--ease-in-out'),
        fill: 'forwards',
      },
    );

    overlayAnimation.onfinish = () => {
      if (!open) overlay.classList.remove('is-open');
    };
  };

  closeHandler = hide;

  toggle.addEventListener('click', () => {
    if (open) hide();
    else show();
  });

  closeButton?.addEventListener('click', () => hide());

  document.addEventListener('keydown', (event) => {
    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = [closeButton, ...items].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || !overlay.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const desktop = window.matchMedia('(min-width: 1024px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) hide(false);
  });
}
