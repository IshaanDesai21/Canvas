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

  // Google Calendar / Apple Calendar integration ready — replace this stub
  // with real fetched events keyed to the viewed day. Shape kept intentionally
  // simple so the integration layer can map onto it directly.
  const events = [
    { id: 'e1', title: 'Design Review', time: '10:30 AM', color: 'var(--accent)' },
    { id: 'e2', title: 'Lunch with Sam', time: '12:30 PM', color: '#ff9f0a' },
    { id: 'e3', title: 'Gym', time: '6:00 PM', color: '#30d158' }
  ];
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

  <section class="upcoming">
    <h3 class="up-title text-tertiary">Upcoming</h3>
    <ul class="events">
      {#each events as ev (ev.id)}
        <li class="event">
          <span class="dot" style:background={ev.color}></span>
          <span class="ev-title">{ev.title}</span>
          <span class="ev-time text-tertiary tabular">{ev.time}</span>
        </li>
      {/each}
    </ul>
  </section>
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
    flex: 0 0 auto;
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

  .upcoming {
    margin-top: auto;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--space-2);
    overflow: hidden;
  }
  .up-title {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .events {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    overflow-y: auto;
    min-height: 0;
  }
  .event {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.8rem;
  }
  .dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: var(--radius-pill);
  }
  .ev-title {
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ev-time {
    margin-left: auto;
    font-size: 0.74rem;
    flex: 0 0 auto;
  }
</style>
