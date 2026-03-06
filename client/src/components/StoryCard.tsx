import { Link } from "react-router-dom";
import type { Story } from "../types";

interface StoryCardProps {
  story: Story;
}

export const StoryCard = ({ story }: StoryCardProps) => {
  return (
    <article className="story-card">
      {story.coverImageUrl ? (
        <img src={story.coverImageUrl} alt={story.title} className="story-card__cover" />
      ) : (
        <div className="story-card__cover story-card__cover--placeholder" />
      )}
      <div className="story-card__body">
        <p className="story-card__meta">
          By {story.author.name} {story.publishedAt ? `- ${new Date(story.publishedAt).toLocaleDateString()}` : ""}
        </p>
        <h3>{story.title}</h3>
        <p className="story-card__excerpt">{story.excerpt || story.content.slice(0, 160)}...</p>
        <div className="story-card__footer">
          <div className="story-card__tags">
            {story.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <Link to={`/stories/${story.slug}`} className="story-card__link">
            Read Story
          </Link>
        </div>
      </div>
    </article>
  );
};
