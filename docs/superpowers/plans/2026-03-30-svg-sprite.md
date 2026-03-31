# SVG Sprite Icon System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 17 individual Icon Astro components with a generated SVG sprite and a single `<Icon>` component.

**Architecture:** A Node script reads `src/assets/icons/*.svg`, extracts inner elements, and generates `public/icons/sprite.svg` with `<symbol>` elements. A single `Icon.astro` component references them via `<use href>`. The script runs automatically before dev/build.

**Tech Stack:** Node.js (fs, path — no dependencies), Astro 5, SVG sprite with `<use>`

---

### Task 1: Create the sprite generation script

**Files:**

- Create: `scripts/generate-icons.mjs`

- [ ] **Step 1: Create `scripts/generate-icons.mjs`**

```js
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const ICONS_DIR = 'src/assets/icons';
const OUTPUT_DIR = 'public/icons';
const OUTPUT_FILE = join(OUTPUT_DIR, 'sprite.svg');

async function extractSvgContent(filePath) {
  const content = await readFile(filePath, 'utf-8');
  // Remove <defs /> empty tags
  const cleaned = content.replace(/<defs\s*\/>/g, '');
  // Extract everything between <svg ...> and </svg>
  const innerMatch = cleaned.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  return innerMatch ? innerMatch[1].trim() : '';
}

async function generateSprite() {
  const files = (await readdir(ICONS_DIR)).filter((f) => extname(f) === '.svg').sort();

  const symbols = [];

  for (const file of files) {
    const id = basename(file, '.svg');
    const inner = await extractSvgContent(join(ICONS_DIR, file));

    if (!inner) {
      console.warn(`[icons] Skipped empty SVG: ${file}`);
      continue;
    }

    symbols.push(`  <symbol id="${id}" viewBox="0 0 24 24">\n    ${inner}\n  </symbol>`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const sprite = [
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
    ...symbols,
    '</svg>',
    '',
  ].join('\n');

  await writeFile(OUTPUT_FILE, sprite, 'utf-8');
  console.log(`[icons] Generated sprite with ${symbols.length} icons → ${OUTPUT_FILE}`);
}

generateSprite();
```

- [ ] **Step 2: Run the script and verify output**

Run: `node scripts/generate-icons.mjs`
Expected: `[icons] Generated sprite with 17 icons → public/icons/sprite.svg`

