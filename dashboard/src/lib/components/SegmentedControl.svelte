<script lang="ts" generics="T extends string">
  /** macOS segmented control with a sliding glass highlight. */
  interface Option { value: T; label: string; }
  interface Props { value: T; options: Option[]; }
  let { value = $bindable(), options }: Props = $props();
  let index = $derived(Math.max(0, options.findIndex((o) => o.value === value)));
</script>

<div class="seg control" role="tablist" style="--n:{options.length}; --i:{index}">
  <span class="thumb"></span>
  {#each options as o (o.value)}
    <button
      type="button" role="tab" aria-selected={o.value === value}
      class:active={o.value === value} onclick={() => (value = o.value)}
    >{o.label}</button>
  {/each}
</div>

<style>
  .seg { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); padding: 3px; border-radius: var(--radius-sm); }
  .thumb {
    position: absolute; inset: 3px auto 3px 3px; width: calc((100% - 6px) / var(--n));
    border-radius: calc(var(--radius-sm) - 3px); background: var(--glass-fill-strong);
    box-shadow: 0 1px 3px rgba(0,0,0,0.18); transform: translateX(calc(var(--i) * 100%));
    transition: transform var(--dur-base) var(--ease-spring);
  }
  button { position: relative; z-index: 1; padding: 5px 10px; font-size: 13px; color: var(--text-secondary); border-radius: inherit; transition: color var(--dur-fast); }
  button.active { color: var(--text-primary); font-weight: 500; }
</style>
