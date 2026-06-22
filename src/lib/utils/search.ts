import type { SearchProvider, SearchProviderId } from '$lib/types';

/** Built-in search providers. `keyword` lets users prefix a query, e.g. "yt cats". */
export const SEARCH_PROVIDERS: Record<SearchProviderId, SearchProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    template: 'https://www.google.com/search?q=%s',
    keyword: 'g',
    color: '#4285f4',
    icon: 'magnifier'
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    template: 'https://duckduckgo.com/?q=%s',
    keyword: 'ddg',
    color: '#de5833',
    icon: 'shield'
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    template: 'https://www.bing.com/search?q=%s',
    keyword: 'b',
    color: '#008373',
    icon: 'magnifier'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    template: 'https://www.youtube.com/results?search_query=%s',
    keyword: 'yt',
    color: '#ff0000',
    icon: 'play'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    template: 'https://github.com/search?q=%s',
    keyword: 'gh',
    color: '#8957e5',
    icon: 'code'
  },
  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia',
    template: 'https://en.wikipedia.org/w/index.php?search=%s',
    keyword: 'w',
    color: '#636466',
    icon: 'book'
  }
};

export const PROVIDER_LIST = Object.values(SEARCH_PROVIDERS);

/** Build a search URL for a provider + query. */
export function searchUrl(provider: SearchProvider, query: string): string {
  return provider.template.replace('%s', encodeURIComponent(query));
}

/** If a query starts with a known provider keyword, peel it off. */
export function detectProvider(
  query: string,
  fallback: SearchProviderId
): { provider: SearchProvider; query: string } {
  const [first, ...rest] = query.split(' ');
  const match = PROVIDER_LIST.find((p) => p.keyword === first.toLowerCase());
  if (match && rest.length) {
    return { provider: match, query: rest.join(' ') };
  }
  return { provider: SEARCH_PROVIDERS[fallback], query };
}

/**
 * Fetch autocomplete suggestions. Uses Google's public suggest endpoint via a
 * JSONP-friendly client fetch; on any failure we degrade to no suggestions so
 * the search bar always stays responsive.
 */
export async function fetchSuggestions(query: string, signal?: AbortSignal): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
      { signal }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1].slice(0, 6) : [];
  } catch {
    return [];
  }
}

/** A naive URL detector so users can type a domain and just go there. */
export function looksLikeUrl(input: string): string | null {
  const s = input.trim();
  if (/\s/.test(s)) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return `https://${s}`;
  return null;
}
