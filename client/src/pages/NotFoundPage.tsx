import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <section className="page-enter status status--error">
      <h1>404 - Page Not Found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/" className="action-link">
        Go back home
      </Link>
    </section>
  );
};
