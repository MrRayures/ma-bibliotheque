export interface BookCollection {
  name: string;
  slug: string;
  volume: number;
  totalVolumes?: number | null;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishDate: string | null;
  ean: string;
  collection: BookCollection | null;
  cover: string | null;
  openLibraryUrl: string | null;
  addedAt: string;
}

export interface Library {
  books: Book[];
}
