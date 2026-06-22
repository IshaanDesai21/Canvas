/**
 * Manifest V3 background service worker.
 *
 * Sole responsibility: when a blank/new tab appears, send it to the hosted
 * dashboard. The extension ships no dashboard code of its own — it is a thin
 * launcher, so updating the hosted site updates what users see with no rebuild.
 */
import { TARGET_URL } from './config.js';

// Works under both the standardized `browser` namespace (Safari/Firefox) and
// Chrome's `chrome` namespace.
const api = typeof browser !== 'undefined' ? browser : chrome;

// URLs that represent an empty / start / new tab across browsers. Anything
// else is a real page we must leave alone (so we never hijack navigation).
const BLANK_URLS = new Set([
  '',
  'about:blank',
  'about:newtab',
  'about:home',
  'about:favorites',
  'favorites://',
  'chrome://newtab/',
  'edge://newtab/'
]);

function isBlank(url) {
  if (!url) return true;
  if (BLANK_URLS.has(url)) return true;
  // Safari's Start Page is served from internal resource URLs.
  if (url.startsWith('safari-resource:') || url.startsWith('safari-web-extension:')) return true;
  return false;
}

/** Redirect a tab to the dashboard, but only if it's a blank/new tab. */
function maybeRedirect(tabId, url) {
  if (typeof tabId !== 'number') return;
  // TARGET_URL is a real URL, so it never counts as blank → no redirect loop.
  if (isBlank(url)) {
    api.tabs.update(tabId, { url: TARGET_URL });
  }
}

// A brand-new tab.
api.tabs.onCreated.addListener((tab) => {
  maybeRedirect(tab.id, tab.pendingUrl || tab.url);
});

// Some browsers create the tab first and only set the blank URL a tick later.
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    maybeRedirect(tabId, changeInfo.url ?? tab.url);
  }
});
