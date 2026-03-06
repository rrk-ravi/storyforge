import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ComponentProps } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/http";
import { storiesApi } from "../api/stories";
import { uploadsApi } from "../api/uploads";
import { RichTextEditor } from "../components/RichTextEditor";
import { htmlToText } from "../utils/html";

const initialState = {
  title: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  tagsText: ""
};

export const StoryEditorPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draftForm, setDraftForm] = useState<Partial<typeof initialState>>({});
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storyQuery = useQuery({
    queryKey: ["my-story", id],
    queryFn: () => storiesApi.getMineById(id as string),
    enabled: isEditing
  });

  const form = useMemo(() => {
    if (!isEditing || !storyQuery.data) {
      return {
        ...initialState,
        ...draftForm
      };
    }

    return {
      title: draftForm.title ?? storyQuery.data.title,
      excerpt: draftForm.excerpt ?? storyQuery.data.excerpt ?? "",
      content: draftForm.content ?? storyQuery.data.content,
      coverImageUrl: draftForm.coverImageUrl ?? storyQuery.data.coverImageUrl ?? "",
      tagsText: draftForm.tagsText ?? storyQuery.data.tags.join(", ")
    };
  }, [draftForm, isEditing, storyQuery.data]);

  const parsedTags = useMemo(
    () =>
      form.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tagsText]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImageUrl: form.coverImageUrl,
        tags: parsedTags
      };

      if (isEditing && id) {
        return storiesApi.update(id, payload);
      }

      return storiesApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
      navigate("/dashboard");
    }
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadsApi.uploadCoverImage(file);
    },
    onSuccess: (result) => {
      setDraftForm((prev) => ({ ...prev, coverImageUrl: result.url }));
      setSelectedCoverFile(null);
    }
  });

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    setError(null);

    if (form.title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }

    if (htmlToText(form.content).length < 120) {
      setError("Content must be at least 120 characters.");
      return;
    }

    saveMutation.mutate();
  };

  return (
    <section className="page-enter">
      <div className="section-heading">
        <h1>{isEditing ? "Edit Story" : "Write a New Story"}</h1>
      </div>

      {storyQuery.isLoading && isEditing && <p className="status">Loading story draft...</p>}
      {storyQuery.isError && isEditing && <p className="status status--error">Failed to load story.</p>}

      <form className="editor-form" onSubmit={onSubmit}>
        <label>
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Write a compelling title"
            required
          />
        </label>

        <label>
          <span>Excerpt</span>
          <input
            value={form.excerpt}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, excerpt: event.target.value }))}
            placeholder="A short preview for readers"
          />
        </label>

        <label>
          <span>Cover Image URL</span>
          <input
            value={form.coverImageUrl}
            onChange={(event) =>
              setDraftForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
            }
            placeholder="https://..."
          />
        </label>

        <label>
          <span>Upload Cover Image (Cloudinary)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedCoverFile(file);
            }}
          />
          <button
            type="button"
            disabled={!selectedCoverFile || uploadCoverMutation.isPending}
            onClick={() => {
              if (!selectedCoverFile) {
                return;
              }

              uploadCoverMutation.mutate(selectedCoverFile);
            }}
          >
            {uploadCoverMutation.isPending ? "Uploading..." : "Upload Cover"}
          </button>
          {uploadCoverMutation.error && (
            <p className="status status--error">{getApiErrorMessage(uploadCoverMutation.error)}</p>
          )}
          {uploadCoverMutation.isSuccess && <p className="status">Cover image uploaded successfully.</p>}
        </label>

        <label>
          <span>Tags (comma separated)</span>
          <input
            value={form.tagsText}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, tagsText: event.target.value }))}
            placeholder="fiction, mystery, life"
          />
        </label>

        <label>
          <span>Story Content</span>
          <RichTextEditor
            value={form.content}
            onChange={(value) => setDraftForm((prev) => ({ ...prev, content: value }))}
          />
        </label>

        {(error || saveMutation.error) && (
          <p className="status status--error">{error || getApiErrorMessage(saveMutation.error)}</p>
        )}

        <button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Draft"}
        </button>
      </form>
    </section>
  );
};
