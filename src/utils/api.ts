import type { Book } from '../types/library';
import { getAuthToken } from './auth';
import { slugify } from './books';

function getApiUrl(): string {
  return `${window.location.origin}/api/library.php`;
}

let booksCache: Book[] | null = null;
let booksInflight: Promise<Book[]> | null = null;

async function fetchBooks(): Promise<Book[]> {
  if (booksCache) return booksCache;
  if (booksInflight) return booksInflight;
  booksInflight = (async () => {
    const res = await fetch(getApiUrl(), { cache: 'no-store' });
    if (!res.ok) return [];
    try {
      const data = (await res.json()) as { books?: Book[] };
      const books = data.books ?? [];
      booksCache = books;
      return books;
    } catch {
      return [];
    }
  })();
  try {
    return await booksInflight;
  } finally {
    booksInflight = null;
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
  booksCache = books;
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

async function deleteCover(bookId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(`${getApiUrl()}?cover=${bookId}`, {
      method: 'DELETE',
      headers: { 'X-Token': token },
    });
  } catch {
    /* best effort */
  }
}

export async function deleteBook(id: string): Promise<void> {
  const books = await fetchBooks();
  const book = books.find((b) => b.id === id);
  if (book?.cover) await deleteCover(id);
  await writeBooks(books.filter((b) => b.id !== id));
}

export async function clearAllBooks(): Promise<void> {
  await writeBooks([]);
}

export interface CollectionUpdate {
  name: string;
  totalVolumes?: number | null;
}

export async function updateCollection(oldSlug: string, update: CollectionUpdate): Promise<void> {
  const newSlug = slugify(update.name);
  const books = await fetchBooks();
  await writeBooks(
    books.map((b) =>
      b.collection?.slug === oldSlug
        ? {
            ...b,
            collection: {
              ...b.collection,
              name: update.name,
              slug: newSlug,
              totalVolumes: update.totalVolumes ?? null,
            },
          }
        : b,
    ),
  );
}

export async function getCollectionNames(): Promise<string[]> {
  const books = await getAllBooks();
  const names = new Set(books.map((b) => b.collection?.name).filter(Boolean) as string[]);
  return [...names].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

async function uploadCoverFromUrl(
  bookId: string,
  coverUrl: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(`${getApiUrl()}?cover=${bookId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': token },
    body: JSON.stringify({ from: coverUrl }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url: string };
  return data.url;
}

function loadImageAsBlob(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function uploadCoverFromBlob(
  bookId: string,
  coverUrl: string,
  token: string,
): Promise<string | null> {
  const blob = await loadImageAsBlob(coverUrl);
  if (!blob) return null;

  const formData = new FormData();
  formData.append('file', blob, `${bookId}.jpg`);

  const res = await fetch(`${getApiUrl()}?cover=${bookId}`, {
    method: 'POST',
    headers: { 'X-Token': token },
    body: formData,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function uploadCover(bookId: string, coverUrl: string): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return (
      (await uploadCoverFromUrl(bookId, coverUrl, token)) ??
      (await uploadCoverFromBlob(bookId, coverUrl, token))
    );
  } catch {
    return null;
  }
}

export async function uploadCoverFile(bookId: string, blob: Blob): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const formData = new FormData();
    formData.append('file', blob, `${bookId}.jpg`);
    const res = await fetch(`${getApiUrl()}?cover=${bookId}`, {
      method: 'POST',
      headers: { 'X-Token': token },
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url: string };
    return data.url;
  } catch {
    return null;
  }
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
