// The dashboard is a client-only SPA: every feature depends on the browser
// (localStorage, matchMedia, the Battery API, etc.), so we disable SSR and
// prerender just the static shell.
export const ssr = false;
export const prerender = true;
