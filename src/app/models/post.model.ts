export type PostTag =
  | 'reseña'
  | 'noticia'
  | 'opinión'
  | 'análisis'
  | 'spoiler'
  | 'recomendación'
  | 'novedad'
  | 'evento'
  | 'autor'
  | 'libro';

export interface PostComment {
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  authorId: string;
  authorName?: string;
  title: string;
  content: string;
  relatedBookId?: string;
  tags: PostTag[];
  comments: PostComment[];
  likes: string[]; // array de userId
  createdAt: string;
  updatedAt: string;
}