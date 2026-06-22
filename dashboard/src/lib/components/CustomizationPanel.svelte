<script lang="ts">
  import { ui } from '$stores/ui.svelte';
  import { settings, DEFAULT_SETTINGS } from '$stores/settings.svelte';
  import { background, GRADIENTS } from '$stores/background.svelte';
  import { layout } from '$stores/layout.svelte';
  import { dock } from '$stores/dock.svelte';
  import { onboarding } from '$stores/onboarding.svelte';
  import type { SearchProviderId } from '$lib/types';
  import { PROVIDER_LIST } from '$utils/search';
  import { PRESETS } from '$utils/presets';
  import Icon from '$components/Icon.svelte';
  import Toggle from '$components/Toggle.svelte';
  import Slider from '$components/Slider.svelte';
  import SegmentedControl from '$components/SegmentedControl.svelte';

  const ACCENTS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d55', '#ff9f0a', '#30d158', '#64d2ff', '#b08968'];
  let dragging = $state(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) await background.setImage(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    void handleFiles(e.dataTransfer?.files ?? null);
  }

  function exportLayout() {
    const data = {
      settings: settings.current,
      widgets: layout.widgets,
      dock: dock.apps,
      background: background.config
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mynewtab-layout.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importLayout(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.settings) settings.replace(data.settings);
      if (data.widgets) layout.replace(data.widgets);
      if (data.dock) dock.apps = data.dock;
      if (data.background) background.config = { ...background.config, ...data.background };
    } catch { /* ignore malformed files */ }
  }
</script>

