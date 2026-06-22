/**
 * The ONE place to configure where the dashboard lives.
 *
 * Flip DEVELOPMENT to true to point new tabs at your local dev server, or
 * false to use the hosted production build. Nothing else needs to change —
 * the extension reads only from here.
 */

// Local SvelteKit dev server (`npm run dev`).
export const DEV_URL = 'http://localhost:5173';

// Hosted production dashboard (GitHub Pages / Cloudflare Pages, etc.).
export const PROD_URL = 'https://canvas.ftcblueprint.com';

// true  → new tabs open DEV_URL
// false → new tabs open PROD_URL
export const DEVELOPMENT = false;

/** The resolved target every new tab should open. */
export const TARGET_URL = DEVELOPMENT ? DEV_URL : PROD_URL;
