# Refactoring Composants — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Décomposer BaseLayout.astro (567 lignes), collections.astro (290 lignes) et index.astro (200 lignes) en composants à responsabilité unique pour faciliter la maintenance.

**Architecture:** Extraction des 3 dialogs de BaseLayout en composants autonomes, centralisation des fonctions de groupage dans `utils/books.ts`, simplification des pages grâce aux utilitaires partagés.

**Tech Stack:** Astro 5, TypeScript strict, Tailwind CSS v4

---

## Fichiers concernés

| Action   | Fichier                              | Responsabilité finale                                                          |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Créer    | `src/utils/books.ts`                 | groupByLetter, groupByCollection, getLetterKey, helpers localStorage view mode |
| Créer    | `src/components/BookDialog.astro`    | Dialog fiche livre (HTML + script complet)                                     |
| Créer    | `src/components/LoginDialog.astro`   | Dialog connexion (HTML + script complet)                                       |
| Créer    | `src/components/OptionsDialog.astro` | Dialog options export/import/delete (HTML + script complet)                    |
| Modifier | `src/layouts/BaseLayout.astro`       | Layout seul : header nav + slot + 3 imports dialog                             |
| Modifier | `src/pages/index.astro`              | Utilise groupByLetter depuis utils/books.ts                                    |
| Modifier | `src/pages/collections.astro`        | Utilise groupByCollection + helpers view mode depuis utils/books.ts            |

---

## Task 1 — Créer `utils/books.ts`

**Files:**

- Create: `src/utils/books.ts`

- [ ] **Créer le fichier avec les 5 fonctions exportées**

```typescript
// src/utils/books.ts
import type { Book } from '../types/library';

export type ViewMode = 'grid' | 'compact';

export function getLetterKey(title: string): string {
  const first =
    title[0]
      ?.toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') ?? '';
  return /^[A-Z]$/.test(first) ? first : '#';
}

export function groupByLetter(books: Book[]): Map<string, Book[]> {
  const groups = new Map<string, Book[]>();
  for (const book of books) {
    const key = getLetterKey(book.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(book);
  }
  return groups;
}

export function groupByCollection(books: Book[]): Map<string, Book[]> {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    if (!book.collection) continue;
    const { slug } = book.collection;
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug)!.push(book);
  }
  for (const [slug, items] of map) {
    map.set(
      slug,
      items.sort((a, b) => (a.collection?.volume ?? 0) - (b.collection?.volume ?? 0)),
    );
  }
  return map;
}

export function getCollectionViewMode(slug: string): ViewMode {
  return (localStorage.getItem(`collection-mode:${slug}`) as ViewMode) ?? 'compact';
}

export function setCollectionViewMode(slug: string, mode: ViewMode): void {
  localStorage.setItem(`collection-mode:${slug}`, mode);
}
```

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed` sans erreur TypeScript.

- [ ] **Commit**

```
refactor: extract groupByLetter/groupByCollection to utils/books.ts
```

---

## Task 2 — Créer `BookDialog.astro`

**Files:**

- Create: `src/components/BookDialog.astro`
- Modify: `src/layouts/BaseLayout.astro` (supprimer le dialog + son script, ajouter l'import)

- [ ] **Créer le composant avec le HTML du dialog**

```astro
<!-- src/components/BookDialog.astro -->
<dialog
  id="book-dialog"
  class="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
  aria-labelledby="dialog-book-title"
