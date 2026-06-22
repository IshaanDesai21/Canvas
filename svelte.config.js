import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * The dashboard is a fully client-side SPA (it relies on localStorage and
 * browser-only APIs). We prerender the shell as a static file and let the
 * client take over — perfect for a Safari New Tab page served from disk.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
      precompress: false
    }),
    alias: {
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $widgets: 'src/lib/widgets',
      $layouts: 'src/lib/layouts',
      $stores: 'src/lib/stores',
      $utils: 'src/lib/utils'
    }
  }
};

export default config;
