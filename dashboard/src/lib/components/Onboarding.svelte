<script lang="ts">
  import { settings } from '$stores/settings.svelte';
  import { background, GRADIENTS } from '$stores/background.svelte';
  import { onboarding } from '$stores/onboarding.svelte';
  import type { SearchProviderId } from '$lib/types';
  import { PROVIDER_LIST } from '$utils/search';
  import Icon from '$components/Icon.svelte';
  import SegmentedControl from '$components/SegmentedControl.svelte';

  const ACCENTS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d55', '#ff9f0a', '#30d158', '#64d2ff', '#b08968'];

  // One preference per step. Changes apply live so the dashboard behind the
  // card previews each choice immediately.
  const STEPS = ['welcome', 'name', 'theme', 'accent', 'search', 'wallpaper', 'done'] as const;
  let step = $state(0);
  const last = $derived(step === STEPS.length - 1);

  function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
  }

  function next() {
    if (last) onboarding.complete();
    else step += 1;
  }
  function back() {
    if (step > 0) step -= 1;
  }

  const primaryLabel = $derived(step === 0 ? 'Get started' : last ? 'Open dashboard' : 'Next');
  const name = $derived(settings.current.name.trim());

  async function handleUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && file.type.startsWith('image/')) await background.setImage(file);
  }
</script>

