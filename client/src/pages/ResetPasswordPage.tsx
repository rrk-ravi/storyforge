import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { getApiErrorMessage } from "../api/http";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: async () => {
      await authApi.resetPassword(token, password);
    },
    onSuccess: () => {
      navigate("/login", { replace: true });
    }
  });

  return (
    <section className="auth page-enter">
      <h1>Reset password</h1>
      <p>Create a new secure password for your account.</p>

      {token ? (
        <form
          className="card-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);

            if (password.length < 8) {
              setError("Password must be at least 8 characters.");
              return;
            }

            if (password !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }

            resetMutation.mutate();
          }}
        >
          <label>
            <span>New Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {(error || resetMutation.error) && (
            <p className="status status--error">{error || getApiErrorMessage(resetMutation.error)}</p>
          )}

          <button type="submit" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? "Resetting..." : "Reset password"}
          </button>
        </form>
      ) : (
        <p className="status status--error">
          Missing or invalid reset token. Request a new one from the forgot password page.
        </p>
      )}

      <p className="auth__switch">
        Back to <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
