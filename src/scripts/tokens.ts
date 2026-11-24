const root = (): HTMLElement => document.documentElement;

export function cssValue(name: string): string {
  return getComputedStyle(root()).getPropertyValue(name).trim();
}

export function ms(name: string, fallback = 0): number {
  const raw = cssValue(name);
  const match = /^(-?[\d.]+)\s*(ms|s)$/.exec(raw);
  if (match) {
    const value = Number.parseFloat(match[1]);
    if (!Number.isFinite(value)) return fallback;
    return match[2] === 's' ? value * 1000 : value;
  }

  const bare = Number.parseFloat(raw);
  return Number.isFinite(bare) ? bare : fallback;
}

export function px(name: string, fallback = 0): number {
  const value = Number.parseFloat(cssValue(name));
  return Number.isFinite(value) ? value : fallback;
}

export function num(name: string, fallback = 0): number {
  const value = Number.parseFloat(cssValue(name));
  return Number.isFinite(value) ? value : fallback;
}

export function easing(name = '--ease-out'): string {
  return cssValue(name) || 'cubic-bezier(0.22, 1, 0.36, 1)';
}

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

export function isReduced(): boolean {
  return reducedQuery.matches;
}

export function hasFinePointer(): boolean {
  return finePointerQuery.matches;
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function wait(duration: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
