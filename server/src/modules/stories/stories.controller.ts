import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { extractText, sanitizeStoryHtml } from "../../utils/content.js";
import { createUniqueStorySlug } from "../../utils/slug.js";
import {
  commentSchema,
  createStorySchema,
  listStoriesQuerySchema,
  moderateCommentSchema,
  moderateStorySchema,
  type UpdateStoryInput,
  updateStorySchema
} from "./stories.schemas.js";

const STORY_STATUS = {
  draft: "DRAFT",
  published: "PUBLISHED"
} as const;

const MODERATION_STATUS = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED"
} as const;

const getRequiredUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  return req.user;
};

const isStoryPublic = (story: { status: string; moderationStatus: string }): boolean => {
  return (
    story.status === STORY_STATUS.published &&
    story.moderationStatus === MODERATION_STATUS.approved
  );
};

const canViewStory = (
  story: {
    status: string;
    moderationStatus: string;
    authorId?: string;
    author?: { id: string };
  },
  user: Request["user"]
): boolean => {
  if (isStoryPublic(story)) {
    return true;
  }

  if (!user) {
    return false;
  }

  const authorId = story.authorId ?? story.author?.id;
  return user.role === "ADMIN" || user.id === authorId;
};

const publicStorySelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  tags: true,
  viewCount: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  moderationStatus: true,
  author: {
    select: {
      id: true,
      name: true,
      bio: true
    }
  }
} as const;

const storyDetailSelect = {
  ...publicStorySelect,
  moderationNote: true,
  content: true,
  status: true
} as const;

const decorateStoriesWithEngagement = async <T extends { id: string }>(
  stories: T[],
  viewerId?: string
): Promise<Array<T & { likesCount: number; commentsCount: number; bookmarksCount: number; likedByMe: boolean; bookmarkedByMe: boolean }>> => {
  if (stories.length === 0) {
    return [];
  }

  const storyIds = stories.map((story) => story.id);

  const [likeGroups, commentGroups, bookmarkGroups, myLikes, myBookmarks] = await Promise.all([
    prisma.storyLike.groupBy({
      by: ["storyId"],
      where: { storyId: { in: storyIds } },
      _count: { _all: true }
    }),
    prisma.comment.groupBy({
      by: ["storyId"],
      where: { storyId: { in: storyIds }, isHidden: false },
      _count: { _all: true }
    }),
    prisma.bookmark.groupBy({
      by: ["storyId"],
      where: { storyId: { in: storyIds } },
      _count: { _all: true }
    }),
    viewerId
      ? prisma.storyLike.findMany({
          where: { storyId: { in: storyIds }, userId: viewerId },
          select: { storyId: true }
        })
      : Promise.resolve([]),
    viewerId
      ? prisma.bookmark.findMany({
          where: { storyId: { in: storyIds }, userId: viewerId },
          select: { storyId: true }
        })
      : Promise.resolve([])
  ]);

  const likeMap = new Map(likeGroups.map((item) => [item.storyId, item._count._all]));
  const commentMap = new Map(commentGroups.map((item) => [item.storyId, item._count._all]));
  const bookmarkMap = new Map(bookmarkGroups.map((item) => [item.storyId, item._count._all]));
  const myLikeSet = new Set(myLikes.map((item) => item.storyId));
  const myBookmarkSet = new Set(myBookmarks.map((item) => item.storyId));

  return stories.map((story) => ({
    ...story,
    likesCount: likeMap.get(story.id) ?? 0,
    commentsCount: commentMap.get(story.id) ?? 0,
    bookmarksCount: bookmarkMap.get(story.id) ?? 0,
    likedByMe: myLikeSet.has(story.id),
    bookmarkedByMe: myBookmarkSet.has(story.id)
  }));
};

const formatStoryInput = (payload: { content: string; excerpt?: string; coverImageUrl?: string; tags: string[] }) => {
  const safeHtml = sanitizeStoryHtml(payload.content);
  const plainText = extractText(safeHtml);

  if (plainText.length < 120) {
    throw new ApiError(400, "Story content must be at least 120 characters of text");
  }

  return {
    content: safeHtml,
    excerpt: payload.excerpt?.trim() || plainText.slice(0, 240),
    coverImageUrl: payload.coverImageUrl || null,
    tags: payload.tags.map((tag) => tag.trim()).filter(Boolean)
  };
};

