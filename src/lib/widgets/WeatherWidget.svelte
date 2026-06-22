<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import { fetchWeather, getCoords, type WeatherData } from '$utils/weather';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  let data = $state<WeatherData | null>(null);
  let error = $state(false);

  async function load() {
    error = false;
    try {
      const { lat, lon } = await getCoords();
      data = await fetchWeather(lat, lon, true);
    } catch {
      error = true;
    }
  }

  $effect(() => {
    void load();
    const t = setInterval(load, 60 * 60 * 1000); // refresh hourly, nothing jittery
    return () => clearInterval(t);
  });

  let today = $derived(data?.daily?.[0] ?? null);
</script>

<div class="weather">
  {#if error}
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
  {/if}
</div>

<style>
  .weather {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1em;
    text-align: center;
  }
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
</style>
