/**
 * Appearance presets — selectable "looks" that swap the font personality (and
 * a suggested accent). They set a starting point; the user can still override
 * accent, radius, transparency, etc. individually afterwards. All fonts are
 * system fonts (via the macOS `ui-*` generics), so nothing is downloaded.
 */
export interface AppearancePreset {
  id: string;
  name: string;
  description: string;
  fontSans: string;
  fontRounded: string;
  accent: string;
}

const APPLE_SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

export const PRESETS: AppearancePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'San Francisco — the macOS system look.',
    fontSans: APPLE_SANS,
    fontRounded: `-apple-system, 'SF Pro Rounded', ${APPLE_SANS}`,
    accent: '#0a84ff'
  },
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'Soft, friendly, fully rounded.',
    fontSans: `ui-rounded, 'SF Pro Rounded', ${APPLE_SANS}`,
    fontRounded: `ui-rounded, 'SF Pro Rounded', ${APPLE_SANS}`,
    accent: '#30d158'
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Elegant serif headlines.',
    fontSans: "ui-serif, 'New York', Georgia, 'Times New Roman', serif",
    fontRounded: "ui-serif, 'New York', Georgia, serif",
    accent: '#bf5af2'
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Technical monospace.',
    fontSans: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace",
    fontRounded: "ui-monospace, 'SF Mono', Menlo, monospace",
    accent: '#64d2ff'
  }
];

export function getPreset(id: string): AppearancePreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
