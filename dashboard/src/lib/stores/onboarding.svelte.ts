import { kv } from '$utils/storage';

const KEY = 'onboarded:v1';

/**
 * Tracks whether the first-run preference wizard has been completed. The flag
 * is persisted, so the wizard only appears on a brand-new install. "Reset to
 * defaults" clears it so the wizard runs again on the next visit.
 */
class OnboardingStore {
  done = $state(kv.get<boolean>(KEY, false));

  /** Mark onboarding finished (also used by "Skip"). */
  complete() {
    this.done = true;
    kv.set(KEY, true);
  }

  /**
   * Clear the flag so onboarding runs again the NEXT time the site opens —
   * without re-showing it in the current session.
   */
  restartNextVisit() {
    kv.remove(KEY);
  }
}

export const onboarding = new OnboardingStore();
