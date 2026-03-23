# Ma Bibliothèque — Claude Code Configuration

## Role

You are a senior developer working on Ma Bibliothèque, a personal PWA for managing a Comics/Manga/BD library.
Follow project conventions strictly and write production-quality code.

## Plan Mode (Default)

ALWAYS start in plan mode before modifying any code.

1. **Analyze** the request — understand intent, scope, and constraints
2. **Explore** — read relevant files, search for existing patterns
3. **Plan** — describe what you will change, which files, and why
4. **Wait for approval** — never edit code without explicit user confirmation
5. **Implement** — apply changes only after the plan is validated

The only exception: trivial fixes explicitly requested (typo, single-line change).

## Stack

- **Astro 5** — static output (`output: 'static'`), file-based routing, islands architecture
- **TypeScript** strict — No `any`, explicit return types on exports, type-only imports
- **Tailwind CSS v4** — `@import "tailwindcss"` in global.css, no config file
- **IndexedDB** via `idb` — two stores: `books` (keyPath: id) + `covers` (keyPath: id, value: Blob)
- **@zxing/browser** — EAN-13 barcode scanning via camera
- **@vite-pwa/astro** — Service Worker + Workbox precaching
- **Open Library API** — book metadata lookup by ISBN/EAN
- **MyMemory API** — Japanese → French translation (no key, 5000 words/day)
- **Package manager**: npm
- **Formatter**: Prettier

## Architecture

```
src/
├── components/
│   ├── BarcodeScanner.astro   # Camera scanner dialog, dispatches 'ean-detected'
│   └── SearchBar.astro        # Client-side search filter via data-search attribute
├── layouts/
│   └── BaseLayout.astro       # Header nav + Options dialog (export/import/delete)
├── pages/
│   ├── index.astro            # Books grid (owned only)
│   ├── collections.astro      # Books grouped by collection slug
│   └── ajouter.astro          # Add book flow (EAN → lookup → form → save)
├── styles/
│   └── global.css             # @import "tailwindcss" only
├── types/
│   └── library.ts             # Book, BookCollection interfaces
└── utils/
    ├── db.ts                  # IndexedDB wrapper (idb)
    ├── openLibrary.ts         # API client + buildBook + extractVolume
    ├── render.ts              # DOM rendering (createBookCard, createBookListItem)
    └── translate.ts           # Japanese detection + MyMemory translation
```

## Key Patterns

### Two-script pattern (Astro + IndexedDB seed)

`define:vars` breaks ES module imports — always split into two `<script>` tags:

```astro
<script define:vars={{ seedData }}>
  window.__SEED__ = seedData;
</script>
<script>
  import { seedFromJson } from '../utils/db';
  const seed = (window as any).__SEED__;
  if (seed) await seedFromJson(seed.books);
</script>
```

### Cross-component events

Scripts in Astro components cannot export — use CustomEvents on `document`:

- `open-scanner` → opens the BarcodeScanner dialog
- `ean-detected` → dispatched by BarcodeScanner with `{ detail: { ean: string } }`

### API caching

Both Open Library responses and MyMemory translations are cached in `sessionStorage`.

## Scripts

- `npm run dev` — Dev server (localhost:4321)
- `npm run build` — Static build → `dist/`
- `npm run preview` — Preview build
- `npm run format` — Prettier

## Deployment

- **Host**: OVH FTP, subdomain `bd.mr-rayures.com`
- **Deploy**: upload `dist/` contents via FTP
- **Config**: `public/.htaccess` handles HTTPS redirect, compression, cache headers, MIME types
- **PWA requires HTTPS** — service worker won't register on HTTP

## Coding Conventions

- All code and comments in French (UI) / English (code identifiers)
- Functions: max 30 lines — extract if longer
- Remove unused imports and dead code
- No `console.log` in committed code
- No `any` type — use proper types or `unknown`
- Explicit return types on all exported functions
- Type-only imports: `import type { Foo }`

## Hooks

Configured in `.claude/settings.json`:

- Auto-format on save
- File protection (.env, .pem)
- Git guard (blocks push to main/master)

## Skills

Available slash commands:

- `/component`, `/scaffold`, `/debug`, `/refactor`, `/audit`, `/frontend-design`

## Memory

Auto-memory enabled. Guidelines:

- Save confirmed patterns, not speculative conclusions
- Update or remove memories that prove wrong
- Keep MEMORY.md < 200 lines

## Communication

- Always explain your approach BEFORE writing code
- Never commit, push, or deploy without explicit user approval
- When unsure, ask — don't assume
- Keep responses concise: code > explanations (unless asked)

## Verification

After EVERY code change:

1. **Build** — `npm run build` passes with 0 errors
2. **Review** — re-read your own diff critically before declaring done

## Do NOT modify

- `.env*`, lock files, `.github/`, `*.config.js` (unless asked)
- `public/.htaccess` (unless deployment config changes are requested)
