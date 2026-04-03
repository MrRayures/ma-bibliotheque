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

export type IndexEntry =
  | { kind: 'book'; book: Book; sortKey: string }
  | { kind: 'collection'; name: string; slug: string; books: Book[]; sortKey: string };

export function buildIndexEntries(books: Book[]): IndexEntry[] {
  const collectionMap = new Map<string, Book[]>();
  const standalone: Book[] = [];

  for (const book of books) {
    if (book.collection) {
      const { slug } = book.collection;
      if (!collectionMap.has(slug)) collectionMap.set(slug, []);
      collectionMap.get(slug)!.push(book);
    } else {
      standalone.push(book);
    }
  }

  const entries: IndexEntry[] = standalone.map((book) => ({
    kind: 'book' as const,
    book,
    sortKey: book.title,
  }));

  for (const [slug, items] of collectionMap) {
    const sorted = items.sort((a, b) => (a.collection?.volume ?? 0) - (b.collection?.volume ?? 0));
    entries.push({
      kind: 'collection',
      name: sorted[0].collection!.name,
      slug,
      books: sorted,
      sortKey: sorted[0].collection!.name,
    });
  }

  return entries;
}

export function groupEntriesByLetter(entries: IndexEntry[]): Map<string, IndexEntry[]> {
  const groups = new Map<string, IndexEntry[]>();
  for (const entry of entries) {
    const key = getLetterKey(entry.sortKey);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  for (const [, group] of groups) {
    group.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'fr', { sensitivity: 'base' }));
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