>
  <div class="flex max-h-[85vh] flex-col overflow-hidden sm:flex-row">
    <div class="relative h-48 w-full shrink-0 overflow-hidden bg-neutral-100 sm:h-auto sm:w-44 sm:rounded-l-xl">
      <img id="dialog-cover-img" src="" alt="" class="hidden h-full w-full object-cover" />
      <div id="dialog-cover-placeholder" class="absolute inset-0 hidden items-center justify-center">
        <span class="text-5xl font-bold text-neutral-300"></span>
      </div>
    </div>
    <div class="flex flex-1 flex-col overflow-y-auto">
      <div class="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <h2 id="dialog-book-title" class="text-base font-bold leading-snug "></h2>
        <button
          id="book-dialog-close"
          type="button"
          aria-label="Fermer"
          class="shrink-0 rounded p-1 text-text-light hover: focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <dl class="flex flex-1 flex-col gap-3 px-5 py-4 text-sm">
        <div id="dialog-row-subtitle" class="hidden">
          <dd id="dialog-subtitle" class="italic text-text-light"></dd>
        </div>
        <div>
          <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-light">Auteur(s)</dt>
          <dd id="dialog-authors" class="text-text-light"></dd>
        </div>
        <div id="dialog-row-collection" class="hidden">
          <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-light">Collection</dt>
          <dd id="dialog-collection" class="text-text-light"></dd>
        </div>
        <div>
          <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-light">EAN</dt>
          <dd id="dialog-ean" class="font-mono text-text-light"></dd>
        </div>
        <div>
          <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-light">Ajouté le</dt>
          <dd id="dialog-date" class="text-text-light"></dd>
        </div>
        <div id="dialog-row-openlibrary" class="hidden">
          <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-light">Open Library</dt>
          <dd>
            <a
              id="dialog-openlibrary"
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm text-text-light underline-offset-2 hover: hover:underline"
            >
              Voir la fiche
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </dd>
        </div>
      </dl>

      <div id="dialog-actions" class="hidden gap-2 border-t border-neutral-100 px-5 py-4 flex">
        <a
          id="dialog-edit"
          href="#"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-text-light transition-colors hover:bg-neutral-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </a>
        <button
          id="dialog-delete"
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Supprimer
        </button>
      </div>
    </div>
  </div>
</dialog>

