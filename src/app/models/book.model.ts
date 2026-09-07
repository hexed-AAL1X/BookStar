export type BookCategory =
  | 'Ficción'
  | 'No Ficción'
  | 'Ciencia'
  | 'Tecnología'
  | 'Infantil'
  | 'Historia'
  | 'Fantasía'
  | 'Romance'
  | 'Misterio';

export interface Book {
  _id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  coverUrl?: string;
  fileUrl?: string;
  language?: string;
  publicationDate?: string;
  category: BookCategory[];
  authorId: string;
  authorName?: string;
  averageRating?: number;
}