import { Router } from "express";
import { requireAdmin } from "../../middleware/require-admin.js";
import { attachOptionalUser, requireAuth } from "../../middleware/require-auth.js";
import { requireVerifiedEmail } from "../../middleware/require-verified-email.js";
import {
  createComment,
  createStory,
  deleteStory,
  deleteStoryComment,
  getMyStoryById,
  getStoryComments,
  getStoryBySlug,
  listBookmarkedStories,
  listMyStories,
  listPendingModerationStories,
  listPublishedStories,
  moderateStory,
  moderateStoryComment,
  publishStory,
  toggleStoryBookmark,
  toggleStoryLike,
  unpublishStory,
  updateStory
} from "./stories.controller.js";

export const storyRoutes = Router();

storyRoutes.get("/", attachOptionalUser, listPublishedStories);
storyRoutes.get("/bookmarks/me", requireAuth, listBookmarkedStories);
storyRoutes.get("/me/list", requireAuth, listMyStories);
storyRoutes.get("/me/:id", requireAuth, getMyStoryById);
storyRoutes.get("/admin/pending", requireAuth, requireAdmin, listPendingModerationStories);
storyRoutes.patch("/admin/:id/moderate", requireAuth, requireAdmin, moderateStory);
storyRoutes.patch(
  "/admin/comments/:commentId/moderate",
  requireAuth,
  requireAdmin,
  moderateStoryComment
);
storyRoutes.post("/", requireAuth, requireVerifiedEmail, createStory);
storyRoutes.patch("/:id", requireAuth, requireVerifiedEmail, updateStory);
storyRoutes.post("/:id/publish", requireAuth, requireVerifiedEmail, publishStory);
storyRoutes.post("/:id/unpublish", requireAuth, unpublishStory);
storyRoutes.delete("/:id", requireAuth, deleteStory);
storyRoutes.post("/:id/like", requireAuth, requireVerifiedEmail, toggleStoryLike);
storyRoutes.post("/:id/bookmark", requireAuth, requireVerifiedEmail, toggleStoryBookmark);
storyRoutes.post("/:id/comments", requireAuth, requireVerifiedEmail, createComment);
storyRoutes.delete("/comments/:commentId", requireAuth, deleteStoryComment);
storyRoutes.get("/:slug/comments", attachOptionalUser, getStoryComments);
storyRoutes.get("/:slug", attachOptionalUser, getStoryBySlug);