const buildStoryUpdateFields = (payload: UpdateStoryInput) => {
  const hasTitle = Object.hasOwn(payload, "title");
  const hasExcerpt = Object.hasOwn(payload, "excerpt");
  const hasContent = Object.hasOwn(payload, "content");
  const hasCoverImage = Object.hasOwn(payload, "coverImageUrl");
  const hasTags = Object.hasOwn(payload, "tags");
  const hasEditorialChange = hasTitle || hasExcerpt || hasContent || hasCoverImage || hasTags;

  let nextContent: string | undefined;
  let nextExcerpt: string | null | undefined;

  if (hasContent && typeof payload.content === "string") {
    const safeHtml = sanitizeStoryHtml(payload.content);
    const plainText = extractText(safeHtml);

    if (plainText.length < 120) {
      throw new ApiError(400, "Story content must be at least 120 characters of text");
    }

    nextContent = safeHtml;
    nextExcerpt =
      hasExcerpt && typeof payload.excerpt === "string"
        ? payload.excerpt.trim() || null
        : plainText.slice(0, 240);
  } else if (hasExcerpt && typeof payload.excerpt === "string") {
    nextExcerpt = payload.excerpt.trim() || null;
  }

  const nextCoverImageUrl = hasCoverImage ? payload.coverImageUrl || null : undefined;
  const nextTags = payload.tags?.map((tag) => tag.trim()).filter(Boolean);

  return {
    hasEditorialChange,
    nextContent,
    nextExcerpt,
    nextCoverImageUrl,
    nextTags
  };
};

export const listPublishedStories = asyncHandler(async (req: Request, res: Response) => {
  const query = listStoriesQuerySchema.parse(req.query);

  const where = {
    status: STORY_STATUS.published,
    moderationStatus: MODERATION_STATUS.approved,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" as const } },
            { excerpt: { contains: query.search, mode: "insensitive" as const } },
            { content: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {})
  };

  const [items, total] = await Promise.all([
    prisma.story.findMany({
      where,
      select: publicStorySelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.story.count({ where })
  ]);

  const data = await decorateStoriesWithEngagement(items, req.user?.id);

  res.json({
    success: true,
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

export const getStoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };

  const story = await prisma.story.findUnique({
    where: { slug },
    select: storyDetailSelect
  });

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (!canViewStory(story, req.user)) {
    throw new ApiError(404, "Story not found");
  }

  await prisma.story.update({
    where: { id: story.id },
    data: {
      viewCount: {
        increment: 1
      }
    }
  });

  const [likedRecord, bookmarkedRecord, likesCount, commentsCount, bookmarksCount] = await Promise.all([
    req.user
      ? prisma.storyLike.findUnique({
          where: {
            storyId_userId: {
              storyId: story.id,
              userId: req.user.id
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null),
    req.user
      ? prisma.bookmark.findUnique({
          where: {
            storyId_userId: {
              storyId: story.id,
              userId: req.user.id
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null),
    prisma.storyLike.count({ where: { storyId: story.id } }),
    prisma.comment.count({ where: { storyId: story.id, isHidden: false } }),
    prisma.bookmark.count({ where: { storyId: story.id } })
  ]);

  res.json({
    success: true,
    data: {
      ...story,
      viewCount: story.viewCount + 1,
      likesCount,
      commentsCount,
      bookmarksCount,
      likedByMe: Boolean(likedRecord),
      bookmarkedByMe: Boolean(bookmarkedRecord)
    }
  });
});

export const listMyStories = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const stories = await prisma.story.findMany({
    where: { authorId: user.id },
    select: storyDetailSelect,
    orderBy: { updatedAt: "desc" }
  });

  const data = await decorateStoriesWithEngagement(stories, user.id);

  res.json({
    success: true,
    data
  });
});

export const getMyStoryById = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const { id } = req.params as { id: string };

  const story = await prisma.story.findFirst({
    where: {
      id,
      authorId: user.id
    },
    select: storyDetailSelect
  });

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  const [decoratedStory] = await decorateStoriesWithEngagement([story], user.id);

  res.json({
    success: true,
    data: decoratedStory
  });
});

export const listBookmarkedStories = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id,
      story: {
        status: STORY_STATUS.published,
        moderationStatus: MODERATION_STATUS.approved
      }
    },
    orderBy: { createdAt: "desc" },
    select: {
      story: {
        select: publicStorySelect
      }
    }
  });

  const stories = bookmarks.map((bookmark) => bookmark.story);
  const data = await decorateStoriesWithEngagement(stories, user.id);

  res.json({
    success: true,
    data
  });
});

