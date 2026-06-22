<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  // A small curated set of elegant, evergreen quotes.
  const QUOTES: { text: string; author: string }[] = [
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Whatever you are, be a good one.', author: 'Abraham Lincoln' },
    { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
    { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
    { text: 'What we think, we become.', author: 'Buddha' },
    { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
    { text: 'Less, but better.', author: 'Dieter Rams' },
    { text: 'Make each day your masterpiece.', author: 'John Wooden' },
    { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
    { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
    { text: 'Creativity is intelligence having fun.', author: 'Albert Einstein' },
    { text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
    { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' }
  ];

  /** Day-of-year (1..366) so the daily pick is stable for a calendar day. */
  function dayOfYear(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    return Math.floor(diff / 86_400_000);
  }

  // Deterministic daily index; refresh sets a local override.
  const dailyIndex = dayOfYear(new Date()) % QUOTES.length;
  let override = $state<number | null>(null);
  let index = $derived(override ?? dailyIndex);
  let quote = $derived(QUOTES[index]);

  /** Cycle to a random *different* quote. */
  function refresh() {
    if (QUOTES.length < 2) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * QUOTES.length);
    override = next;
  }
</script>

<div class="quote">
  <div class="mark" aria-hidden="true"><Icon name="quote" size={28} /></div>
  <div class="body">
    <p class="text text-display">{quote.text}</p>
    <p class="author text-secondary">&mdash; {quote.author}</p>
  </div>
  <button class="refresh control selectable" onclick={refresh} aria-label="New quote">
    <Icon name="refresh" size={16} />
  </button>
</div>

<style>
  .quote {
    height: 100%;
    width: 100%;
    container-type: size;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(var(--space-1), 2cqmin, var(--space-3));
    position: relative;
    text-align: center;
  }
  .mark {
    color: var(--accent);
    opacity: 0.35;
    display: inline-flex;
  }
  .mark :global(svg) {
    width: clamp(22px, 10cqmin, 40px);
    height: clamp(22px, 10cqmin, 40px);
  }
  .body {
    min-width: 0; /* allow truncation in narrow widgets */
    max-width: 100%;
  }
  .text {
    font-weight: 500;
    font-size: clamp(1rem, 6cqmin, 1.7rem);
    line-height: 1.4;
    /* Graceful truncation when the widget is short. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
  .author {
    margin-top: var(--space-1);
    font-size: clamp(0.75rem, 3cqh, 0.95rem);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .refresh {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    opacity: 0;
    transition:
      opacity var(--dur-fast) var(--ease-smooth),
      background-color var(--dur-fast) var(--ease-smooth);
  }
  .quote:hover .refresh,
  .refresh:focus-visible {
    opacity: 1;
  }
</style>
