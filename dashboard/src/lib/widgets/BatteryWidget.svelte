<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  // null while loading, false once we know the API is unavailable / rejected.
  let level = $state<number | null>(null); // 0..1
  let charging = $state(false);
  let unavailable = $state(false);

  $effect(() => {
    let alive = true;
    let battery: BatteryManager | null = null;

    // Sync local reactive state from the BatteryManager.
    const sync = () => {
      if (!alive || !battery) return;
      level = battery.level;
      charging = battery.charging;
    };

    if (typeof navigator === 'undefined' || !navigator.getBattery) {
      unavailable = true;
    } else {
      navigator
        .getBattery()
        .then((b) => {
          if (!alive) return;
          battery = b;
          sync();
          // Live updates: percentage + plug state.
          b.addEventListener('levelchange', sync);
          b.addEventListener('chargingchange', sync);
        })
        .catch(() => {
          if (alive) unavailable = true;
        });
    }

    return () => {
      alive = false;
      if (battery) {
        battery.removeEventListener('levelchange', sync);
        battery.removeEventListener('chargingchange', sync);
      }
    };
  });

  // Percentage as a whole number for display + fill geometry.
  let percent = $derived(level === null ? 0 : Math.round(level * 100));

  // Apple-style state color: green high, amber mid, red low.
  let fillColor = $derived(
    percent > 50 ? '#34c759' : percent >= 20 ? '#ff9f0a' : '#ff453a'
  );
</script>

<div class="battery" aria-label="Battery status">
  {#if unavailable}
    <div class="state text-secondary">
      <Icon name="battery" size={30} strokeWidth={1.6} />
      <span>Battery unavailable</span>
    </div>
  {:else if level === null}
    <!-- Loading: keep layout stable with a faint glyph. -->
    <div class="state text-tertiary">
      <Icon name="battery" size={30} strokeWidth={1.6} />
    </div>
  {:else}
    <div class="head">
      <div class="pct text-display tabular">{percent}<span class="unit">%</span></div>
      {#if charging}
        <div class="charging" style:color={fillColor} aria-label="Charging">
          <Icon name="bolt" size={16} strokeWidth={1.6} />
          <span>Charging</span>
        </div>
      {/if}
    </div>

    <!-- Horizontal battery glyph that fills proportionally. -->
    <div
      class="glyph"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Battery {percent} percent{charging ? ', charging' : ''}"
    >
      <div class="body">
        <div class="fill" style:width="{percent}%" style:background={fillColor}></div>
        {#if charging}
          <div class="bolt-overlay"><Icon name="bolt" size={20} strokeWidth={1.4} /></div>
        {/if}
      </div>
      <div class="cap" style:background={fillColor}></div>
    </div>
  {/if}
</div>

<style>
  .battery {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(var(--space-2), 4cqh, var(--space-4));
    container-type: size;
  }
  .state {
    flex: 1;
    display: grid;
    place-items: center;
    gap: var(--space-2);
    text-align: center;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .head {
    width: 100%;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-2);
  }
  .pct {
    font-size: clamp(1.8rem, 22cqmin, 3.4rem);
    line-height: 1;
    font-weight: 600;
  }
  .unit {
    font-size: 0.5em;
    font-weight: 500;
    color: var(--text-secondary);
    margin-left: 1px;
  }
  .charging {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  /* Horizontal battery glyph: rounded body + a small terminal cap. */
  .glyph {
    display: flex;
    align-items: center;
    gap: 3px;
    width: 100%;
  }
  .body {
    position: relative;
    flex: 1;
    height: clamp(1.4rem, 16cqmin, 2.6rem);
    border-radius: var(--radius-sm);
    background: var(--control-fill);
    box-shadow: inset 0 0 0 1.5px var(--hairline);
    overflow: hidden;
  }
  .fill {
    position: absolute;
    inset: 2px auto 2px 2px;
    border-radius: calc(var(--radius-sm) - 3px);
    transition:
      width var(--dur-base) var(--ease-smooth),
      background var(--dur-base) var(--ease-smooth);
  }
  .bolt-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: rgba(255, 255, 255, 0.92);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  .cap {
    width: 4px;
    height: 38%;
    border-radius: 0 2px 2px 0;
    opacity: 0.85;
  }
</style>
