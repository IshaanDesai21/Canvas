/**
 * Shared type definitions for the dashboard.
 * Keeping every cross-cutting type here keeps stores and components honest.
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type ClockFormat = '12h' | '24h';

/** Identifiers for the built-in search providers. */
export type SearchProviderId =
  | 'google'
  | 'duckduckgo'
  | 'bing'
  | 'youtube'
  | 'github'
  | 'wikipedia';

/** A search engine the Spotlight bar can dispatch a query to. */
export interface SearchProvider {
  id: SearchProviderId;
  name: string;
  /** `%s` is replaced with the URL-encoded query. */
  template: string;
  /** A short keyword that activates the provider, e.g. "yt". */
  keyword: string;
  /** Accent color used for the provider chip. */
  color: string;
  icon: string;
}

/** Every widget kind known to the registry. */
export type WidgetType =
  | 'weather'
  | 'clock'
  | 'calendar'
  | 'pomodoro'
  | 'notes'
  | 'quote'
  | 'battery'
  | 'worldclock'
  | 'countdown'
  | 'calculator'
  | 'habit'
  | 'stocks'
  | 'crypto'
  | 'spotify'
  | 'systeminfo'
  | 'tasks';

/** A widget placed on the grid. Position/size are in grid cells. */
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Per-instance configuration, shape owned by the widget itself. */
  settings?: Record<string, unknown>;
}

/** Static metadata describing a widget kind. */
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  /** Default size in grid cells. */
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  /** Category used by the widget gallery / marketplace. */
  category: 'time' | 'productivity' | 'system' | 'media' | 'info' | 'fun';
}

/** A pinned site in the Dock. */
export interface DockApp {
  id: string;
  label: string;
  url: string;
  /** SF-symbol-style glyph id or a single emoji/letter. */
  glyph: string;
  /** Optional full-color brand logo id (see BrandIcon). Falls back to `glyph`. */
  brand?: string;
  /** Optional uploaded custom icon image, stored in the blob store. */
  imageId?: string;
  /** Gradient stops for the icon tile. */
  color: [string, string];
}

export type BackgroundKind = 'gradient' | 'image' | 'video';

/** A named gradient preset. */
export interface GradientPreset {
  id: string;
  name: string;
  /** Full CSS background value (supports animated multi-layer gradients). */
  css: string;
  animated: boolean;
}

export interface BackgroundConfig {
  kind: BackgroundKind;
  /** Active gradient preset id (when kind === 'gradient'). */
  gradientId: string;
  /** Key into the blob store for an uploaded image (when kind === 'image'). */
  imageId: string | null;
  /** Key into the blob store for an uploaded video (future-ready). */
  videoId: string | null;
  blur: number; // px
  dim: number; // 0..1
  saturation: number; // 0..2 (1 = neutral)
  brightness: number; // 0..2 (1 = neutral)
  parallax: boolean;
}

/** Global, user-tunable settings. Persisted as one JSON blob. */
export interface Settings {
  theme: Theme;
  /** Appearance preset id (font personality). See utils/presets. */
  preset: string;
  /** Accent color as a hex string. */
  accent: string;
  clockFormat: ClockFormat;
  greetingEnabled: boolean;
  /** Display name used in the greeting. */
  name: string;
  searchProvider: SearchProviderId;
  /** Widget corner radius in px (22–30 per HIG). */
  cornerRadius: number;
  /** Grid gap / spacing in px. */
  gridGap: number;
  /** Animation speed multiplier (0.5 = slower, 2 = snappier). */
  animationSpeed: number;
  reduceMotion: boolean;
  /** Glass transparency amount, 0 (opaque) .. 1 (very see-through). */
  transparency: number;
  /** Search bar glass level, 0 (clear / see-through) .. 1 (fully frosted). */
  searchGlass: number;
  /** Search bar offset from its centered position (edit-mode draggable). */
  searchPosition: { x: number; y: number };
  /** Dock icon base size in px. */
  dockSize: number;
  /** Dock hover magnification factor. */
  dockMagnification: number;
  dockEnabled: boolean;
  /** When true, dock tiles drop their colored background for frosted glass. */
  dockGlass: boolean;
}