export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const payload = createStorySchema.parse(req.body);
  const formatted = formatStoryInput(payload);
  const slug = await createUniqueStorySlug(payload.title);

  const story = await prisma.story.create({
    data: {
      authorId: user.id,
      title: payload.title,
      slug,
      excerpt: formatted.excerpt,
      content: formatted.content,
      coverImageUrl: formatted.coverImageUrl,
      tags: formatted.tags,
      moderationStatus: MODERATION_STATUS.pending
    },
    select: storyDetailSelect
  });

  res.status(201).json({
    success: true,
    message: "Story created as draft",
    data: story
  });
});

export const updateStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const { id } = req.params as { id: string };
  const payload = updateStorySchema.parse(req.body);

  const existing = await prisma.story.findUnique({
    where: { id },
    select: { id: true, authorId: true, title: true }
  });

  if (existing?.authorId !== user.id) {
    throw new ApiError(404, "Story not found");
  }

  const nextSlug = payload.title ? await createUniqueStorySlug(payload.title, existing.id) : undefined;
  const { hasEditorialChange, nextContent, nextExcerpt, nextCoverImageUrl, nextTags } =
    buildStoryUpdateFields(payload);

  const story = await prisma.story.update({
    where: { id },
    data: {
      title: payload.title,
      slug: nextSlug,
      excerpt: nextExcerpt,
      content: nextContent,
      coverImageUrl: nextCoverImageUrl,
      tags: nextTags,
      moderationStatus: hasEditorialChange ? MODERATION_STATUS.pending : undefined,
      moderationNote: hasEditorialChange ? null : undefined,
      moderatedById: hasEditorialChange ? null : undefined,
      moderatedAt: hasEditorialChange ? null : undefined
    },
    select: storyDetailSelect
  });

  res.json({
    success: true,
    message: "Story updated",
    data: story
  });
});

export const publishStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const { id } = req.params as { id: string };

  const existing = await prisma.story.findUnique({
    where: { id },
    select: { id: true, authorId: true }
  });

  if (existing?.authorId !== user.id) {
    throw new ApiError(404, "Story not found");
  }

  const story = await prisma.story.update({
    where: { id },
    data: {
      status: STORY_STATUS.published,
      publishedAt: new Date(),
      moderationStatus: MODERATION_STATUS.pending,
      moderationNote: null,
      moderatedById: null,
      moderatedAt: null
    },
    select: storyDetailSelect
  });

  res.json({
    success: true,
    message: "Story submitted for moderation",
    data: story
  });
});

export const unpublishStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const { id } = req.params as { id: string };

  const existing = await prisma.story.findUnique({
    where: { id },
    select: { id: true, authorId: true }
  });

  if (existing?.authorId !== user.id) {
    throw new ApiError(404, "Story not found");
  }

  const story = await prisma.story.update({
    where: { id },
    data: {
      status: STORY_STATUS.draft,
      publishedAt: null
    },
    select: storyDetailSelect
  });

  res.json({
    success: true,
    message: "Story moved to draft",
    data: story
  });
});

export const deleteStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);

  const { id } = req.params as { id: string };

  const existing = await prisma.story.findUnique({
    where: { id },
    select: { id: true, authorId: true }
  });

  if (existing?.authorId !== user.id) {
    throw new ApiError(404, "Story not found");
  }

  await prisma.story.delete({ where: { id } });

  res.json({
    success: true,
    message: "Story deleted"
  });
});

export const toggleStoryLike = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { id } = req.params as { id: string };

  const story = await prisma.story.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      moderationStatus: true
    }
  });

  if (!story || !isStoryPublic(story)) {
    throw new ApiError(404, "Story not found");
  }

  const existing = await prisma.storyLike.findUnique({
    where: {
      storyId_userId: {
        storyId: id,
        userId: user.id
      }
    },
    select: { id: true }
  });

  if (existing) {
    await prisma.storyLike.delete({
      where: {
        storyId_userId: {
          storyId: id,
          userId: user.id
        }
      }
    });
  } else {
    await prisma.storyLike.create({
      data: {
        storyId: id,
        userId: user.id
      }
    });
  }

  const likesCount = await prisma.storyLike.count({ where: { storyId: id } });

  res.json({
    success: true,
    data: {
      liked: !existing,
      likesCount
    }
  });
});

