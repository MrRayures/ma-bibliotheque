import type { Book, BookType } from "../types/library";

interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  number_of_pages?: number;
  subjects?: Array<{ name: string }>;
  cover?: { medium?: string; large?: string };
}

export interface LookupResult {
  title: string;
  authors: string[];
  coverUrl: string | null;
  ean: string;
}

export async function lookupByEan(ean: string): Promise<LookupResult | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${ean}&format=json&jscmd=data`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, OpenLibraryBook>;
  const book = data[`ISBN:${ean}`];
  if (!book) return null;

  const coverUrl = book.cover?.large ?? book.cover?.medium ?? null;

  return {
    title: book.title ?? "",
    authors: book.authors?.map((a) => a.name) ?? [],
    coverUrl,
    ean,
  };
}

export async function fetchCoverBlob(coverUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(coverUrl);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

export function buildBook(
  result: LookupResult,
  type: BookType,
  collectionName: string | null,
  collectionVolume: number | null,
): Book {
  const collectionSlug = collectionName
    ? collectionName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    : null;

  return {
    id: crypto.randomUUID(),
    title: result.title,
    authors: result.authors,
    ean: result.ean,
    type,
    collection:
      collectionName && collectionSlug && collectionVolume !== null
        ? {
            name: collectionName,
            slug: collectionSlug,
            volume: collectionVolume,
          }
        : null,
    cover: null,
    status: "owned",
    addedAt: new Date().toISOString().split("T")[0] ?? "",
  };
}
