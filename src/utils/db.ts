import { openDB, type IDBPDatabase } from "idb";
import type { Book } from "../types/library";

const DB_NAME = "ma-bibliotheque";
const DB_VERSION = 1;

export interface LibraryDB {
  books: {
    key: string;
    value: Book;
  };
  covers: {
    key: string;
    value: { id: string; blob: Blob };
  };
}

let dbInstance: IDBPDatabase<LibraryDB> | null = null;

async function getDB(): Promise<IDBPDatabase<LibraryDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LibraryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("books", { keyPath: "id" });
      db.createObjectStore("covers", { keyPath: "id" });
    },
  });

  return dbInstance;
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  const books = await db.getAll("books");
  return books.sort((a, b) =>
    a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
  );
}

export async function getBookByEan(ean: string): Promise<Book | undefined> {
  const db = await getDB();
  const all = await db.getAll("books");
  return all.find((b) => b.ean === ean);
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put("books", book);
}

export async function saveCover(bookId: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put("covers", { id: bookId, blob });
}

export async function getCoverUrl(bookId: string): Promise<string | null> {
  const db = await getDB();
  const cover = await db.get("covers", bookId);
  if (!cover) return null;
  return URL.createObjectURL(cover.blob);
}

export async function seedFromJson(books: Book[]): Promise<void> {
  const db = await getDB();
  const existing = await db.count("books");
  if (existing > 0) return;
  const tx = db.transaction("books", "readwrite");
  await Promise.all([...books.map((b) => tx.store.put(b)), tx.done]);
}

export async function exportToJson(): Promise<string> {
  const books = await getAllBooks();
  return JSON.stringify({ books }, null, 2);
}

export async function importFromJson(json: string): Promise<void> {
  const data = JSON.parse(json) as { books: Book[] };
  const db = await getDB();
  const tx = db.transaction("books", "readwrite");
  await tx.store.clear();
  await Promise.all([...data.books.map((b) => tx.store.put(b)), tx.done]);
}
