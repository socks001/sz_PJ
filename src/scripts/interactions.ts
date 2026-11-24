import { closeMenu } from './menu';
import { easing, isReduced, ms, px } from './tokens';

const toastEl = document.querySelector<HTMLElement>('[data-toast]');
let toastAnimation: Animation | null = null;

function showToast(message: string): void {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastAnimation?.cancel();

  const enter = ms('--motion-toast-in-duration', 200);
  const hold = ms('--motion-toast-hold-duration', 1600);
  const exit = ms('--motion-toast-out-duration', 200);
  const total = enter + hold + exit;
  const offset = px('--motion-toast-offset', 16);

  toastAnimation = toastEl.animate(
    [
      {
        opacity: 0,
        transform: `translate(-50%, ${offset}px)`,
        offset: 0,
        easing: easing(),
      },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: enter / total, easing: 'linear' },
      {
        opacity: 1,
        transform: 'translate(-50%, 0)',
        offset: (enter + hold) / total,
        easing: 'ease-in',
      },
      { opacity: 0, transform: `translate(-50%, ${offset}px)`, offset: 1 },
    ],
    { duration: total, fill: 'none' },
  );
}

let clockEl: HTMLElement | null = null;
let scrollAnimation: Animation | null = null;
let scrollFrame = 0;

function scrollClock(): HTMLElement {
  if (!clockEl) {
    clockEl = document.createElement('span');
    clockEl.setAttribute('aria-hidden', 'true');
    clockEl.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.append(clockEl);
  }
  return clockEl;
}

function cancelScroll(): void {
  if (scrollAnimation) {
    scrollAnimation.cancel();
    scrollAnimation = null;
  }
  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  }
}

function scrollToY(top: number): void {
  cancelScroll();

  const start = window.scrollY;
  const delta = top - start;

  if (Math.abs(delta) < 1) return;

  if (isReduced()) {
    window.scrollTo(0, top);
    return;
  }

  const min = ms('--motion-scroll-top-min', 400);
  const max = ms('--motion-scroll-top-max', 700);
  const distance = Math.abs(delta);
  const span = Math.max(window.innerHeight, 1);
  const duration = Math.min(max, min + (max - min) * Math.min(1, distance / span));

  const animation = scrollClock().animate([{ opacity: 0 }, { opacity: 1 }], {
    duration,
    easing: easing('--ease-in-out'),
  });
  scrollAnimation = animation;

  const step = (): void => {
    const time = Number(animation.currentTime ?? 0);
    const progress = Math.min(1, time / duration);
    window.scrollTo(0, start + delta * progress);

    if (progress < 1) {
      scrollFrame = window.requestAnimationFrame(step);
    } else {
      scrollFrame = 0;
      animation.cancel();
      scrollAnimation = null;
    }
  };

  scrollFrame = window.requestAnimationFrame(step);
}

function initAnchorLinks(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#menu') return;

    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();

      const offset = href === '#top' ? 0 : px('--layout-anchor-offset', 72);
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
      scrollToY(top);
      window.history.pushState(null, '', href);

      if (link.closest('.menu-nav')) {
        closeMenu();
        const heading = target.querySelector<HTMLElement>('h1, h2');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
          heading.addEventListener(
            'blur',
            () => heading.removeAttribute('tabindex'),
            { once: true },
          );
        }
      }
    });
  });

  window.addEventListener('wheel', cancelScroll, { passive: true });
  window.addEventListener('touchstart', cancelScroll, { passive: true });
}

function initBackToTop(): void {
  const button = document.querySelector<HTMLElement>('[data-to-top]');
  if (!button) return;

  const update = (): void => {
    button.hidden = document.documentElement.scrollHeight <= window.innerHeight + 1;
  };

  window.addEventListener('resize', update);
  update();
}

function initEmailCopy(): void {
  document.querySelectorAll<HTMLElement>('[data-copy-email]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.copyEmail ?? '';

      const fallback = (): void => {
        showToast('长按邮箱可复制');
      };

      if (!navigator.clipboard) {
        fallback();
        return;
      }

      navigator.clipboard.writeText(value).then(
        () => showToast('邮箱已复制'),
        fallback,
      );
    });
  });
}

export function initInteractions(): void {
  initAnchorLinks();
  initBackToTop();
  initEmailCopy();
}
