import { easing, isReduced, ms } from './tokens';

/**
 * 数字递增只在指标存在实测值（data-value）时启用。
 * 当前 §4.5 的指标全部为「待测」，按边界规则不显示数字、不播放递增。
 */
export function initMetrics(): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-metric]'));
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const card = entry.target as HTMLElement;
        const raw = card.dataset.value;
        const valueEl = card.querySelector<HTMLElement>('[data-metric-value]');
        if (!raw || !valueEl) return;

        const value = Number.parseFloat(raw);
        if (!Number.isFinite(value)) return;

        const parsed = Number.parseInt(card.dataset.decimals ?? '', 10);
        const digits = Number.isFinite(parsed) ? parsed : (raw.split('.')[1]?.length ?? 0);
        const format = (input: number): string => input.toFixed(digits);

        if (isReduced()) {
          valueEl.textContent = format(value);
          return;
        }

        const duration = ms('--motion-count-duration', 1000);
        const animation = valueEl.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration,
          easing: easing(),
        });

        const tick = (): void => {
          const progress = animation.effect?.getComputedTiming().progress ?? 1;
          valueEl.textContent = format(value * progress);
          if (progress < 1) window.requestAnimationFrame(tick);
          else animation.cancel();
        };

        window.requestAnimationFrame(tick);
      });
    },
    { threshold: 0.7 },
  );

  cards.forEach((card) => observer.observe(card));
}
