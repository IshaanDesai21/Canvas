<script lang="ts">
  import { ui } from '$stores/ui.svelte';
  import { settings } from '$stores/settings.svelte';
  import { viewport } from '$stores/viewport.svelte';
  import Background from '$components/Background.svelte';
  import Greeting from '$components/Greeting.svelte';
  import SearchBar from '$components/SearchBar.svelte';
  import Dock from '$components/Dock.svelte';
  import CommandPalette from '$components/CommandPalette.svelte';
  import CustomizationPanel from '$components/CustomizationPanel.svelte';
  import WidgetGallery from '$components/WidgetGallery.svelte';
  import Onboarding from '$components/Onboarding.svelte';
  import WidgetGrid from '$layouts/WidgetGrid.svelte';
  import Icon from '$components/Icon.svelte';

  let search = $state<ReturnType<typeof SearchBar>>();

  // A fresh new tab should be ready to type immediately: focus the search bar
  // on load (and whenever the tab regains visibility).
  $effect(() => {
    requestAnimationFrame(() => search?.focusInput());
  });

  // Drag the search bar to reposition it (edit mode only); offset persists.
  function startSearchDrag(e: PointerEvent) {
    e.preventDefault();
    const ox = e.clientX - settings.current.searchPosition.x;
    const oy = e.clientY - settings.current.searchPosition.y;
    const move = (ev: PointerEvent) =>
      (settings.current.searchPosition = { x: ev.clientX - ox, y: ev.clientY - oy });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function onKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA)$/.test(target.tagName) || target.isContentEditable;

    // ⌘K simply (re)focuses the search bar — never a popup menu.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      search?.focusInput();
      return;
    }
    // ⌘P opens the command palette (kept available, no longer on ⌘K).
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      ui.paletteOpen = !ui.paletteOpen;
      return;
    }
    if (e.key === 'Escape') {
      if (ui.galleryOpen) ui.galleryOpen = false;
      else if (ui.settingsOpen) ui.settingsOpen = false;
      else if (ui.editMode) ui.editMode = false;
      return;
    }
    if (!typing && e.key === '/') {
      e.preventDefault();
      search?.focusInput();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<Background />

<!-- Top-right floating controls -->
<div class="toolbar">
  {#if ui.editMode}
    <button class="tool glass animate-in" aria-label="Add widget" onclick={() => (ui.galleryOpen = true)}>
      <Icon name="plus" size={20} strokeWidth={2.2} />
    </button>
  {/if}
  <button class="tool glass" aria-label="Settings" onclick={() => (ui.settingsOpen = true)}>
    <Icon name="sliders" size={20} />
  </button>
  {#if !viewport.isMobile}
    <button class="tool glass" class:active={ui.editMode} aria-pressed={ui.editMode}
      aria-label={ui.editMode ? 'Done editing' : 'Edit dashboard'} onclick={() => ui.toggleEdit()}>
      {#if ui.editMode}<span class="done">Done</span>{:else}<Icon name="pencil" size={18} />{/if}
    </button>
  {/if}
</div>

<main class="stage scroll-area">
  <section class="hero">
    <Greeting />
    {#if !viewport.isMobile}
    <div class="search-pos" style="transform: translate({settings.current.searchPosition.x}px, {settings.current.searchPosition.y}px)">
      {#if ui.editMode}
        <div class="search-tools">
          <button class="search-handle glass" onpointerdown={startSearchDrag} aria-label="Move search bar">
            <Icon name="grid" size={13} /> Drag to move
          </button>
          <button
            class="search-handle glass"
            onclick={() => (settings.current.searchPosition = { x: 0, y: 0 })}
            aria-label="Reset search bar position"
          >
            <Icon name="refresh" size={13} /> Reset position
          </button>
        </div>
      {/if}
      <SearchBar bind:this={search} />
      {#if ui.editMode}
        <!-- Drag anywhere on the bar to reposition it. -->
        <div class="search-drag" onpointerdown={startSearchDrag} role="presentation" aria-hidden="true"></div>
      {/if}
    </div>
    {/if}
  </section>

  <section class="widgets">
    <WidgetGrid />
  </section>
</main>

{#if !viewport.isMobile}
  <Dock />
{/if}

<CommandPalette />
<CustomizationPanel />
<WidgetGallery />
<Onboarding />

<style>
  .stage { position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden; padding: 0 max(24px, 4vw) 140px; display: flex; flex-direction: column; align-items: center; }
  .hero { display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 9vh 0 5vh; width: 100%; flex-shrink: 0; }
  .widgets { width: 100%; max-width: 1240px; }

  .toolbar { position: fixed; top: 18px; right: 18px; z-index: 60; display: flex; gap: 8px; }
  .tool {
    width: 42px; height: 42px; border-radius: 999px; display: grid; place-items: center; color: var(--text-primary);
    transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base);
  }
  .tool:hover { transform: translateY(-1px); }
  .tool:active { transform: scale(0.92); }
  .tool.active { background: var(--accent); color: #fff; width: auto; padding: 0 16px; }
  .done { font-weight: 600; font-size: 0.95rem; }

  /* The inline transform makes this a stacking context; without a positive
     z-index the widget slots (also auto-z-index, but later in the DOM) would
     paint over the search results / calculator preview. Lift it above them. */
  .search-pos { position: relative; z-index: 40; display: flex; flex-direction: column; align-items: center; }
  .search-tools {
    position: absolute; bottom: calc(100% + 10px); z-index: 5;
    display: inline-flex; gap: 6px; white-space: nowrap;
  }
  .search-handle {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px;
    font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: grab;
  }
  .search-handle:active { cursor: grabbing; }
  .search-tools .search-handle:last-child { cursor: pointer; }
  .search-drag { position: absolute; inset: 0; z-index: 6; cursor: grab; border-radius: var(--radius-pill); }
  .search-drag:active { cursor: grabbing; }

  /* Mobile: no dock/search, so reclaim the spacing and tighten the gutters. */
  @media (max-width: 680px) {
    .stage { padding: 0 16px 32px; }
    .hero { padding: 6vh 0 3vh; gap: 18px; }
    .widgets { max-width: 560px; }
  }
</style>
