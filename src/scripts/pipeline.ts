import { easing, isReduced, ms } from './tokens';

export function initPipeline(): void {
  const wrap = document.querySelector<HTMLElement>('[data-pipeline]');
  const line = wrap?.querySelector<HTMLElement>('[data-pipeline-line]');
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-pipeline-node]'));
  if (!wrap || !line || !nodes.length) return;

  let played = false;

  const play = (): void => {
    const reduced = isReduced();
    const vertical = !window.matchMedia('(min-width: 1024px)').matches;
    const duration = ms('--motion-pipeline-duration', 800);
    const stagger = ms('--motion-pipeline-stagger', 120);

    if (!reduced) {
      const axis = vertical ? 'scaleY' : 'scaleX';
      line.animate([{ transform: `${axis}(0)` }, { transform: `${axis}(1)` }], {
        duration,
        easing: 'linear',
        fill: 'backwards',
      });
    }

    nodes.forEach((node, index) => {
      const lit = node.querySelector<HTMLElement>('[data-node-lit]');

      const light = (): void => {
        node.dataset.lit = 'true';
        if (!lit) return;
        if (reduced) {
          lit.style.opacity = '1';
          return;
        }
        lit.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: ms('--duration-feedback', 120),
          easing: easing(),
          fill: 'forwards',
        });
      };

      if (reduced) light();
      else window.setTimeout(light, Math.min(duration, index * stagger));
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (played || !entries.some((entry) => entry.isIntersecting)) return;
      played = true;
      observer.disconnect();
      play();
    },
    { rootMargin: '0px 0px -20% 0px' },
  );

  observer.observe(wrap);
}
