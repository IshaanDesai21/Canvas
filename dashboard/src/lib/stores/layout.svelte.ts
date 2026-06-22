import type { WidgetInstance, WidgetType } from '$lib/types';
import { kv } from '$utils/storage';
import { uid } from '$utils/id';
import { findFreeSlot } from '$utils/grid';
import { getWidgetDefinition } from '$widgets/registry';

const KEY = 'layout:v1';

/** A pleasant default arrangement shown on first run. */
const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: uid('w'), type: 'clock', x: 0, y: 0, w: 3, h: 2 },
  { id: uid('w'), type: 'weather', x: 3, y: 0, w: 2, h: 2 },
  { id: uid('w'), type: 'calendar', x: 5, y: 0, w: 3, h: 3 },
  { id: uid('w'), type: 'notes', x: 8, y: 0, w: 4, h: 3 },
  { id: uid('w'), type: 'pomodoro', x: 0, y: 2, w: 3, h: 3 },
  { id: uid('w'), type: 'worldclock', x: 3, y: 2, w: 2, h: 3 },
  { id: uid('w'), type: 'tasks', x: 8, y: 3, w: 4, h: 3 },
  { id: uid('w'), type: 'battery', x: 5, y: 3, w: 3, h: 2 },
  { id: uid('w'), type: 'quote', x: 0, y: 5, w: 5, h: 1 }
];

/**
 * Widget layout store. Holds the placed widgets and owns add/remove/move/
 * resize. Auto-persists; everything survives refresh.
 */
class LayoutStore {
  widgets = $state<WidgetInstance[]>(
    kv.get<WidgetInstance[] | null>(KEY, null) ?? structuredClone(DEFAULT_LAYOUT)
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
    this.widgets = widgets;
  }
}

export const layout = new LayoutStore();
