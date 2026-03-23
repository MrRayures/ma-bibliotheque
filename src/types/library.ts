export type BookType = "comics" | "manga" | "bd";
export type BookStatus = "owned" | "missing";

export interface BookCollection {
  name: string;
  slug: string;
  volume: number;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  ean: string;
  type: BookType;
  collection: BookCollection | null;
  cover: string | null;
  status: BookStatus;
  addedAt: string;
}

export interface Library {
  books: Book[];
}
