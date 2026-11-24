import { easing, isReduced, ms, num, px, wait } from './tokens';

const running = new WeakMap<HTMLElement, Animation[]>();

function addAnimations(root: HTMLElement, ...animations: Animation[]): void {
  const list = running.get(root) ?? [];
  list.push(...animations);
  running.set(root, list);
}

function resetDemo(root: HTMLElement): void {
  const list = running.get(root);
  if (list) list.forEach((animation) => animation.cancel());
  running.delete(root);
}

function settled(animations: Animation[]): Promise<void> {
  return Promise.allSettled(animations.map((animation) => animation.finished)).then(() => undefined);
}

function fadeStage(root: HTMLElement, stage: HTMLElement): Promise<void> {
  const animation = stage.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: ms('--motion-reduced-duration', 300),
    easing: easing(),
    fill: 'backwards',
  });
  addAnimations(root, animation);
  return settled([animation]);
}

type Play = () => Promise<void>;

function demoHero(root: HTMLElement, stage: HTMLElement): Play {
  const steps = new Map<string, HTMLElement>();
  stage.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => {
    if (el.dataset.step) steps.set(el.dataset.step, el);
  });

  const config: Array<[string, string, string, string]> = [
    ['eyebrow', '--motion-hero-eyebrow-delay', '--motion-hero-eyebrow-duration', '--motion-hero-eyebrow-offset'],
    ['l1', '--motion-hero-title-delay-1', '--motion-hero-title-duration', '--motion-hero-title-offset'],
    ['l2', '--motion-hero-title-delay-2', '--motion-hero-title-duration', '--motion-hero-title-offset'],
    ['lede', '--motion-hero-lede-delay', '--motion-hero-lede-duration', '--motion-hero-lede-offset'],
    ['actions', '--motion-hero-actions-delay', '--motion-hero-actions-duration', '--motion-hero-actions-offset'],
  ];

  let run = 0;

  return async () => {
    const current = ++run;
    resetDemo(root);

    if (isReduced()) {
      await fadeStage(root, stage);
      return;
    }

    const animations = config.flatMap(([step, delay, duration, offset]) => {
      const el = steps.get(step);
      if (!el) return [];
      return [
        el.animate(
          [
            { opacity: 0, transform: `translateY(${px(offset)}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: ms(duration), delay: ms(delay), easing: easing(), fill: 'both' },
        ),
      ];
    });

    addAnimations(root, ...animations);
    await settled(animations);
    if (current !== run) return;

    animations.forEach((animation) => animation.cancel());
    running.delete(root);
  };
}

function demoParallax(root: HTMLElement, stage: HTMLElement): Play {
  const glow = stage.querySelector<HTMLElement>('[data-para-glow]');
  const card = stage.querySelector<HTMLElement>('[data-para-card]');
  let run = 0;

  return async () => {
    const current = ++run;
    resetDemo(root);

    if (isReduced() || !glow || !card) {
      await fadeStage(root, stage);
      return;
    }

    const duration = ms('--duration-narrative', 1200);
    const hold = ms('--motion-demo-hold-duration', 600);
    const back = ms('--duration-slow', 640);
    const scale = num('--motion-hero-glow-scale', 1.06);
    const lift = px('--motion-reveal-offset', 24);
    const fadeTo = num('--motion-hero-exit-opacity', 0.15);

    const forward = [
      glow.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }], {
        duration,
        easing: 'linear',
        fill: 'both',
      }),
      card.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(-${lift}px)`, opacity: fadeTo },
        ],
        { duration, easing: 'linear', fill: 'both' },
      ),
    ];

    addAnimations(root, ...forward);
    await settled(forward);
    if (current !== run) return;

    await wait(hold);
    if (current !== run) return;

    const reverse = [
      glow.animate([{ transform: `scale(${scale})` }, { transform: 'scale(1)' }], {
        duration: back,
        easing: easing(),
        fill: 'backwards',
      }),
      card.animate(
        [
          { transform: `translateY(-${lift}px)`, opacity: fadeTo },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: back, easing: easing(), fill: 'backwards' },
      ),
    ];

    addAnimations(root, ...reverse);
    await settled(reverse);
    if (current !== run) return;

    resetDemo(root);
  };
}

function demoShared(root: HTMLElement, stage: HTMLElement): Play {
  const small = stage.querySelector<HTMLElement>('[data-shared-small]');
  const large = stage.querySelector<HTMLElement>('[data-shared-large]');
  const ghost = stage.querySelector<HTMLElement>('[data-shared-ghost]');
  let run = 0;

  return async () => {
    const current = ++run;
    resetDemo(root);

    if (isReduced() || !small || !large || !ghost) {
      await fadeStage(root, stage);
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const from = small.getBoundingClientRect();
    const to = large.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    ghost.style.left = `${from.left - stageRect.left}px`;
    ghost.style.top = `${from.top - stageRect.top}px`;
    ghost.style.width = `${from.width}px`;
    ghost.style.height = `${from.height}px`;

    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    const duration = ms('--duration-base', 400);
    const fade = ms('--duration-fast', 220);
    const hold = ms('--motion-demo-hold-duration', 600);

    const forward = [
      ghost.animate(
        [
          { opacity: 0, transform: 'translate(0, 0) scale(1, 1)' },
          { opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        ],
        { duration, easing: easing(), fill: 'both' },
      ),
      small.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: fade,
        easing: easing(),
        fill: 'both',
      }),
    ];

    addAnimations(root, ...forward);
    await settled(forward);
    if (current !== run) return;

    await wait(hold);
    if (current !== run) return;

    const reverse = [
      ghost.animate(
        [
          { opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { opacity: 0, transform: 'translate(0, 0) scale(1, 1)' },
        ],
        { duration, easing: easing(), fill: 'backwards' },
      ),
      small.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: fade,
        easing: easing(),
        fill: 'backwards',
      }),
    ];

    addAnimations(root, ...reverse);
    await settled(reverse);
    if (current !== run) return;

    resetDemo(root);
  };
}

