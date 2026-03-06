import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters");

export const registerSchema = z.object({
  name: z.string().min(2).max(70),
  email: z.email(),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(256)
});

export const resendVerificationSchema = z.object({
  email: z.email()
});

export const forgotPasswordSchema = z.object({
  email: z.email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
