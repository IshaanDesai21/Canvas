<script lang="ts">
  import { settings } from '$stores/settings.svelte';
  import type { SearchProviderId } from '$lib/types';
  import { SEARCH_PROVIDERS, PROVIDER_LIST, searchUrl, detectProvider, fetchSuggestions, looksLikeUrl } from '$utils/search';
  import { evaluateExpression, convertUnits, prettyNumber } from '$utils/calc';
  import Icon from '$components/Icon.svelte';

  let query = $state('');
  let focused = $state(false);
  let active = $state(0); // highlighted row
  let suggestions = $state<string[]>([]);
  let input = $state<HTMLInputElement>();
  let menuOpen = $state(false);

  /** Allow the parent to focus the bar (e.g. pressing "/"). */
  export function focusInput() { input?.focus(); }

  // Safe lookup — tolerates a stale/removed provider id in persisted settings.
  let provider = $derived(SEARCH_PROVIDERS[settings.current.searchProvider] ?? SEARCH_PROVIDERS.google);
  let parsed = $derived(detectProvider(query, provider.id));

  // Inline "smart" answer: calculator or unit conversion.
  let smart = $derived.by(() => {
    const calc = evaluateExpression(query);
    if (calc !== null) return { kind: 'calc' as const, text: prettyNumber(calc) };
    const conv = convertUnits(query);
    if (conv) return { kind: 'convert' as const, text: `${prettyNumber(conv.value)} ${conv.to}` };
    return null;
  });

  let directUrl = $derived(looksLikeUrl(query));

  // Debounced suggestion fetch.
  $effect(() => {
    const q = parsed.query.trim();
    if (!q || smart) { suggestions = []; return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      suggestions = await fetchSuggestions(q, ctrl.signal);
    }, 140);
    return () => { clearTimeout(t); ctrl.abort(); };
  });

  let rows = $derived(suggestions.slice(0, 6));
  let showHint = $derived(!focused && !query);

  // User-tunable see-through level for the bar (overrides the .glass defaults).
  let barStyle = $derived.by(() => {
    const g = settings.current.searchGlass;
    const pct = Math.round(g * 100);
    const blur = 6 + g * 34;
    return `background-color: color-mix(in srgb, var(--glass-fill-strong) ${pct}%, transparent); backdrop-filter: blur(${blur}px) saturate(180%); -webkit-backdrop-filter: blur(${blur}px) saturate(180%);`;
  });

  function go(target: string | null = null) {
    const text = (target ?? parsed.query).trim();
    if (!text && !directUrl) return;
    const url = directUrl && !target ? directUrl : searchUrl(parsed.provider, text);
    window.location.href = url;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, rows.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (active > 0 && rows[active - 1]) go(rows[active - 1]);
      else go();
    } else if (e.key === 'Escape') { query = ''; input?.blur(); }
  }

  function pickProvider(id: SearchProviderId) {
    settings.current.searchProvider = id;
    menuOpen = false;
    input?.focus();
  }
</script>

<svelte:window onclick={() => (menuOpen = false)} />

