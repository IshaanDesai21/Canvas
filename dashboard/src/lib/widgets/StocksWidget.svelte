<script lang="ts">
  /**
   * StocksWidget — an editable watchlist with inline sparklines.
   *
   * The ticker list is fully user-editable (add / remove) and persists per
   * widget instance. There is no reliable free, keyless, CORS-open real-time
   * quotes API, so prices/series are deterministic illustrative DEMO values
   * derived from the ticker symbol (stable across reloads). To wire in live
   * quotes, swap `quoteFor()` for a fetch (Finnhub / Alpha Vantage / Polygon —
   * all key-gated) following the WeatherWidget async + loading/error pattern.
   */
  import { untrack } from 'svelte';
  import type { WidgetInstance } from '$lib/types';
  import { layout } from '$stores/layout.svelte';
  import { ui } from '$stores/ui.svelte';
  import Icon from '$components/Icon.svelte';

  let { instance }: { instance: WidgetInstance } = $props();

  const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA'];

  // Editable, persisted ticker list.
  let tickers = $state<string[]>(
    untrack(() => {
      const saved = instance.settings?.tickers as string[] | undefined;
      return saved && saved.length ? [...saved] : [...DEFAULT_TICKERS];
    })
  );
  let draft = $state('');

  const editing = $derived(ui.editMode);

  function persist() {
    layout.setWidgetSettings(instance.id, { tickers: $state.snapshot(tickers) });
  }

  function addTicker() {
    const t = draft.trim().toUpperCase().replace(/[^A-Z.\-]/g, '');
    if (!t || tickers.includes(t)) {
      draft = '';
      return;
    }
    tickers.push(t);
    draft = '';
    persist();
  }

  function removeTicker(t: string) {
    tickers = tickers.filter((x) => x !== t);
    persist();
  }

  // ---- deterministic illustrative data -----------------------------------
  /** Small stable hash of a string → unsigned 32-bit int. */
  function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  type Quote = { price: number; change: number; series: number[] };

  /** A stable, ticker-derived placeholder quote + 16-point series. */
  function quoteFor(ticker: string): Quote {
    const seed = hash(ticker);
    // Seeded LCG so the same ticker always renders the same shape.
    let state = seed || 1;
    const rnd = () => {
      state = (Math.imul(state, 1664525) + 1013904259) >>> 0;
      return state / 4294967296;
    };
    const base = 40 + (seed % 460); // $40 .. $500
    const series: number[] = [];
    let v = base;
    for (let i = 0; i < 16; i++) {
      v += (rnd() - 0.48) * base * 0.02;
      series.push(v);
    }
    const price = series[series.length - 1];
    const change = ((price - series[0]) / series[0]) * 100;
    return { price, change, series };
  }

  // Sparkline geometry. Viewbox is fixed; the polyline is normalized to it.
  const SVG_W = 64;
  const SVG_H = 22;
  const PAD = 2;

  function sparkPoints(series: number[]): string {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (SVG_W - PAD * 2) / (series.length - 1);
    return series
      .map((val, i) => {
        const x = PAD + i * stepX;
        const y = PAD + (SVG_H - PAD * 2) * (1 - (val - min) / range);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const fmtPrice = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtChange = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
</script>

<div class="stocks">
  <header class="head">
    <div class="title">
      <Icon name="chart" size={16} strokeWidth={1.8} />
      <span>Stocks</span>
    </div>
    <span class="caption text-tertiary">Demo data</span>
  </header>

  <div class="rows scroll-area" role="list">
    {#each tickers as t (t)}
      {@const q = quoteFor(t)}
      {@const up = q.change >= 0}
      {@const color = up ? '#34c759' : '#ff3b30'}
      <div class="row" role="listitem">
        <div class="labels">
          <span class="ticker">{t}</span>
        </div>

        <svg class="spark" viewBox="0 0 {SVG_W} {SVG_H}" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={sparkPoints(q.series)}
            fill="none"
            stroke={color}
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <div class="figures">
          <span class="price tabular">{fmtPrice(q.price)}</span>
          <span class="change tabular" class:up class:down={!up} aria-label="{t} change {fmtChange(q.change)}">
            {fmtChange(q.change)}
          </span>
        </div>

        {#if editing}
          <button class="remove" aria-label="Remove {t}" onclick={() => removeTicker(t)}>
            <Icon name="xmark" size={13} strokeWidth={2.4} />
          </button>
        {/if}
      </div>
    {:else}
      <p class="empty text-tertiary">No tickers — add one below.</p>
    {/each}
  </div>

  {#if editing}
    <form class="add" onsubmit={(e) => { e.preventDefault(); addTicker(); }}>
      <input
        class="add-input selectable"
        type="text"
        bind:value={draft}
        placeholder="Add ticker (e.g. AMZN)"
        aria-label="Add stock ticker"
        maxlength="8"
        spellcheck="false"
        autocomplete="off"
      />
      <button class="add-btn control" type="submit" aria-label="Add ticker">
        <Icon name="plus" size={16} />
      </button>
    </form>
  {/if}
</div>

<style>
  .stocks {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    container-type: size;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .title {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  .caption {
    font-size: 0.68rem;
    font-weight: 500;
  }
  .rows {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: clamp(var(--space-1), 3cqh, var(--space-3));
    min-height: 0;
    overflow-y: auto;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--space-2);
  }
  .labels {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
  }
  .ticker {
    font-weight: 600;
    font-size: clamp(0.8rem, 6cqh, 0.95rem);
  }
  .spark {
    width: clamp(48px, 22cqw, 72px);
    height: clamp(18px, 11cqh, 26px);
    overflow: visible;
  }
  .figures {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
  }
  .price {
    font-weight: 600;
    font-size: clamp(0.8rem, 6cqh, 0.95rem);
  }
  .change {
    font-size: clamp(0.66rem, 4.5cqh, 0.78rem);
    font-weight: 600;
  }
  .change.up {
    color: #34c759;
  }
  .change.down {
    color: #ff3b30;
  }
  .remove {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-pill);
    color: var(--text-tertiary);
  }
  .remove:hover {
    background: var(--control-fill-active);
    color: #ff453a;
  }
  .empty {
    margin: auto;
    font-size: 0.85rem;
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
    text-transform: uppercase;
  }
  .add-input::placeholder {
    color: var(--text-tertiary);
    text-transform: none;
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
