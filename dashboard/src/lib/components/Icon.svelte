<script lang="ts" module>
  /**
   * Minimal SF-Symbols-inspired icon set: rounded, consistent 24px grid,
   * mostly stroke-based so they inherit `currentColor` and feel native.
   * Add new glyphs here so every surface shares one visual language.
   */
  export const ICONS: Record<string, string> = {
    magnifier: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="7" y="5" width="3.5" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    forward: '<path d="M5 5.5v13l9-6.5z" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none"/>',
    backward: '<path d="M19 5.5v13l-9-6.5z" fill="currentColor" stroke="none"/><rect x="5" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none"/>',
    code: '<path d="M9 8l-5 4 5 4M15 8l5 4-5 4"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/>',
    book: '<path d="M5 5a2 2 0 0 1 2-2h11v15H7a2 2 0 0 0-2 2z"/><path d="M5 5v14"/>',
    chat: '<path d="M5 5h14v10H9l-4 4z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>',
    music: '<path d="M9 18V6l10-2v10"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="14" r="2.5"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9h17M8 3v4M16 3v4"/>',
    note: '<path d="M5 4h9l5 5v11H5z"/><path d="M14 4v5h5"/>',
    finder: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M9 9v2M15 9v2M8.5 15c1.2 1.2 5.8 1.2 7 0"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r="1.05" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 10.5a3.5 3.5 0 0 1-.5 7z"/>',
    cloudrain: '<path d="M7 15a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 7.5a3.5 3.5 0 0 1-.5 7z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 13V9M9.5 2.5h5M19 6l1.5-1.5"/>',
    quote: '<path d="M9 7c-2.5 1-4 3-4 6h3v4H4v-4M19 7c-2.5 1-4 3-4 6h3v4h-4v-4"/>',
    battery: '<rect x="2.5" y="8" width="16" height="8" rx="2.5"/><path d="M21 11v2"/>',
    bolt: '<path d="M13 2L4 13h6l-1 9 9-11h-6z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17"/>',
    hourglass: '<path d="M7 4h10M7 20h10M8 4c0 4 8 4 8 8s-8 4-8 8M16 4c0 4-8 4-8 8s8 4 8 8"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h4M8 19h.01M12 19h.01"/>',
    flame: '<path d="M12 3c1 3 5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3 1.5-4 .8 1 2 1.2 2-1 0-1.5-.5-2.5 1.5-4z"/>',
    chart: '<path d="M4 19V5M4 19h16M8 16l3-4 3 2 4-6"/>',
    coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v5c0 1.4 2.2 2.5 5 2.5M14 11.5c2.8.3 5 1.4 5 2.5v3c0 1.4-2.2 2.5-5 2.5s-5-1.1-5-2.5v-3"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M18.9 5.1l-1.8 1.8M6.9 17.1l-1.8 1.8"/>',
    pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    xmark: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    command: '<path d="M9 9V7a2 2 0 1 0-2 2zM15 9h2a2 2 0 1 0-2-2zM9 15v2a2 2 0 1 1-2-2zM15 15h2a2 2 0 1 1-2 2zM9 9h6v6H9z"/>',
    sliders: '<path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2.2"/><circle cx="8" cy="16" r="2.2"/>',
    photo: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    chevronright: '<path d="M9 6l6 6-6 6"/>',
    chevrondown: '<path d="M6 9l6 6 6-6"/>',
    arrowup: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowdown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"/>',
    rss: '<path d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none"/><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/>',
    folder: '<path d="M3.5 6.5a2 2 0 0 1 2-2H9l2 2.5h7.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    pin: '<path d="M12 21v-7M8 3h8l-1 6 3 3H6l3-3z"/>'
  };
</script>

<script lang="ts">
  interface Props {
    name: string;
    size?: number;
    strokeWidth?: number;
    class?: string;
  }
  let { name, size = 22, strokeWidth = 1.8, class: klass = '' }: Props = $props();
  let path = $derived(ICONS[name] ?? ICONS.cube);
</script>

<svg
  class={klass}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {@html path}
</svg>
