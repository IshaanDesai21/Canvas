/**
 * Viewport store — tracks whether we're on a small (phone) screen so the UI
 * can adapt: on mobile the dashboard hides the search bar and dock and stacks
 * widgets into a single readable column.
 */
const MOBILE_QUERY = '(max-width: 680px)';

class ViewportStore {
  isMobile = $state(
    typeof matchMedia !== 'undefined' ? matchMedia(MOBILE_QUERY).matches : false
  );

  constructor() {
    if (typeof matchMedia !== 'undefined') {
      const mq = matchMedia(MOBILE_QUERY);
      mq.addEventListener('change', (e) => (this.isMobile = e.matches));
    }
  }
}

export const viewport = new ViewportStore();
