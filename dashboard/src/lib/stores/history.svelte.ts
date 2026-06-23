import { kv } from '$utils/storage';

const KEY = 'sitehistory:v1';

/**
 * Seed of commonly-visited sites so inline autocomplete is useful immediately,
 * before the user has built up their own history. Values are weights — the
 * user's own visits accrue more weight and rise above the seed over time.
 */
const SEED: Record<string, number> = {
  'google.com': 6, 'youtube.com': 6, 'gmail.com': 4, 'mail.google.com': 4,
  'github.com': 5, 'reddit.com': 4, 'x.com': 3, 'twitter.com': 2,
  'instagram.com': 4, 'facebook.com': 3, 'amazon.com': 4, 'netflix.com': 3,
  'wikipedia.org': 3, 'chatgpt.com': 5, 'openai.com': 2, 'claude.ai': 3,
  'stackoverflow.com': 3, 'linkedin.com': 3, 'discord.com': 4, 'twitch.tv': 3,
  'open.spotify.com': 3, 'maps.google.com': 3, 'drive.google.com': 3,
  'calendar.google.com': 2, 'docs.google.com': 2, 'notion.so': 2
};

/**
 * Tracks how often the user navigates to each host so the search bar can offer
 * browser-style inline autocomplete (type a prefix, the rest is filled in and
 * highlighted; Enter accepts).
 */
class HistoryStore {
  counts = $state<Record<string, number>>({ ...SEED, ...kv.get<Record<string, number>>(KEY, {}) });

  constructor() {
    $effect.root(() => {
      $effect(() => {
        kv.set(KEY, $state.snapshot(this.counts));
      });
    });
  }

  /** Record a visit to a host (strips a leading www.). */
  record(host: string) {
    const h = host.replace(/^www\./, '').trim().toLowerCase();
    if (!h || h.includes(' ')) return;
    this.counts = { ...this.counts, [h]: (this.counts[h] ?? 0) + 3 };
  }

  /**
   * Best completion for a typed prefix, or null. Matches a host that starts
   * with the prefix (most-visited wins). Skips multi-word input (a search,
   * not a URL).
   */
  complete(prefix: string): string | null {
    const p = prefix.replace(/^https?:\/\//i, '').trim().toLowerCase();
    if (!p || /\s/.test(p)) return null;
    let best: string | null = null;
    let bestScore = 0;
    for (const host in this.counts) {
      if (host.length > p.length && host.startsWith(p) && this.counts[host] > bestScore) {
        bestScore = this.counts[host];
        best = host;
      }
    }
    return best;
  }
}

export const history = new HistoryStore();
