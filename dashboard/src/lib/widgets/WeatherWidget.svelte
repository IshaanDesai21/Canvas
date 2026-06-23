<script lang="ts">
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import { fetchWeather, fetchNWSCurrent, getLocation, geocodeCity, type WeatherData } from '$utils/weather';
  import { kv } from '$utils/storage';
  import { layout } from '$stores/layout.svelte';
  import Icon from '$components/Icon.svelte';

  let { instance }: { instance: WidgetInstance } = $props();

  type Override = { lat: number; lon: number; place: string | null };

  const CACHE_KEY = 'weather:last';
  const PLACE_KEY = 'weather:place';

  // Seed from the last successful reading so a fresh offline tab shows real
  // (if slightly stale) weather instead of an error.
  let data = $state<WeatherData | null>(kv.get<WeatherData | null>(CACHE_KEY, null));
  let place = $state<string | null>(kv.get<string | null>(PLACE_KEY, null));
  let error = $state(false);

  // A user-chosen location (persisted) overrides auto GPS/IP detection.
  let override = $state<Override | null>(
    untrack(() => (instance.settings?.location as Override | undefined) ?? null)
  );

  // Inline "change location" editor.
  let editingLoc = $state(false);
  let cityDraft = $state('');
  let geoBusy = $state(false);
  let geoError = $state(false);

  function autofocus(node: HTMLInputElement) {
    node.focus();
  }

  async function load() {
    error = false;
    try {
      const loc = override ?? (await getLocation());
      place = loc.place;
      kv.set(PLACE_KEY, place);
      data = await fetchWeather(loc.lat, loc.lon, true);
      kv.set(CACHE_KEY, data);

      // For US locations, correct the "now" condition with real NWS station
      // observations (Open-Meteo's model code can invent thunderstorms).
      const nws = await fetchNWSCurrent(loc.lat, loc.lon, true, data.now.isDay);
      if (nws && data) {
        data = { ...data, now: { ...data.now, temp: nws.temp, label: nws.label, icon: nws.icon } };
        kv.set(CACHE_KEY, data);
      }
    } catch {
      // Only surface an error when we have nothing cached to fall back on.
      if (!data) error = true;
    }
  }

  async function setCity() {
    geoError = false;
    geoBusy = true;
    const res = await geocodeCity(cityDraft);
    geoBusy = false;
    if (!res) {
      geoError = true;
      return;
    }
    override = { lat: res.lat, lon: res.lon, place: res.place };
    layout.setWidgetSettings(instance.id, { location: override });
    editingLoc = false;
    cityDraft = '';
    await load();
  }

  function useMyLocation() {
    override = null;
    layout.setWidgetSettings(instance.id, { location: null });
    editingLoc = false;
    cityDraft = '';
    geoError = false;
    void load();
  }

  $effect(() => {
    void load();
    const t = setInterval(load, 60 * 60 * 1000); // refresh hourly, nothing jittery
    return () => clearInterval(t);
  });

  let today = $derived(data?.daily?.[0] ?? null);
</script>

