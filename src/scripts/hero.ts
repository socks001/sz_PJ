import { clamp, easing, hasFinePointer, isReduced, ms, num, px } from './tokens';

interface EntranceStep {
  el: Element | null;
  delay: number;
  duration: number;
  offset?: number;
  opacity?: number;
}

function clearPending(): void {
  if (document.documentElement.dataset.motion === 'pending') {
    delete document.documentElement.dataset.motion;
  }
}

function playEntrance(hero: HTMLElement, glowLayer: HTMLElement | null): void {
  const reduced = isReduced();
  const hint = hero.querySelector<HTMLElement>('[data-scroll-hint]');
  const generic = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero]:not([data-scroll-hint])'));

  if (reduced) {
    generic.forEach((el) => {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: ms('--motion-reduced-duration'),
        easing: easing(),
        fill: 'backwards',
      });
    });
    hint?.animate([{ opacity: 0 }, { opacity: num('--motion-hero-hint-opacity', 0.5) }], {
      duration: ms('--motion-reduced-duration'),
      easing: easing(),
      fill: 'backwards',
    });
    clearPending();
    return;
  }

  const titleLines = Array.from(hero.querySelectorAll<HTMLElement>('.title > span'));
  const steps: EntranceStep[] = [
    { el: glowLayer, delay: 0, duration: ms('--motion-hero-glow-duration') },
    {
      el: hero.querySelector('.eyebrow'),
      delay: ms('--motion-hero-eyebrow-delay'),
      duration: ms('--motion-hero-eyebrow-duration'),
      offset: px('--motion-hero-eyebrow-offset'),
    },
    {
      el: titleLines[0] ?? null,
      delay: ms('--motion-hero-title-delay-1'),
      duration: ms('--motion-hero-title-duration'),
      offset: px('--motion-hero-title-offset'),
    },
    {
      el: titleLines[1] ?? null,
      delay: ms('--motion-hero-title-delay-2'),
      duration: ms('--motion-hero-title-duration'),
      offset: px('--motion-hero-title-offset'),
    },
    {
      el: hero.querySelector('.lede'),
      delay: ms('--motion-hero-lede-delay'),
      duration: ms('--motion-hero-lede-duration'),
      offset: px('--motion-hero-lede-offset'),
    },
    {
      el: hero.querySelector('.tags'),
      delay: ms('--motion-hero-tags-delay'),
      duration: ms('--motion-hero-tags-duration'),
      offset: px('--motion-hero-tags-offset'),
    },
    {
      el: hero.querySelector('.actions'),
      delay: ms('--motion-hero-actions-delay'),
      duration: ms('--motion-hero-actions-duration'),
      offset: px('--motion-hero-actions-offset'),
    },
  ];

  steps.forEach(({ el, delay, duration, offset }) => {
    if (!el) return;
    const frames: Keyframe[] =
      offset === undefined
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: `translateY(${offset}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ];
    el.animate(frames, {
      duration,
      delay,
      easing: easing(),
      fill: 'backwards',
    });
  });

  hint?.animate([{ opacity: 0 }, { opacity: num('--motion-hero-hint-opacity', 0.5) }], {
    duration: ms('--motion-hero-hint-duration'),
    delay: ms('--motion-hero-hint-delay'),
    easing: easing(),
    fill: 'backwards',
  });

  clearPending();
}

function initScroll(content: HTMLElement | null, glow: HTMLElement | null): void {
  if (!content) return;

  const duration = ms('--motion-scrub-duration', 1000);
  const exitOffset = px('--motion-hero-exit-offset');
  const exitOpacity = num('--motion-hero-exit-opacity', 0.15);
  const glowScale = num('--motion-hero-glow-scale', 1.06);
  const range = num('--motion-hero-exit-range', 0.7);

  const exit = content.animate(
    [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: `translateY(${exitOffset}px)`, opacity: exitOpacity },
    ],
    { duration, easing: 'linear', fill: 'both' },
  );
  exit.pause();

  const depth = glow?.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${glowScale})` }],
    { duration, easing: 'linear', fill: 'both' },
  );
  depth?.pause();

  let frame = 0;
  const update = (): void => {
    frame = 0;
    const y = window.scrollY;
    exit.currentTime = clamp(y / (window.innerHeight * range)) * duration;
    if (depth) depth.currentTime = clamp(y / window.innerHeight) * duration;
  };
  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}

