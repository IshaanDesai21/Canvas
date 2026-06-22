<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const today = new Date();

  // Month being viewed, expressed as a signed offset from the current month.
  let offset = $state(0);

  // The first-of-month date for the viewed month.
  let viewed = $derived(new Date(today.getFullYear(), today.getMonth() + offset, 1));
  let year = $derived(viewed.getFullYear());
  let month = $derived(viewed.getMonth());

  // Leading blanks (0=Sunday) + day numbers for the grid.
  let leading = $derived(new Date(year, month, 1).getDay());
  let daysInMonth = $derived(new Date(year, month + 1, 0).getDate());
  let cells = $derived([
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
</script>

<div class="calendar">
  <header class="head">
    <div class="title">
      <span class="month">{MONTHS[month]}</span>
      <span class="year text-tertiary tabular">{year}</span>
    </div>
    <div class="nav">
      <button
        class="control nav-btn"
        aria-label="Previous month"
        onclick={() => (offset -= 1)}
      >
        <Icon name="chevronright" size={16} />
      </button>
      <button
        class="control nav-btn"
        aria-label="Next month"
        onclick={() => (offset += 1)}
      >
        <Icon name="chevronright" size={16} />
      </button>
    </div>
  </header>

  <div class="weekdays text-tertiary">
    {#each WEEKDAYS as wd, i (i)}
      <span>{wd}</span>
    {/each}
  </div>

  <div class="grid">
    {#each cells as day, i (i)}
      {#if day === null}
        <span class="cell empty" aria-hidden="true"></span>
      {:else}
        <span class="cell tabular" class:today={isToday(day)}>{day}</span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .calendar {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(var(--space-1), 2cqh, var(--space-3));
    container-type: size;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    display: flex;
    align-items: baseline;
    gap: 0.4ch;
  }
  .month {
    font-size: clamp(0.95rem, 6cqw, 1.15rem);
    font-weight: 600;
    color: var(--text-primary);
  }
  .year {
    font-size: clamp(0.8rem, 5cqw, 0.95rem);
    font-weight: 500;
  }
  .nav {
    display: flex;
    gap: var(--space-1);
  }
  .nav-btn {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
  }
  /* Flip the first chevron to point left (prev). */
  .nav-btn:first-child :global(svg) {
    transform: rotate(180deg);
  }

  .weekdays,
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
  }
  .weekdays {
    font-size: clamp(0.6rem, 3.4cqw, 0.72rem);
    font-weight: 600;
  }
  .grid {
    gap: clamp(1px, 0.8cqh, 4px) 0;
    flex: 1 1 auto;
    align-content: center;
  }
  .cell {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    margin: 0 auto;
    width: clamp(20px, 11cqw, 32px);
    height: clamp(20px, 11cqw, 32px);
    font-size: clamp(0.7rem, 4cqw, 0.9rem);
    color: var(--text-primary);
    border-radius: var(--radius-pill);
  }
  .cell.empty {
    visibility: hidden;
  }
  /* Today: filled accent circle, Apple-style. */
  .cell.today {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }
</style>
