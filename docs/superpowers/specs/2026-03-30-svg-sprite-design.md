# SVG Sprite Icon System

## Summary

Replace the 17 individual `Icon*.astro` components with a single SVG sprite file and a unified `<Icon>` component. The sprite is generated from `src/assets/icons/*.svg` via a Node script, hooked into dev/build.

## Motivation

- **Single source of truth:** `src/assets/icons/` is the only place to update icons
- **No sync issues:** no more manual copy of SVG paths into Astro components
- **Lighter HTML:** `<use href>` instead of full inline SVG paths on every page
- **Browser caching:** the sprite is a static file cached by the browser

## Architecture

```
src/assets/icons/*.svg          ← Source of truth (17 SVG files)
        │
        ▼
scripts/generate-icons.mjs      ← Node script, reads SVGs, outputs sprite
        │
        ▼
public/icons/sprite.svg         ← Generated sprite (<symbol> per icon)
        │
        ▼
src/components/Icon.astro        ← Single component, uses <use href>
```

## 1. Sprite Generation Script

**File:** `scripts/generate-icons.mjs`

**Behavior:**

1. Read all `*.svg` files from `src/assets/icons/` (ignore non-SVG files)
2. For each SVG: extract inner elements (`<path>`, `<circle>`, etc.) with their attributes
3. Wrap each in a `<symbol id="{filename}" viewBox="0 0 24 24">`
4. Write all symbols to `public/icons/sprite.svg`

**Output format:**

```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="add" viewBox="0 0 24 24">
    <path fill="currentColor" d="..." />
  </symbol>
  <symbol id="settings" viewBox="0 0 24 24">
    <path fill="currentColor" d="..." />
  </symbol>
</svg>
```

**npm scripts:**

```json
{
  "icons": "node scripts/generate-icons.mjs",
  "predev": "npm run icons",
  "prebuild": "npm run icons"
}
```

## 2. Icon Component

**File:** `src/components/Icon.astro`

**Props:**

- `name: string` — icon ID matching the SVG filename (kebab-case)
- `size?: number` — defaults to 24
- `class?: string` — CSS classes

**Template:**

```astro
<svg
  width={size}
  height={size}
  fill="none"
  class={className}
  aria-hidden="true"
>
  <use href={`/icons/sprite.svg#${name}`} />
</svg>
```

## 3. Migration

**Replace imports in ~10 files:**

- Before: `import IconSettings from '../components/icons/IconSettings.astro'`
- After: `import Icon from '../components/Icon.astro'`

**Replace usage:**

- Before: `<IconSettings size={16} />`
- After: `<Icon name="settings" size={16} />`

**Slots preserved:** `<Icon name="close" size={16} slot="icon" />`

**Delete:** all 17 files in `src/components/icons/`

## 4. Naming Convention

- Icon IDs use kebab-case matching the source filename
- Available icons: `add`, `close`, `delete`, `download`, `edit`, `external`, `eye`, `eye-off`, `grid-view`, `list-view`, `loading`, `logout`, `scan`, `search`, `settings`, `upload`, `user`

## 5. Adding a New Icon

1. Drop a new `.svg` file in `src/assets/icons/`
2. Run `npm run icons` (or restart dev server)
3. Use `<Icon name="new-icon" />` anywhere

## Decisions

| Choice           | Decision                            | Rationale                           |
| ---------------- | ----------------------------------- | ----------------------------------- |
| Sprite location  | `public/icons/sprite.svg`           | Browser-cached, external reference  |
| Reference method | `<use href="/icons/sprite.svg#id">` | No extra HTTP per icon, cached      |
| Generation       | npm script + pre-hooks              | Independent, auto on build          |
| Name type        | `string`                            | Simple, no regeneration on icon add |
| Naming           | kebab-case                          | Matches source filenames            |