function currentTranslate(el: HTMLElement): { x: number; y: number } {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === 'none') return { x: 0, y: 0 };

  const matrix = new DOMMatrixReadOnly(transform);
  return { x: matrix.m41, y: matrix.m42 };
}

function initParallax(hero: HTMLElement, glowLayer: HTMLElement | null): void {
  if (!glowLayer || !hasFinePointer()) return;
  const max = px('--motion-parallax-max');
  if (!max) return;

  const duration = ms('--motion-parallax-duration', 600);
  const target = { x: 0, y: 0 };
  let frame = 0;
  let animation: Animation | null = null;

  const apply = (): void => {
    frame = 0;
    const from = currentTranslate(glowLayer);
    animation?.cancel();
    animation = glowLayer.animate(
      [
        { transform: `translate3d(${from.x}px, ${from.y}px, 0)` },
        { transform: `translate3d(${target.x}px, ${target.y}px, 0)` },
      ],
      { duration, easing: easing(), fill: 'forwards' },
    );
  };
  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(apply);
  };

  hero.addEventListener('pointermove', (event) => {
    target.x = (event.clientX / window.innerWidth - 0.5) * max * 2;
    target.y = (event.clientY / window.innerHeight - 0.5) * max * 2;
    schedule();
  });

  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    schedule();
  });
}

function initHintLoop(hero: HTMLElement, hintLine: HTMLElement | null): void {
  if (!hintLine) return;

  window.setTimeout(() => {
    const offset = px('--motion-hero-hint-offset');
    if (!offset) return;

    const animation = hintLine.animate(
      [
        { transform: `translateY(-${offset}px)` },
        { transform: `translateY(${offset}px)` },
      ],
      {
        duration: ms('--motion-hero-hint-loop-duration', 2600),
        iterations: Infinity,
        direction: 'alternate',
        easing: easing('--ease-in-out'),
      },
    );

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) animation.play();
      else animation.pause();
    });
    observer.observe(hero);
  }, ms('--motion-hero-hint-loop-delay', 1200));
}

function initPress(hero: HTMLElement): void {
  const button = hero.querySelector<HTMLElement>('.button-primary');
  if (!button) return;

  const scale = num('--motion-press-scale', 0.97);
  const opacity = num('--motion-press-opacity', 0.9);

  const press = (): void => {
    button.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: `scale(${scale})`, opacity }], {
      duration: ms('--motion-press-duration', 120),
      easing: 'linear',
      fill: 'forwards',
    });
  };
  const release = (): void => {
    button.getAnimations().forEach((animation) => animation.cancel());
    button.animate([{ transform: `scale(${scale})`, opacity }, { transform: 'scale(1)', opacity: 1 }], {
      duration: ms('--motion-press-release-duration', 180),
      easing: easing(),
      fill: 'backwards',
    });
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;

  const content = hero.querySelector<HTMLElement>('[data-hero-content]');
  const glowLayer = hero.querySelector<HTMLElement>('[data-hero-parallax]');
  const glow = hero.querySelector<HTMLElement>('[data-hero-glow]');
  const hintLine = hero.querySelector<HTMLElement>('.scroll-line');

  playEntrance(hero, glowLayer);

  if (!isReduced()) {
    initScroll(content, glow);
    initParallax(hero, glowLayer);
    initHintLoop(hero, hintLine);
    initPress(hero);
  }
}
