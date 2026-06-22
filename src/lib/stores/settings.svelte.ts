import type { Settings } from '$lib/types';
import { kv } from '$utils/storage';

const KEY = 'settings:v1';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  preset: 'default',
  accent: '#0a84ff',
  clockFormat: '12h',
  greetingEnabled: true,
  name: 'Ishaan',
  searchProvider: 'google',
  cornerRadius: 26,
  gridGap: 18,
  animationSpeed: 1,
  reduceMotion: false,
  transparency: 0.5,
  searchGlass: 0.7,
  searchPosition: { x: 0, y: 0 },
  dockSize: 54,
  dockMagnification: 1.65,
  dockEnabled: true,
  dockGlass: false
};

/**
 * Global settings store. State is reactive (Svelte 5 runes) and auto-persists
 * to localStorage. Mutate `settings.current.<field>` and it just saves.
 */
class SettingsStore {
  current = $state<Settings>({ ...DEFAULT_SETTINGS, ...kv.get<Partial<Settings>>(KEY, {}) });

  constructor() {
    // Persist on any change. $effect.root keeps the effect alive for the
    // lifetime of the app (these are module singletons).
    $effect.root(() => {
      $effect(() => {
        kv.set(KEY, $state.snapshot(this.current));
      });
    });
  }

  reset() {
    this.current = { ...DEFAULT_SETTINGS };
  }

  /** Replace settings wholesale (used by layout import). */
  replace(next: Partial<Settings>) {
    this.current = { ...DEFAULT_SETTINGS, ...next };
  }
}

export const settings = new SettingsStore();
