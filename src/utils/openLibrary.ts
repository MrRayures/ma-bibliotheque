import type { Book } from '../types/library';

interface OpenLibraryBook {
  title?: string;
  subtitle?: string;
  authors?: Array<{ name: string }>;
  cover?: { medium?: string; large?: string };
}

export interface LookupResult {
  title: string;
  subtitle: string | null;
  authors: string[];
  coverUrl: string | null;
  ean: string;
}

const CACHE_PREFIX = 'ol_cache_';

export async function lookupByEan(ean: string): Promise<LookupResult | null> {
  const cacheKey = `${CACHE_PREFIX}${ean}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) {
    return JSON.parse(cached) as LookupResult | null;
  }

  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${ean}&format=json&jscmd=data`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, OpenLibraryBook>;
  const book = data[`ISBN:${ean}`];
  const result: LookupResult | null = book
    ? {
        title: book.title ?? '',
        subtitle: book.subtitle ?? null,
        authors: book.authors?.map((a) => a.name) ?? [],
        coverUrl: book.cover?.large ?? book.cover?.medium ?? null,
        ean,
      }
    : null;

  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
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

export function extractVolume(title: string): number | null {
  const patterns = [
    /\btome\s*(\d+)/i,
    /\bvol(?:ume)?\.?\s*(\d+)/i,
    /\bT\.?\s*(\d+)\b/,
    /#\s*(\d+)/,
  ];
  for (const re of patterns) {
    const match = re.exec(title);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return null;
}

export function buildBook(
  result: LookupResult,
  collectionName: string | null,
  collectionVolume: number | null,
): Book {
  const collectionSlug = collectionName
    ? collectionName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : null;

  return {
    id: crypto.randomUUID(),
    title: result.title,
    subtitle: result.subtitle,
    authors: result.authors,
    ean: result.ean,
    collection:
      collectionName && collectionSlug && collectionVolume !== null
        ? {
            name: collectionName,
            slug: collectionSlug,
            volume: collectionVolume,
          }
        : null,
    cover: null,
    addedAt: new Date().toISOString().split('T')[0] ?? '',
  };
}
