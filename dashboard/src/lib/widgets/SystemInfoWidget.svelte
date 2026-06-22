<script lang="ts">
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  // Minimal shape of the NetworkInformation API (not in standard DOM typings).
  interface NetworkInformation extends EventTarget {
    effectiveType?: string;
    downlink?: number;
  }

  const hasNav = typeof navigator !== 'undefined';

  // ---- static values (read once, stable for the session) ----------------
  function detectPlatform(): string | null {
    if (!hasNav) return null;
    const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
    if (uaData?.platform) return uaData.platform;
    if (navigator.platform) return navigator.platform;
    return null;
  }
  const platform = detectPlatform();

  // ---- dynamic values (polled / event-driven) ---------------------------
  let online = $state(hasNav ? navigator.onLine : true);
  let network = $state<string | null>(null);

  function readNetwork() {
    const conn = hasNav
      ? (navigator as unknown as { connection?: NetworkInformation }).connection
      : undefined;
    if (!conn) {
      network = null;
      return;
    }
    const type = conn.effectiveType ? conn.effectiveType.toUpperCase() : null;
    const down = typeof conn.downlink === 'number' ? `${conn.downlink} Mbps` : null;
    const text = [type, down].filter(Boolean).join(' · ');
    network = text || null;
  }

  function readOnline() {
    online = hasNav ? navigator.onLine : true;
  }

  $effect(() => {
    if (typeof window === 'undefined') return;

    // Initial read of the dynamic values.
    readNetwork();
    readOnline();

    // Poll the cheap, frequently-changing values every 2s.
    const poll = setInterval(() => {
      readNetwork();
      readOnline();
    }, 2000);

    // Also respond immediately to explicit online/offline + connection events.
    const onOnline = () => readOnline();
    const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    conn?.addEventListener('change', readNetwork);

    return () => {
      clearInterval(poll);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
      conn?.removeEventListener('change', readNetwork);
    };
  });

  // Honest, accurately-labelled stat rows. Rows with no real data are hidden.
  let rows = $derived(
    [
      network !== null ? { icon: 'globe', label: 'Network', value: network } : null,
      platform !== null ? { icon: 'finder', label: 'Platform', value: platform } : null,
      { icon: 'globe', label: 'Status', value: online ? 'Online' : 'Offline' }
    ].filter((r): r is { icon: string; label: string; value: string } => r !== null)
  );
</script>

<div class="sysinfo">
  <ul class="stats" aria-label="System information">
    {#each rows as s (s.label)}
      <li class="stat">
        <span class="ico text-tertiary"><Icon name={s.icon} size={16} strokeWidth={1.7} /></span>
        <span class="label text-secondary">{s.label}</span>
        <span class="value tabular" class:online={s.label === 'Status' && online}>{s.value}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .sysinfo {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    container-type: size;
  }
  .stats {
    flex: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: clamp(var(--space-1), 3cqh, var(--space-3));
  }
  .stat {
    display: grid;
    grid-template-columns: 1.4rem 1fr auto;
    align-items: center;
    gap: var(--space-2);
    font-size: clamp(0.8rem, 6.5cqh, 0.98rem);
  }
  .ico {
    display: inline-flex;
  }
  .label {
    font-weight: 500;
  }
  .value {
    font-weight: 600;
    color: var(--text-primary);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .value.online {
    color: var(--accent);
  }
</style>
