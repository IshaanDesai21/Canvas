<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';
  import { settings } from '$stores/settings.svelte';
  import { formatInZone } from '$utils/time';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  interface City {
    city: string;
    tz: string;
  }

  // Default world clock cities (could later be driven by instance.settings).
  const cities: City[] = [
    { city: 'Cupertino', tz: 'America/Los_Angeles' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' }
  ];

  let now = $state(new Date());
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(t);
  });

  /** Roughly day (6:00–18:00 local) in the given timezone, via Intl. */
  function isDay(date: Date, tz: string): boolean {
    try {
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: tz
        }).format(date)
      );
      return hour >= 6 && hour < 18;
    } catch {
      return true;
    }
  }
</script>

<div class="world">
  <div class="title text-secondary">
    <Icon name="globe" size={16} strokeWidth={1.7} />
    <span>World Clock</span>
  </div>

  <ul class="rows scroll-area" aria-label="World clock times">
    {#each cities as c (c.tz)}
      {@const day = isDay(now, c.tz)}
      <li class="row">
        <span class="city">{c.city}</span>
        <span class="indicator" class:day aria-hidden="true">
          <Icon name={day ? 'sun' : 'moon'} size={14} strokeWidth={1.7} />
        </span>
        <span class="time tabular">{formatInZone(now, c.tz, settings.current.clockFormat)}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .world {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    container-type: size;
  }
  .title {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.78rem;
    font-weight: 600;
  }
  .rows {
    flex: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: clamp(2px, 2cqh, var(--space-2));
    overflow-y: auto;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: var(--space-2);
    padding: clamp(2px, 3cqh, 7px) 0;
    font-size: clamp(0.82rem, 7cqh, 1rem);
  }
  .city {
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .indicator {
    display: inline-flex;
    color: var(--text-tertiary);
    transition: color var(--dur-base) var(--ease-smooth);
  }
  .indicator.day {
    color: #ffb340;
  }
  .time {
    font-weight: 600;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
</style>
