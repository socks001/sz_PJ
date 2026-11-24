import { easing, ms } from './tokens';

export function initAccordion(): void {
  const entries = Array.from(document.querySelectorAll<HTMLDetailsElement>('.entry'));
  if (!entries.length) return;

  const duration = (): number => ms('--motion-accordion-duration', 320);
  const panelOf = (entry: HTMLDetailsElement): HTMLElement | null =>
    entry.querySelector<HTMLElement>('.entry-reason');

  const closeEntry = (entry: HTMLDetailsElement): void => {
    if (!entry.open) return;

    const panel = panelOf(entry);
    if (!panel) {
      entry.open = false;
      return;
    }

    const height = panel.getBoundingClientRect().height;
    panel.style.overflow = 'hidden';

    const animation = panel.animate(
      [
        { height: `${height}px`, opacity: 1 },
        { height: '0px', opacity: 0 },
      ],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );

    animation.finished
      .then(() => {
        entry.open = false;
        animation.cancel();
        panel.style.removeProperty('height');
        panel.style.removeProperty('overflow');
      })
      .catch(() => {});
  };

  const openEntry = (entry: HTMLDetailsElement): void => {
    entries.forEach((other) => {
      if (other !== entry && other.open) closeEntry(other);
    });

    entry.open = true;

    const panel = panelOf(entry);
    if (!panel) return;

    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    const target = panel.scrollHeight;

    const animation = panel.animate(
      [
        { height: '0px', opacity: 0 },
        { height: `${target}px`, opacity: 1 },
      ],
      { duration: duration(), easing: easing('--ease-in-out'), fill: 'forwards' },
    );

    animation.finished
      .then(() => {
        panel.style.height = 'auto';
        animation.cancel();
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
