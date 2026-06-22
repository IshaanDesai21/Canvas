<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import { layout } from '$stores/layout.svelte';
  import { ui } from '$stores/ui.svelte';
  import { settings } from '$stores/settings.svelte';
  import { viewport } from '$stores/viewport.svelte';
  import { getWidgetDefinition } from '$widgets/registry';
  import {
    computeMetrics, cellToPx, spanToPx, pxToCell, collides, clampPosition, type GridMetrics
  } from '$utils/grid';
  import { clamp } from '$utils/motion';
  import WidgetShell from '$widgets/WidgetShell.svelte';

  let container = $state<HTMLDivElement>();
  let containerWidth = $state(1200);

  let metrics = $derived<GridMetrics>(computeMetrics(containerWidth, settings.current.gridGap));

  // On phones the cell grid can't fit; stack widgets in reading order instead.
  let stacked = $derived(
    [...layout.widgets].sort((a, b) => a.y - b.y || a.x - b.x)
  );

  // Total rows occupied → grid height (so the area scrolls if needed).
  let rows = $derived(layout.widgets.reduce((m, w) => Math.max(m, w.y + w.h), 6));
  let gridHeight = $derived(spanToPx(rows + 1, metrics));

  // Transient interaction state.
  let dragId = $state<string | null>(null);
  let resizeId = $state<string | null>(null);
  let dx = $state(0), dy = $state(0), dw = $state(0), dh = $state(0);
  let preview = $state<{ x: number; y: number; w: number; h: number } | null>(null);

  $effect(() => {
    if (!container) return;
    const ro = new ResizeObserver(([e]) => (containerWidth = e.contentRect.width));
    ro.observe(container);
    return () => ro.disconnect();
  });

  function px(w: WidgetInstance) {
    const isDrag = dragId === w.id;
    const isResize = resizeId === w.id;
    return {
      left: cellToPx(w.x, metrics) + (isDrag ? dx : 0),
      top: cellToPx(w.y, metrics) + (isDrag ? dy : 0),
      width: spanToPx(w.w, metrics) + (isResize ? dw : 0),
      height: spanToPx(w.h, metrics) + (isResize ? dh : 0)
    };
  }

  function startDrag(e: PointerEvent, w: WidgetInstance) {
    e.preventDefault();
    dragId = w.id;
    const sx = e.clientX, sy = e.clientY;
    const baseLeft = cellToPx(w.x, metrics), baseTop = cellToPx(w.y, metrics);
    const move = (ev: PointerEvent) => {
      dx = ev.clientX - sx; dy = ev.clientY - sy;
      preview = clampPosition(
        { x: pxToCell(baseLeft + dx, metrics), y: pxToCell(baseTop + dy, metrics), w: w.w, h: w.h },
        metrics.columns
      ) as typeof preview;
      if (preview) { preview.w = w.w; preview.h = w.h; }
    };
    const up = () => {
      if (preview && !collides(preview, layout.widgets, w.id)) layout.update(w.id, { x: preview.x, y: preview.y });
      dragId = null; dx = dy = 0; preview = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function startResize(e: PointerEvent, w: WidgetInstance) {
    e.preventDefault(); e.stopPropagation();
    resizeId = w.id;
    const def = getWidgetDefinition(w.type);
    const sx = e.clientX, sy = e.clientY;
    const baseW = spanToPx(w.w, metrics), baseH = spanToPx(w.h, metrics);
    const move = (ev: PointerEvent) => { dw = ev.clientX - sx; dh = ev.clientY - sy; };
    const up = () => {
      const nw = clamp(pxToCell(baseW + dw, metrics), def.minSize.w, Math.min(def.maxSize.w, metrics.columns - w.x));
      const nh = clamp(pxToCell(baseH + dh, metrics), def.minSize.h, def.maxSize.h);
      if (!collides({ x: w.x, y: w.y, w: nw, h: nh }, layout.widgets, w.id)) layout.update(w.id, { w: nw, h: nh });
      resizeId = null; dw = dh = 0;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
</script>

{#if viewport.isMobile}
  <!-- Mobile: a single readable column, no drag/resize. -->
  <div class="mobile-stack">
    {#each stacked as w (w.id)}
      <div class="m-slot" style="height:{Math.max(w.h, 1) * 84}px">
        <WidgetShell
          instance={w}
          editMode={false}
          onDelete={() => layout.remove(w.id)}
          onDragPointerDown={() => {}}
          onResizePointerDown={() => {}}
        />
      </div>
    {/each}
  </div>
{:else}
<div class="grid-area" bind:this={container} class:editing={ui.editMode}>
  <div class="grid" style="height:{gridHeight}px">
    {#if ui.editMode}
      <div class="overlay" style="background-size:{metrics.cell + metrics.gap}px {metrics.cell + metrics.gap}px"></div>
      {#if preview}
        <div
          class="snap"
          style="
            transform: translate3d({cellToPx(preview.x, metrics)}px, {cellToPx(preview.y, metrics)}px, 0);
            width:{spanToPx(preview.w, metrics)}px; height:{spanToPx(preview.h, metrics)}px;"
        ></div>
      {/if}
    {/if}

    {#each layout.widgets as w (w.id)}
      {@const p = px(w)}
      <div
        class="slot"
        style="transform: translate3d({p.left}px, {p.top}px, 0); width:{p.width}px; height:{p.height}px;"
      >
        <WidgetShell
          instance={w}
          editMode={ui.editMode}
          dragging={dragId === w.id}
          onDelete={() => layout.remove(w.id)}
          onDragPointerDown={(e) => startDrag(e, w)}
          onResizePointerDown={(e) => startResize(e, w)}
        />
      </div>
    {/each}
  </div>
</div>
{/if}

<style>
  .grid-area { width: 100%; }
  .mobile-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    padding-bottom: 24px;
  }
  .m-slot { width: 100%; }
  .grid { position: relative; margin: 0 auto; }
  .slot {
    position: absolute; top: 0; left: 0; will-change: transform;
    transition: transform var(--dur-base) var(--ease-spring),
      width var(--dur-base) var(--ease-spring), height var(--dur-base) var(--ease-spring);
  }
  .overlay {
    position: absolute; inset: -4px;
    background-image:
      radial-gradient(circle at 1px 1px, var(--hairline) 1px, transparent 0);
    pointer-events: none; opacity: 0.7; animation: fade-in var(--dur-base);
  }
  .snap {
    position: absolute; top: 0; left: 0; border-radius: var(--radius-widget);
    background: var(--accent-soft); border: 1.5px dashed var(--accent);
    transition: transform var(--dur-fast) var(--ease-smooth); pointer-events: none;
  }
</style>