function demoReduced(root: HTMLElement, stage: HTMLElement): Play {
  const currentDot = stage.querySelector<HTMLElement>('[data-lane="current"]');
  const reducedDot = stage.querySelector<HTMLElement>('[data-lane="reduced"]');
  let run = 0;

  return async () => {
    const current = ++run;
    resetDemo(root);

    if (!currentDot || !reducedDot) return;

    const reduced = isReduced();
    const lift = px('--motion-reveal-offset', 24);
    const full = ms('--duration-base', 400);
    const short = ms('--motion-reduced-duration', 300);

    const animations = [
      currentDot.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(0)' },
              { opacity: 1, transform: `translateY(-${lift}px)` },
            ],
        { duration: reduced ? short : full, easing: easing(), fill: 'both' },
      ),
      reducedDot.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: short,
        easing: easing(),
        fill: 'both',
      }),
    ];

    addAnimations(root, ...animations);
    await settled(animations);
    if (current !== run) return;

    await wait(ms('--motion-demo-hold-duration', 600));
    if (current !== run) return;

    resetDemo(root);
  };
}

function demoNav(root: HTMLElement, stage: HTMLElement): Play {
  const nav = stage.querySelector<HTMLElement>('[data-mini-nav]');
  const scrim = stage.querySelector<HTMLElement>('[data-mini-nav-scrim]');
  let run = 0;

  return async () => {
    const current = ++run;
    resetDemo(root);

    if (isReduced() || !nav) {
      await fadeStage(root, stage);
      return;
    }

    const duration = ms('--motion-demo-nav-duration', 2400);

    const animations: Animation[] = [
      nav.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-100%)', offset: 0.2 },
          { transform: 'translateY(-100%)', offset: 0.55 },
          { transform: 'translateY(0)', offset: 0.78 },
          { transform: 'translateY(0)', offset: 1 },
        ],
        { duration, easing: easing('--ease-in-out'), fill: 'both' },
      ),
    ];

    if (scrim) {
      animations.push(
        scrim.animate(
          [
            { opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { opacity: 1, offset: 0.55 },
            { opacity: 0, offset: 0.78 },
            { opacity: 0, offset: 1 },
          ],
          { duration, easing: easing('--ease-in-out'), fill: 'both' },
        ),
      );
    }

    addAnimations(root, ...animations);
    await settled(animations);
    if (current !== run) return;

    resetDemo(root);
  };
}

function createPlay(root: HTMLElement, stage: HTMLElement): Play | null {
  switch (root.dataset.demo) {
    case '01':
      return demoHero(root, stage);
    case '02':
      return demoParallax(root, stage);
    case '03':
      return demoShared(root, stage);
    case '04':
      return demoReduced(root, stage);
    case '05':
      return demoNav(root, stage);
    default:
      return null;
  }
}

let autoplayActive = false;
const autoplayQueue: Play[] = [];

function scheduleAutoplay(play: Play): void {
  if (autoplayActive) {
    autoplayQueue.push(play);
    return;
  }

  autoplayActive = true;
  void play().finally(() => {
    autoplayActive = false;
    const next = autoplayQueue.shift();
    if (next) scheduleAutoplay(next);
  });
}

let demoObserver: IntersectionObserver | null = null;

export function initDemos(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-demo]'));
  if (!roots.length) return;

  const plays = new Map<Element, Play>();

  roots.forEach((root) => {
    const stage = root.querySelector<HTMLElement>('.demo-stage');
    if (!stage) return;

    const play = createPlay(root, stage);
    if (!play) return;

    plays.set(root, play);

    root.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a')) return;

      if (!isReduced()) {
        root.querySelector<HTMLElement>('[data-replay]')?.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
          { duration: ms('--motion-demo-replay-turn', 320), easing: easing() },
        );
      }

      void play();
    });
  });

  if (isReduced() || !plays.size) return;

  demoObserver = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        .forEach((entry) => {
          const play = plays.get(entry.target);
          demoObserver?.unobserve(entry.target);
          if (play) scheduleAutoplay(play);
        });
    },
    { threshold: 0.7 },
  );

  plays.forEach((_play, root) => {
    demoObserver?.observe(root);
  });
}
