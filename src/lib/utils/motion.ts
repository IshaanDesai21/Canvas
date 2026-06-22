/** Spring presets mirroring iOS/macOS system animations (for the `motion` lib). */
export const SPRING = {
  /** Snappy UI response — buttons, toggles. */
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as const,
  /** Default gentle spring — panels, widgets. */
  gentle: { type: 'spring', stiffness: 280, damping: 26 } as const,
  /** Bouncy — dock magnification, playful affordances. */
  bouncy: { type: 'spring', stiffness: 400, damping: 18 } as const
};

/** Whether motion should be suppressed right now (OS or in-app preference). */
export function prefersReducedMotion(appReduceMotion: boolean): boolean {
  if (appReduceMotion) return true;
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Clamp helper used throughout grid math and sliders. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
