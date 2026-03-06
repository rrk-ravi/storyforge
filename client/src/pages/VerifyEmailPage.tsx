import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { getApiErrorMessage } from "../api/http";
import { useAuth } from "../context/useAuth";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const user = await authApi.verifyEmail(token);
      await refreshSession();
      return user;
    },
    onSuccess: () => {
      navigate("/dashboard", { replace: true });
    }
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await authApi.resendVerification(email);
    }
  });

  return (
    <section className="auth page-enter">
      <h1>Verify your email</h1>
      <p>Confirm your email address to unlock publishing, likes, comments, and bookmarks.</p>

      {token ? (
        <div className="card-form">
          <button type="button" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? "Verifying..." : "Verify account"}
          </button>
          {verifyMutation.error && (
            <p className="status status--error">{getApiErrorMessage(verifyMutation.error)}</p>
          )}
        </div>
      ) : (
        <form
          className="card-form"
          onSubmit={(event) => {
            event.preventDefault();
            resendMutation.mutate();
          }}
        >
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={resendMutation.isPending}>
            {resendMutation.isPending ? "Sending..." : "Resend verification email"}
          </button>
          {resendMutation.isSuccess && (
            <p className="status">If your account exists, a verification email has been sent.</p>
          )}
          {resendMutation.error && (
            <p className="status status--error">{getApiErrorMessage(resendMutation.error)}</p>
          )}
        </form>
      )}

      <p className="auth__switch">
        Back to <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
