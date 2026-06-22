<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import { layout } from '$stores/layout.svelte';
  import { uid } from '$utils/id';
  import Icon from '$components/Icon.svelte';
  import {
    googleTasksConfigured,
    isSignedIn,
    signIn,
    signOut,
    listTasks,
    addTask,
    toggleTask,
    type GTask
  } from '$utils/googleTasks';

  let { instance }: { instance: WidgetInstance } = $props();

  interface Task { id: string; text: string; done: boolean; }

  // svelte-ignore state_referenced_locally -- intentional one-time hydration
  let items = $state<Task[]>(((instance.settings?.items as Task[] | undefined) ?? []).map((t) => ({ ...t })));
  let draft = $state('');

  function save() {
    layout.setWidgetSettings(instance.id, { items: $state.snapshot(items) });
  }
  function add() {
    const text = draft.trim();
    if (!text) return;
    items = [...items, { id: uid('t'), text, done: false }];
    draft = '';
    save();
  }
  function toggle(id: string) {
    items = items.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    save();
  }
  function remove(id: string) {
    items = items.filter((t) => t.id !== id);
    save();
  }

  let remaining = $derived(items.filter((t) => !t.done).length);
  // Completed tasks sink to the bottom, like Google Tasks.
  let ordered = $derived([...items].sort((a, b) => Number(a.done) - Number(b.done)));

  /* ---- Google Tasks mode -------------------------------------------- */
  const configured = googleTasksConfigured();
  let connected = $state(configured && isSignedIn());
  let gItems = $state<GTask[]>([]);
  let loading = $state(false);
  let busy = $state(false);
  let error = $state('');

  let gRemaining = $derived(gItems.filter((t) => !t.done).length);
  let gOrdered = $derived([...gItems].sort((a, b) => Number(a.done) - Number(b.done)));

  async function refreshGoogle() {
    if (!connected) return;
    loading = true;
    error = '';
    try {
      gItems = await listTasks();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load tasks';
      // 401 clears the token inside the client; reflect sign-out in the UI.
      if (!isSignedIn()) connected = false;
    } finally {
      loading = false;
    }
  }

  async function connect() {
    error = '';
    try {
      await signIn();
      connected = true; // $effect triggers the initial load
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not connect';
    }
  }

  function disconnect() {
    signOut();
    connected = false;
    gItems = [];
    error = '';
  }

  async function gAdd() {
    const text = draft.trim();
    if (!text || busy) return;
    busy = true;
    error = '';
    try {
      await addTask(text);
      draft = '';
      await refreshGoogle();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not add task';
      if (!isSignedIn()) connected = false;
    } finally {
      busy = false;
    }
  }

  async function gToggle(id: string, done: boolean) {
    if (busy) return;
    busy = true;
    // Optimistic update; refresh re-syncs the truth.
    gItems = gItems.map((t) => (t.id === id ? { ...t, done } : t));
    try {
      await toggleTask(id, done);
      await refreshGoogle();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not update task';
      if (!isSignedIn()) connected = false;
      else await refreshGoogle();
    } finally {
      busy = false;
    }
  }

  $effect(() => {
    if (connected) refreshGoogle();
  });
</script>

