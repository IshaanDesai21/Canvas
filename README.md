# MyNewTab

A premium, macOS-style **Safari New Tab dashboard** built to feel like a first-party
Apple feature — Liquid Glass widgets, a Spotlight-style search, a magnifying Dock, and a
⌘K command palette. Everything is customizable and persists locally.

> Goal: someone seeing it for the first time should believe Apple secretly added
> customizable Liquid Glass widgets to Safari's Start Page.

## Highlights

- **Liquid Glass design system** — layered translucency, frosted backdrop blur, edge
  highlights, top sheen reflections and extremely soft shadows. Tuned to macOS Tahoe /
  VisionOS materials. Light & dark, following macOS automatically.
- **Dynamic background** — upload any image (drag-and-drop anywhere), animated gradient
  presets, pointer parallax, and live blur / dim / saturation / brightness controls. Images
  are stored in IndexedDB; everything else in localStorage.
- **Spotlight search** — autocomplete, 7 providers (Google, DuckDuckGo, Bing, YouTube,
  GitHub, Blueprint, Wikipedia) with keyword prefixes (`yt …`, `gh …`), inline calculator
  and unit conversion, and direct URL detection.
- **⌘K Command Palette** — launch widgets, switch theme, change wallpaper, open settings,
  toggle edit mode, or search the web.
- **Movable, resizable widget grid** — snap-to-grid, iOS-style jiggle edit mode, drag &
  resize handles, snap guides and a grid overlay. 15 widgets included.
- **Magnifying Dock** — macOS fish-eye magnification with spring easing and pinnable sites.
- **Customization panel** — accent color, corner radius, transparency, animation speed,
  reduce-motion, clock format, dock size/magnification, and layout import/export.
- **Accessible & fast** — keyboard navigation, ARIA roles, reduce-motion support, and
  per-widget code splitting (each widget is its own lazy chunk).

## Tech stack

SvelteKit · Svelte 5 (runes) · TypeScript · Vite · Tailwind v4 · Motion · static adapter.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static SPA in ./build
npm run preview  # preview the production build
npm run check    # type-check + a11y lint
```

### Use it as your Safari New Tab

Run `npm run build` and point a "new tab" extension (or your browser's start-page setting)
at `build/index.html`. The app is a fully client-side SPA — no server required.

## Architecture

```
src/
  lib/
    components/   Background, Greeting, SearchBar, Dock, CommandPalette,
                  CustomizationPanel, WidgetGallery, Icon + UI controls
    widgets/      WidgetShell + 15 widgets + registry.ts (the marketplace map)
    layouts/      Dashboard (composition) + WidgetGrid (geometry, drag, resize)
    stores/       settings, theme, background, layout, dock, ui  (Svelte 5 runes)
    utils/        storage, grid, search, calc, time, weather, motion, id
    styles/       tokens.css, glass.css, base.css  (the design system)
  routes/         +page (mounts Dashboard), +layout, app shell
```

### Adding a widget (marketplace-ready)

1. Create `src/lib/widgets/MyWidget.svelte` accepting `let { instance } = $props()`.
2. Add a `WidgetDefinition` and a lazy loader entry in `widgets/registry.ts`.

That's it — the gallery, command palette and grid pick it up automatically.

## Persistence

Widget positions/sizes, wallpaper, theme, accent, dock, notes, habits and every setting
survive refresh. The storage layer (`utils/storage.ts`) abstracts localStorage + IndexedDB
behind a tiny API so it can later be swapped for an iCloud/remote sync backend.

## Roadmap (architecture in place)

AI assistant sidebar · Apple Reminders/Notes · iCloud sync · Live Activities · Focus modes ·
multiple desktops · wallpaper packs · plugin/extension API · widget marketplace.
