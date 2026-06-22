import type { Component } from 'svelte';
import type { WidgetDefinition, WidgetType } from '$lib/types';

/**
 * The widget registry — the heart of the marketplace architecture.
 * Adding a new widget is a two-line change: add a definition here and a loader
 * below. Everything else (gallery, command palette, grid) is data-driven.
 */
export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  clock: {
    type: 'clock', name: 'Clock', description: 'Time and date at a glance.',
    icon: 'clock', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 3 }, category: 'time'
  },
  weather: {
    type: 'weather', name: 'Weather', description: 'Minimal current conditions.',
    icon: 'cloud', defaultSize: { w: 2, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 4, h: 3 }, category: 'info'
  },
  calendar: {
    type: 'calendar', name: 'Calendar', description: 'Month view and upcoming events.',
    icon: 'calendar', defaultSize: { w: 3, h: 3 }, minSize: { w: 3, h: 3 }, maxSize: { w: 5, h: 5 }, category: 'time'
  },
  pomodoro: {
    type: 'pomodoro', name: 'Pomodoro', description: 'Focus timer with work / break cycles.',
    icon: 'timer', defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 4, h: 4 }, category: 'productivity'
  },
  notes: {
    type: 'notes', name: 'Notes', description: 'Sticky markdown notes that autosave.',
    icon: 'note', defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 6 }, category: 'productivity'
  },
  quote: {
    type: 'quote', name: 'Quote', description: 'A fresh quote every day.',
    icon: 'quote', defaultSize: { w: 6, h: 1 }, minSize: { w: 3, h: 1 }, maxSize: { w: 8, h: 2 }, category: 'fun'
  },
  battery: {
    type: 'battery', name: 'Battery', description: 'Live battery level and charging state.',
    icon: 'battery', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 1 }, maxSize: { w: 4, h: 2 }, category: 'system'
  },
  worldclock: {
    type: 'worldclock', name: 'World Clock', description: 'Times across the globe.',
    icon: 'globe', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 4 }, category: 'time'
  },
  countdown: {
    type: 'countdown', name: 'Countdown', description: 'Days until a date that matters.',
    icon: 'hourglass', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 1 }, maxSize: { w: 4, h: 2 }, category: 'time'
  },
  calculator: {
    type: 'calculator', name: 'Calculator', description: 'A quick glass calculator.',
    icon: 'calculator', defaultSize: { w: 3, h: 4 }, minSize: { w: 3, h: 3 }, maxSize: { w: 4, h: 5 }, category: 'productivity'
  },
  habit: {
    type: 'habit', name: 'Habit Tracker', description: 'Build streaks, one day at a time.',
    icon: 'flame', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 4 }, category: 'productivity'
  },
  stocks: {
    type: 'stocks', name: 'Stocks', description: 'Watchlist with sparklines.',
    icon: 'chart', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 4 }, category: 'info'
  },
  crypto: {
    type: 'crypto', name: 'Crypto', description: 'Track your favourite coins.',
    icon: 'coins', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 4 }, category: 'info'
  },
  spotify: {
    type: 'spotify', name: 'Now Playing', description: 'Whatever the browser is playing.',
    icon: 'music', defaultSize: { w: 4, h: 2 }, minSize: { w: 3, h: 2 }, maxSize: { w: 6, h: 3 }, category: 'media'
  },
  systeminfo: {
    type: 'systeminfo', name: 'System Info', description: 'CPU, memory and network at a glance.',
    icon: 'cpu', defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 3 }, category: 'system'
  },
  tasks: {
    type: 'tasks', name: 'Tasks', description: 'A Google Tasks–style checklist.',
    icon: 'check', defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 5, h: 6 }, category: 'productivity'
  }
};

export const WIDGET_LIST: WidgetDefinition[] = Object.values(WIDGET_DEFINITIONS);

export function getWidgetDefinition(type: WidgetType): WidgetDefinition {
  return WIDGET_DEFINITIONS[type];
}

/**
 * Lazy component loaders — each widget is a separate chunk, so widgets are
 * code-split and only fetched when first rendered.
 */
type Loader = () => Promise<{ default: Component<{ instance: import('$lib/types').WidgetInstance }> }>;

export const WIDGET_LOADERS: Record<WidgetType, Loader> = {
  clock: () => import('./ClockWidget.svelte'),
  weather: () => import('./WeatherWidget.svelte'),
  calendar: () => import('./CalendarWidget.svelte'),
  pomodoro: () => import('./PomodoroWidget.svelte'),
  notes: () => import('./NotesWidget.svelte'),
  quote: () => import('./QuoteWidget.svelte'),
  battery: () => import('./BatteryWidget.svelte'),
  worldclock: () => import('./WorldClockWidget.svelte'),
  countdown: () => import('./CountdownWidget.svelte'),
  calculator: () => import('./CalculatorWidget.svelte'),
  habit: () => import('./HabitWidget.svelte'),
  stocks: () => import('./StocksWidget.svelte'),
  crypto: () => import('./CryptoWidget.svelte'),
  spotify: () => import('./SpotifyWidget.svelte'),
  systeminfo: () => import('./SystemInfoWidget.svelte'),
  tasks: () => import('./TasksWidget.svelte')
};
