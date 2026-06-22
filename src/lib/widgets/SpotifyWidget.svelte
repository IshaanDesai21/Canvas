<script lang="ts">
  /**
   * Now Playing — reflects the browser's active media via the standard
   * Media Session API (navigator.mediaSession). No accounts, no client IDs:
   * whatever media the browser is playing (and exposes metadata for) shows up
   * here. When nothing is playing it falls back to a calm placeholder.
   *
   * Note: browsers sandbox this to media the browser itself is playing — there
   * is no web API to read another native app's "now playing".
   */
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  interface Track { title: string; artist: string; art: string | null; playing: boolean; }
  let track = $state<Track | null>(null);

  function read(): Track | null {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return null;
    const meta = navigator.mediaSession.metadata;
    if (!meta || !meta.title) return null;
    const art = meta.artwork && meta.artwork.length ? meta.artwork[meta.artwork.length - 1].src : null;
    return {
      title: meta.title,
      artist: meta.artist || meta.album || '',
      art,
      playing: navigator.mediaSession.playbackState !== 'paused'
    };
  }

  // Media Session has no change event, so we poll lightly.
  $effect(() => {
    track = read();
    const t = setInterval(() => (track = read()), 1000);
    return () => clearInterval(t);
  });
</script>

<div class="np">
  {#if track}
    <div class="now">
      <div class="art" aria-hidden="true">
        {#if track.art}<img src={track.art} alt="" />{:else}<Icon name="music" size={26} />{/if}
      </div>
      <div class="meta">
        <span class="kicker text-tertiary">{track.playing ? 'Now Playing' : 'Paused'}</span>
        <span class="song">{track.title}</span>
        {#if track.artist}<span class="artist text-secondary">{track.artist}</span>{/if}
      </div>
      <div class="eq" class:on={track.playing} aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    </div>
  {:else}
    <div class="idle">
      <div class="logo"><Icon name="music" size={26} strokeWidth={1.7} /></div>
      <span class="prompt">Nothing playing</span>
      <span class="sub text-tertiary">Media you play in the browser appears here</span>
    </div>
  {/if}
</div>

<style>
  .np { height: 100%; width: 100%; display: flex; flex-direction: column; justify-content: center; container-type: size; }

  .now { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .art {
    flex: 0 0 auto; display: grid; place-items: center; overflow: hidden;
    width: clamp(3rem, 34cqmin, 5rem); aspect-ratio: 1; border-radius: var(--radius-md);
    background: linear-gradient(145deg, #5e5ce6, #bf5af2 60%, #ff375f); color: rgba(255,255,255,0.92);
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  }
  .art img { width: 100%; height: 100%; object-fit: cover; }
  .meta { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
  .kicker { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .song { font-weight: 600; font-size: clamp(0.95rem, 9cqmin, 1.3rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .artist { font-size: clamp(0.78rem, 6cqmin, 0.95rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Little animated equalizer when playing. */
  .eq { display: flex; align-items: flex-end; gap: 2px; height: 18px; margin-left: auto; }
  .eq i { width: 3px; height: 30%; border-radius: 2px; background: var(--accent); }
  .eq.on i { animation: eq 0.9s var(--ease-smooth) infinite; }
  .eq.on i:nth-child(2) { animation-delay: 0.2s; }
  .eq.on i:nth-child(3) { animation-delay: 0.45s; }
  .eq.on i:nth-child(4) { animation-delay: 0.15s; }
  @keyframes eq { 0%, 100% { height: 25%; } 50% { height: 95%; } }

  .idle { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; }
  .logo { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: var(--radius-md); background: linear-gradient(145deg, #5e5ce6, #bf5af2); color: #fff; box-shadow: 0 6px 18px rgba(94,92,230,0.32); }
  .prompt { font-weight: 600; font-size: 0.98rem; }
  .sub { font-size: 0.78rem; max-width: 24ch; }
</style>