Verify: open `public/icons/sprite.svg` and check it contains `<symbol id="add" ...>`, `<symbol id="settings" ...>`, etc.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-icons.mjs public/icons/sprite.svg
git commit -m "feat: add SVG sprite generation script"
```

---

### Task 2: Hook script into npm dev/build

**Files:**

- Modify: `package.json` (scripts section)

- [ ] **Step 1: Add npm scripts**

In `package.json`, replace the scripts section:

```json
"scripts": {
  "icons": "node scripts/generate-icons.mjs",
  "predev": "npm run icons",
  "prebuild": "npm run icons",
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

- [ ] **Step 2: Verify the hook works**

Run: `npm run build`
Expected: `[icons] Generated sprite with 17 icons` appears before the Astro build output, then build completes with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: hook icon sprite generation into dev/build"
```

---

### Task 3: Create the `<Icon>` component

**Files:**

- Create: `src/components/Icon.astro`

- [ ] **Step 1: Create `src/components/Icon.astro`**

```astro
---
interface Props {
  name: string;
  size?: number;
  class?: string;
}

const { name, size = 24, class: className = '' } = Astro.props;
---

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

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build completes with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Icon.astro
git commit -m "feat: add unified Icon component using SVG sprite"
```

---

### Task 4: Migrate `SearchBar.astro`

**Files:**

- Modify: `src/components/SearchBar.astro`

- [ ] **Step 1: Replace import and usage**

Replace:

```astro
import IconSearch from './icons/IconSearch.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

Replace:

```astro
<IconSearch size={24} class="absolute left-3 top-1/2 -translate-y-1/2 " />
```

With:

```astro
<Icon name="search" size={24} class="absolute left-3 top-1/2 -translate-y-1/2 " />
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.astro
git commit -m "refactor: migrate SearchBar to Icon sprite"
```

---

### Task 5: Migrate `BaseLayout.astro`

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconUser from '../components/icons/IconUser.astro';
import IconSettings from '../components/icons/IconSettings.astro';
import IconAdd from '../components/icons/IconAdd.astro';
```

With:

```astro
import Icon from '../components/Icon.astro';
```

- [ ] **Step 2: Replace usages**

Replace all occurrences:

- `<IconUser size={16} slot="icon" />` → `<Icon name="user" size={16} slot="icon" />`
- `<IconSettings size={16} slot="icon" />` → `<Icon name="settings" size={16} slot="icon" />`
- `<IconAdd size={24} slot="icon" />` → `<Icon name="add" size={24} slot="icon" />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "refactor: migrate BaseLayout to Icon sprite"
```

---

### Task 6: Migrate `BookDialog.astro`

**Files:**

- Modify: `src/components/BookDialog.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconClose from './icons/IconClose.astro';
import IconExternal from './icons/IconExternal.astro';
import IconEdit from './icons/IconEdit.astro';
import IconDelete from './icons/IconDelete.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

- [ ] **Step 2: Replace usages**

- `<IconClose size={16} slot="icon" />` → `<Icon name="close" size={16} slot="icon" />`
- `<IconExternal size={11} />` → `<Icon name="external" size={11} />`
- `<IconEdit size={14} slot="icon" />` → `<Icon name="edit" size={14} slot="icon" />`
- `<IconDelete size={14} slot="icon" />` → `<Icon name="delete" size={14} slot="icon" />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/BookDialog.astro
git commit -m "refactor: migrate BookDialog to Icon sprite"
```

---

### Task 7: Migrate `OptionsDialog.astro`

**Files:**

- Modify: `src/components/OptionsDialog.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconClose from './icons/IconClose.astro';
import IconDownload from './icons/IconDownload.astro';
import IconUpload from './icons/IconUpload.astro';
import IconDelete from './icons/IconDelete.astro';
import IconLogout from './icons/IconLogout.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

- [ ] **Step 2: Replace usages**

- `<IconClose size={32} slot="icon" />` → `<Icon name="close" size={32} slot="icon" />`
- `<IconDownload size={16} slot="icon" />` → `<Icon name="download" size={16} slot="icon" />`
- `<IconUpload size={16} />` → `<Icon name="upload" size={16} />`
- `<IconLogout size={16} slot="icon" />` → `<Icon name="logout" size={16} slot="icon" />`
- `<IconDelete size={16} slot="icon" />` → `<Icon name="delete" size={16} slot="icon" />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/OptionsDialog.astro
git commit -m "refactor: migrate OptionsDialog to Icon sprite"
```

---

### Task 8: Migrate `LoginDialog.astro`

**Files:**

- Modify: `src/components/LoginDialog.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconClose from './icons/IconClose.astro';
import IconEye from './icons/IconEye.astro';
import IconEyeOff from './icons/IconEyeOff.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

- [ ] **Step 2: Replace usages**

- `<IconClose size={16} slot="icon" />` → `<Icon name="close" size={16} slot="icon" />`
- `<IconEye size={16} />` → `<Icon name="eye" size={16} />`
- `<IconEyeOff size={16} />` → `<Icon name="eye-off" size={16} />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/LoginDialog.astro
git commit -m "refactor: migrate LoginDialog to Icon sprite"
```

---

### Task 9: Migrate `BarcodeScanner.astro`

**Files:**

- Modify: `src/components/BarcodeScanner.astro`

- [ ] **Step 1: Replace import and usage**

Replace:

```astro
import IconClose from './icons/IconClose.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

Replace:

```astro
<IconClose size={18} slot="icon" />
```

With:

```astro
<Icon name="close" size={18} slot="icon" />
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BarcodeScanner.astro
git commit -m "refactor: migrate BarcodeScanner to Icon sprite"
```

---

### Task 10: Migrate `RenameDialog.astro`

**Files:**

- Modify: `src/components/RenameDialog.astro`

- [ ] **Step 1: Replace import and usage**

Replace:

```astro
import IconClose from './icons/IconClose.astro';
```

With:

```astro
import Icon from './Icon.astro';
```

Replace:

```astro
<IconClose size={16} slot="icon" />
```

With:

```astro
<Icon name="close" size={16} slot="icon" />
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RenameDialog.astro
git commit -m "refactor: migrate RenameDialog to Icon sprite"
```

---

### Task 11: Migrate `index.astro`

**Files:**

- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace import and usage**

Replace:

```astro
import IconAdd from '../components/icons/IconAdd.astro';
```

With:

```astro
import Icon from '../components/Icon.astro';
```

Replace:

```astro
<IconAdd size={16} slot="icon" />
```

With:

```astro
<Icon name="add" size={16} slot="icon" />
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "refactor: migrate index page to Icon sprite"
```

---

### Task 12: Migrate `collections.astro`

**Files:**

- Modify: `src/pages/collections.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconListView from '../components/icons/IconListView.astro';
import IconGridView from '../components/icons/IconGridView.astro';
import IconEdit from '../components/icons/IconEdit.astro';
```

With:

```astro
import Icon from '../components/Icon.astro';
```

- [ ] **Step 2: Replace usages**

- `<IconListView size={14} />` → `<Icon name="list-view" size={14} />`
- `<IconGridView size={14} />` → `<Icon name="grid-view" size={14} />`
- `<IconEdit size={12} />` → `<Icon name="edit" size={12} />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/collections.astro
git commit -m "refactor: migrate collections page to Icon sprite"
```

---

### Task 13: Migrate `ajouter.astro`

**Files:**

- Modify: `src/pages/ajouter.astro`

- [ ] **Step 1: Replace imports**

Replace:

```astro
import IconScan from '../components/icons/IconScan.astro';
import IconLoading from '../components/icons/IconLoading.astro';
```

With:

```astro
import Icon from '../components/Icon.astro';
```

- [ ] **Step 2: Replace usages**

- `<IconScan size={16} slot="icon" />` → `<Icon name="scan" size={16} slot="icon" />`
- `<IconLoading size={16} class="animate-spin" />` → `<Icon name="loading" size={16} class="animate-spin" />`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ajouter.astro
git commit -m "refactor: migrate ajouter page to Icon sprite"
```

---

### Task 14: Delete old icon components

**Files:**

- Delete: all 17 files in `src/components/icons/`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -r "icons/Icon" src/` — should return 0 results.

- [ ] **Step 2: Delete the icon components directory**

```bash
rm -rf src/components/icons/
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add -u src/components/icons/
git commit -m "refactor: remove old individual Icon components"
```

---

### Task 15: Final verification

- [ ] **Step 1: Full clean build**

```bash
rm -rf dist/
npm run build
```

Expected: `[icons] Generated sprite with 17 icons` then build completes with 0 errors, 3 pages built.

- [ ] **Step 2: Visual check**

Run: `npm run preview`
Open in browser and verify icons display correctly on all 3 pages (index, collections, ajouter).

- [ ] **Step 3: Check sprite content**

Open `public/icons/sprite.svg` and verify it contains exactly 17 `<symbol>` elements with correct IDs.
