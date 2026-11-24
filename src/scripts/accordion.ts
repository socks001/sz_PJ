import { easing, ms } from './tokens';

export function initAccordion(): void {
  const entries = Array.from(document.querySelectorAll<HTMLDetailsElement>('.entry'));
  if (!entries.length) return;

  const duration = (): number => ms('--motion-accordion-duration', 320);
  const reduced = (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panelOf = (entry: HTMLDetailsElement): HTMLElement | null =>
    entry.querySelector<HTMLElement>('.entry-reason');
  const innerOf = (entry: HTMLDetailsElement): HTMLElement | null =>
    entry.querySelector<HTMLElement>('.entry-reason-inner');
  const running = new WeakMap<HTMLDetailsElement, Animation[]>();

  const stop = (entry: HTMLDetailsElement): void => {
    running.get(entry)?.forEach((animation) => animation.cancel());
    running.delete(entry);
  };

  const settle = (entry: HTMLDetailsElement): void => {
    running.get(entry)?.forEach((animation) => animation.cancel());
    running.delete(entry);
    const panel = panelOf(entry);
    panel?.style.removeProperty('height');
    panel?.classList.remove('is-animating');
  };

  const closeEntry = (entry: HTMLDetailsElement): void => {
    if (!entry.open) return;

    const panel = panelOf(entry);
    const inner = innerOf(entry);
    stop(entry);

    if (!panel || !inner || reduced()) {
      entry.open = false;
      settle(entry);
      return;
    }

    const from = inner.getBoundingClientRect().height;
    panel.style.height = `${from}px`;
    panel.classList.add('is-animating');

    const height = panel.animate(
      [{ height: `${from}px` }, { height: '0px' }],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );
    const fade = inner.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );
    running.set(entry, [height, fade]);

    Promise.all([height.finished, fade.finished])
      .then(() => {
        entry.open = false;
        settle(entry);
      })
      .catch(() => {});
  };

  const openEntry = (entry: HTMLDetailsElement): void => {
    entries.forEach((other) => {
      if (other !== entry && other.open) closeEntry(other);
    });

    stop(entry);
    entry.open = true;

    const panel = panelOf(entry);
    const inner = innerOf(entry);
    if (!panel || !inner) return;

    if (reduced()) {
      settle(entry);
      return;
    }

    panel.style.height = '0px';
    panel.classList.add('is-animating');
    const target = inner.getBoundingClientRect().height;

    const height = panel.animate(
      [{ height: '0px' }, { height: `${target}px` }],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );
    const fade = inner.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );
    running.set(entry, [height, fade]);

    Promise.all([height.finished, fade.finished])
      .then(() => {
        panel.style.height = 'auto';
        settle(entry);
      })
      .catch(() => {});
  };

  entries.forEach((entry) => {
    const summary = entry.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (entry.open) closeEntry(entry);
      else openEntry(entry);
    });
  });
}
