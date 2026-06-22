import type { DockApp } from '$lib/types';
import { kv } from '$utils/storage';
import { uid } from '$utils/id';

const KEY = 'dock:v1';
const MIGRATION_KEY = 'dock:mig:2';

/** Default pinned sites mirroring the brief. */
const DEFAULT_DOCK: DockApp[] = [
  { id: uid('d'), label: 'GitHub', url: 'https://github.com', glyph: 'code', brand: 'github', color: ['#6e5494', '#24292e'] },
  { id: uid('d'), label: 'Discord', url: 'https://discord.com/app', glyph: 'chat', brand: 'discord', color: ['#7289da', '#5865f2'] },
  { id: uid('d'), label: 'YouTube', url: 'https://youtube.com', glyph: 'play', brand: 'youtube', color: ['#ff5b5b', '#ff0000'] },
  { id: uid('d'), label: 'Gmail', url: 'https://mail.google.com', glyph: 'mail', brand: 'gmail', color: ['#ea4335', '#fbbc05'] },
  { id: uid('d'), label: 'Spotify', url: 'https://open.spotify.com', glyph: 'music', brand: 'spotify', color: ['#1ed760', '#1db954'] },
  { id: uid('d'), label: 'Instagram', url: 'https://instagram.com', glyph: 'instagram', brand: 'instagram', color: ['#e1306c', '#f77737'] },
  { id: uid('d'), label: 'Calendar', url: 'https://calendar.google.com', glyph: 'calendar', brand: 'gcal', color: ['#ff3b30', '#ff9500'] },
  { id: uid('d'), label: 'VS Code', url: 'https://vscode.dev', glyph: 'code', brand: 'vscode', color: ['#23a9f2', '#0066b8'] }
];

/** Dock store: the user's pinned sites, persisted and reorderable. */
class DockStore {
  apps = $state<DockApp[]>(kv.get<DockApp[] | null>(KEY, null) ?? structuredClone(DEFAULT_DOCK));

  constructor() {
    // One-time cleanup for existing users: drop non-functional placeholder
    // apps (e.g. Finder, which a website can't open → url '#') and pin
    // Instagram if it isn't already there.
    if (!kv.get<boolean>(MIGRATION_KEY, false)) {
      let apps = this.apps.filter((a) => a.url && a.url !== '#');
      if (!apps.some((a) => /instagram\.com/i.test(a.url))) {
        apps = [
          ...apps,
          { id: uid('d'), label: 'Instagram', url: 'https://instagram.com', glyph: 'instagram', color: ['#e1306c', '#f77737'] }
        ];
      }
      this.apps = apps;
      kv.set(MIGRATION_KEY, true);
    }

    $effect.root(() => {
      $effect(() => {
        kv.set(KEY, $state.snapshot(this.apps));
      });
    });
  }

  add(app: Omit<DockApp, 'id'>) {
    this.apps = [...this.apps, { ...app, id: uid('d') }];
  }

  remove(id: string) {
    this.apps = this.apps.filter((a) => a.id !== id);
  }

  reset() {
    this.apps = structuredClone(DEFAULT_DOCK);
  }
}

export const dock = new DockStore();