{#if !onboarding.done}
  <div class="ob-scrim" role="dialog" aria-modal="true" aria-label="Welcome to Canvas">
    <div class="ob-card glass glass-strong">
      {#if !last}
        <button class="ob-skip" onclick={() => onboarding.complete()}>Skip</button>
      {/if}

      <div class="ob-body">
        {#if STEPS[step] === 'welcome'}
          <span class="ob-badge"><Icon name="grid" size={30} strokeWidth={1.7} /></span>
          <h2 class="text-display">Welcome to Canvas</h2>
          <p class="ob-sub">Let's set up your new tab. It only takes a few seconds — and you can change anything later in Settings.</p>
        {:else if STEPS[step] === 'name'}
          <h2 class="text-display">What should we call you?</h2>
          <p class="ob-sub">Used for your greeting.</p>
          <input
            class="ob-input selectable"
            type="text"
            bind:value={settings.current.name}
            placeholder="Your name"
            aria-label="Your name"
            maxlength="30"
            spellcheck="false"
            use:autofocus
            onkeydown={(e) => { if (e.key === 'Enter') next(); }}
          />
        {:else if STEPS[step] === 'theme'}
          <h2 class="text-display">Pick a theme</h2>
          <p class="ob-sub">Light, dark, or follow your system.</p>
          <div class="ob-control">
            <SegmentedControl bind:value={settings.current.theme}
              options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'Auto' }]} />
          </div>
        {:else if STEPS[step] === 'accent'}
          <h2 class="text-display">Choose an accent</h2>
          <p class="ob-sub">The highlight color across the dashboard.</p>
          <div class="ob-swatches">
            {#each ACCENTS as c (c)}
              <button class="sw" class:on={settings.current.accent === c} style="background:{c}"
                aria-label={`Accent ${c}`} onclick={() => (settings.current.accent = c)}></button>
            {/each}
            <label class="sw custom" style="background:{settings.current.accent}">
              <input type="color" bind:value={settings.current.accent} aria-label="Custom accent" />
            </label>
          </div>
        {:else if STEPS[step] === 'search'}
          <h2 class="text-display">Default search engine</h2>
          <p class="ob-sub">Where the search bar sends your queries.</p>
          <div class="ob-providers">
            {#each PROVIDER_LIST as p (p.id)}
              <button class="prov control" class:on={settings.current.searchProvider === p.id}
                onclick={() => (settings.current.searchProvider = p.id as SearchProviderId)}>
                <span class="dot" style="background:{p.color}"></span>{p.name}
              </button>
            {/each}
          </div>
        {:else if STEPS[step] === 'wallpaper'}
          <h2 class="text-display">Choose a background</h2>
          <p class="ob-sub">Pick a wallpaper, or upload your own photo.</p>
          <div class="ob-grads">
            {#each GRADIENTS as g (g.id)}
              <button class="grad" class:on={background.config.kind === 'gradient' && background.config.gradientId === g.id}
                style="background:{g.css}; background-size:200% 200%" title={g.name}
                aria-label={g.name} onclick={() => background.setGradient(g.id)}></button>
            {/each}
          </div>
          <label class="ob-upload control" class:on={background.config.kind === 'image'}>
            <Icon name="photo" size={16} />
            {background.config.kind === 'image' ? 'Image uploaded — choose another' : 'Upload your own photo'}
            <input type="file" accept="image/*" onchange={handleUpload} />
          </label>
        {:else}
          <span class="ob-badge done"><Icon name="check" size={30} strokeWidth={2.4} /></span>
          <h2 class="text-display">{name ? `You're all set, ${name}!` : "You're all set!"}</h2>
          <p class="ob-sub">Tweak anything anytime from the Settings panel. Enjoy your new tab.</p>
        {/if}
      </div>

      <div class="ob-foot">
        <div class="dots" aria-hidden="true">
          {#each STEPS as _, i (i)}
            <span class="dot" class:on={i === step}></span>
          {/each}
        </div>
        <div class="ob-nav">
          {#if step > 0 && !last}
            <button class="ob-btn" onclick={back}>Back</button>
          {/if}
          <button class="ob-btn primary" onclick={next}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .ob-scrim {
    position: fixed; inset: 0; z-index: 120; display: grid; place-items: center; padding: 20px;
    background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    animation: fade-in var(--dur-base);
  }
  .ob-card {
    width: min(460px, 96vw); border-radius: var(--radius-lg); padding: 28px 26px 20px;
    display: flex; flex-direction: column; gap: 18px; position: relative;
    animation: pop var(--dur-base) var(--ease-spring) both;
  }
  @keyframes pop { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: none; } }
  .ob-skip {
    position: absolute; top: 16px; right: 18px; font-size: 0.82rem; font-weight: 600;
    color: var(--text-tertiary); padding: 4px 8px; border-radius: 999px;
  }
  .ob-skip:hover { color: var(--text-primary); background: var(--control-fill); }

  .ob-body { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; min-height: 184px; justify-content: center; padding: 8px 4px; }
  .ob-badge {
    width: 60px; height: 60px; display: grid; place-items: center; border-radius: 18px; margin-bottom: 4px;
    background: var(--accent-soft); color: var(--accent);
  }
  .ob-badge.done { background: color-mix(in srgb, #30d158 22%, transparent); color: #30d158; }
  h2 { margin: 0; font-size: 1.5rem; }
  .ob-sub { margin: 0; font-size: 0.95rem; color: var(--text-secondary); max-width: 36ch; line-height: 1.45; }

  .ob-input {
    margin-top: 6px; width: 100%; max-width: 280px; text-align: center; font-size: 1.1rem;
    background: var(--control-fill); border: none; border-radius: var(--radius-sm); padding: 11px 14px; outline: none;
  }
  .ob-control { margin-top: 8px; }

  .ob-swatches { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }
  .ob-swatches .sw { width: 34px; height: 34px; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); transition: transform var(--dur-fast) var(--ease-spring); }
  .ob-swatches .sw.on { transform: scale(1.18); box-shadow: 0 0 0 2px var(--accent); }
  .ob-swatches .sw.custom { position: relative; overflow: hidden; display: grid; place-items: center; }
  .ob-swatches .sw.custom input { position: absolute; inset: -6px; opacity: 0; cursor: pointer; }

  .ob-providers { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; max-width: 320px; margin-top: 8px; }
  .prov { display: flex; align-items: center; gap: 8px; padding: 9px 11px; font-size: 0.9rem; }
  .prov.on { box-shadow: inset 0 0 0 1.5px var(--accent); }
  .prov .dot { width: 9px; height: 9px; border-radius: 999px; }

  .ob-grads { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; width: 100%; max-width: 320px; margin-top: 8px; }
  .grad { aspect-ratio: 1; border-radius: 12px; box-shadow: inset 0 0 0 1px var(--hairline); transition: transform var(--dur-fast) var(--ease-spring); }
  .grad.on { box-shadow: 0 0 0 2px var(--accent); transform: scale(1.06); }
  .ob-upload {
    position: relative; display: inline-flex; align-items: center; gap: 8px; margin-top: 12px;
    padding: 9px 14px; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer;
  }
  .ob-upload.on { box-shadow: inset 0 0 0 1.5px var(--accent); color: var(--accent); }
  .ob-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

  .ob-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .dots { display: flex; gap: 6px; }
  .dots .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--control-fill-active); transition: background var(--dur-fast), width var(--dur-fast); }
  .dots .dot.on { background: var(--accent); width: 18px; }
  .ob-nav { display: flex; gap: 8px; }
  .ob-btn { padding: 9px 18px; border-radius: 999px; font-size: 0.9rem; font-weight: 600; background: var(--control-fill); color: var(--text-primary); }
  .ob-btn:hover { background: var(--control-fill-active); }
  .ob-btn.primary { background: var(--accent); color: #fff; }
  .ob-btn.primary:hover { filter: brightness(1.05); }

  @media (max-width: 680px) {
    .ob-card { padding: 22px 18px 16px; }
    h2 { font-size: 1.3rem; }
  }
</style>
