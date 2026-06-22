<script lang="ts">
  import { ui } from '$stores/ui.svelte';
  import { layout } from '$stores/layout.svelte';
  import { settings } from '$stores/settings.svelte';
  import { background, GRADIENTS } from '$stores/background.svelte';
  import { WIDGET_LIST } from '$widgets/registry';
  import { SEARCH_PROVIDERS, searchUrl } from '$utils/search';
  import type { Theme } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  interface Command {
    id: string;
    title: string;
    hint?: string;
    icon: string;
    keywords?: string;
    run: () => void;
  }

  let query = $state('');
  let active = $state(0);
  let input = $state<HTMLInputElement>();

  function close() { ui.paletteOpen = false; query = ''; active = 0; }

  // Build the full command set from live app state.
  let commands = $derived.by<Command[]>(() => {
    const list: Command[] = [
      { id: 'edit', title: ui.editMode ? 'Exit Edit Mode' : 'Edit Dashboard', icon: 'pencil', keywords: 'arrange move', run: () => ui.toggleEdit() },
      { id: 'settings', title: 'Open Settings', icon: 'gear', keywords: 'preferences customize', run: () => (ui.settingsOpen = true) },
      { id: 'reset', title: 'Reset Layout', icon: 'refresh', keywords: 'default', run: () => layout.reset() }
    ];
    (['light', 'dark', 'system'] as Theme[]).forEach((t) =>
      list.push({ id: `theme-${t}`, title: `Theme: ${t[0].toUpperCase()}${t.slice(1)}`, icon: t === 'dark' ? 'moon' : t === 'light' ? 'sun' : 'gear', keywords: 'appearance', run: () => (settings.current.theme = t) })
    );
    WIDGET_LIST.forEach((w) =>
      list.push({ id: `add-${w.type}`, title: `Add ${w.name}`, hint: 'Widget', icon: w.icon, keywords: `${w.description} widget`, run: () => layout.add(w.type) })
    );
    GRADIENTS.forEach((g) =>
      list.push({ id: `bg-${g.id}`, title: `Wallpaper: ${g.name}`, icon: 'photo', keywords: 'background gradient', run: () => background.setGradient(g.id) })
    );
    return list;
  });

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 8);
    return commands
      .filter((c) => (c.title + ' ' + (c.keywords ?? '')).toLowerCase().includes(q))
      .slice(0, 8);
  });

  // When no command matches, offer a web search for the raw query.
  let webSearch = $derived(
    query.trim() && filtered.length === 0
      ? { url: searchUrl(SEARCH_PROVIDERS[settings.current.searchProvider], query.trim()) }
      : null
  );

  $effect(() => {
    if (ui.paletteOpen) requestAnimationFrame(() => input?.focus());
  });

  function run(i: number) {
    if (webSearch) { window.location.href = webSearch.url; return; }
    filtered[i]?.run();
    close();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  }

  $effect(() => { void query; active = 0; });
</script>

{#if ui.paletteOpen}
  <div class="scrim" onclick={close} role="presentation">
    <div class="palette glass glass-strong" role="dialog" aria-label="Command palette" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <div class="field">
        <Icon name="command" size={20} class="text-secondary" />
        <input
          bind:this={input} bind:value={query} onkeydown={onKey}
          class="selectable" type="text" placeholder="Search commands, widgets, wallpapers…"
          spellcheck="false" autocomplete="off" aria-label="Command search"
        />
        <kbd>esc</kbd>
      </div>
      <div class="list scroll-area" role="listbox">
        {#if webSearch}
          <button class="cmd sel" role="option" aria-selected="true" onclick={() => run(0)}>
            <Icon name="magnifier" size={18} />
            <span class="t">Search the web for “{query.trim()}”</span>
          </button>
        {:else}
          {#each filtered as c, i (c.id)}
            <button class="cmd" class:sel={active === i} role="option" aria-selected={active === i}
              onmouseenter={() => (active = i)} onclick={() => run(i)}>
              <Icon name={c.icon} size={18} />
              <span class="t">{c.title}</span>
              {#if c.hint}<span class="h">{c.hint}</span>{/if}
            </button>
          {:else}
            <div class="empty text-tertiary">No matching commands</div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: center; align-items: flex-start; padding-top: 16vh; background: rgba(0,0,0,0.18); backdrop-filter: blur(2px); animation: fade-in var(--dur-fast); }
  .palette { width: min(620px, 92vw); border-radius: var(--radius-lg); overflow: hidden; animation: pop var(--dur-base) var(--ease-spring) both; }
  @keyframes pop { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: none; } }
  .field { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--hairline); }
  .field input { flex: 1; background: none; border: none; outline: none; font-size: 1.1rem; }
  .field kbd { font-size: 11px; padding: 3px 7px; border-radius: 6px; background: var(--control-fill); color: var(--text-tertiary); font-family: var(--font-mono); }
  .list { padding: 8px; max-height: 46vh; }
  .cmd { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border-radius: var(--radius-sm); text-align: left; color: var(--text-primary); }
  .cmd.sel { background: var(--accent-soft); }
  .cmd .t { flex: 1; }
  .cmd .h { font-size: 11px; color: var(--text-tertiary); padding: 2px 8px; border-radius: 999px; background: var(--control-fill); }
  .empty { padding: 24px; text-align: center; font-size: 14px; }
</style>
