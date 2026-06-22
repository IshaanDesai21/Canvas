import type { WidgetInstance } from '$lib/types';
import { clamp } from './motion';

/**
 * Grid geometry. Widgets live on an integer cell grid; this module converts
 * between cell coordinates and pixels and resolves overlaps so the layout
 * always snaps cleanly like the iOS/macOS widget grid.
 */

/** Base size of a single grid cell, in px (before the gap is added). */
export const CELL = 92;

export interface GridMetrics {
  cell: number;
  gap: number;
  columns: number;
}

/** Compute how many columns fit, given the available width. */
export function computeMetrics(width: number, gap: number): GridMetrics {
  const unit = CELL + gap;
  const columns = Math.max(4, Math.floor((width + gap) / unit));
  return { cell: CELL, gap, columns };
}

/** Pixel position of a cell coordinate. */
export function cellToPx(coord: number, m: GridMetrics): number {
  return coord * (m.cell + m.gap);
}

/** Pixel size of a span of `n` cells. */
export function spanToPx(n: number, m: GridMetrics): number {
  return n * m.cell + (n - 1) * m.gap;
}

/** Nearest cell coordinate for a pixel offset. */
export function pxToCell(px: number, m: GridMetrics): number {
  return Math.round(px / (m.cell + m.gap));
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Does `rect` collide with any widget other than `ignoreId`? */
export function collides(rect: Rect, widgets: WidgetInstance[], ignoreId?: string): boolean {
  return widgets.some((w) => w.id !== ignoreId && overlaps(rect, w));
}

/**
 * Find the first free slot (scanning row by row) that fits a w×h widget.
 * Used when adding widgets from the gallery / command palette.
 */
export function findFreeSlot(
  w: number,
  h: number,
  widgets: WidgetInstance[],
  columns: number
): { x: number; y: number } {
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x <= columns - w; x++) {
      if (!collides({ x, y, w, h }, widgets)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/** Clamp a position so the widget stays within the column bounds. */
export function clampPosition(rect: Rect, columns: number): { x: number; y: number } {
  return {
    x: clamp(rect.x, 0, Math.max(0, columns - rect.w)),
    y: Math.max(0, rect.y)
  };
}