{#if ui.settingsOpen}
  <div class="scrim" onclick={() => (ui.settingsOpen = false)} role="presentation"></div>
  <aside
    class="panel glass glass-strong scroll-area"
    aria-label="Customization"
    class:drop={dragging}
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={onDrop}
  >
    <header>
      <h2 class="text-display">Customize</h2>
      <button class="close control" onclick={() => (ui.settingsOpen = false)} aria-label="Close">
        <Icon name="xmark" size={18} strokeWidth={2.2} />
      </button>
    </header>

    <!-- Appearance -->
    <section>
      <h3>Appearance</h3>
      <div class="line col"><span>Look</span>
        <div class="presets">
          {#each PRESETS as p (p.id)}
            <button class="preset" class:on={settings.current.preset === p.id} title={p.description}
              onclick={() => { settings.current.preset = p.id; settings.current.accent = p.accent; }}>
              <span class="pv" style="font-family:{p.fontSans}">Ag</span>
              <span class="pn">{p.name}</span>
            </button>
          {/each}
        </div>
      </div>
      <label class="line"><span>Theme</span>
        <SegmentedControl bind:value={settings.current.theme}
          options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }]} />
      </label>
      <div class="line col"><span>Accent</span>
        <div class="swatches">
          {#each ACCENTS as c (c)}
            <button class="sw" class:on={settings.current.accent === c} style="background:{c}"
              aria-label={`Accent ${c}`} onclick={() => (settings.current.accent = c)}></button>
          {/each}
          <label class="sw custom" style="background:{settings.current.accent}">
            <input type="color" bind:value={settings.current.accent} aria-label="Custom accent" />
          </label>
        </div>
      </div>
      <Slider label="Transparency" bind:value={settings.current.transparency} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Search bar glass" bind:value={settings.current.searchGlass} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Corner radius" min={16} max={32} step={1} bind:value={settings.current.cornerRadius} format={(v) => `${v}px`} />
      <Slider label="Animation speed" min={0.5} max={2} step={0.1} bind:value={settings.current.animationSpeed} format={(v) => `${v}×`} />
      <label class="line"><span>Reduce motion</span><Toggle bind:checked={settings.current.reduceMotion} label="Reduce motion" /></label>
    </section>

    <!-- Wallpaper -->
    <section>
      <h3>Wallpaper</h3>
      <div class="dropzone">
        <label class="upload control">
          <Icon name="photo" size={18} /> Upload image
          <input type="file" accept="image/*" onchange={(e) => handleFiles((e.target as HTMLInputElement).files)} />
        </label>
        {#if background.config.kind === 'image'}
          <button class="control remove" onclick={() => background.clearImage()}>Remove</button>
        {/if}
        <span class="hint text-tertiary">or drop an image anywhere here</span>
      </div>
      <div class="grad-grid">
        {#each GRADIENTS as g (g.id)}
          <button class="grad" class:on={background.config.kind === 'gradient' && background.config.gradientId === g.id}
            style="background:{g.css}; background-size:200% 200%" title={g.name}
            aria-label={g.name} onclick={() => background.setGradient(g.id)}></button>
        {/each}
      </div>
      <Slider label="Blur" min={0} max={40} step={1} bind:value={background.config.blur} format={(v) => `${v}px`} />
      <Slider label="Dim" min={0} max={0.8} bind:value={background.config.dim} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Saturation" min={0} max={2} bind:value={background.config.saturation} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Brightness" min={0.4} max={1.6} bind:value={background.config.brightness} format={(v) => `${Math.round(v * 100)}%`} />
      <label class="line"><span>Parallax</span><Toggle bind:checked={background.config.parallax} label="Parallax" /></label>
    </section>

    <!-- Greeting & search -->
    <section>
      <h3>Greeting & Search</h3>
      <label class="line"><span>Show greeting</span><Toggle bind:checked={settings.current.greetingEnabled} label="Greeting" /></label>
      <label class="line"><span>Name</span>
        <input class="text-input selectable" type="text" bind:value={settings.current.name} placeholder="Your name" />
      </label>
      <label class="line"><span>Clock</span>
        <SegmentedControl bind:value={settings.current.clockFormat}
          options={[{ value: '12h', label: '12h' }, { value: '24h', label: '24h' }]} />
      </label>
      <label class="line col"><span>Search provider</span>
        <div class="providers">
          {#each PROVIDER_LIST as p (p.id)}
            <button class="prov control" class:on={settings.current.searchProvider === p.id}
              onclick={() => (settings.current.searchProvider = p.id as SearchProviderId)}>
              <span class="dot" style="background:{p.color}"></span>{p.name}
            </button>
          {/each}
        </div>
      </label>
    </section>

    <!-- Dock -->
    <section>
      <h3>Dock</h3>
      <label class="line"><span>Show dock</span><Toggle bind:checked={settings.current.dockEnabled} label="Dock" /></label>
      <Slider label="Dock size" min={40} max={84} step={1} bind:value={settings.current.dockSize} format={(v) => `${v}px`} />
      <Slider label="Magnification" min={1} max={2.2} step={0.05} bind:value={settings.current.dockMagnification} format={(v) => `${v.toFixed(2)}×`} />
    </section>

    <!-- Layout management -->
    <section>
      <h3>Layout</h3>
      <div class="actions">
        <button class="control" onclick={exportLayout}>Export</button>
        <label class="control">Import
          <input type="file" accept="application/json" onchange={(e) => importLayout((e.target as HTMLInputElement).files)} />
        </label>
        <button class="control" onclick={() => layout.reset()}>Reset widgets</button>
        <button
          class="control danger"
          title="Restore everything to defaults and re-run the welcome setup next time you open Canvas"
          onclick={() => { settings.reset(); dock.reset(); background.reset(); layout.reset(); onboarding.restartNextVisit(); }}
        >Reset to defaults</button>
      </div>
    </section>
  </aside>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.18); animation: fade-in var(--dur-fast); }
  .panel {
    position: fixed; top: 12px; right: 12px; bottom: 12px; z-index: 91; width: min(420px, 94vw);
    border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 22px;
    animation: slide-in var(--dur-base) var(--ease-out-quart) both;
  }
  .panel.drop { box-shadow: inset 0 0 0 2px var(--accent), var(--shadow-float); }
  @keyframes slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
  header { display: flex; align-items: center; justify-content: space-between; }
  header h2 { font-size: 1.5rem; margin: 0; }
  .close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 999px; }
  section { display: flex; flex-direction: column; gap: 14px; }
  h3 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin: 0; font-weight: 600; }
  .line { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.95rem; }
  .line.col { flex-direction: column; align-items: stretch; gap: 10px; }
  .presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .preset { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px; border-radius: var(--radius-sm); background: var(--control-fill); transition: box-shadow var(--dur-fast), transform var(--dur-fast) var(--ease-spring); }
  .preset:hover { transform: translateY(-1px); }
  .preset.on { box-shadow: inset 0 0 0 1.5px var(--accent); }
  .preset .pv { font-size: 1.2rem; font-weight: 600; line-height: 1; }
  .preset .pn { font-size: 0.7rem; color: var(--text-secondary); }
  .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .sw { width: 28px; height: 28px; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); transition: transform var(--dur-fast) var(--ease-spring); }
  .sw.on { transform: scale(1.15); box-shadow: 0 0 0 2px var(--accent); }
  .sw.custom { position: relative; overflow: hidden; display: grid; place-items: center; }
  .sw.custom input { position: absolute; inset: -6px; opacity: 0; cursor: pointer; }
  .text-input { background: var(--control-fill); border: none; border-radius: var(--radius-sm); padding: 7px 10px; width: 55%; text-align: right; }
  .dropzone { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .upload, .remove, .actions label, .actions .control { position: relative; display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; font-size: 0.9rem; border-radius: var(--radius-sm); }
  input[type='file'] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .hint { font-size: 12px; flex: 1; min-width: 120px; }
  .grad-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .grad { aspect-ratio: 1; border-radius: 12px; box-shadow: inset 0 0 0 1px var(--hairline); transition: transform var(--dur-fast) var(--ease-spring); }
  .grad.on { box-shadow: 0 0 0 2px var(--accent); transform: scale(1.06); }
  .providers { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .prov { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 0.9rem; }
  .prov.on { box-shadow: inset 0 0 0 1.5px var(--accent); }
  .prov .dot { width: 9px; height: 9px; border-radius: 999px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .actions .danger { color: #ff453a; }
</style>
