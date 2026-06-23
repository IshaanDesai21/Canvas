<script lang="ts">
  import { background } from '$stores/background.svelte';
  import { settings } from '$stores/settings.svelte';

  // Pointer parallax — a gentle counter-translate, disabled for reduce-motion.
  let px = $state(0);
  let py = $state(0);

  function onMove(e: PointerEvent) {
    if (!background.config.parallax || settings.current.reduceMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    px = ((e.clientX - cx) / cx) * -16;
    py = ((e.clientY - cy) / cy) * -16;
  }

  let bg = $derived(background.config);
  // Only emit a filter when something is actually adjusted — an identity filter
  // still forces the browser to rasterize the layer, which softens the image.
  let filter = $derived(
    bg.blur === 0 && bg.saturation === 1 && bg.brightness === 1
      ? 'none'
      : `saturate(${bg.saturation}) brightness(${bg.brightness}) blur(${bg.blur}px)`
  );
  // The visible layer: image if present, else the chosen gradient.
  let image = $derived(bg.kind === 'image' && background.imageUrl ? background.imageUrl : null);

  // Drag-and-drop a wallpaper anywhere on the page.
  let dragging = $state(false);
  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    dragging = true;
  }
  function onDragLeave(e: DragEvent) {
    // Only clear when the pointer actually leaves the window.
    if (e.relatedTarget === null) dragging = false;
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) void background.setImage(file);
  }
</script>

<svelte:window
  onpointermove={onMove}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
/>

<div class="bg-root" aria-hidden="true">
  {#key image ?? background.activeGradient.id}
    <div
      class="layer"
      class:animated={!image && background.activeGradient.animated}
      style="
        transform: translate3d({px}px, {py}px, 0);
        filter: {filter};
        {image ? `background-image:url(${image})` : `background:${background.activeGradient.css}`};
        background-size: {image ? 'cover' : '300% 300%'};
      "
    ></div>
  {/key}
  <div class="dim" style="opacity:{bg.dim}"></div>
</div>

{#if dragging}
  <div class="drop-hint">
    <div class="drop-card glass-strong">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="M4 17l5-4 4 3 3-2 4 3" />
      </svg>
      <span>Drop image to set wallpaper</span>
    </div>
  </div>
{/if}

<style>
  /* z-index 0 (not -1): a negative z-index would paint behind the opaque body
     background and hide the wallpaper. 0 keeps it above the body fill but below
     all app content (which lives in later, positioned containers). */
  .bg-root { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: var(--bg-fallback); }
  .layer {
    position: absolute; inset: -40px; background-position: center; background-repeat: no-repeat;
    will-change: transform; animation: bg-fade var(--dur-slow) var(--ease-out-quart) both;
    transition: filter var(--dur-base) var(--ease-smooth);
  }
  .layer.animated { animation: bg-fade var(--dur-slow) var(--ease-out-quart) both, gradient-pan 22s linear infinite; }
  .dim { position: absolute; inset: 0; background: #000; transition: opacity var(--dur-base) var(--ease-smooth); }

  .drop-hint {
    position: fixed; inset: 0; z-index: 120; display: grid; place-items: center;
    background: rgba(0, 0, 0, 0.28); backdrop-filter: blur(10px);
    animation: bg-fade var(--dur-fast) var(--ease-out-quart) both;
  }
  .drop-card {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    padding: 38px 54px; border-radius: var(--radius-widget); color: var(--text-primary);
    font-size: 1.05rem; font-weight: 600; border: 2px dashed var(--glass-edge);
    box-shadow: var(--shadow-float);
  }

  @keyframes bg-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes gradient-pan {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>
