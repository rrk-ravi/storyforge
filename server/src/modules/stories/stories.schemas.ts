import { z } from "zod";

export const createStorySchema = z.object({
  title: z.string().min(5).max(140),
  excerpt: z.string().max(280).optional(),
  content: z.string().min(120),
  coverImageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  tags: z.array(z.string().min(1).max(24)).max(8).default([])
});

export const updateStorySchema = createStorySchema.partial();

export const listStoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(20).default(10),
  search: z.string().trim().optional(),
  tag: z.string().trim().optional()
});

export const commentSchema = z.object({
  content: z.string().min(2).max(1200)
});

export const moderateStorySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(280).optional()
});

export const moderateCommentSchema = z.object({
  action: z.enum(["HIDE", "SHOW"]),
  note: z.string().trim().max(280).optional()
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
