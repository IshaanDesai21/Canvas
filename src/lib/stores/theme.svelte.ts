import type { ResolvedTheme } from '$lib/types';
import { getPreset } from '$utils/presets';
import { settings } from './settings.svelte';

/**
 * Resolves the effective light/dark theme (following macOS when set to
 * "system") and pushes every runtime-tunable setting onto the document as
 * CSS custom properties / data-attributes. This is the bridge between the
 * settings store and the design tokens.
 */
class ThemeStore {
  /** The OS preference, kept in sync via matchMedia. */
  private systemDark = $state(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
  );

  resolved = $derived<ResolvedTheme>(
    settings.current.theme === 'system'
      ? this.systemDark
        ? 'dark'
        : 'light'
      : settings.current.theme
  );

  constructor() {
    if (typeof matchMedia !== 'undefined') {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => (this.systemDark = e.matches));
    }

    $effect.root(() => {
      $effect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const s = settings.current;

        root.setAttribute('data-theme', this.resolved);
        root.style.colorScheme = this.resolved;
        root.setAttribute('data-reduce-motion', String(s.reduceMotion));

        // Appearance preset → font personality (accent stays user-overridable).
        const preset = getPreset(s.preset);
        root.style.setProperty('--font-sans', preset.fontSans);
        root.style.setProperty('--font-rounded', preset.fontRounded);

        root.style.setProperty('--accent', s.accent);
        root.style.setProperty('--radius-widget', `${s.cornerRadius}px`);
        root.style.setProperty('--motion-scale', String(1 / Math.max(0.25, s.animationSpeed)));

        // Transparency maps to both fill opacity and blur strength so the
        // glass feels thinner/thicker as the user drags the slider.
        const blur = 16 + s.transparency * 40;
        root.style.setProperty('--glass-blur', `${blur}px`);
        root.style.setProperty('--glass-blur-strong', `${blur * 1.5}px`);
      });
    });
  }
}

export const theme = new ThemeStore();
