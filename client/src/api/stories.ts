import { http, unwrap } from "./http";
import type { ApiEnvelope, Story, StoryComment } from "../types";

export interface ListStoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
}

export interface StoryFormInput {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  tags: string[];
}

interface ToggleLikeResponse {
  liked: boolean;
  likesCount: number;
}

interface ToggleBookmarkResponse {
  bookmarked: boolean;
  bookmarksCount: number;
}

interface ModerateStoryInput {
  action: "APPROVE" | "REJECT";
  note?: string;
}

interface ModerateCommentInput {
  action: "HIDE" | "SHOW";
  note?: string;
}

export const storiesApi = {
  listPublished: async (params: ListStoriesParams) => {
    const { data } = await http.get<ApiEnvelope<Story[]>>("/stories", { params });
    return data;
  },

  getBySlug: async (slug: string): Promise<Story> => {
    const { data } = await http.get<ApiEnvelope<Story>>(`/stories/${slug}`);
    return unwrap(data);
  },

  listMine: async (): Promise<Story[]> => {
    const { data } = await http.get<ApiEnvelope<Story[]>>("/stories/me/list");
    return unwrap(data);
  },

  getMineById: async (id: string): Promise<Story> => {
    const { data } = await http.get<ApiEnvelope<Story>>(`/stories/me/${id}`);
    return unwrap(data);
  },

  create: async (input: StoryFormInput): Promise<Story> => {
    const { data } = await http.post<ApiEnvelope<Story>>("/stories", input);
    return unwrap(data);
  },

  update: async (id: string, input: Partial<StoryFormInput>): Promise<Story> => {
    const { data } = await http.patch<ApiEnvelope<Story>>(`/stories/${id}`, input);
    return unwrap(data);
  },

  publish: async (id: string): Promise<Story> => {
    const { data } = await http.post<ApiEnvelope<Story>>(`/stories/${id}/publish`);
    return unwrap(data);
  },

  unpublish: async (id: string): Promise<Story> => {
    const { data } = await http.post<ApiEnvelope<Story>>(`/stories/${id}/unpublish`);
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    await http.delete(`/stories/${id}`);
  },

  toggleLike: async (id: string): Promise<ToggleLikeResponse> => {
    const { data } = await http.post<ApiEnvelope<ToggleLikeResponse>>(`/stories/${id}/like`);
    return unwrap(data);
  },

  toggleBookmark: async (id: string): Promise<ToggleBookmarkResponse> => {
    const { data } = await http.post<ApiEnvelope<ToggleBookmarkResponse>>(`/stories/${id}/bookmark`);
    return unwrap(data);
  },

  listBookmarks: async (): Promise<Story[]> => {
    const { data } = await http.get<ApiEnvelope<Story[]>>("/stories/bookmarks/me");
    return unwrap(data);
  },

  listComments: async (slug: string): Promise<StoryComment[]> => {
    const { data } = await http.get<ApiEnvelope<StoryComment[]>>(`/stories/${slug}/comments`);
    return unwrap(data);
  },

  createComment: async (storyId: string, content: string): Promise<StoryComment> => {
    const { data } = await http.post<ApiEnvelope<StoryComment>>(`/stories/${storyId}/comments`, {
      content
    });
    return unwrap(data);
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await http.delete(`/stories/comments/${commentId}`);
  },

  listPendingModeration: async (): Promise<Story[]> => {
    const { data } = await http.get<ApiEnvelope<Story[]>>("/stories/admin/pending");
    return unwrap(data);
  },

  moderateStory: async (storyId: string, input: ModerateStoryInput): Promise<Story> => {
    const { data } = await http.patch<ApiEnvelope<Story>>(`/stories/admin/${storyId}/moderate`, input);
    return unwrap(data);
  },

  moderateComment: async (commentId: string, input: ModerateCommentInput): Promise<StoryComment> => {
    const { data } = await http.patch<ApiEnvelope<StoryComment>>(
      `/stories/admin/comments/${commentId}/moderate`,
      input
    );
    return unwrap(data);
  }
};
