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
