<script lang="ts">
  /** iOS-style switch. */
  interface Props { checked: boolean; label?: string; onchange?: (v: boolean) => void; }
  let { checked = $bindable(), label, onchange }: Props = $props();
  function toggle() { checked = !checked; onchange?.(checked); }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  class="track"
  class:on={checked}
  onclick={toggle}
>
  <span class="knob"></span>
</button>

<style>
  .track {
    width: 44px; height: 26px; border-radius: 999px; padding: 2px;
    background: var(--control-fill); position: relative;
    transition: background var(--dur-fast) var(--ease-smooth);
  }
  .track.on { background: var(--accent); }
  .knob {
    display: block; width: 22px; height: 22px; border-radius: 999px; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(0);
    transition: transform var(--dur-base) var(--ease-spring);
  }
  .track.on .knob { transform: translateX(18px); }
</style>
