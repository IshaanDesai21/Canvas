<script lang="ts">
  import { dock } from '$stores/dock.svelte';
  import { settings } from '$stores/settings.svelte';
  import { ui } from '$stores/ui.svelte';
  import type { DockApp } from '$lib/types';
  import { blobStore } from '$utils/storage';
  import { uid } from '$utils/id';
  import Icon from '$components/Icon.svelte';

  let el = $state<HTMLElement>();
  let baseCenters: number[] = [];
  let mouseX = $state<number | null>(null);
  let hovered = $state<number | null>(null);
  let revealed = $state(false);
  let urls = $state<Record<string, string>>({});

  // Add-to-dock form (edit mode).
  let adding = $state(false);
  let nLabel = $state('');
  let nUrl = $state('');
  let nFile = $state<File | null>(null);

  const base = $derived(settings.current.dockSize);
  const mag = $derived(settings.current.dockMagnification);
  const reduce = $derived(settings.current.reduceMotion);
  const editing = $derived(ui.editMode);
  const shown = $derived(revealed || editing);

  /** A live website thumbnail for the hover preview (WordPress mShots, free). */
  function shot(app: DockApp): string | null {
    try {
      const u = new URL(app.url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(app.url)}?w=400&h=240`;
    } catch {
      return null;
    }
  }

  $effect(() => {
    for (const app of dock.apps) {
      if (app.imageId && !urls[app.imageId]) {
        void blobStore.get(app.imageId).then((b) => {
          if (b) urls = { ...urls, [app.imageId as string]: URL.createObjectURL(b) };
        });
      }
    }
  });

  function measure() {
    if (!el) return;
    baseCenters = [...el.querySelectorAll<HTMLElement>('.dock-item')].map((n) => {
      const r = n.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  }

  function scaleFor(i: number): number {
    if (mouseX === null || reduce || editing) return 1;
    const d = Math.abs(mouseX - (baseCenters[i] ?? 0));
    const influence = base * 2.4;
    if (d > influence) return 1;
    const t = 1 - d / influence;
    return 1 + (mag - 1) * t * t;
  }

  // rAF-throttled cursor tracking → one layout update per frame, zero lag.
  let raf = 0;
  let pendingX = 0;
  function onMove(e: PointerEvent) {
    if (!baseCenters.length) measure();
    pendingX = e.clientX;
    if (!raf) raf = requestAnimationFrame(() => { mouseX = pendingX; raf = 0; });
  }

  // Auto-hide: the dock stays tucked away and rises only when the cursor
  // reaches the bottom edge (or hovers the dock itself).
  let hideTimer = 0;
  function reveal() { clearTimeout(hideTimer); revealed = true; }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { revealed = false; mouseX = null; hovered = null; }, 240);
  }

  async function addApp() {
    if (!nLabel.trim() && !nUrl.trim()) return;
    let imageId: string | undefined;
    if (nFile) { imageId = uid('icon'); await blobStore.put(imageId, nFile); }
    const url = nUrl.trim() ? (/^https?:\/\//.test(nUrl) ? nUrl.trim() : `https://${nUrl.trim()}`) : '#';
    dock.add({ label: nLabel.trim() || 'Site', url, glyph: 'pin', color: ['#8e8e93', '#636366'], imageId });
    nLabel = ''; nUrl = ''; nFile = null; adding = false;
  }
  function removeApp(app: DockApp) {
    if (app.imageId) void blobStore.delete(app.imageId);
    dock.remove(app.id);
  }
</script>

{#if settings.current.dockEnabled}
  <div class="dock-region">
    <!-- Bottom-edge trigger that reveals the hidden dock. -->
    <div class="dock-trigger" onpointerenter={reveal} role="presentation"></div>

    <div class="dock-stack" class:shown role="presentation" onpointerenter={reveal} onpointerleave={scheduleHide}>
      {#if editing && adding}
        <div class="add-form glass glass-strong animate-in">
          <input class="selectable" bind:value={nLabel} placeholder="Name" aria-label="App name" spellcheck="false" />
          <input class="selectable" bind:value={nUrl} placeholder="URL (example.com)" aria-label="App URL" spellcheck="false" />
          <label class="file control">
            {nFile ? nFile.name : 'Custom icon…'}
            <input type="file" accept="image/*" onchange={(e) => (nFile = (e.target as HTMLInputElement).files?.[0] ?? null)} />
          </label>
          <div class="form-actions">
            <button class="control" onclick={() => (adding = false)}>Cancel</button>
            <button class="control accent" onclick={addApp}>Add</button>
          </div>
        </div>
      {/if}

      <nav
        class="dock glass glass-strong"
        class:editing
        bind:this={el}
        onpointermove={onMove}
        onpointerenter={measure}
        onpointerleave={() => (mouseX = null)}
        aria-label="Dock"
        style="--base:{base}px"
      >
        {#each dock.apps as app, i (app.id)}
          {@const s = scaleFor(i)}
          {@const img = app.imageId ? urls[app.imageId] : null}
          {@const preview = shot(app)}
          <a
            class="dock-item"
            href={editing ? undefined : app.url}
            title={app.label}
            aria-label={app.label}
            style="width:calc(var(--base) * {s}); height:calc(var(--base) * {s});"
            onpointerenter={() => (hovered = i)}
            onpointerleave={() => (hovered = null)}
            onclick={(e) => editing && e.preventDefault()}
          >
            {#if editing}
              <button class="remove" aria-label={`Remove ${app.label}`} onclick={(e) => { e.preventDefault(); removeApp(app); }}>
                <Icon name="xmark" size={12} strokeWidth={2.6} />
              </button>
            {/if}

            {#if img}
              <span class="tile img-tile"><img class="fav" src={img} alt="" /></span>
            {:else}
              <span class="tile glass-tile"><Icon name={app.glyph} size={base * 0.5} strokeWidth={1.8} /></span>
            {/if}

            {#if hovered === i && !editing}
              <div class="preview glass glass-strong">
                {#if preview}
                  <img class="shot" src={preview} alt="" loading="lazy" />
                {/if}
                <span class="pl">{app.label}</span>
              </div>
            {/if}
          </a>
        {/each}

        {#if editing}
          <button class="dock-item add" aria-label="Add to dock" onclick={() => (adding = !adding)} style="width:var(--base); height:var(--base);">
            <span class="tile add-tile"><Icon name="plus" size={base * 0.42} strokeWidth={2.2} /></span>
          </button>
        {/if}
      </nav>
    </div>
  </div>
{/if}

<style>
  .dock-region {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; height: 140px;
    display: flex; justify-content: center; align-items: flex-end; pointer-events: none;
  }
  /* Generous bottom hover zone that pops the dock up. */
  .dock-trigger { position: absolute; left: 0; right: 0; bottom: 0; height: 52px; pointer-events: auto; }

  .dock-stack {
    pointer-events: auto; margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; gap: 10px;
    transition: transform var(--dur-base) var(--ease-spring), opacity var(--dur-base) var(--ease-smooth);
  }
  /* Fully tucked away (incl. shadow) until the bottom zone is hovered. */
  .dock-stack:not(.shown) { transform: translateY(240%); opacity: 0; pointer-events: none; }

  .dock { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; border-radius: 26px; contain: layout style; }
  .dock.editing { animation: jiggle 0.34s ease-in-out infinite; }
  .dock-item { position: relative; display: block; flex: 0 0 auto; }
  .dock-item :global(svg), .fav { pointer-events: none; }
  .tile { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 24%; overflow: hidden; }
  .fav { width: 72%; height: 72%; object-fit: contain; }

  .tile.glass-tile, .tile.img-tile, .tile.add-tile {
    background: var(--glass-fill); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
    box-shadow: inset 0 1px 0 0 var(--glass-edge), inset 0 0 0 1px var(--glass-edge-shadow), 0 3px 8px rgba(0,0,0,0.18);
    color: var(--text-primary);
  }
  .tile.img-tile .fav { width: 100%; height: 100%; }
  .tile.add-tile { color: var(--text-secondary); border: 1.5px dashed var(--glass-edge); box-shadow: none; }

  .remove {
    position: absolute; top: -6px; right: -6px; z-index: 5; width: 20px; height: 20px;
    display: grid; place-items: center; border-radius: 999px; background: #ff453a; color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  /* Hover preview card: a live website thumbnail + label, centered directly
     above the icon. Centering uses a negative margin (half the fixed width)
     rather than translateX(-50%) — the shared `fade-in` keyframe ends on
     `transform: none`, which would otherwise wipe out the centering and shove
     the card up-and-to-the-right. */
  .preview {
    position: absolute; bottom: calc(100% + 14px); left: 50%; margin-left: -100px;
    width: 200px; border-radius: var(--radius-md); overflow: hidden; pointer-events: none;
    animation: preview-in var(--dur-fast) var(--ease-out-quart) both;
  }
  @keyframes preview-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  .shot { display: block; width: 100%; height: 118px; object-fit: cover; background: var(--control-fill); }
  .preview .pl { display: block; padding: 7px 11px; font-size: 12.5px; font-weight: 600; text-align: center; }

  .add-form { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: var(--radius-md); width: 260px; }
  .add-form > input { background: var(--control-fill); border: none; border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.88rem; outline: none; }
  .add-form .file { position: relative; display: inline-flex; align-items: center; justify-content: center; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 0.85rem; overflow: hidden; }
  .add-form .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .form-actions .control { padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
  .form-actions .accent { background: var(--accent); color: #fff; }
</style>
