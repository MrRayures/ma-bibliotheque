import type { Book, Library } from "../types/library";
import libraryData from "../../data/library.json";

const library = libraryData as Library;

export function getAllBooks(): Book[] {
  return [...library.books].sort((a, b) =>
    a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
  );
}

export function getCollections(): Map<string, Book[]> {
  const collectionBooks = library.books.filter((b) => b.collection !== null);
  const map = new Map<string, Book[]>();

  for (const book of collectionBooks) {
    const slug = book.collection!.slug;
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug)!.push(book);
  }

  for (const [slug, books] of map) {
    map.set(
      slug,
      [...books].sort(
        (a, b) => (a.collection?.volume ?? 0) - (b.collection?.volume ?? 0),
      ),
    );
  }

  return map;
}
