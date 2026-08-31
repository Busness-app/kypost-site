# Theming

## One palette set, five surfaces

KyPost ships 15 theme presets, and they are the same 15 everywhere: the web UI,
Android, iOS, macOS, and Linux. The palettes are not "matched by eye" — the
values are copied byte for byte between the implementations, and the theme a
user picks on one client is the theme they see on the next.

The default is **Patina Ky**.

## The 15 presets

| Theme | | Theme |
|---|---|---|
| Patina Ky *(default)* | | Polished Ky |
| Dark Matter | | Light Matter |
| Ocean | | Sky |
| Forest | | Tropics |
| Tropic Night | | Sun |
| Coffee | | Space |
| Cyber Punk | | Neon Purple |
| White Cliffs | | |

## Where each implementation lives

| Surface | File |
|---|---|
| Web | `frontend/src/theme.ts` (`kypost-server`) |
| Android | `AppTheme.kt` (`kypost-android`) |
| macOS & iOS | `KyPost/Style/` (`kypost-for-Mac`) |
| Linux | `core/theme/AppTheme.cpp` — the palette table; `ThemePalette.h` holds the invariant (`kypost-Linux`) |

These four are a binding contract. Changing a colour in one without changing it
in the others breaks the promise that the theme travels with the user, so a
palette edit is a four-repo change.

Linux additionally asserts the invariant in code: `ThemePalette.h` checks the
background's perceptual lightness, so a theme declared light has to actually
present as light.

## Choosing a theme

- **Web** — Settings → Appearance.
- **Android** — the Themes screen.
- **macOS & iOS** — Settings (⌘, on macOS).
- **Linux** — Settings.

## Custom themes

There is no custom-theme editor. The preset list is the supported surface; a new
palette is a code change in the four files above.
