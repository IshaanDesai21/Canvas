import type { BackgroundConfig, DockApp, Settings, WidgetInstance } from '$lib/types';
import { settings } from '$stores/settings.svelte';
import { layout } from '$stores/layout.svelte';
import { dock } from '$stores/dock.svelte';
import { background } from '$stores/background.svelte';

/** The full, portable dashboard configuration (everything except image bytes). */
export interface DashboardConfig {
  version: 1;
  settings: Settings;
  widgets: WidgetInstance[];
  dock: DockApp[];
  background: BackgroundConfig;
}

/** Snapshot the entire dashboard into a JSON string for download. */
export function exportConfig(): string {
  const config: DashboardConfig = {
    version: 1,
    settings: $state.snapshot(settings.current),
    widgets: $state.snapshot(layout.widgets),
    dock: $state.snapshot(dock.apps),
    background: $state.snapshot(background.config)
  };
  return JSON.stringify(config, null, 2);
}

/** Trigger a browser download of the current configuration. */
export function downloadConfig() {
  const blob = new Blob([exportConfig()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mynewtab-layout.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Apply a previously-exported configuration. Returns false if malformed. */
export function importConfig(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<DashboardConfig>;
    if (!parsed || typeof parsed !== 'object') return false;
    if (parsed.settings) settings.replace(parsed.settings);
    if (Array.isArray(parsed.widgets)) layout.replace(parsed.widgets);
    if (Array.isArray(parsed.dock)) dock.apps = parsed.dock;
    if (parsed.background) {
      // Imported images live in another profile's IndexedDB, so fall back to a
      // gradient rather than referencing a missing blob.
      background.config = { ...parsed.background, kind: 'gradient', imageId: null };
    }
    return true;
  } catch {
    return false;
  }
}