<div class="weather">
  {#if !editingLoc}
    <button class="loc-btn" aria-label="Change weather location" title="Change location" onclick={() => { editingLoc = true; geoError = false; }}>
      <Icon name="pin" size={14} strokeWidth={1.9} />
    </button>
  {/if}

  {#if editingLoc}
    <form class="loc-edit" onsubmit={(e) => { e.preventDefault(); setCity(); }}>
      <input
        class="loc-input selectable"
        type="text"
        bind:value={cityDraft}
        placeholder="Search city…"
        aria-label="Search for a city"
        spellcheck="false"
        autocomplete="off"
        use:autofocus
        onkeydown={(e) => { if (e.key === 'Escape') { editingLoc = false; cityDraft = ''; geoError = false; } }}
      />
      {#if geoError}<span class="geo-err">City not found</span>{/if}
      <div class="loc-actions">
        <button type="button" class="mini" onclick={useMyLocation}>My location</button>
        <button type="submit" class="mini primary" disabled={geoBusy}>{geoBusy ? '…' : 'Set'}</button>
      </div>
    </form>
  {:else if error}
    <div class="state text-secondary">
      <Icon name="cloud" size={30} strokeWidth={1.6} />
      <span>Weather unavailable</span>
      <button class="retry control" onclick={load}>Retry</button>
    </div>
  {:else if !data}
    <div class="state"><div class="shimmer ph"></div></div>
  {:else}
    <div class="icon" aria-hidden="true">
      <Icon name={data.now.icon} size={56} strokeWidth={1.5} />
    </div>
    <div class="temp text-display tabular">{data.now.temp}<span class="deg">{data.unit}</span></div>
    <div class="label text-secondary">{data.now.label}</div>
    {#if today}
      <div class="hilo tabular text-tertiary">H:{today.max}°&nbsp;&nbsp;L:{today.min}°</div>
    {/if}
    {#if place}
      <button class="place text-tertiary" title="Change location" onclick={() => { editingLoc = true; geoError = false; }}>
        <Icon name="pin" size={11} strokeWidth={1.8} />
        <span>{place}</span>
      </button>
    {/if}
  {/if}
</div>

<style>
  .weather {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1em;
    text-align: center;
  }
  /* Hover-revealed "change location" affordance. */
  .loc-btn {
    position: absolute; top: -4px; right: -4px; z-index: 2;
    width: 26px; height: 26px; display: grid; place-items: center; border-radius: 999px;
    color: var(--text-tertiary); opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-smooth), background var(--dur-fast), color var(--dur-fast);
  }
  .weather:hover .loc-btn, .loc-btn:focus-visible { opacity: 1; }
  .loc-btn:hover { background: var(--control-fill); color: var(--text-primary); }

  .loc-edit { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 220px; }
  .loc-input {
    width: 100%; text-align: center; font-size: 0.92rem;
    background: var(--control-fill); border: none; border-radius: var(--radius-sm); padding: 8px 10px; outline: none;
  }
  .geo-err { font-size: 0.72rem; color: #ff453a; }
  .loc-actions { display: flex; gap: 6px; justify-content: center; }
  .mini { padding: 5px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; background: var(--control-fill); color: var(--text-primary); }
  .mini:hover { background: var(--control-fill-active); }
  .mini.primary { background: var(--accent); color: #fff; }
  .mini:disabled { opacity: 0.6; }
  .state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font-size: 0.9rem; font-weight: 500; }
  .ph { width: 64%; height: 44px; border-radius: 12px; background: var(--control-fill); }
  .retry { padding: 4px 14px; border-radius: 999px; font-size: 0.85rem; }

  .icon { color: var(--accent); line-height: 0; margin-bottom: 0.1em; }
  .icon :global(svg) { width: clamp(40px, 34cqmin, 92px); height: auto; }
  .temp {
    font-size: clamp(2rem, 32cqmin, 4.2rem);
    line-height: 0.95;
    font-weight: 600;
    display: inline-flex;
    align-items: flex-start;
  }
  .deg { font-size: 0.4em; font-weight: 500; color: var(--text-secondary); margin-top: 0.2em; }
  .label { font-size: clamp(0.85rem, 10cqmin, 1.2rem); font-weight: 500; }
  .hilo { font-size: clamp(0.72rem, 8cqmin, 0.95rem); margin-top: 0.2em; }
  .place {
    display: inline-flex; align-items: center; gap: 3px; cursor: pointer;
    font-size: clamp(0.66rem, 7cqmin, 0.82rem); margin-top: 0.3em; max-width: 100%;
    color: var(--text-tertiary); border-radius: 999px; padding: 1px 4px;
    transition: color var(--dur-fast), background var(--dur-fast);
  }
  .place:hover { color: var(--text-secondary); background: var(--control-fill); }
  .place span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
