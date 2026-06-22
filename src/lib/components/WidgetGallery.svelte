<script lang="ts">
  import { ui } from '$stores/ui.svelte';
  import { layout } from '$stores/layout.svelte';
  import { WIDGET_LIST } from '$widgets/registry';
  import Icon from '$components/Icon.svelte';

  function add(type: (typeof WIDGET_LIST)[number]['type']) {
    layout.add(type);
  }
</script>

{#if ui.galleryOpen}
  <div class="scrim" onclick={() => (ui.galleryOpen = false)} role="presentation">
    <div class="gallery glass glass-strong" role="dialog" aria-label="Add widget" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <header>
        <h2 class="text-display">Add a Widget</h2>
        <button class="close control" onclick={() => (ui.galleryOpen = false)} aria-label="Close">
          <Icon name="xmark" size={18} strokeWidth={2.2} />
        </button>
      </header>
      <div class="grid scroll-area">
        {#each WIDGET_LIST as w (w.type)}
          <button class="card glass-interactive" onclick={() => add(w.type)}>
            <span class="ic"><Icon name={w.icon} size={24} /></span>
            <span class="meta">
              <strong>{w.name}</strong>
              <small class="text-secondary">{w.description}</small>
            </span>
            <span class="plus" aria-hidden="true"><Icon name="plus" size={16} strokeWidth={2.4} /></span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 95; display: grid; place-items: center; padding: 24px; background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); animation: fade-in var(--dur-fast); }
  .gallery { width: min(720px, 94vw); max-height: 80vh; border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 16px; animation: pop var(--dur-base) var(--ease-spring) both; }
  @keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
  header { display: flex; align-items: center; justify-content: space-between; }
  header h2 { margin: 0; font-size: 1.4rem; }
  .close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 999px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; overflow-y: auto; padding: 2px; }
  .card { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: var(--radius-md); background: var(--control-fill); text-align: left; }
  .ic { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: var(--glass-fill-strong); color: var(--accent); flex-shrink: 0; }
  .meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .meta strong { font-weight: 600; font-size: 0.95rem; }
  .meta small { font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; }
  .plus { margin-left: auto; color: var(--text-tertiary); }
</style>
