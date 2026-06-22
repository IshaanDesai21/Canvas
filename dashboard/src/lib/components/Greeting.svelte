<script lang="ts">
  import { settings } from '$stores/settings.svelte';
  import { greetingFor, formatLongDate, formatClock } from '$utils/time';

  let now = $state(new Date());
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(t);
  });

  let greeting = $derived(greetingFor(now));
  let name = $derived(settings.current.name.trim());
</script>

{#if settings.current.greetingEnabled}
  <header class="greeting animate-in" aria-label="Greeting">
    <h1 class="text-display">
      {greeting}{#if name}, <span class="name">{name}</span>{/if}
    </h1>
    <p class="sub text-secondary tabular">
      {formatLongDate(now)} · {formatClock(now, settings.current.clockFormat)}
    </p>
  </header>
{/if}

<style>
  .greeting { text-align: center; }
  h1 { font-size: clamp(1.9rem, 4vw, 3rem); font-weight: 600; letter-spacing: -0.02em; margin: 0; text-shadow: 0 1px 24px rgba(0, 0, 0, 0.18); }
  .name { background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #ff2d55)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sub { margin: 0.4rem 0 0; font-size: clamp(0.95rem, 1.4vw, 1.15rem); font-weight: 500; }

  @media (max-width: 680px) {
    h1 { font-size: clamp(1.5rem, 7vw, 2rem); }
    .sub { font-size: 0.9rem; }
  }
</style>
