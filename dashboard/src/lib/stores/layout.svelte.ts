import type { WidgetInstance, WidgetType } from '$lib/types';
import { kv } from '$utils/storage';
import { uid } from '$utils/id';
import { findFreeSlot } from '$utils/grid';
import { getWidgetDefinition, WIDGET_DEFINITIONS } from '$widgets/registry';

/** Drop any widgets whose type is no longer in the registry (e.g. removed
 *  battery/crypto widgets persisted from an older version), so the grid never
 *  tries to load a chunk that doesn't exist. */
function pruneUnknown(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.filter((w) => w.type in WIDGET_DEFINITIONS);
}

const KEY = 'layout:v1';

/** A pleasant default arrangement shown on first run — a tidy 4-across grid. */
const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: uid('w'), type: 'clock', x: 0, y: 0, w: 3, h: 2 },
  { id: uid('w'), type: 'weather', x: 3, y: 0, w: 3, h: 2 },
  { id: uid('w'), type: 'calendar', x: 6, y: 0, w: 3, h: 3 },
  { id: uid('w'), type: 'notes', x: 9, y: 0, w: 3, h: 3 },
  { id: uid('w'), type: 'pomodoro', x: 0, y: 2, w: 3, h: 3 },
  { id: uid('w'), type: 'calculator', x: 3, y: 2, w: 3, h: 4 },
  { id: uid('w'), type: 'tasks', x: 6, y: 3, w: 3, h: 3 },
  { id: uid('w'), type: 'quote', x: 9, y: 3, w: 3, h: 1 }
];

/**
 * Widget layout store. Holds the placed widgets and owns add/remove/move/
 * resize. Auto-persists; everything survives refresh.
 */
class LayoutStore {
  widgets = $state<WidgetInstance[]>(
    pruneUnknown(kv.get<WidgetInstance[] | null>(KEY, null) ?? structuredClone(DEFAULT_LAYOUT))
  );

  constructor() {
    $effect.root(() => {
      $effect(() => {
        kv.set(KEY, $state.snapshot(this.widgets));
      });
    });
  }

  has(type: WidgetType): boolean {
    return this.widgets.some((w) => w.type === type);
  }

  /** Place a new widget in the first free slot. */
  add(type: WidgetType, columns = 12): WidgetInstance {
    const def = getWidgetDefinition(type);
    const { w, h } = def.defaultSize;
    const { x, y } = findFreeSlot(w, h, this.widgets, columns);
    const instance: WidgetInstance = { id: uid('w'), type, x, y, w, h };
    this.widgets = [...this.widgets, instance];
    return instance;
  }

  remove(id: string) {
    this.widgets = this.widgets.filter((w) => w.id !== id);
  }

  update(id: string, patch: Partial<WidgetInstance>) {
    this.widgets = this.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w));
  }

  /** Merge per-widget settings (used by widgets that store their own state). */
  setWidgetSettings(id: string, settings: Record<string, unknown>) {
    this.widgets = this.widgets.map((w) =>
      w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w
    );
  }

  reset() {
    this.widgets = structuredClone(DEFAULT_LAYOUT);
  }

  replace(widgets: WidgetInstance[]) {
    this.widgets = pruneUnknown(widgets);
  }
}

export const layout = new LayoutStore();
