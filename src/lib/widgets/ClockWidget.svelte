<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import { settings } from '$stores/settings.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  let now = $state(new Date());
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(t);
  });

  // Split time so the meridiem can be styled smaller, Apple-style.
  let parts = $derived.by(() => {
    const h24 = settings.current.clockFormat === '24h';
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    let suffix = '';
    if (!h24) {
      suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
    }
    return { time: `${h}:${m}`, suffix };
  });

  let weekday = $derived(now.toLocaleDateString(undefined, { weekday: 'long' }));
  let date = $derived(now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }));
</script>

<div class="clock">
  <span class="weekday">{weekday}</span>
  <div class="time text-display tabular">
    {parts.time}{#if parts.suffix}<span class="suffix">{parts.suffix}</span>{/if}
  </div>
  <span class="date text-secondary">{date}</span>
</div>

<style>
  .clock {
    height: 100%;
    width: 100%;
    container-type: size;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.15em;
  }
  .weekday {
    font-size: clamp(0.7rem, 8cqmin, 1rem);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .time {
    font-size: clamp(2rem, 30cqmin, 4.4rem);
    line-height: 0.95;
    font-weight: 600;
    display: flex;
    align-items: baseline;
    gap: 0.18em;
  }
  .suffix {
    font-size: 0.34em;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }
  .date {
    font-size: clamp(0.85rem, 9cqmin, 1.25rem);
    font-weight: 500;
  }
</style>
