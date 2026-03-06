import DOMPurify from "dompurify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/http";
import { storiesApi } from "../api/stories";
import { useAuth } from "../context/useAuth";

export const StoryPage = () => {
  const { slug = "" } = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const storyQuery = useQuery({
    queryKey: ["story", slug],
    queryFn: () => storiesApi.getBySlug(slug),
    enabled: Boolean(slug)
  });

  const commentsQuery = useQuery({
    queryKey: ["story-comments", slug],
    queryFn: () => storiesApi.listComments(slug),
    enabled: Boolean(slug)
  });

  const likeMutation = useMutation({
    mutationFn: (storyId: string) => storiesApi.toggleLike(storyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["story", slug] });
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (storyId: string) => storiesApi.toggleBookmark(storyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["story", slug] });
      void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ storyId, content }: { storyId: string; content: string }) =>
      storiesApi.createComment(storyId, content),
    onSuccess: () => {
      setCommentText("");
      void queryClient.invalidateQueries({ queryKey: ["story-comments", slug] });
      void queryClient.invalidateQueries({ queryKey: ["story", slug] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => storiesApi.deleteComment(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["story-comments", slug] });
      void queryClient.invalidateQueries({ queryKey: ["story", slug] });
    }
  });

  const moderateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      action
    }: {
      commentId: string;
      action: "HIDE" | "SHOW";
    }) => storiesApi.moderateComment(commentId, { action }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["story-comments", slug] });
      void queryClient.invalidateQueries({ queryKey: ["story", slug] });
    }
  });

  if (storyQuery.isLoading) {
    return <p className="status">Loading story...</p>;
  }

  if (storyQuery.isError || !storyQuery.data) {
    return <p className="status status--error">Story not found or unavailable.</p>;
  }

  const story = storyQuery.data;
  const canComment = isAuthenticated && Boolean(user?.isEmailVerified);
  const safeContent = DOMPurify.sanitize(story.content);

  return (
    <section className="page-enter story-page-layout">
      <article className="story-view">
        <p className="story-view__meta">
          By {story.author.name} - {story.viewCount} views - {story.likesCount} likes
        </p>
        <h1>{story.title}</h1>

        {story.coverImageUrl && (
          <img src={story.coverImageUrl} alt={story.title} className="story-view__cover" />
        )}

        <p className="story-view__excerpt">{story.excerpt}</p>

        <div className="story-view__tags">
          {story.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="story-view__actions">
          <button
            type="button"
            className={`ghost-button ${story.likedByMe ? "is-active" : ""}`}
            onClick={() => likeMutation.mutate(story.id)}
            disabled={!canComment || likeMutation.isPending}
          >
            {story.likedByMe ? "Unlike" : "Like"} ({story.likesCount})
          </button>

          <button
            type="button"
            className={`ghost-button ${story.bookmarkedByMe ? "is-active" : ""}`}
            onClick={() => bookmarkMutation.mutate(story.id)}
            disabled={!canComment || bookmarkMutation.isPending}
          >
            {story.bookmarkedByMe ? "Bookmarked" : "Bookmark"} ({story.bookmarksCount})
          </button>
        </div>

        {(!user?.isEmailVerified && isAuthenticated) && (
          <p className="status">Verify your email to like, bookmark, and comment.</p>
        )}

        <div className="story-view__content" dangerouslySetInnerHTML={{ __html: safeContent }} />
      </article>

      <aside className="comments-pane">
        <h2>Comments ({story.commentsCount})</h2>

        {canComment && (
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (commentText.trim().length < 2) {
                return;
              }

              commentMutation.mutate({
                storyId: story.id,
                content: commentText
              });
            }}
          >
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              placeholder="Write a thoughtful comment"
            />
            <button type="submit" disabled={commentMutation.isPending}>
              {commentMutation.isPending ? "Posting..." : "Post comment"}
            </button>
          </form>
        )}

        {(commentMutation.error ||
          deleteCommentMutation.error ||
          moderateCommentMutation.error ||
          likeMutation.error ||
          bookmarkMutation.error) && (
          <p className="status status--error">
            {getApiErrorMessage(
              commentMutation.error ||
                deleteCommentMutation.error ||
                moderateCommentMutation.error ||
                likeMutation.error ||
                bookmarkMutation.error
            )}
          </p>
        )}

        {commentsQuery.isLoading && <p className="status">Loading comments...</p>}

        <div className="comments-list">
          {commentsQuery.data?.map((comment) => {
            const canDelete =
              user?.role === "ADMIN" || user?.id === comment.user.id || user?.id === story.author.id;
            const canModerate = user?.role === "ADMIN";

            return (
              <article key={comment.id} className={`comment-card ${comment.isHidden ? "is-hidden" : ""}`}>
                <div className="comment-card__top">
                  <p>
                    <strong>{comment.user.name}</strong>
                  </p>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>

                <p>{comment.content}</p>

                {comment.isHidden && (
                  <p className="comment-card__moderation">Hidden by moderation: {comment.moderationNote}</p>
                )}

                {canDelete && (
                  <button
                    type="button"
                    className="ghost-button ghost-button--danger"
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                  >
                    Delete
                  </button>
                )}

                {canModerate && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      moderateCommentMutation.mutate({
                        commentId: comment.id,
                        action: comment.isHidden ? "SHOW" : "HIDE"
                      })
                    }
                  >
                    {comment.isHidden ? "Show" : "Hide"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </section>
  );
};
