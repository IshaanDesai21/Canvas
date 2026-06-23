import { kv } from '$utils/storage';

export type PomodoroMode = 'focus' | 'break';
export const DURATIONS: Record<PomodoroMode, number> = { focus: 25 * 60, break: 5 * 60 };

const KEY = 'pomodoro:v1';
const STORAGE_KEY = `mynewtab:${KEY}`;

interface Persisted {
  mode: PomodoroMode;
  running: boolean;
  /** Wall-clock ms when the current run ends (when running). */
  endsAt: number | null;
  /** Seconds left when paused / not yet started. */
  remaining: number;
  sessions: number;
}

function nowMs() {
  return Date.now();
}

function notify(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    // Same tag → the OS coalesces duplicates fired from multiple open tabs.
    new Notification(title, { body, tag: 'pomodoro-canvas', icon: '/favicon.svg' });
  } catch {
    /* notifications unavailable */
  }
}

/**
 * A single, app-wide Pomodoro timer. State is wall-clock based (we store the
 * absolute end time, not a ticking countdown) and persisted, so the timer keeps
 * running across tab closes/reopens and stays in sync between open tabs. When a
 * block finishes it fires a desktop notification.
 */
class PomodoroStore {
  mode = $state<PomodoroMode>('focus');
  running = $state(false);
  endsAt = $state<number | null>(null);
  remainingWhenPaused = $state(DURATIONS.focus);
  sessions = $state(0);

  // Drives the reactive countdown; updated on a timer + visibility/focus.
  private tick = $state(nowMs());
  private lastSaved = '';

  /** Seconds remaining right now. */
  remaining = $derived(
    this.running && this.endsAt != null
      ? Math.max(0, Math.round((this.endsAt - this.tick) / 1000))
      : this.remainingWhenPaused
  );

  total = $derived(DURATIONS[this.mode]);

  constructor() {
    this.hydrate(true);

    if (typeof window !== 'undefined') {
      // Stay in sync with the timer in other tabs.
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) this.hydrate(false);
      });
      // Recompute immediately when the tab becomes visible/focused again
      // (background tabs throttle timers, so the countdown could be stale).
      const refresh = () => (this.tick = nowMs());
      document.addEventListener('visibilitychange', refresh);
      window.addEventListener('focus', refresh);
    }

    $effect.root(() => {
      const id = setInterval(() => (this.tick = nowMs()), 250);

      // Fire completion exactly once when a running block hits zero.
      $effect(() => {
        if (this.running && this.remaining <= 0) this.complete(true);
      });

      // Persist whenever the real state (not the tick) changes.
      $effect(() => {
        const snap: Persisted = {
          mode: this.mode,
          running: this.running,
          endsAt: this.endsAt,
          remaining: this.remainingWhenPaused,
          sessions: this.sessions
        };
        const json = JSON.stringify(snap);
        if (json !== this.lastSaved) {
          this.lastSaved = json;
          kv.set(KEY, snap);
        }
      });

      return () => clearInterval(id);
    });
  }

  /** Load persisted state; `initial` allows resolving a block that ended while away. */
  private hydrate(initial: boolean) {
    const p = kv.get<Persisted | null>(KEY, null);
    if (!p) return;
    this.lastSaved = JSON.stringify(p);
    this.mode = p.mode;
    this.sessions = p.sessions;
    this.remainingWhenPaused = p.remaining;

    if (p.running && p.endsAt != null) {
      if (p.endsAt <= nowMs()) {
        // The block finished while this tab was closed/away.
        this.running = false;
        this.endsAt = null;
        // Only notify if it just happened (avoid stale alerts hours later) and
        // only on initial load (a sync event already reflects the other tab).
        this.applyCompletion(initial && nowMs() - p.endsAt < 120_000);
      } else {
        this.running = true;
        this.endsAt = p.endsAt;
      }
    } else {
      this.running = false;
      this.endsAt = null;
    }
  }

  /** Advance to the next block (focus → break → focus), counting focus sessions. */
  private applyCompletion(doNotify: boolean) {
    if (this.mode === 'focus') {
      this.sessions += 1;
      this.mode = 'break';
      this.remainingWhenPaused = DURATIONS.break;
      if (doNotify) notify('Focus complete 🎉', 'Nice work — time for a 5 minute break.');
    } else {
      this.mode = 'focus';
      this.remainingWhenPaused = DURATIONS.focus;
      if (doNotify) notify('Break over', 'Back to it — starting a new focus block.');
    }
    this.running = false;
    this.endsAt = null;
  }

  private complete(doNotify: boolean) {
    this.applyCompletion(doNotify);
  }

  toggle() {
    if (this.running) {
      // Pause: freeze the remaining seconds.
      this.remainingWhenPaused = this.remaining;
      this.running = false;
      this.endsAt = null;
    } else {
      // Start/resume: ask for notification permission the first time.
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
      const secs = this.remaining > 0 ? this.remaining : DURATIONS[this.mode];
      this.endsAt = nowMs() + secs * 1000;
      this.running = true;
    }
  }

  reset() {
    this.running = false;
    this.endsAt = null;
    this.remainingWhenPaused = DURATIONS[this.mode];
  }

  switchMode(next: PomodoroMode) {
    this.mode = next;
    this.running = false;
    this.endsAt = null;
    this.remainingWhenPaused = DURATIONS[next];
  }
}

export const pomodoro = new PomodoroStore();
