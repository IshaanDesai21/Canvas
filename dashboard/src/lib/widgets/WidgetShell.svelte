<script lang="ts" module>
  import type { Component } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import { WIDGET_LOADERS } from './registry';

  // Cache resolved widget components so re-mounts don't refetch the chunk.
  const cache = new Map<string, Promise<{ default: Component<{ instance: WidgetInstance }> }>>();
  function load(type: WidgetInstance['type']) {
    if (!cache.has(type)) cache.set(type, WIDGET_LOADERS[type]());
    return cache.get(type)!;
  }
</script>

<script lang="ts">
  import Icon from '$components/Icon.svelte';

  interface Props {
    instance: WidgetInstance;
    editMode: boolean;
    dragging?: boolean;
    onDelete: () => void;
    onDragPointerDown: (e: PointerEvent) => void;
    onResizePointerDown: (e: PointerEvent) => void;
  }

  let {
    instance,
    editMode,
    dragging = false,
    onDelete,
    onDragPointerDown,
    onResizePointerDown
  }: Props = $props();
</script>

<!--
  The frame around every widget: liquid-glass card + edit-mode affordances
  (jiggle, delete button, resize handle). The widget itself is lazy-loaded
  and renders inside `.widget-body`.
-->
<div
  class="widget glass"
  class:editing={editMode}
  class:dragging
  role="group"
  aria-label={instance.type}
>
  {#if editMode}
    <button
      class="edit-btn delete"
      onclick={onDelete}
      aria-label="Remove widget"
      onpointerdown={(e) => e.stopPropagation()}
    >
      <Icon name="xmark" size={14} strokeWidth={2.4} />
    </button>
  {/if}

  <!-- Drag surface (active only in edit mode). -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drag-surface"
    class:active={editMode}
    role="presentation"
    onpointerdown={(e) => editMode && onDragPointerDown(e)}
  ></div>

  <div class="widget-body">
    {#await load(instance.type) then mod}
      {@const WidgetComponent = mod.default}
      <WidgetComponent {instance} />
    {/await}
  </div>

  {#if editMode}
    <button
      class="resize-handle"
      aria-label="Resize widget"
      onpointerdown={onResizePointerDown}
    >
      <span></span>
    </button>
  {/if}
</div>

<style>
  .widget {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition:
      transform var(--dur-base) var(--ease-spring),
      box-shadow var(--dur-base) var(--ease-smooth);
  }

  .widget:not(.editing):hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 0 var(--glass-edge),
      inset 0 0 0 1px var(--glass-edge-shadow),
      var(--shadow-float);
  }

  .editing {
    animation: jiggle calc(280ms * var(--motion-scale)) ease-in-out infinite;
    cursor: grab;
  }
  .editing.dragging {
    animation: none;
    cursor: grabbing;
    z-index: 50;
    box-shadow:
      inset 0 1px 0 0 var(--glass-edge),
      inset 0 0 0 1px var(--glass-edge-shadow),
      var(--shadow-float);
  }

  .widget-body {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    /* Responsive padding: tight on small widgets, airy on large — never wasteful. */
    padding: clamp(11px, 5cqmin, 18px);
    container-type: size;
  }

  .drag-surface {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: none;
  }
  .drag-surface.active {
    display: block;
  }

  .edit-btn {
    position: absolute;
    /* Inside the rounded clip so the shell's overflow:hidden doesn't hide it. */
    top: 7px;
    left: 7px;
    z-index: 20;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    /* Frosted glass chip, not a flat red dot. */
    background: var(--glass-fill-strong);
    backdrop-filter: blur(12px) saturate(160%);
    -webkit-backdrop-filter: blur(12px) saturate(160%);
    box-shadow: inset 0 0 0 1px var(--glass-edge-shadow), inset 0 1px 0 0 var(--glass-edge), var(--shadow-float);
    color: var(--text-primary);
  }
  .edit-btn:hover {
    color: #ff453a;
  }
  .edit-btn:active {
    transform: scale(0.9);
  }

  .resize-handle {
    position: absolute;
    right: 3px;
    bottom: 3px;
    z-index: 20;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    cursor: nwse-resize;
    touch-action: none;
  }
  .resize-handle span {
    width: 11px;
    height: 11px;
    border-right: 2.5px solid var(--text-secondary);
    border-bottom: 2.5px solid var(--text-secondary);
    border-bottom-right-radius: 4px;
  }
</style>
