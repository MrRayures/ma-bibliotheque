import type { Book } from '../types/library';
import { getAuthToken } from './auth';

function getApiUrl(): string {
  return `${window.location.origin}/api/library.php`;
}

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(getApiUrl());
  if (!res.ok) return [];
  try {
    const data = (await res.json()) as { books?: Book[] };
    return data.books ?? [];
  } catch {
    return [];
  }
}

async function writeBooks(books: Book[]): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': token },
    body: JSON.stringify({ books }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Erreur ${res.status}`);
  }
}

export async function getAllBooks(): Promise<Book[]> {
  const books = await fetchBooks();
  return books.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
}

export async function getBookByEan(ean: string): Promise<Book | undefined> {
  const books = await fetchBooks();
  return books.find((b) => b.ean === ean);
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const books = await fetchBooks();
  return books.find((b) => b.id === id);
}

export async function saveBook(book: Book): Promise<void> {
  const books = await fetchBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) {
    books[idx] = book;
  } else {
    books.push(book);
  }
  await writeBooks(books);
}

export async function deleteBook(id: string): Promise<void> {
  const books = await fetchBooks();
  await writeBooks(books.filter((b) => b.id !== id));
}

export async function clearAllBooks(): Promise<void> {
  await writeBooks([]);
}

export async function getCollectionNames(): Promise<string[]> {
  const books = await getAllBooks();
  const names = new Set(books.map((b) => b.collection?.name).filter(Boolean) as string[]);
  return [...names].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

export async function uploadCover(bookId: string, blob: Blob): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${getApiUrl()}?cover=${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg', 'X-Token': token },
      body: blob,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url: string };
    return data.url;
  } catch {
    return null;
  }
}

export function getEffectiveCoverUrl(book: Book): string | null {
  return book.cover;
}

export async function exportToJson(): Promise<string> {
  const books = await getAllBooks();
  return JSON.stringify({ books }, null, 2);
}

export async function importFromJson(json: string): Promise<void> {
  let data: { books: Book[] };
  try {
    data = JSON.parse(json) as { books: Book[] };
    if (!Array.isArray(data.books)) throw new Error('Format invalide');
  } catch {
    throw new Error('Fichier JSON invalide — import annulé');
  }
  await writeBooks(data.books);
}
