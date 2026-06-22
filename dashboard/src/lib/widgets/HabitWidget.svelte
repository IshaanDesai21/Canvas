<script lang="ts">
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';
  import { layout } from '$stores/layout.svelte';

  let { instance }: { instance: WidgetInstance } = $props();

  /** A habit stores the ISO (YYYY-MM-DD) dates on which it was completed. */
  interface Habit {
    name: string;
    days: string[];
  }

  const DEFAULT_HABITS: Habit[] = [
    { name: 'Read', days: [] },
    { name: 'Workout', days: [] }
  ];

  // ---- date helpers ------------------------------------------------------
  /** Local-date ISO key (YYYY-MM-DD), avoiding timezone drift from toISOString. */
  function iso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function addDays(d: Date, n: number): Date {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
  }

  // Monday as the start of the current week.
  const today = new Date();
  const todayIso = iso(today);
  const mondayOffset = (today.getDay() + 6) % 7; // 0 if Monday .. 6 if Sunday
  const monday = addDays(today, -mondayOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return {
      iso: iso(d),
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' })
    };
  });

  // ---- persisted state ---------------------------------------------------
  let habits = $state<Habit[]>(
    untrack(() => structuredClone((instance.settings?.habits as Habit[]) ?? DEFAULT_HABITS))
  );
  let draft = $state('');

  function persist() {
    layout.setWidgetSettings(instance.id, { habits: $state.snapshot(habits) });
  }

  /** Current streak: consecutive completed days ending today (or yesterday). */
  function streak(days: string[]): number {
    const set = new Set(days);
    let count = 0;
    // Allow the streak to "stand" through today even if today isn't ticked yet.
    let cursor = set.has(todayIso) ? new Date(today) : addDays(today, -1);
    if (!set.has(iso(cursor)) && !set.has(todayIso)) return 0;
    while (set.has(iso(cursor))) {
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  function toggle(habit: Habit, dayIso: string) {
    const at = habit.days.indexOf(dayIso);
    if (at >= 0) habit.days.splice(at, 1);
    else habit.days.push(dayIso);
    persist();
  }

  function addHabit() {
    const name = draft.trim();
    if (!name) return;
    habits.push({ name, days: [] });
    draft = '';
    persist();
  }

  function removeHabit(i: number) {
    habits.splice(i, 1);
    persist();
  }
</script>

<div class="habit">
  <div class="list scroll-area">
    {#each habits as habit, i (i)}
      <div class="row">
        <span class="name" title={habit.name}>{habit.name}</span>

        <div class="dots" role="group" aria-label="{habit.name} this week">
          {#each weekDays as d (d.iso)}
            {@const done = habit.days.includes(d.iso)}
            <button
              class="dot selectable"
              class:done
              class:today={d.iso === todayIso}
              onclick={() => toggle(habit, d.iso)}
              aria-pressed={done}
              aria-label="{habit.name} {d.iso} {done ? 'done' : 'not done'}"
            >
              <span class="day-label">{d.label}</span>
            </button>
          {/each}
        </div>

        <span class="streak" title="{streak(habit.days)} day streak">
          <Icon name="flame" size={14} />
          <span class="tabular">{streak(habit.days)}</span>
        </span>

        <button
          class="remove selectable"
          onclick={() => removeHabit(i)}
          aria-label="Remove {habit.name}"
        >
          <Icon name="xmark" size={13} />
        </button>
      </div>
    {/each}
  </div>

  <form
    class="add"
    onsubmit={(e) => {
      e.preventDefault();
      addHabit();
    }}
  >
    <input
      class="add-input"
      type="text"
      bind:value={draft}
      placeholder="New habit"
      aria-label="New habit name"
      maxlength="40"
    />
    <button class="add-btn control selectable" type="submit" aria-label="Add habit">
      <Icon name="plus" size={16} />
    </button>
  </form>
</div>

<style>
  .habit {
    height: 100%;
    width: 100%;
    container-type: size;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: clamp(var(--space-2), 3cqh, var(--space-4));
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: var(--space-2);
  }
  .name {
    font-size: clamp(0.8rem, 4cqh, 0.95rem);
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .dots {
    display: flex;
    gap: 6px;
  }
  .dot {
    --d: clamp(24px, 7cqh, 34px);
    width: var(--d);
    height: var(--d);
    border-radius: var(--radius-pill);
    border: 1.5px solid var(--control-fill-active);
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: grid;
    place-items: center;
    transition:
      background-color var(--dur-fast) var(--ease-smooth),
      border-color var(--dur-fast) var(--ease-smooth),
      transform var(--dur-fast) var(--ease-spring);
  }
  .dot:hover {
    transform: scale(1.12);
  }
  .dot.today {
    border-color: var(--accent-soft);
  }
  .dot.done {
    background: var(--accent);
    border-color: var(--accent);
  }
  .day-label {
    font-size: 0.62rem;
    line-height: 1;
    color: var(--text-tertiary);
    text-transform: uppercase;
    user-select: none;
  }
  .dot.done .day-label {
    color: #fff;
    opacity: 0.9;
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .streak :global(svg) {
    color: #ff9f0a;
  }
  .remove {
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-pill);
    opacity: 0;
    transition:
      opacity var(--dur-fast) var(--ease-smooth),
      color var(--dur-fast) var(--ease-smooth);
  }
  .row:hover .remove,
  .remove:focus-visible {
    opacity: 1;
  }
  .remove:hover {
    color: var(--text-primary);
  }
  .add {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  .add-input {
    flex: 1;
    min-width: 0;
    background: var(--control-fill);
    border: none;
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font: inherit;
    font-size: 0.85rem;
    color: var(--text-primary);
    outline: none;
    transition: background-color var(--dur-fast) var(--ease-smooth);
  }
  .add-input::placeholder {
    color: var(--text-tertiary);
  }
  .add-input:focus {
    background: var(--control-fill-active);
  }
  .add-btn {
    flex: 0 0 auto;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
  }
</style>
