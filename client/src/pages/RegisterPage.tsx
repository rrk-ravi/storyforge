import { useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getApiErrorMessage } from "../api/http";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    void (async () => {
      try {
        const createdUser = await register(form);
        navigate(`/verify-email?email=${encodeURIComponent(createdUser.email)}`, { replace: true });
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <section className="auth page-enter">
      <h1>Create Your Author Account</h1>
      <p>Build your storytelling profile and start publishing.</p>

      <form onSubmit={onSubmit} className="card-form">
        <label>
          <span>Full Name</span>
          <input
            type="text"
            minLength={2}
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>

        {error && <p className="status status--error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>

        <p className="auth__switch">
          Already a member? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
};
