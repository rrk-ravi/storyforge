import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { storiesApi } from "../api/stories";
import { getApiErrorMessage } from "../api/http";

export const DashboardPage = () => {
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ["my-stories"],
    queryFn: () => storiesApi.listMine()
  });

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => storiesApi.listBookmarks()
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => storiesApi.publish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => storiesApi.unpublish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  const currentError = publishMutation.error || unpublishMutation.error || deleteMutation.error;

  return (
    <section className="page-enter">
      <div className="section-heading">
        <h1>Your Writing Dashboard</h1>
        <Link to="/stories/new" className="action-link">
          + New Story
        </Link>
      </div>

      {storiesQuery.isLoading && <p className="status">Loading your stories...</p>}
      {storiesQuery.isError && <p className="status status--error">Could not load dashboard data.</p>}

      {currentError && <p className="status status--error">{getApiErrorMessage(currentError)}</p>}

      <div className="dashboard-list">
        {storiesQuery.data?.map((story) => (
          <article className="dashboard-card" key={story.id}>
            <div>
              <p className="dashboard-card__status">{story.status}</p>
              <h3>{story.title}</h3>
              <p>{story.excerpt || story.content.slice(0, 120)}...</p>
            </div>

            <div className="dashboard-card__actions">
              <Link className="ghost-button" to={`/stories/${story.id}/edit`}>
                Edit
              </Link>

              {story.status === "DRAFT" ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => publishMutation.mutate(story.id)}
                >
                  Publish
                </button>
              ) : (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => unpublishMutation.mutate(story.id)}
                >
                  Move to Draft
                </button>
              )}

              <button
                className="ghost-button ghost-button--danger"
                type="button"
                onClick={() => {
                  if (globalThis.confirm("Delete this story permanently?")) {
                    deleteMutation.mutate(story.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="section-heading">
        <h2>Bookmarked Stories</h2>
      </div>

      {bookmarksQuery.isLoading && <p className="status">Loading bookmarks...</p>}
      {bookmarksQuery.isError && <p className="status status--error">Could not load bookmarks.</p>}

      <div className="dashboard-list">
        {bookmarksQuery.data?.map((story) => (
          <article className="dashboard-card" key={story.id}>
            <div>
              <p className="dashboard-card__status">Bookmarked</p>
              <h3>{story.title}</h3>
              <p>{story.excerpt || "No excerpt"}</p>
              <p className="story-card__meta">By {story.author.name}</p>
            </div>

            <div className="dashboard-card__actions">
              <Link className="ghost-button" to={`/stories/${story.slug}`}>
                Read
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
