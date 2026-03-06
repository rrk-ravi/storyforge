import { http, unwrap } from "./http";
import type { ApiEnvelope, User } from "../types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: async (input: RegisterInput): Promise<User> => {
    const { data } = await http.post<ApiEnvelope<User>>("/auth/register", input);
    return unwrap(data);
  },

  login: async (input: LoginInput): Promise<User> => {
    const { data } = await http.post<ApiEnvelope<User>>("/auth/login", input);
    return unwrap(data);
  },

  me: async (): Promise<User> => {
    const { data } = await http.get<ApiEnvelope<User>>("/auth/me");
    return unwrap(data);
  },

  logout: async (): Promise<void> => {
    await http.post("/auth/logout");
  },

  verifyEmail: async (token: string): Promise<User> => {
    const { data } = await http.post<ApiEnvelope<User>>("/auth/verify-email", { token });
    return unwrap(data);
  },

  resendVerification: async (email: string): Promise<void> => {
    await http.post("/auth/resend-verification", { email });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await http.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await http.post("/auth/reset-password", { token, password });
  }
};
