import { easing, isReduced, ms, px } from './tokens';

interface Preset {
  offset: string;
  duration: string;
  stagger: string | null;
}

const presets: Record<string, Preset> = {
  group: {
    offset: '--motion-reveal-offset',
    duration: '--motion-reveal-duration',
    stagger: '--motion-reveal-stagger',
  },
  layer: {
    offset: '--motion-reveal-offset-sm',
    duration: '--motion-reveal-duration-sm',
    stagger: '--motion-reveal-stagger',
  },
  tradeoff: {
    offset: '--motion-reveal-offset-sm',
    duration: '--motion-reveal-duration-sm',
    stagger: '--motion-reveal-stagger-lg',
  },
  motion: {
    offset: '--motion-reveal-offset',
    duration: '--motion-reveal-duration',
    stagger: '--motion-reveal-stagger',
  },
  metric: {
    offset: '--motion-reveal-offset-sm',
    duration: '--motion-reveal-duration-sm',
    stagger: '--motion-reveal-stagger',
  },
  check: {
    offset: '--motion-reveal-offset-xs',
    duration: '--motion-reveal-duration-xs',
    stagger: '--motion-reveal-stagger-sm',
  },
  title: {
    offset: '--motion-reveal-offset-lg',
    duration: '--motion-reveal-duration',
    stagger: null,
  },
  footer: {
    offset: '--motion-reveal-offset-sm',
    duration: '--motion-reveal-duration-sm',
    stagger: null,
  },
};

interface Entry {
  el: HTMLElement;
  preset: Preset;
}

function reveal(el: HTMLElement, preset: Preset, delay: number): void {
  el.animate(
    [
      { opacity: 0, transform: `translateY(${px(preset.offset)}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: ms(preset.duration),
      delay,
      easing: easing(),
      fill: 'backwards',
    },
  );

  el.querySelectorAll<HTMLElement>('[data-reveal-line]').forEach((line) => {
    line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: ms('--motion-line-duration'),
      delay,
      easing: easing(),
      fill: 'backwards',
    });
  });
}

export function initReveal(): void {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!containers.length) return;

  const queue = new Map<Element, Entry>();

  containers.forEach((container) => {
    const preset = presets[container.dataset.reveal ?? ''] ?? presets.group;
    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal-item]'));
    const targets = items.length ? items : [container];
    targets.forEach((el) => queue.set(el, { el, preset }));
  });

  if (!queue.size) return;

  const reduced = isReduced();

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;

      if (reduced) {
        visible.forEach((entry) => {
          const item = queue.get(entry.target);
          observer.unobserve(entry.target);
          if (!item) return;
          item.el.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: ms('--motion-reduced-duration'),
            easing: easing(),
            fill: 'backwards',
          });
        });
        return;
      }

      visible
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        .forEach((entry, index) => {
          const item = queue.get(entry.target);
          observer.unobserve(entry.target);
          if (!item) return;
          const stagger = item.preset.stagger ? ms(item.preset.stagger) : 0;
          reveal(item.el, item.preset, stagger * index);
        });
    },
    { rootMargin: '0px 0px -15% 0px' },
  );

  queue.forEach((_item, el) => {
    observer.observe(el);
  });
}
