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

export interface SearchResult {
  title: string;
  authors: string[];
  coverUrl: string | null;
  ean: string | null;
  source: 'openlibrary' | 'googlebooks';
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

const CACHE_PREFIX = 'book_cache_';

async function lookupOnOpenLibrary(ean: string): Promise<LookupResult | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${ean}&format=json&jscmd=data`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, OpenLibraryBook>;
  const book = data[`ISBN:${ean}`];
  if (!book) return null;

  return {
    title: book.title ?? '',
    subtitle: book.subtitle ?? null,
    authors: book.authors?.map((a) => a.name) ?? [],
    publisher: book.publishers?.[0]?.name ?? null,
    publishDate: book.publish_date ?? null,
    coverUrl: book.cover?.large ?? book.cover?.medium ?? null,
    openLibraryUrl: book.url ?? null,
    ean,
  };
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    infoLink?: string;
  };
}

function enhanceGoogleCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  return url
    .replace('http://', 'https://')
    .replace(/&zoom=\d/, '&zoom=2')
    .replace(/&edge=curl/, '');
}

async function lookupOnGoogleBooks(ean: string): Promise<LookupResult | null> {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${ean}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as { items?: GoogleBooksVolume[] };
  const vol = data.items?.[0]?.volumeInfo;
  if (!vol?.title) return null;

  const coverUrl = enhanceGoogleCoverUrl(vol.imageLinks?.thumbnail);

  return {
    title: vol.title,
    subtitle: vol.subtitle ?? null,
    authors: vol.authors ?? [],
    publisher: vol.publisher ?? null,
    publishDate: vol.publishedDate ?? null,
    coverUrl,
    openLibraryUrl: vol.infoLink ?? null,
    ean,
  };
}

interface OpenLibrarySearchDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
}

async function searchOnOpenLibrary(query: string): Promise<SearchResult[]> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=10`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = (await response.json()) as { docs?: OpenLibrarySearchDoc[] };
  return (data.docs ?? []).map((doc) => {
    const isbn13 = doc.isbn?.find(
      (i) => i.length === 13 && (i.startsWith('978') || i.startsWith('979')),
    );
    return {
      title: doc.title ?? '',
      authors: doc.author_name ?? [],
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      ean: isbn13 ?? null,
      source: 'openlibrary' as const,
    };
  });
}

async function searchOnGoogleBooks(query: string): Promise<SearchResult[]> {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = (await response.json()) as { items?: GoogleBooksVolume[] };
  return (data.items ?? []).map((item) => {
    const vol = item.volumeInfo;
    const isbn13 = vol?.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ?? null;
    return {
      title: vol?.title ?? '',
      authors: vol?.authors ?? [],
      coverUrl: enhanceGoogleCoverUrl(vol?.imageLinks?.thumbnail),
      ean: isbn13,
      source: 'googlebooks' as const,
    };
  });
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (!r.title) return false;
    const key = r.ean ?? `${r.title}-${r.authors.join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface SearchProgress {
  source: string;
  results: SearchResult[];
  done: boolean;
}

export async function searchByTitle(
  query: string,
  onProgress: (progress: SearchProgress) => void,
): Promise<SearchResult[]> {
  let all: SearchResult[] = [];

  onProgress({ source: 'Google Books', results: [], done: false });
  const gbResults = await searchOnGoogleBooks(query);
  all = deduplicateResults([...all, ...gbResults]);
  onProgress({ source: 'Open Library', results: all, done: false });

  const olResults = await searchOnOpenLibrary(query);
  all = deduplicateResults([...all, ...olResults]);
  onProgress({ source: '', results: all, done: true });

  return all;
}

export async function lookupByEan(ean: string): Promise<LookupResult | null> {
  const cacheKey = `${CACHE_PREFIX}${ean}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) {
    return JSON.parse(cached) as LookupResult | null;
  }

  const [olResult, gbResult] = await Promise.all([
    lookupOnOpenLibrary(ean),
    lookupOnGoogleBooks(ean),
  ]);

  const result = olResult ?? gbResult;

  if (result && !result.coverUrl) {
    result.coverUrl = olResult?.coverUrl ?? gbResult?.coverUrl ?? null;
  }

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
