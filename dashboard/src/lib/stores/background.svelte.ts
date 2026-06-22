import type { BackgroundConfig, GradientPreset } from '$lib/types';
import { blobStore, kv } from '$utils/storage';
import { uid } from '$utils/id';

const KEY = 'background:v1';

/** Curated gradient wallpapers, including a few animated ones. */
export const GRADIENTS: GradientPreset[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    css: 'linear-gradient(160deg, #0a0a0c 0%, #161618 55%, #1f1f23 100%)',
    animated: false
  },
  {
    id: 'monterey',
    name: 'Monterey',
    css: 'linear-gradient(160deg, #4b6cb7 0%, #182848 100%)',
    animated: false
  },
  {
    id: 'sunset',
    name: 'Sunset',
    css: 'linear-gradient(160deg, #ff9a9e 0%, #fad0c4 40%, #fbc2eb 100%)',
    animated: false
  },
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    animated: false
  },
  {
    id: 'graphite',
    name: 'Graphite',
    css: 'linear-gradient(160deg, #232526 0%, #414345 100%)',
    animated: false
  },
  {
    id: 'comfort',
    name: 'Comfort',
    css: 'linear-gradient(160deg, #f7efe1 0%, #ecdcc3 50%, #ddc6a6 100%)',
    animated: false
  },
  {
    id: 'sequoia',
    name: 'Sequoia',
    css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    animated: false
  },
  {
    id: 'tahoe',
    name: 'Tahoe Flow',
    css: 'linear-gradient(300deg, #5ac8fa, #007aff, #5856d6, #af52de)',
    animated: true
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    css: 'linear-gradient(300deg, #ff2d55, #ff9500, #ffcc00, #34c759, #5ac8fa)',
    animated: true
  }
];

const DEFAULT_BG: BackgroundConfig = {
  kind: 'gradient',
  gradientId: 'obsidian',
  imageId: null,
  videoId: null,
  blur: 0,
  dim: 0.12,
  saturation: 1,
  brightness: 1,
  parallax: true
};

/**
 * Background store. Owns the wallpaper configuration plus the live object URL
 * for the uploaded image (kept out of the persisted config — only the blob
 * key is saved; the bytes live in IndexedDB).
 */
class BackgroundStore {
  config = $state<BackgroundConfig>({ ...DEFAULT_BG, ...kv.get<Partial<BackgroundConfig>>(KEY, {}) });
  /** Object URL for the active image blob, or null. */
  imageUrl = $state<string | null>(null);

  constructor() {
    $effect.root(() => {
      $effect(() => {
        kv.set(KEY, $state.snapshot(this.config));
      });
    });
    if (this.config.kind === 'image' && this.config.imageId) {
      void this.loadImage(this.config.imageId);
    }
  }

  private async loadImage(id: string) {
    const blob = await blobStore.get(id);
    if (blob) {
      if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = URL.createObjectURL(blob);
    }
  }

  /** Store an uploaded image and switch the background to it. */
  async setImage(file: Blob) {
    const id = uid('img');
    await blobStore.put(id, file);
    const previous = this.config.imageId;
    this.config.imageId = id;
    this.config.kind = 'image';
    await this.loadImage(id);
    if (previous) void blobStore.delete(previous);
  }

  setGradient(id: string) {
    this.config.kind = 'gradient';
    this.config.gradientId = id;
  }

  clearImage() {
    if (this.config.imageId) void blobStore.delete(this.config.imageId);
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = null;
    this.config.imageId = null;
    this.config.kind = 'gradient';
  }

  /** Restore the default wallpaper (used by "Reset to defaults"). */
  reset() {
    if (this.config.imageId) void blobStore.delete(this.config.imageId);
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = null;
    this.config = { ...DEFAULT_BG };
  }

  get activeGradient(): GradientPreset {
    return GRADIENTS.find((g) => g.id === this.config.gradientId) ?? GRADIENTS[0];
  }
}

export const background = new BackgroundStore();
