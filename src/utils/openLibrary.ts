import type { Book } from '../types/library';

interface OpenLibraryBook {
  url?: string;
  title?: string;
  subtitle?: string;
  authors?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  publish_date?: string;
  cover?: { medium?: string; large?: string };
}

export interface LookupResult {
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishDate: string | null;
  coverUrl: string | null;
  openLibraryUrl: string | null;
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
        publisher: book.publishers?.[0]?.name ?? null,
        publishDate: book.publish_date ?? null,
        coverUrl: book.cover?.large ?? book.cover?.medium ?? null,
        openLibraryUrl: book.url ?? null,
        ean,
      }
    : null;

  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

const VOLUME_PATTERNS = [
  /\btome\s*(\d+)/i,
  /\bvol(?:ume)?\.?\s*(\d+)/i,
  /\bT\.?\s*(\d+)\b/,
  /#\s*(\d+)/,
];

export function extractVolume(title: string): number | null {
  for (const re of VOLUME_PATTERNS) {
    const match = re.exec(title);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return null;
}

export function extractCollectionName(title: string): string | null {
  for (const re of VOLUME_PATTERNS) {
    if (re.test(title)) {
      return (
        title
          .replace(re, '')
          .replace(/[\s\-–—:,]+$/, '')
          .trim() || null
      );
    }
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
    publisher: result.publisher,
    publishDate: result.publishDate,
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
    openLibraryUrl: result.openLibraryUrl,
    addedAt: new Date().toISOString().split('T')[0] ?? '',
  };
}