<div class="search-wrap" class:focused>
  <!-- The whole bar is the text field: clicking anywhere focuses the input. -->
  <div
    class="bar glass glass-strong glass-pill"
    class:open={focused && (rows.length || smart)}
    style={barStyle}
    onclick={() => input?.focus()}
    role="presentation"
  >
    <button
      class="lead"
      title={`Search with ${provider.name}`}
      aria-label={`Search engine: ${provider.name}. Click to change.`}
      onclick={(e) => { e.stopPropagation(); menuOpen = !menuOpen; }}
    >
      <Icon name="magnifier" size={21} strokeWidth={1.9} />
    </button>

    {#if showHint}
      <kbd class="hint" aria-hidden="true">⌘K</kbd>
    {/if}

    <input
      bind:this={input}
      bind:value={query}
      class="selectable"
      type="text"
      placeholder={`Search ${provider.name} or enter a website`}
      spellcheck="false"
      autocomplete="off"
      aria-label="Search"
      onfocus={() => (focused = true)}
      onblur={() => setTimeout(() => (focused = false), 120)}
      onkeydown={onKey}
      oninput={() => (active = 0)}
    />

    {#if query}
      <button class="clear" aria-label="Clear" onclick={(e) => { e.stopPropagation(); query = ''; input?.focus(); }}>
        <Icon name="xmark" size={16} strokeWidth={2.2} />
      </button>
    {/if}
  </div>

  {#if menuOpen}
    <div class="menu glass glass-strong animate-in" role="menu">
      {#each PROVIDER_LIST as p (p.id)}
        <button class="menu-row" class:sel={p.id === provider.id} role="menuitem"
          onclick={(e) => { e.stopPropagation(); pickProvider(p.id); }}>
          <span class="dot" style="background:{p.color}"></span>{p.name}
          <kbd>{p.keyword}</kbd>
        </button>
      {/each}
    </div>
  {:else if focused && (rows.length || smart)}
    <div class="results glass glass-strong animate-in" role="listbox">
      {#if smart}
        <button class="row sel" role="option" aria-selected="true" onclick={() => go()}>
          <Icon name="calculator" size={18} />
          <span class="r-text">{query}</span>
          <span class="r-eq">= {smart.text}</span>
        </button>
      {/if}
      {#each rows as s, i (s)}
        <button
          class="row" class:sel={active === i + 1} role="option" aria-selected={active === i + 1}
          onmouseenter={() => (active = i + 1)} onclick={() => go(s)}
        >
          <Icon name="magnifier" size={18} class="text-tertiary" />
          <span class="r-text">{s}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-wrap { position: relative; width: min(640px, 86vw); }
  .bar {
    display: flex; align-items: center; gap: 8px; height: 60px; padding: 0 12px 0 8px; cursor: text;
    transition: box-shadow var(--dur-base) var(--ease-smooth);
  }
  /* No scale "pop" — a soft accent halo only, so the bar reads as one field. */
  .focused .bar {
    box-shadow: inset 0 1px 0 0 var(--glass-edge), inset 0 0 0 1px var(--glass-edge-shadow),
      var(--shadow-float), 0 0 0 4px var(--accent-soft);
  }
  .lead {
    width: 40px; height: 40px; display: grid; place-items: center; border-radius: 999px;
    color: var(--text-secondary); transition: color var(--dur-fast), background var(--dur-fast);
    flex-shrink: 0;
  }
  .lead:hover { color: var(--text-primary); background: var(--control-fill); }
  /* Soft, natural shortcut hint sitting on the left, fades out on focus. */
  .hint {
    font-size: 12px; padding: 3px 8px; border-radius: 8px; color: var(--text-tertiary);
    background: var(--control-fill); font-family: var(--font-mono); letter-spacing: 0.03em; flex-shrink: 0;
  }
  input { flex: 1; background: none; border: none; outline: none; font-size: 1.15rem; font-weight: 450; min-width: 0; }
  /* The bar itself shows the focus state — the inner field never draws its own. */
  input:focus,
  input:focus-visible { outline: none; box-shadow: none; }
  .clear { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 999px; color: var(--text-tertiary); flex-shrink: 0; }
  .clear:hover { background: var(--control-fill); color: var(--text-primary); }

  .results, .menu {
    position: absolute; top: calc(100% + 10px); left: 0; right: 0; padding: 7px; z-index: 30;
    border-radius: var(--radius-lg); display: flex; flex-direction: column; max-height: 50vh; overflow-y: auto;
  }
  .menu { left: 0; right: auto; min-width: 220px; }
  .row, .menu-row {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-sm);
    text-align: left; font-size: 0.98rem; color: var(--text-primary); width: 100%;
  }
  .row.sel, .menu-row.sel, .menu-row:hover { background: var(--accent-soft); }
  .r-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .r-eq { color: var(--accent); font-weight: 600; font-variant-numeric: tabular-nums; }
  .menu-row .dot { width: 10px; height: 10px; border-radius: 999px; }
  .menu-row kbd { margin-left: auto; font-size: 11px; padding: 2px 6px; border-radius: 6px; background: var(--control-fill); font-family: var(--font-mono); }
</style>
