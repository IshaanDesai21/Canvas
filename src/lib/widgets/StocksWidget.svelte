<script lang="ts">
  /**
   * StocksWidget — a compact watchlist with inline sparklines.
   *
   * There is no reliable free, keyless real-time stock quotes API, so this
   * ships with curated DEMO data. To wire in live quotes, replace WATCHLIST
   * with a fetch (e.g. Finnhub / Alpha Vantage / Polygon — all key-gated) using
   * the same WeatherWidget async + loading/error pattern, and feed each row's
   * intraday closes into `series` for the sparkline.
   */
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  type Stock = {
    ticker: string;
    name: string;
    price: number;
    change: number; // 24h percent
    series: number[]; // ~16 points for the sparkline
  };

  // DEMO data — static, illustrative only.
  const WATCHLIST: Stock[] = [
    {
      ticker: 'AAPL',
      name: 'Apple',
      price: 212.44,
      change: 1.24,
      series: [205, 206, 204, 207, 208, 207, 209, 210, 209, 211, 210, 212, 211, 213, 212, 212.44]
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft',
      price: 448.12,
      change: 0.62,
      series: [443, 444, 442, 445, 446, 445, 447, 446, 448, 447, 449, 448, 450, 449, 448, 448.12]
    },
    {
      ticker: 'NVDA',
      name: 'NVIDIA',
      price: 124.88,
      change: -2.13,
      series: [131, 130, 129, 130, 128, 127, 128, 126, 127, 125, 126, 124, 125, 124, 125, 124.88]
    },
    {
      ticker: 'TSLA',
      name: 'Tesla',
      price: 248.5,
      change: -0.87,
      series: [252, 251, 253, 250, 251, 249, 250, 248, 249, 247, 249, 248, 250, 249, 248, 248.5]
    }
  ];

  // Sparkline geometry. Viewbox is fixed; the polyline is normalized to it.
  const SVG_W = 64;
  const SVG_H = 22;
  const PAD = 2;

  /** Map a stock's series to an SVG polyline `points` string. */
  function sparkPoints(series: number[]): string {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (SVG_W - PAD * 2) / (series.length - 1);
    return series
      .map((v, i) => {
        const x = PAD + i * stepX;
        // Invert Y: higher value -> lower y (toward the top).
        const y = PAD + (SVG_H - PAD * 2) * (1 - (v - min) / range);
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
    {#each WATCHLIST as s (s.ticker)}
      {@const up = s.change >= 0}
      {@const color = up ? '#34c759' : '#ff3b30'}
      <div class="row" role="listitem">
        <div class="labels">
          <span class="ticker">{s.ticker}</span>
          <span class="name text-tertiary">{s.name}</span>
        </div>

        <svg
          class="spark"
          viewBox="0 0 {SVG_W} {SVG_H}"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={sparkPoints(s.series)}
            fill="none"
            stroke={color}
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <div class="figures">
          <span class="price tabular">{fmtPrice(s.price)}</span>
          <span
            class="change tabular"
            class:up
            class:down={!up}
            aria-label="{s.name} change {fmtChange(s.change)}"
          >
            {fmtChange(s.change)}
          </span>
        </div>
      </div>
    {/each}
  </div>
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
  .name {
    font-size: clamp(0.66rem, 4.5cqh, 0.76rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
</style>
