export type StoryStatus = "DRAFT" | "PUBLISHED";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface StoryAuthor {
  id: string;
  name: string;
  bio?: string | null;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  viewCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: StoryStatus;
  moderationStatus: ModerationStatus;
  moderationNote?: string | null;
  author: StoryAuthor;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
}

export interface StoryComment {
  id: string;
  content: string;
  isHidden: boolean;
  moderationNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
