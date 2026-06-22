<script lang="ts">
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import { layout } from '$stores/layout.svelte';

  let { instance }: { instance: WidgetInstance } = $props();

  // Initialise from persisted settings, falling back to empty.
  let text = $state<string>(untrack(() => String(instance.settings?.text ?? '')));

  // Debounced autosave — avoids thrashing localStorage on every keystroke.
  // NOTE: rich-text / markdown rendering is a future enhancement; for now the
  // textarea stores and displays plain text.
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  function onInput() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      layout.setWidgetSettings(instance.id, { text });
    }, 400);
  }

  // Flush any pending save when the widget unmounts.
  $effect(() => {
    return () => {
      clearTimeout(saveTimer);
      layout.setWidgetSettings(instance.id, { text });
    };
  });

  let chars = $derived(text.length);
  let lines = $derived(text ? text.split('\n').length : 0);
</script>

<div class="notes">
  <header class="head">
    <span class="title">Notes</span>
    <span class="count text-tertiary tabular">
      {chars} chars · {lines} {lines === 1 ? 'line' : 'lines'}
    </span>
  </header>

  <textarea
    class="selectable scroll-area"
    aria-label="Note text"
    placeholder="Jot something down…"
    bind:value={text}
    oninput={onInput}
    spellcheck="true"
  ></textarea>
</div>

<style>
  .notes {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    container-type: size;
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .title {
    font-size: clamp(0.85rem, 6cqw, 1rem);
    font-weight: 600;
    color: var(--text-primary);
  }
  .count {
    font-size: 0.7rem;
    font-weight: 500;
    white-space: nowrap;
  }

  textarea {
    flex: 1;
    min-height: 0;
    width: 100%;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    /* Inherit the surrounding typography for a native, paper-like feel. */
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: clamp(0.85rem, 5cqh, 1rem);
    line-height: 1.55;
    overflow-y: auto;
  }
  textarea::placeholder {
    color: var(--text-tertiary);
  }
  textarea:focus {
    outline: none;
    box-shadow: none;
  }
</style>
