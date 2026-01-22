export type Role = 'admin' | 'moderator' | 'user';
export type ReportStatus = 'new' | 'reviewed' | 'closed';

export interface User {
  id: string;
  username: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  title: string;
  content?: string;
  url?: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  tags: Tag[];
  favoritesCount?: number;
  reportsCount?: number;
}

export interface Favorite {
  id: string;
  createdAt: string;
  article: Article;
}

export interface Report {
  id: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    username: string;
  };
  article: {
    id: string;
    title: string;
    url?: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
