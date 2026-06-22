// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface Error {}
    interface Locals {}
    interface PageData {}
    interface PageState {}
    interface Platform {}
  }

  // Battery Status API (not yet in the standard lib DOM typings).
  interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  }
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export {};
