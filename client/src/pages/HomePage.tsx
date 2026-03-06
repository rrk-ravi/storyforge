import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storiesApi } from "../api/stories";
import { StoryCard } from "../components/StoryCard";

export const HomePage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const storiesQuery = useQuery({
    queryKey: ["stories", search],
    queryFn: () => storiesApi.listPublished({ page: 1, limit: 9, search })
  });

  return (
    <section className="page-enter">
      <div className="hero">
        <p className="hero__eyebrow">Global Storytelling Platform</p>
        <h1>Share your short stories with readers who love words.</h1>
        <p>
          Publish drafts, refine your narrative voice, and build a living portfolio of fiction,
          memoir, and life moments.
        </p>

        <form
          className="hero__search"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search stories by title, excerpt, or phrase"
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="section-heading">
        <h2>Freshly Published</h2>
        <p>{storiesQuery.data?.meta?.total ?? 0} stories currently live</p>
      </div>

      {storiesQuery.isLoading && <p className="status">Loading stories...</p>}
      {storiesQuery.isError && <p className="status status--error">Could not load stories.</p>}

      {storiesQuery.data && storiesQuery.data.data.length === 0 && (
        <p className="status">No stories match this search yet.</p>
      )}

      <div className="story-grid">
        {storiesQuery.data?.data.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
};
