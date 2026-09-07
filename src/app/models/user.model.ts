export type UserRole = 'buyer' | 'author' | 'admin';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: string | {
    bio?: string;
    website?: string;
  };
  social?: {
    twitter?: string;
    instagram?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}