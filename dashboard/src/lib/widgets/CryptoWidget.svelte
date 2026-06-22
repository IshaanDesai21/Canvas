<script lang="ts">
  /**
   * CryptoWidget — live BTC / ETH / SOL spot prices from CoinGecko's free,
   * keyless `simple/price` endpoint. Refreshes every 60s and degrades to a
   * graceful "Unavailable" state if the network is down. Follows the
   * WeatherWidget async + loading/error pattern.
   */
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  // The coins we track. `id` is the CoinGecko id; `symbol`/`name` are display.
  const COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' }
  ] as const;

  type Quote = { usd: number; change: number };
  type Quotes = Record<string, Quote>;

  let quotes = $state<Quotes | null>(null);
  let error = $state(false);

  const URL =
    'https://api.coingecko.com/api/v3/simple/price' +
    '?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';

  // Fetch + 60s polling. AbortController + alive guard ensure clean teardown.
  $effect(() => {
    let alive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(URL, { signal: controller.signal });
        if (!res.ok) throw new Error('bad status');
        const json = await res.json();
        const next: Quotes = {};
        for (const c of COINS) {
          const row = json[c.id];
          if (!row) throw new Error('missing coin');
          next[c.id] = { usd: row.usd, change: row.usd_24h_change ?? 0 };
        }
        if (alive) {
          quotes = next;
          error = false;
        }
      } catch {
        // Ignore aborts; only surface real failures (and only if we have no data).
        if (alive && !controller.signal.aborted && !quotes) error = true;
      }
    };

    load();
    const t = setInterval(load, 60_000);

    return () => {
      alive = false;
      controller.abort();
      clearInterval(t);
    };
  });

  const fmtPrice = (n: number) =>
    n.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: n >= 100 ? 0 : 2
    });
  const fmtChange = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
</script>

<div class="crypto">
  {#if error}
    <div class="state text-secondary">
      <Icon name="coins" size={28} strokeWidth={1.6} />
      <span>Crypto unavailable</span>
    </div>
  {:else if !quotes}
    <!-- Loading shimmer: one ghost row per coin -->
    <div class="rows" aria-busy="true" aria-label="Loading crypto prices">
      {#each COINS as c (c.id)}
        <div class="row">
          <span class="shimmer ghost ghost-coin"></span>
          <span class="shimmer ghost ghost-price"></span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="rows" role="list">
      {#each COINS as c (c.id)}
        {@const q = quotes[c.id]}
        {@const up = q.change >= 0}
        <div class="row" role="listitem">
          <div class="coin">
            <span class="coin-icon"><Icon name="coins" size={18} strokeWidth={1.6} /></span>
            <div class="labels">
              <span class="sym">{c.symbol}</span>
              <span class="name text-tertiary">{c.name}</span>
            </div>
          </div>
          <div class="figures">
            <span class="price tabular">{fmtPrice(q.usd)}</span>
            <span
              class="change tabular"
              class:up
              class:down={!up}
              aria-label="{c.name} 24 hour change {fmtChange(q.change)}"
            >
              <Icon name={up ? 'arrowup' : 'arrowdown'} size={12} strokeWidth={2.4} />
              {fmtChange(q.change)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .crypto {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    container-type: size;
  }
  .state {
    flex: 1;
    display: grid;
    place-items: center;
    gap: var(--space-2);
    font-size: 0.9rem;
  }
  .rows {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: clamp(var(--space-2), 4cqh, var(--space-4));
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .coin {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .coin-icon {
    display: grid;
    place-items: center;
    width: clamp(1.6rem, 12cqh, 2rem);
    height: clamp(1.6rem, 12cqh, 2rem);
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    flex: 0 0 auto;
  }
  .labels {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
  }
  .sym {
    font-weight: 600;
    font-size: clamp(0.85rem, 7cqh, 1rem);
  }
  .name {
    font-size: clamp(0.68rem, 5cqh, 0.78rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .figures {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
  }
  .price {
    font-weight: 600;
    font-size: clamp(0.85rem, 7cqh, 1rem);
  }
  .change {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: clamp(0.68rem, 5cqh, 0.8rem);
    font-weight: 600;
  }
  .change.up {
    color: #34c759;
  }
  .change.down {
    color: #ff3b30;
  }

  /* Loading ghosts */
  .ghost {
    display: block;
    height: clamp(1.6rem, 12cqh, 2rem);
    border-radius: var(--radius-sm);
    background-color: var(--control-fill);
  }
  .ghost-coin {
    width: 45%;
  }
  .ghost-price {
    width: 30%;
  }
</style>
