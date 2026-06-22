/**
 * Ephemeral UI state — not persisted. Tracks which overlays are open and
 * whether the dashboard is in edit mode.
 */
class UIStore {
  editMode = $state(false);
  paletteOpen = $state(false);
  settingsOpen = $state(false);
  galleryOpen = $state(false);

  toggleEdit() {
    this.editMode = !this.editMode;
  }

  openPalette() {
    this.paletteOpen = true;
  }
  closePalette() {
    this.paletteOpen = false;
  }
}

export const ui = new UIStore();