<div class="tasks">
  <header>
    <div class="title">
      <span class="badge"><Icon name="check" size={14} strokeWidth={2.6} /></span>
      <h3>Tasks</h3>
    </div>
    {#if !configured}
      <button class="connect" title="Set GOOGLE_CLIENT_ID to enable" disabled>Connect</button>
    {:else if connected}
      <button class="connect active" onclick={disconnect} title="Disconnect Google Tasks">Disconnect</button>
    {:else}
      <button class="connect" onclick={connect} title="Connect Google Tasks">Connect Google Tasks</button>
    {/if}
  </header>

  {#if configured && connected}
    <!-- Google Tasks mode -->
    <div class="adder">
      <span class="plus"><Icon name="plus" size={16} strokeWidth={2.2} /></span>
      <input
        class="selectable" bind:value={draft} placeholder="Add a task"
        aria-label="Add a task" spellcheck="false" disabled={busy}
        onkeydown={(e) => { if (e.key === 'Enter') gAdd(); }}
      />
    </div>

    {#if error}
      <p class="err text-tertiary">{error}</p>
    {/if}

    <ul class="list scroll-area">
      {#each gOrdered as t (t.id)}
        <li class="task" class:done={t.done}>
          <button class="check" role="checkbox" aria-checked={t.done} aria-label={t.title} onclick={() => gToggle(t.id, !t.done)}>
            {#if t.done}<Icon name="check" size={13} strokeWidth={3} />{/if}
          </button>
          <span class="text selectable">{t.title}</span>
        </li>
      {:else}
        <li class="empty text-tertiary">
          {loading ? 'Loading…' : 'No Google tasks yet — add your first task.'}
        </li>
      {/each}
    </ul>

    {#if gItems.length}
      <footer class="text-tertiary">{gRemaining} remaining · {gItems.length - gRemaining} done</footer>
    {/if}
  {:else}
    <!-- Local / offline mode -->
    <div class="adder">
      <span class="plus"><Icon name="plus" size={16} strokeWidth={2.2} /></span>
      <input
        class="selectable" bind:value={draft} placeholder="Add a task"
        aria-label="Add a task" spellcheck="false"
        onkeydown={(e) => { if (e.key === 'Enter') add(); }}
      />
    </div>

    {#if configured && error}
      <p class="err text-tertiary">{error}</p>
    {/if}

    <ul class="list scroll-area">
      {#each ordered as t (t.id)}
        <li class="task" class:done={t.done}>
          <button class="check" role="checkbox" aria-checked={t.done} aria-label={t.text} onclick={() => toggle(t.id)}>
            {#if t.done}<Icon name="check" size={13} strokeWidth={3} />{/if}
          </button>
          <span class="text selectable">{t.text}</span>
          <button class="del" aria-label="Delete task" onclick={() => remove(t.id)}>
            <Icon name="xmark" size={13} strokeWidth={2.4} />
          </button>
        </li>
      {:else}
        <li class="empty text-tertiary">Nothing yet — add your first task.</li>
      {/each}
    </ul>

    {#if items.length}
      <footer class="text-tertiary">{remaining} remaining · {items.length - remaining} done</footer>
    {/if}
  {/if}
</div>

<style>
  .tasks { height: 100%; display: flex; flex-direction: column; gap: 10px; }
  header { display: flex; align-items: center; justify-content: space-between; }
  .title { display: flex; align-items: center; gap: 8px; }
  .badge { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; background: var(--accent); color: #fff; }
  h3 { margin: 0; font-size: 1rem; font-weight: 600; }
  .connect { font-size: 11px; padding: 3px 9px; border-radius: 999px; background: var(--control-fill); color: var(--text-secondary); cursor: pointer; transition: background var(--dur-fast), color var(--dur-fast); }
  .connect:hover:not(:disabled) { color: var(--text-primary); }
  .connect:disabled { opacity: 0.7; cursor: default; }
  .connect.active { color: var(--accent); }
  .err { font-size: 0.72rem; padding: 0 4px; color: var(--text-tertiary); }

  .adder { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--radius-sm); background: var(--control-fill); }
  .adder .plus { color: var(--accent); display: grid; place-items: center; }
  .adder input { flex: 1; background: none; border: none; outline: none; font-size: 0.92rem; min-width: 0; }
  /* No focus halo around the inline add-task field. */
  .adder input:focus,
  .adder input:focus-visible { outline: none; box-shadow: none; }

  .list { flex: 1; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .task { display: flex; align-items: center; gap: 10px; padding: 7px 4px; border-bottom: 1px solid var(--hairline); }
  .task:last-child { border-bottom: none; }
  .check {
    flex-shrink: 0; width: 20px; height: 20px; border-radius: 999px; display: grid; place-items: center;
    box-shadow: inset 0 0 0 1.7px var(--text-tertiary); color: #fff;
    transition: background var(--dur-fast), box-shadow var(--dur-fast);
  }
  .task.done .check { background: var(--accent); box-shadow: inset 0 0 0 1.7px var(--accent); }
  .text { flex: 1; font-size: 0.92rem; line-height: 1.3; word-break: break-word; }
  .task.done .text { color: var(--text-tertiary); text-decoration: line-through; }
  .del { flex-shrink: 0; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; color: var(--text-tertiary); opacity: 0; transition: opacity var(--dur-fast); }
  .task:hover .del { opacity: 1; }
  .del:hover { background: var(--control-fill); color: var(--text-primary); }
  .empty { padding: 14px 4px; font-size: 0.85rem; }
  footer { font-size: 0.75rem; padding-top: 2px; }
</style>
