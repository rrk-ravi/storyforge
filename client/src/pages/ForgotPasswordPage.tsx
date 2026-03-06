import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { getApiErrorMessage } from "../api/http";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  const forgotMutation = useMutation({
    mutationFn: async () => {
      await authApi.forgotPassword(email);
    }
  });

  return (
    <section className="auth page-enter">
      <h1>Forgot password</h1>
      <p>Enter your email and we will send a reset link.</p>

      <form
        className="card-form"
        onSubmit={(event) => {
          event.preventDefault();
          forgotMutation.mutate();
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

        <button type="submit" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending ? "Sending..." : "Send reset link"}
        </button>

        {forgotMutation.isSuccess && (
          <p className="status">If your account exists, a password reset email has been sent.</p>
        )}

        {forgotMutation.error && (
          <p className="status status--error">{getApiErrorMessage(forgotMutation.error)}</p>
        )}
      </form>

      <p className="auth__switch">
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
