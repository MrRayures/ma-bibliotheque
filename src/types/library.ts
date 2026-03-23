export interface BookCollection {
  name: string;
  slug: string;
  volume: number;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  ean: string;
  collection: BookCollection | null;
  cover: string | null;
  addedAt: string;
}

export interface Library {
  books: Book[];
}