<script>
  import type { Book } from '../types/library';
  import { deleteBook } from '../utils/api';

  const dialog = document.getElementById('book-dialog') as HTMLDialogElement;
  let currentBookId: string | null = null;

  document.addEventListener('open-book-dialog', (e) => {
    const { book, coverUrl, isLoggedIn } = (e as CustomEvent<{ book: Book; coverUrl: string | null; isLoggedIn: boolean }>).detail;
    currentBookId = book.id;

    const coverImg = document.getElementById('dialog-cover-img') as HTMLImageElement;
    const coverPlaceholder = document.getElementById('dialog-cover-placeholder')!;
    if (coverUrl) {
      coverImg.src = coverUrl;
      coverImg.alt = book.title;
      coverImg.classList.remove('hidden');
      coverPlaceholder.classList.add('hidden');
    } else {
      coverImg.classList.add('hidden');
      coverPlaceholder.classList.remove('hidden');
      coverPlaceholder.querySelector('span')!.textContent = (book.title[0] ?? '?').toUpperCase();
    }

    document.getElementById('dialog-book-title')!.textContent = book.title;

    const rowSubtitle = document.getElementById('dialog-row-subtitle')!;
    document.getElementById('dialog-subtitle')!.textContent = book.subtitle ?? '';
    rowSubtitle.classList.toggle('hidden', !book.subtitle);

    document.getElementById('dialog-authors')!.textContent = book.authors.join(', ') || '—';

    const rowCollection = document.getElementById('dialog-row-collection')!;
    if (book.collection) {
      document.getElementById('dialog-collection')!.textContent =
        `${book.collection.name}\u00a0· T.\u00a0${book.collection.volume}`;
      rowCollection.classList.remove('hidden');
    } else {
      rowCollection.classList.add('hidden');
    }

    document.getElementById('dialog-ean')!.textContent = book.ean || '—';

    const dateEl = document.getElementById('dialog-date')!;
    try {
      dateEl.textContent = new Date(book.addedAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch {
      dateEl.textContent = book.addedAt;
    }

    const rowOl = document.getElementById('dialog-row-openlibrary')!;
    const linkOl = document.getElementById('dialog-openlibrary') as HTMLAnchorElement;
    if (book.openLibraryUrl) {
      linkOl.href = book.openLibraryUrl;
      rowOl.classList.remove('hidden');
    } else {
      rowOl.classList.add('hidden');
    }

    const actionsEl = document.getElementById('dialog-actions')!;
    if (isLoggedIn) {
      (document.getElementById('dialog-edit') as HTMLAnchorElement).href = `/ajouter?id=${book.id}`;
      actionsEl.classList.remove('hidden');
    } else {
      actionsEl.classList.add('hidden');
    }

    dialog.showModal();
  });

  document.getElementById('book-dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  document.getElementById('dialog-delete')?.addEventListener('click', async () => {
    if (!currentBookId) return;
    if (!confirm('Supprimer ce livre ?')) return;
    await deleteBook(currentBookId);
    dialog.close();
    document.dispatchEvent(new CustomEvent('book-deleted', { detail: { id: currentBookId } }));
    currentBookId = null;
  });
</script>
```

- [ ] **Remplacer le bloc dialog + son script dans BaseLayout par l'import du composant**

Dans `src/layouts/BaseLayout.astro`, en frontmatter ajouter :

```astro
---
import BookDialog from '../components/BookDialog.astro';
---
```

Puis remplacer le bloc `<!-- Dialog fiche livre -->` (jusqu'à la balise `</dialog>` correspondante) par :

```astro
<BookDialog />
```

Supprimer dans le `<script>` de BaseLayout tout le bloc `// ─── Book dialog ───` (lignes `const bookDialog` jusqu'au dernier listener du dialog-delete inclus).

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed` sans erreur.

- [ ] **Commit**

```
refactor: extract BookDialog into standalone component
```

---

## Task 3 — Créer `LoginDialog.astro`

**Files:**

- Create: `src/components/LoginDialog.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Créer le composant**

```astro
<!-- src/components/LoginDialog.astro -->
<dialog
  id="login-dialog"
  class="w-full max-w-xs rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
  aria-labelledby="login-title"
>
  <div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
    <h2 id="login-title" class="text-sm font-semibold ">Connexion</h2>
    <button
      id="login-close"
      type="button"
      aria-label="Fermer"
      class="rounded p-1 text-text-light hover: focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="flex flex-col gap-3 p-5">
    <label for="login-password" class="text-sm text-text-light">Mot de passe</label>
    <div class="relative">
      <input
        type="password"
        id="login-password"
        autocomplete="current-password"
        class="w-full rounded-lg border border-neutral-200 px-3 py-2 pr-10 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      />
      <button
        id="toggle-password"
        type="button"
        aria-label="Afficher le mot de passe"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-light hover:text-text-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        <svg id="icon-eye" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <svg id="icon-eye-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="hidden">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </button>
    </div>
    <button
      id="login-submit"
      type="button"
      class="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      Se connecter
    </button>
    <p id="login-error" class="hidden text-xs text-red-600" aria-live="polite"></p>
  </div>
</dialog>

<script>
  import { login } from '../utils/auth';

  const dialog = document.getElementById('login-dialog') as HTMLDialogElement;
  const loginError = document.getElementById('login-error')!;
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;

  function openDialog(): void {
    loginError.classList.add('hidden');
    loginError.textContent = '';
    dialog.showModal();
  }

  function closeDialog(): void {
    dialog.close();
  }

  document.getElementById('login-btn')?.addEventListener('click', openDialog);
  document.getElementById('login-close')?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });

  document.getElementById('login-submit')?.addEventListener('click', async () => {
    const ok = await login(passwordInput.value);
    if (ok) {
      closeDialog();
      window.location.reload();
    } else {
      loginError.textContent = 'Mot de passe incorrect';
      loginError.classList.remove('hidden');
    }
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-submit')?.click();
  });

  document.getElementById('toggle-password')?.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    document.getElementById('icon-eye')!.classList.toggle('hidden', isHidden);
    document.getElementById('icon-eye-off')!.classList.toggle('hidden', !isHidden);
    (document.getElementById('toggle-password') as HTMLButtonElement).setAttribute(
      'aria-label',
      isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe',
    );
  });
</script>
```

- [ ] **Mettre à jour BaseLayout.astro**

Frontmatter :

```astro
import LoginDialog from '../components/LoginDialog.astro';
```

Remplacer le bloc `<!-- Dialog Login -->` par :

```astro
<LoginDialog />
```

Supprimer dans le `<script>` le bloc `// ─── Login dialog ───` (création `loginDialog`, `loginError`, listeners login-btn, login-close, login-submit, keydown, toggle-password).

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed`.

- [ ] **Commit**

```
refactor: extract LoginDialog into standalone component
```

---

## Task 4 — Créer `OptionsDialog.astro`

**Files:**

- Create: `src/components/OptionsDialog.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Créer le composant**

```astro
<!-- src/components/OptionsDialog.astro -->
<dialog
  id="options-dialog"
  class="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
  aria-labelledby="options-title"
>
  <div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
    <h2 id="options-title" class="text-sm font-semibold ">Options</h2>
    <button
      id="options-close"
      type="button"
      aria-label="Fermer"
      class="rounded p-1 text-text-light hover: focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <div class="flex flex-col gap-1 p-3">
    <button
      id="export-btn"
      type="button"
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-light hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exporter (JSON)
    </button>

    <label class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-light hover:bg-neutral-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neutral-900">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      Importer (JSON)
      <input id="import-input" type="file" accept=".json" class="sr-only" />
    </label>

    <hr class="my-1 border-neutral-100" />

    <div id="delete-zone">
      <button
        id="delete-btn"
        type="button"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Supprimer tous mes livres
      </button>
      <div id="delete-confirm" class="mt-1 hidden rounded-lg bg-red-50 p-3">
        <p class="mb-3 text-xs text-red-700">Cette action est irréversible. Tous vos livres et couvertures seront supprimés.</p>
        <div class="flex gap-2">
          <button
            id="delete-confirm-btn"
            type="button"
            class="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Oui, supprimer
          </button>
          <button
            id="delete-cancel-btn"
            type="button"
            class="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-text-light hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</dialog>

<script>
  import { exportToJson, importFromJson, clearAllBooks } from '../utils/api';

  const dialog = document.getElementById('options-dialog') as HTMLDialogElement;
  const deleteConfirm = document.getElementById('delete-confirm')!;

  document.getElementById('options-btn')?.addEventListener('click', () => dialog.showModal());
  document.getElementById('options-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => deleteConfirm.classList.add('hidden'));

  document.getElementById('export-btn')?.addEventListener('click', async () => {
    const json = await exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliotheque-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    dialog.close();
  });

  document.getElementById('import-input')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importFromJson(await file.text());
      window.location.reload();
    } catch (err) {
      alert((err as Error).message);
    }
  });

  document.getElementById('delete-btn')?.addEventListener('click', () => {
    deleteConfirm.classList.remove('hidden');
  });

  document.getElementById('delete-confirm-btn')?.addEventListener('click', async () => {
    await clearAllBooks();
    dialog.close();
    window.location.reload();
  });

  document.getElementById('delete-cancel-btn')?.addEventListener('click', () => {
    deleteConfirm.classList.add('hidden');
  });
</script>
```

- [ ] **Mettre à jour BaseLayout.astro**

Frontmatter :

```astro
import OptionsDialog from '../components/OptionsDialog.astro';
```

Remplacer le bloc `<!-- Dialog Options -->` par :

```astro
<OptionsDialog />
```

Supprimer dans le `<script>` le bloc `// ─── Options dialog ───` (création `optionsDialog`, `deleteConfirm`, tous leurs listeners export/import/delete).

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed`.

- [ ] **Commit**

```
refactor: extract OptionsDialog into standalone component
```

---

## Task 5 — Simplifier `BaseLayout.astro`

À ce stade, le `<script>` de BaseLayout ne doit plus contenir que la gestion de l'état d'authentification et le bouton logout.

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Vérifier que le script restant correspond exactement à ceci**

```typescript
import { isLoggedIn, logout } from '../utils/auth';

function applyAuthState(): void {
  const loggedIn = isLoggedIn();
  document.getElementById('options-btn')?.classList.toggle('hidden', !loggedIn);
  document.getElementById('fab-add')?.classList.toggle('hidden', !loggedIn);
  document.getElementById('login-btn')?.classList.toggle('hidden', loggedIn);
  document.getElementById('logout-btn')?.classList.toggle('hidden', !loggedIn);
}

applyAuthState();

document.getElementById('logout-btn')?.addEventListener('click', () => {
  logout();
  window.location.reload();
});
```

- [ ] **Vérifier le build + comportement**

```bash
npm run build
```

Attendu : `✓ Completed`. Tester en dev : connexion, déconnexion, ouverture des 3 dialogs.

- [ ] **Commit**

```
refactor: simplify BaseLayout to layout + auth state only
```

---

## Task 6 — Mettre à jour `index.astro`

**Files:**

- Modify: `src/pages/index.astro`

- [ ] **Remplacer la fonction locale `getLetterKey` par l'import depuis `utils/books.ts`**

Supprimer dans le script :

```typescript
function getLetterKey(title: string): string {
  const first =
    title[0]
      ?.toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') ?? '';
  return /^[A-Z]$/.test(first) ? first : '#';
}
```

Ajouter à la ligne des imports :

```typescript
import { getLetterKey, groupByLetter } from '../utils/books';
```

- [ ] **Remplacer la logique de groupage manuelle par `groupByLetter`**

Supprimer dans `init()` :

```typescript
const groups = new Map<string, typeof books>();
for (const book of books) {
  const key = getLetterKey(book.title);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(book);
}
```

Remplacer par :

```typescript
const groups = groupByLetter(books);
```

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed`.

- [ ] **Commit**

```
refactor: use groupByLetter from utils/books in index.astro
```

---

## Task 7 — Mettre à jour `collections.astro`

**Files:**

- Modify: `src/pages/collections.astro`

- [ ] **Remplacer les fonctions locales par les imports depuis `utils/books.ts`**

Supprimer dans le script :

```typescript
type ViewMode = 'grid' | 'compact';
// ...
function getModeForSlug(slug: string): ViewMode {
  return (localStorage.getItem(`collection-mode:${slug}`) as ViewMode) ?? 'compact';
}
```

Ajouter à la ligne des imports :

```typescript
import { groupByCollection, getCollectionViewMode, setCollectionViewMode } from '../utils/books';
import type { ViewMode } from '../utils/books';
```

- [ ] **Remplacer les appels locaux**

`getModeForSlug(slug)` → `getCollectionViewMode(slug)`

`localStorage.setItem(...)` dans le click du toggle → `setCollectionViewMode(slug, nextMode)`

Supprimer la fonction locale `groupByCollection` et remplacer son appel par l'import.

- [ ] **Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Completed`.

- [ ] **Commit**

```
refactor: use groupByCollection and view mode helpers from utils/books
```

---

## Résultat attendu

| Fichier               | Avant      | Après       |
| --------------------- | ---------- | ----------- |
| `BaseLayout.astro`    | 567 lignes | ~130 lignes |
| `BookDialog.astro`    | —          | ~140 lignes |
| `LoginDialog.astro`   | —          | ~90 lignes  |
| `OptionsDialog.astro` | —          | ~100 lignes |
| `utils/books.ts`      | —          | ~50 lignes  |
| `index.astro`         | 200 lignes | ~170 lignes |
| `collections.astro`   | 290 lignes | ~240 lignes |
