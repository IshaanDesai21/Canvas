<script lang="ts">
  /** Glass range slider with a tinted fill. */
  interface Props {
    value: number; min?: number; max?: number; step?: number; label?: string;
    format?: (v: number) => string;
  }
  let { value = $bindable(), min = 0, max = 1, step = 0.01, label, format }: Props = $props();
  let pct = $derived(((value - min) / (max - min)) * 100);
</script>

<label class="row">
  {#if label}<span class="lbl text-secondary">{label}</span>{/if}
  <span class="ctrl">
    <input type="range" {min} {max} {step} bind:value style="--pct:{pct}%" aria-label={label} />
    {#if format}<span class="val tabular text-secondary">{format(value)}</span>{/if}
  </span>
</label>

<style>
  .row { display: flex; flex-direction: column; gap: 6px; }
  .lbl { font-size: 13px; }
  .ctrl { display: flex; align-items: center; gap: 10px; }
  .val { font-size: 12px; min-width: 42px; text-align: right; }
  input[type='range'] {
    -webkit-appearance: none; appearance: none; flex: 1; height: 6px; border-radius: 999px;
    background: linear-gradient(to right, var(--accent) var(--pct), var(--control-fill) var(--pct));
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; border-radius: 999px; background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.35); transition: transform var(--dur-fast) var(--ease-spring);
  }
  input[type='range']::-webkit-slider-thumb:active { transform: scale(1.18); }
</style>
