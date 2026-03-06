import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storiesApi } from "../api/stories";
import { getApiErrorMessage } from "../api/http";

export const AdminModerationPage = () => {
  const queryClient = useQueryClient();

  const queueQuery = useQuery({
    queryKey: ["admin", "moderation", "pending"],
    queryFn: () => storiesApi.listPendingModeration()
  });

  const moderateMutation = useMutation({
    mutationFn: async ({
      storyId,
      action,
      note
    }: {
      storyId: string;
      action: "APPROVE" | "REJECT";
      note?: string;
    }) => {
      return storiesApi.moderateStory(storyId, { action, note });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "pending"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  return (
    <section className="page-enter">
      <div className="section-heading">
        <h1>Admin Moderation Queue</h1>
        <p>{queueQuery.data?.length ?? 0} stories pending review</p>
      </div>

      {queueQuery.isLoading && <p className="status">Loading moderation queue...</p>}
      {queueQuery.isError && <p className="status status--error">Could not load moderation queue.</p>}

      {moderateMutation.error && (
        <p className="status status--error">{getApiErrorMessage(moderateMutation.error)}</p>
      )}

      <div className="dashboard-list">
        {queueQuery.data?.map((story) => (
          <article className="dashboard-card" key={story.id}>
            <div>
              <p className="dashboard-card__status">Pending Review</p>
              <h3>{story.title}</h3>
              <p>{story.excerpt || "No excerpt"}</p>
              <p className="story-card__meta">By {story.author.name}</p>
            </div>

            <div className="dashboard-card__actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  moderateMutation.mutate({
                    storyId: story.id,
                    action: "APPROVE"
                  })
                }
              >
                Approve
              </button>

              <button
                className="ghost-button ghost-button--danger"
                type="button"
                onClick={() => {
                  const note = globalThis.prompt("Add rejection note (optional)") ?? undefined;
                  moderateMutation.mutate({
                    storyId: story.id,
                    action: "REJECT",
                    note
                  });
                }}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