export const toggleStoryBookmark = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { id } = req.params as { id: string };

  const story = await prisma.story.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      moderationStatus: true
    }
  });

  if (!story || !isStoryPublic(story)) {
    throw new ApiError(404, "Story not found");
  }

  const existing = await prisma.bookmark.findUnique({
    where: {
      storyId_userId: {
        storyId: id,
        userId: user.id
      }
    },
    select: { id: true }
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: {
        storyId_userId: {
          storyId: id,
          userId: user.id
        }
      }
    });
  } else {
    await prisma.bookmark.create({
      data: {
        storyId: id,
        userId: user.id
      }
    });
  }

  const bookmarksCount = await prisma.bookmark.count({ where: { storyId: id } });

  res.json({
    success: true,
    data: {
      bookmarked: !existing,
      bookmarksCount
    }
  });
});

export const getStoryComments = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };

  const story = await prisma.story.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      status: true,
      moderationStatus: true
    }
  });

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  const requester = req.user;
  const isOwner = requester?.id === story.authorId;
  const isAdmin = requester?.role === "ADMIN";

  if (!isStoryPublic(story) && !isOwner && !isAdmin) {
    throw new ApiError(404, "Story not found");
  }

  const comments = await prisma.comment.findMany({
    where: {
      storyId: story.id,
      ...(isOwner || isAdmin ? {} : { isHidden: false })
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      isHidden: true,
      moderationNote: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: comments
  });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { id } = req.params as { id: string };

  const story = await prisma.story.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      moderationStatus: true
    }
  });

  if (!story || !isStoryPublic(story)) {
    throw new ApiError(404, "Story not found");
  }

  const payload = commentSchema.parse(req.body);
  const content = extractText(payload.content);

  if (content.length < 2) {
    throw new ApiError(400, "Comment is too short");
  }

  const comment = await prisma.comment.create({
    data: {
      storyId: id,
      userId: user.id,
      content
    },
    select: {
      id: true,
      content: true,
      isHidden: true,
      moderationNote: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: "Comment posted",
    data: comment
  });
});

export const deleteStoryComment = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { commentId } = req.params as { commentId: string };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      story: {
        select: {
          authorId: true
        }
      }
    }
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const canDelete =
    user.role === "ADMIN" || user.id === comment.userId || user.id === comment.story.authorId;

  if (!canDelete) {
    throw new ApiError(403, "Not allowed to delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });

  res.json({
    success: true,
    message: "Comment deleted"
  });
});

export const listPendingModerationStories = asyncHandler(async (_req: Request, res: Response) => {
  const stories = await prisma.story.findMany({
    where: {
      status: STORY_STATUS.published,
      moderationStatus: MODERATION_STATUS.pending
    },
    orderBy: { publishedAt: "asc" },
    select: storyDetailSelect
  });

  const data = await decorateStoriesWithEngagement(stories);

  res.json({
    success: true,
    data
  });
});

export const moderateStory = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { id } = req.params as { id: string };
  const payload = moderateStorySchema.parse(req.body);

  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  const moderationStatus =
    payload.action === "APPROVE" ? MODERATION_STATUS.approved : MODERATION_STATUS.rejected;

  const updated = await prisma.story.update({
    where: { id },
    data: {
      moderationStatus,
      moderationNote: payload.note,
      moderatedById: user.id,
      moderatedAt: new Date()
    },
    select: storyDetailSelect
  });

  res.json({
    success: true,
    message: payload.action === "APPROVE" ? "Story approved" : "Story rejected",
    data: updated
  });
});

export const moderateStoryComment = asyncHandler(async (req: Request, res: Response) => {
  const user = getRequiredUser(req);
  const { commentId } = req.params as { commentId: string };
  const payload = moderateCommentSchema.parse(req.body);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true }
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      isHidden: payload.action === "HIDE",
      moderationNote: payload.note,
      moderatedById: user.id,
      moderatedAt: new Date()
    },
    select: {
      id: true,
      content: true,
      isHidden: true,
      moderationNote: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: payload.action === "HIDE" ? "Comment hidden" : "Comment restored",
    data: updated
  });
});
