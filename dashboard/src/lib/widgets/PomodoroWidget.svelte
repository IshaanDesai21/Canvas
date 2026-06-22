<script lang="ts">
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';
  import { layout } from '$stores/layout.svelte';
  import { formatDuration } from '$utils/time';

  let { instance }: { instance: WidgetInstance } = $props();

  type Mode = 'focus' | 'break';
  const DURATIONS: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };

  // Completed focus sessions persist across reloads.
  let sessions = $state<number>(untrack(() => Number(instance.settings?.sessions ?? 0)));

  let mode = $state<Mode>('focus');
  let remaining = $state<number>(DURATIONS.focus);
  let running = $state(false);

  let total = $derived(DURATIONS[mode]);
  let label = $derived(formatDuration(remaining));
  // Fraction of time elapsed, 0..1, drives the ring.
  let progress = $derived(total > 0 ? (total - remaining) / total : 0);

  // SVG ring geometry.
  const R = 52;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  let dashOffset = $derived(CIRCUMFERENCE * (1 - progress));
  let ringColor = $derived(mode === 'focus' ? 'var(--accent)' : '#30d158');

  function switchMode(next: Mode) {
    mode = next;
    remaining = DURATIONS[next];
    running = false;
  }

  function toggle() {
    running = !running;
  }

  function reset() {
    running = false;
    remaining = DURATIONS[mode];
  }

  function completeSession() {
    if (mode === 'focus') {
      sessions += 1;
      layout.setWidgetSettings(instance.id, { sessions });
      // Auto-switch into a break after a completed focus block.
      switchMode('break');
    } else {
      switchMode('focus');
    }
    // Stay paused so the user consciously starts the next block.
    running = false;
  }

  // Countdown driver — ticks once a second while running, cleans up on stop.
  $effect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (remaining <= 1) {
        remaining = 0;
        completeSession();
      } else {
        remaining -= 1;
      }
    }, 1000);
    return () => clearInterval(t);
  });
</script>

<div class="pomodoro">
  <!-- Mode toggle (segmented control) -->
  <div class="segmented" role="tablist" aria-label="Timer mode">
    <button
      class="seg"
      class:active={mode === 'focus'}
      role="tab"
      aria-selected={mode === 'focus'}
      onclick={() => switchMode('focus')}
    >
      Focus
    </button>
    <button
      class="seg"
      class:active={mode === 'break'}
      role="tab"
      aria-selected={mode === 'break'}
      onclick={() => switchMode('break')}
    >
      Break
    </button>
  </div>

  <!-- Progress ring with countdown -->
  <div class="ring-wrap">
    <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle
        class="fill"
        cx="60"
        cy="60"
        r={R}
        stroke={ringColor}
        stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={dashOffset}
      />
    </svg>
    <div class="readout">
      <span class="time text-display tabular">{label}</span>
      <span class="mode-label text-tertiary">{mode === 'focus' ? 'Focus' : 'Break'}</span>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <button
      class="ctrl primary"
      aria-label={running ? 'Pause timer' : 'Start timer'}
      onclick={toggle}
    >
      <Icon name={running ? 'pause' : 'play'} size={20} />
    </button>
    <button class="ctrl" aria-label="Reset timer" onclick={reset}>
      <Icon name="refresh" size={18} />
    </button>
  </div>

  <!-- Completed focus sessions -->
  <div class="sessions" aria-label="{sessions} completed focus sessions">
    <Icon name="flame" size={14} />
    <span class="tabular">×{sessions}</span>
  </div>
</div>

<style>
  .pomodoro {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(6px, 2.5cqh, 12px);
  }

  .segmented {
    display: inline-flex;
    padding: 2px;
    border-radius: var(--radius-pill);
    background: var(--control-fill);
  }
  .seg {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.25rem 0.85rem;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition:
      background-color var(--dur-fast) var(--ease-smooth),
      color var(--dur-fast) var(--ease-smooth);
  }
  .seg.active {
    background: var(--glass-fill-strong);
    color: var(--text-primary);
    box-shadow: 0 1px 2px var(--glass-edge-shadow);
  }

  /* The ring grows to fill the space left between the toggle and controls,
     so the timer fills its widget instead of floating in an empty box. */
  .ring-wrap {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    display: grid;
    place-items: center;
  }
  .ring {
    height: 100%;
    max-height: 100%;
    aspect-ratio: 1;
    max-width: 100%;
    transform: rotate(-90deg);
  }
  .fill {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset var(--dur-base) var(--ease-smooth);
  }
  .readout {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
  }
  .time {
    font-size: clamp(1.4rem, 14cqh, 2.1rem);
    font-weight: 600;
    line-height: 1;
  }
  .mode-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .controls {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
  .ctrl {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--control-fill);
    color: var(--text-primary);
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-smooth), transform var(--dur-fast) var(--ease-spring);
  }
  .ctrl:hover { background: var(--control-fill-active); }
  .ctrl:active { transform: scale(0.92); }
  .ctrl.primary {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .ctrl.primary:hover {
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .sessions {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>
