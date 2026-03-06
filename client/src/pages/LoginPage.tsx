import { useState, type ComponentProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getApiErrorMessage } from "../api/http";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    void (async () => {
      try {
        await login(form);
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <section className="auth page-enter">
      <h1>Welcome Back</h1>
      <p>Continue writing and publishing your stories.</p>

      <form onSubmit={onSubmit} className="card-form">
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
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>

        {error && <p className="status status--error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>

        <p className="auth__switch auth__switch--small">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="auth__switch">
          New here? <Link to="/register">Create account</Link> or <Link to="/verify-email">verify email</Link>
        </p>
      </form>
    </section>
  );
};
