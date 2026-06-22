<script lang="ts">
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';
  import { layout } from '$stores/layout.svelte';
  import { daysUntil } from '$utils/time';

  let { instance }: { instance: WidgetInstance } = $props();

  /** Default target: the next January 1st. */
  function nextNewYear(): string {
    const now = new Date();
    const d = new Date(now.getFullYear() + 1, 0, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ---- persisted state ---------------------------------------------------
  let title = $state(untrack(() => (instance.settings?.title as string) ?? 'New Year'));
  let date = $state(untrack(() => (instance.settings?.date as string) ?? nextNewYear()));
  let editing = $state(false);

  // Parse the YYYY-MM-DD input as a *local* midnight so day math is intuitive.
  let target = $derived.by(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  });
  let days = $derived(daysUntil(target));

  let formatted = $derived(
    isNaN(target.getTime())
      ? ''
      : target.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
  );

  // Big number + caption, handling today / future / past.
  let bigNumber = $derived(days === 0 ? 'Today' : String(Math.abs(days)));
  let caption = $derived(
    days === 0 ? '' : days > 0 ? (Math.abs(days) === 1 ? 'day until' : 'days until') : Math.abs(days) === 1 ? 'day ago' : 'days ago'
  );

  // ---- persistence -------------------------------------------------------
  // Date is persisted immediately; the title input is debounced (~400ms).
  let titleTimer: ReturnType<typeof setTimeout> | undefined;
  function persistTitle() {
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => {
      layout.setWidgetSettings(instance.id, { title: title.trim() || 'Countdown' });
    }, 400);
  }
  $effect(() => () => clearTimeout(titleTimer));

  function persistDate() {
    layout.setWidgetSettings(instance.id, { date });
  }
</script>

<div class="countdown">
  <button
    class="edit selectable"
    onclick={() => (editing = !editing)}
    aria-label={editing ? 'Done editing' : 'Edit countdown'}
    aria-pressed={editing}
  >
    <Icon name="pencil" size={15} />
  </button>

  {#if editing}
    <div class="fields">
      <input
        class="field"
        type="text"
        bind:value={title}
        oninput={persistTitle}
        placeholder="Title"
        aria-label="Countdown title"
        maxlength="40"
      />
      <input
        class="field"
        type="date"
        bind:value={date}
        onchange={persistDate}
        aria-label="Target date"
      />
    </div>
  {:else}
    <div class="display">
      <div class="number text-display tabular">{bigNumber}</div>
      {#if caption}<div class="caption text-tertiary">{caption}</div>{/if}
      <div class="title">{title}</div>
      <div class="date text-tertiary">{formatted}</div>
    </div>
  {/if}
</div>

<style>
  .countdown {
    height: 100%;
    width: 100%;
    container-type: size;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-width: 0;
    max-width: 100%;
  }
  .number {
    color: var(--accent);
    font-weight: 600;
    font-size: clamp(2rem, 30cqmin, 5rem);
    line-height: 1;
  }
  .caption {
    font-size: clamp(0.7rem, 5cqh, 0.95rem);
    font-weight: 500;
    margin-top: 2px;
  }
  .title {
    margin-top: var(--space-2);
    font-size: clamp(0.95rem, 7cqh, 1.3rem);
    font-weight: 600;
    color: var(--text-primary);
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .date {
    margin-top: 2px;
    font-size: clamp(0.7rem, 4.5cqh, 0.9rem);
    font-weight: 500;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
    align-self: stretch;
  }
  .field {
    width: 100%;
    background: var(--control-fill);
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--text-primary);
    outline: none;
    transition: background-color var(--dur-fast) var(--ease-smooth);
  }
  .field::placeholder {
    color: var(--text-tertiary);
  }
  .field:focus {
    background: var(--control-fill-active);
  }
  .edit {
    position: absolute;
    top: 0;
    right: 0;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: var(--radius-pill);
    opacity: 0;
    transition:
      opacity var(--dur-fast) var(--ease-smooth),
      color var(--dur-fast) var(--ease-smooth),
      background-color var(--dur-fast) var(--ease-smooth);
  }
  .countdown:hover .edit,
  .edit:focus-visible,
  .edit[aria-pressed='true'] {
    opacity: 1;
  }
  .edit:hover {
    color: var(--text-primary);
    background: var(--control-fill);
  }
</style>
